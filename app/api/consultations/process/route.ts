import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/openai/transcribe";
import { cleanTranscription } from "@/lib/openai/clean-text";
import { extractConsultationFields } from "@/lib/openai/extract-fields";
import { downloadAudio, extractKeyFromUrl } from "@/lib/cloudflare/r2-client";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export const maxDuration = 600; // 10 minutos para processamento de áudios grandes
export const dynamic = 'force-dynamic';

/**
 * Determina extensão baseada no Content-Type
 */
function getExtensionFromContentType(contentType: string): string {
  if (contentType.includes("webm")) return "webm";
  if (contentType.includes("mp4") || contentType.includes("m4a")) return "mp4";
  if (contentType.includes("wav")) return "wav";
  if (contentType.includes("ogg")) return "ogg";
  if (contentType.includes("aac")) return "aac";
  return "mp3"; // padrão
}

export async function POST(request: NextRequest) {
  let tempFilePath = join(tmpdir(), `audio-${Date.now()}.tmp`); // Temporário, será renomeado
  let consultationId: string | undefined; // Variável para usar no catch

  try {
    console.log("\n=== INICIANDO PROCESSAMENTO DE CONSULTA ===");

    const supabase = await createClient();

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("❌ Usuário não autenticado");
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    console.log(`👤 Usuário autenticado: ${user.id}`);

    const body = await request.json();
    consultationId = body.consultationId; // Salvar em variável externa
    const useOriginal = body.useOriginal === true; // Flag para usar áudio original

    console.log(`📋 Consultation ID: ${consultationId}`);
    if (useOriginal) {
      console.log(`🔄 RETRY COM ÁUDIO ORIGINAL solicitado`);
    }

    if (!consultationId) {
      return NextResponse.json(
        { error: "ID da consulta não fornecido" },
        { status: 400 }
      );
    }

    console.log(`\n🚀 Iniciando processamento da consulta ${consultationId}`);

    // Buscar consulta
    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .select("*")
      .eq("id", consultationId)
      .eq("doctor_id", user.id)
      .single();

    if (consultationError || !consultation) {
      return NextResponse.json(
        { error: "Consulta não encontrada" },
        { status: 404 }
      );
    }

    // Decidir qual áudio usar: original (backup) ou processado
    let audioUrlToUse: string;
    if (useOriginal && consultation.original_audio_url) {
      audioUrlToUse = consultation.original_audio_url;
      console.log(`🔄 Usando áudio ORIGINAL (backup) para processamento`);
    } else {
      audioUrlToUse = consultation.audio_url;
      if (useOriginal && !consultation.original_audio_url) {
        console.warn(`⚠️ Áudio original solicitado mas não disponível, usando áudio normal`);
      }
    }

    if (!audioUrlToUse) {
      return NextResponse.json(
        { error: "URL do áudio não encontrada" },
        { status: 400 }
      );
    }

    // Step 1: Baixar áudio do Cloudflare R2
    console.log("📥 Step 1/4: Baixando áudio do R2...");
    await updateProcessingStep(supabase, consultationId, "download", "in_progress");

    console.log(`📍 Audio URL: ${audioUrlToUse}`);

    // Extrair key do arquivo do R2
    const audioKey = extractKeyFromUrl(audioUrlToUse);
    console.log(`📁 Key do áudio: ${audioKey}`);

    // Baixar do Cloudflare R2
    const { buffer: audioBuffer, contentType } = await downloadAudio(audioKey);
    console.log(`📦 Áudio baixado: ${audioBuffer.length} bytes (${contentType})`);

    // Determinar extensão correta baseada no Content-Type
    const extension = getExtensionFromContentType(contentType);
    tempFilePath = join(tmpdir(), `audio-${Date.now()}.${extension}`);
    console.log(`📝 Extensão detectada: .${extension}`);

    // Salvar áudio temporariamente com extensão correta
    await writeFile(tempFilePath, audioBuffer);
    console.log(`💾 Áudio salvo temporariamente em: ${tempFilePath}`);
    console.log(`📊 Tamanho do arquivo: ${(audioBuffer.length / 1024 / 1024).toFixed(2)}MB`);

    // Verificar se o arquivo não está vazio
    if (audioBuffer.length === 0) {
      throw new Error("Arquivo de áudio está vazio");
    }

    // 🔄 CONVERSÃO: Se for WebM, converter para MP3 para ter metadados confiáveis
    if (extension === "webm") {
      console.log("🔄 Detectado WebM - convertendo para MP3 para metadados confiáveis...");
      const mp3Path = join(tmpdir(), `audio-${Date.now()}-converted.mp3`);
      
      try {
        // Usar compressAudio que já converte para MP3
        const { compressAudio } = await import("@/lib/utils/compress-audio");
        await compressAudio(tempFilePath, mp3Path);
        
        // Trocar arquivo original pelo convertido
        await unlink(tempFilePath);
        tempFilePath = mp3Path;
        
        console.log(`✅ WebM convertido para MP3 com sucesso: ${tempFilePath}`);
      } catch (conversionError: any) {
        console.warn(`⚠️ Erro ao converter WebM, continuando com original: ${conversionError.message}`);
        // Se falhar, continuar com WebM original
      }
    }

    await updateProcessingStep(supabase, consultationId, "download", "completed");

    // Step 2: Transcrever com Whisper
    console.log("🎤 Step 2/4: Transcrevendo áudio...");
    const transcriptionStartTime = Date.now();
    await updateProcessingStep(supabase, consultationId, "transcription", "in_progress");

    const rawTranscription = await transcribeAudio({
      audioPath: tempFilePath,
      language: "pt",
    });

    const transcriptionDuration = ((Date.now() - transcriptionStartTime) / 1000).toFixed(1);
    const transcriptionWords = rawTranscription.trim().split(/\s+/).length;
    console.log(`📝 Transcrição: ${rawTranscription.length} caracteres, ${transcriptionWords} palavras (${transcriptionDuration}s)`);
    console.log(`   Preview: ${rawTranscription.substring(0, 200)}...`);

    // 🎙️ Detectar se tem diarização automática de speakers
    const hasDiarization = rawTranscription.includes("[Speaker");
    if (hasDiarization) {
      const speakerMatches = rawTranscription.match(/\[Speaker \d+\]/g) || [];
      const uniqueSpeakers = [...new Set(speakerMatches)];
      console.log(`👥 Diarização detectada: ${uniqueSpeakers.length} falantes identificados`);
      console.log(`   Falantes: ${uniqueSpeakers.join(", ")}`);
    } else {
      console.log(`⚠️ Sem diarização automática (consulta antiga ou modelo sem segments)`);
    }

    await supabase
      .from("consultations")
      .update({ raw_transcription: rawTranscription })
      .eq("id", consultationId);

    await updateProcessingStep(supabase, consultationId, "transcription", "completed");

    // Step 3: Preparar texto (sem limpeza por GPT)
    console.log("🧹 Step 3/4: Preparando texto para extração...");
    await updateProcessingStep(supabase, consultationId, "cleaning", "in_progress");

    // 🔥 USANDO TRANSCRIÇÃO DIRETA (sem limpeza por GPT)
    // GPT-4o na extração já lida bem com ruídos e repetições naturais
    const cleanedText = rawTranscription;
    const cleanedWords = cleanedText.trim().split(/\s+/).length;
    console.log(`📊 Texto para extração: ${cleanedText.length} caracteres, ${cleanedWords} palavras (perda: 0%)`);
    console.log(`   Preview: ${cleanedText.substring(0, 200)}...`);

    await supabase
      .from("consultations")
      .update({ cleaned_transcription: cleanedText })
      .eq("id", consultationId);

    await updateProcessingStep(supabase, consultationId, "cleaning", "completed");

    // Step 4: Extrair campos estruturados
    console.log("🤖 Step 4/4: Extraindo campos estruturados...");
    const extractionStartTime = Date.now();
    await updateProcessingStep(supabase, consultationId, "extraction", "in_progress");

    // Buscar dados do paciente para contexto
    const { data: patient } = await supabase
      .from("patients")
      .select("*")
      .eq("id", consultation.patient_id)
      .single();

    // Buscar consultas anteriores para histórico
    const { data: previousConsultations } = await supabase
      .from("consultations")
      .select("id, created_at, diagnosis, previous_consultations_summary")
      .eq("patient_id", consultation.patient_id)
      .eq("doctor_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(3);

    // Extrair summaries das consultas anteriores
    const previousSummaries = previousConsultations
      ?.map(c => c.previous_consultations_summary?.consultations?.[0])
      .filter(Boolean) || [];

    // Calcular idade do paciente
    const patientAge = patient?.date_of_birth
      ? Math.floor((new Date().getTime() - new Date(patient.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
      : null;

    const extractedFields = await extractConsultationFields(
      cleanedText,
      {
        patientName: patient?.full_name,
        patientAge,
        weight: patient?.weight_kg,
        height: patient?.height_cm,
        headCircumference: patient?.head_circumference_cm,
        allergies: patient?.allergies,
        bloodType: patient?.blood_type,
        medicalHistory: patient?.medical_history,
        currentMedications: patient?.current_medications,
      },
      consultation.consultation_type,
      consultation.consultation_subtype,
      previousSummaries
    );

    const extractionDuration = ((Date.now() - extractionStartTime) / 1000).toFixed(1);
    console.log(`✅ Extração concluída (${extractionDuration}s)`);

    // Verificar se há atualizações para o cadastro do paciente
    const patientProfileUpdates: any = {};
    let shouldUpdatePatientProfile = false;

    // 1. MEDIDAS ANTROPOMÉTRICAS (se source === "audio" e valor diferente)
    if (extractedFields.weight_kg && extractedFields.weight_source === "audio" && extractedFields.weight_kg !== patient?.weight_kg) {
      patientProfileUpdates.weight_kg = extractedFields.weight_kg;
      shouldUpdatePatientProfile = true;
      console.log(`📊 Nova medida de peso: ${extractedFields.weight_kg} kg (anterior: ${patient?.weight_kg || 'não registrado'})`);
    }

    if (extractedFields.height_cm && extractedFields.height_source === "audio" && extractedFields.height_cm !== patient?.height_cm) {
      patientProfileUpdates.height_cm = extractedFields.height_cm;
      shouldUpdatePatientProfile = true;
      console.log(`📊 Nova medida de altura: ${extractedFields.height_cm} cm (anterior: ${patient?.height_cm || 'não registrado'})`);
    }

    if (extractedFields.head_circumference_cm && extractedFields.head_circumference_source === "audio" && extractedFields.head_circumference_cm !== patient?.head_circumference_cm) {
      patientProfileUpdates.head_circumference_cm = extractedFields.head_circumference_cm;
      shouldUpdatePatientProfile = true;
      console.log(`📊 Nova medida de PC: ${extractedFields.head_circumference_cm} cm (anterior: ${patient?.head_circumference_cm || 'não registrado'})`);
    }

    // 2. CAMPOS CLÍNICOS DO CADASTRO (se mencionados no áudio via patient_updates)
    if (extractedFields.patient_updates) {
      if (extractedFields.patient_updates.allergies !== undefined && extractedFields.patient_updates.allergies !== patient?.allergies) {
        patientProfileUpdates.allergies = extractedFields.patient_updates.allergies;
        shouldUpdatePatientProfile = true;
        console.log(`🔴 Alergias atualizadas: "${extractedFields.patient_updates.allergies}" (anterior: "${patient?.allergies || 'não registrado'}")`);
      }

      if (extractedFields.patient_updates.current_medications !== undefined && extractedFields.patient_updates.current_medications !== patient?.current_medications) {
        patientProfileUpdates.current_medications = extractedFields.patient_updates.current_medications;
        shouldUpdatePatientProfile = true;
        console.log(`💊 Medicações atualizadas: "${extractedFields.patient_updates.current_medications}" (anterior: "${patient?.current_medications || 'não registrado'}")`);
      }

      if (extractedFields.patient_updates.blood_type !== undefined && extractedFields.patient_updates.blood_type !== patient?.blood_type) {
        patientProfileUpdates.blood_type = extractedFields.patient_updates.blood_type;
        shouldUpdatePatientProfile = true;
        console.log(`🩸 Tipo sanguíneo atualizado: ${extractedFields.patient_updates.blood_type} (anterior: ${patient?.blood_type || 'não registrado'})`);
      }

      if (extractedFields.patient_updates.medical_history !== undefined && extractedFields.patient_updates.medical_history !== patient?.medical_history) {
        patientProfileUpdates.medical_history = extractedFields.patient_updates.medical_history;
        shouldUpdatePatientProfile = true;
        console.log(`📋 Histórico médico atualizado (anterior: "${patient?.medical_history || 'não registrado'}")`);
      }
    }

    // Atualizar perfil do paciente se houver mudanças
    if (shouldUpdatePatientProfile && consultation.patient_id) {
      console.log(`🔄 Atualizando cadastro do paciente ${consultation.patient_id}...`);
      console.log(`📝 Atualizações:`, patientProfileUpdates);
      
      const { data: updateResult, error: patientUpdateError } = await supabase
        .from("patients")
        .update({
          ...patientProfileUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", consultation.patient_id)
        .select();

      if (patientUpdateError) {
        console.error("❌ Erro ao atualizar cadastro do paciente:", patientUpdateError);
        // Não falhar a consulta por isso, apenas logar
      } else if (!updateResult || updateResult.length === 0) {
        console.warn("⚠️ Nenhum registro de paciente foi atualizado (RLS ou paciente não encontrado)");
      } else {
        console.log("✅ Cadastro do paciente atualizado com sucesso!", updateResult[0]);
      }
    }

    // Salvar campos extraídos e versão original para versionamento
    await supabase
      .from("consultations")
      .update({
        chief_complaint: extractedFields.chief_complaint,
        hma: extractedFields.hma, // História da Moléstia Atual (foco na queixa)
        history: extractedFields.history, // Informações complementares de contexto
        family_history: extractedFields.family_history,
        physical_exam: extractedFields.physical_exam,
        diagnosis: extractedFields.diagnosis,
        conduct: extractedFields.conduct, // Conduta (exames, encaminhamentos)
        plan: extractedFields.plan,
        notes: extractedFields.notes,
        weight_kg: extractedFields.weight_kg,
        height_cm: extractedFields.height_cm,
        head_circumference_cm: extractedFields.head_circumference_cm,
        development_notes: extractedFields.development_notes,
        prenatal_perinatal_history: extractedFields.prenatal_perinatal_history,
        original_ai_version: extractedFields, // Guardar versão original
        status: "completed",
        processing_completed_at: new Date().toISOString(),
      })
      .eq("id", consultationId);

    await updateProcessingStep(supabase, consultationId, "extraction", "completed");

    const totalDuration = ((Date.now() - transcriptionStartTime) / 1000).toFixed(1);
    console.log(`✅ Processamento concluído com sucesso! Tempo total: ${totalDuration}s\n`);

    return NextResponse.json({
      success: true,
      consultationId,
      message: "Consulta processada com sucesso",
      extractedFields,
    });
  } catch (error: any) {
    console.error("❌ Erro no processamento:", error);

    // Tentar salvar erro no banco usando consultationId da variável externa
    if (consultationId) {
      try {
        const supabase = await createClient();
        await supabase
          .from("consultations")
          .update({
            status: "error",
            processing_error: error.message,
            processing_completed_at: new Date().toISOString(),
          })
          .eq("id", consultationId);

        console.log("✅ Erro salvo no banco - retry disponível na página de preview");
      } catch (dbError) {
        console.error("❌ Erro ao salvar erro no banco:", dbError);
      }
    } else {
      console.warn("⚠️ consultationId não disponível para salvar erro");
    }

    return NextResponse.json(
      { error: error.message || "Erro no processamento" },
      { status: 500 }
    );
  } finally {
    // Limpar arquivo temporário
    try {
      await unlink(tempFilePath);
      console.log("🗑️  Arquivo temporário removido");
    } catch (err) {
      // Ignorar erro de limpeza
    }
  }
}

// Função auxiliar para atualizar steps de processamento
async function updateProcessingStep(
  supabase: any,
  consultationId: string,
  step: string,
  status: "in_progress" | "completed" | "error"
) {
  const { data: current } = await supabase
    .from("consultations")
    .select("processing_steps")
    .eq("id", consultationId)
    .single();

  const steps = current?.processing_steps || [];
  const existingStepIndex = steps.findIndex((s: any) => s.step === step);

  if (existingStepIndex >= 0) {
    steps[existingStepIndex] = {
      step,
      status,
      timestamp: new Date().toISOString(),
    };
  } else {
    steps.push({
      step,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  await supabase
    .from("consultations")
    .update({ processing_steps: steps })
    .eq("id", consultationId);
}
