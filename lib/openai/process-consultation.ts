/**
 * Função centralizada para processar consulta
 * Pode ser chamada diretamente ou via API route
 */

import { createClient } from "@/lib/supabase/server";
import { downloadAudio, extractKeyFromUrl } from "@/lib/cloudflare/r2-client";
import { transcribeAudio } from "./transcribe";
import { cleanTranscription } from "./clean-text";
import { extractConsultationFields } from "./extract-fields";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export async function processConsultation(consultationId: string) {
  let tempFilePath = join(tmpdir(), `audio-${Date.now()}.tmp`); // Temporário, será renomeado

  try {
    console.log("\n=== INICIANDO PROCESSAMENTO DE CONSULTA ===");
    console.log(`📋 Consultation ID: ${consultationId}`);

    const supabase = await createClient();

    // Buscar consulta
    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .select("*")
      .eq("id", consultationId)
      .single();

    if (consultationError || !consultation) {
      throw new Error("Consulta não encontrada");
    }

    if (!consultation.audio_url) {
      throw new Error("URL do áudio não encontrada");
    }

    console.log("👤 Doctor ID:", consultation.doctor_id);
    console.log("📍 Audio URL:", consultation.audio_url);

    // Buscar dados do paciente para contexto da IA
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("full_name, date_of_birth, weight_kg, height_cm, head_circumference_cm, allergies, blood_type, medical_history, current_medications")
      .eq("id", consultation.patient_id)
      .single();

    if (patientError) {
      console.warn("⚠️ Não foi possível buscar dados do paciente:", patientError);
    }

    // Calcular idade do paciente
    let patientAge: number | null = null;
    if (patient?.date_of_birth) {
      const birthDate = new Date(patient.date_of_birth);
      const today = new Date();
      patientAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        patientAge--;
      }
    }

    console.log("👤 Paciente:", patient?.full_name, `(${patientAge} anos)`);

    // Step 1: Baixar áudio do Cloudflare R2
    console.log("\n📥 Step 1/4: Baixando áudio do R2...");
    await updateProcessingStep(supabase, consultationId, "download", "in_progress");

    // Extrair o key do arquivo do audio_url
    const audioUrl = consultation.audio_url;
    const audioKey = extractKeyFromUrl(audioUrl);
    console.log(`📁 Key do áudio: ${audioKey}`);

    const { buffer: audioBuffer, contentType } = await downloadAudio(audioKey);
    console.log(`📦 Áudio baixado: ${audioBuffer.length} bytes (${contentType})`);

    // Determinar extensão correta baseada no Content-Type
    function getExtension(ct: string): string {
      if (ct.includes("webm")) return "webm";
      if (ct.includes("mp4") || ct.includes("m4a")) return "mp4";
      if (ct.includes("wav")) return "wav";
      if (ct.includes("ogg")) return "ogg";
      if (ct.includes("aac")) return "aac";
      return "mp3";
    }
    const extension = getExtension(contentType);
    tempFilePath = join(tmpdir(), `audio-${Date.now()}.${extension}`);
    console.log(`📝 Extensão detectada: .${extension}`);

    // Salvar áudio temporariamente com extensão correta
    await writeFile(tempFilePath, audioBuffer);
    console.log(`💾 Áudio salvo temporariamente em: ${tempFilePath}`);

    await updateProcessingStep(supabase, consultationId, "download", "completed");

    // Step 2: Transcrever com Whisper
    console.log("\n🎤 Step 2/4: Transcrevendo áudio...");
    await updateProcessingStep(supabase, consultationId, "transcription", "in_progress");

    const rawTranscription = await transcribeAudio({
      audioPath: tempFilePath,
      language: "pt",
    });

    console.log(`📝 Transcrição: ${rawTranscription.length} caracteres`);
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

    // Step 3: Limpar texto (DESABILITADO - estava removendo muito conteúdo)
    console.log("\n🧹 Step 3/4: Pulando limpeza de texto...");
    await updateProcessingStep(supabase, consultationId, "cleaning", "in_progress");

    // 🔥 USANDO TRANSCRIÇÃO DIRETA (sem limpeza por GPT)
    // O GPT de extração (gpt-4o) já faz a limpeza implicitamente
    const cleanedText = rawTranscription;
    console.log(`⚠️ Usando transcrição direta do Whisper (${cleanedText.length} chars)`);

    // 🔥 LIMPEZA POR GPT DESABILITADA (removia muito conteúdo)
    // const cleanedText = await cleanTranscription(rawTranscription, {
    //   patientName: patient?.full_name,
    //   patientAge,
    // });

    console.log(`✨ Texto para extração: ${cleanedText.substring(0, 200)}...`);

    await supabase
      .from("consultations")
      .update({ cleaned_transcription: cleanedText })
      .eq("id", consultationId);

    await updateProcessingStep(supabase, consultationId, "cleaning", "completed");

    // Step 4: Extrair campos estruturados
    console.log("\n🤖 Step 4/4: Extraindo campos estruturados...");
    await updateProcessingStep(supabase, consultationId, "extraction", "in_progress");

    const extractedFields = await extractConsultationFields(cleanedText, {
      patientName: patient?.full_name,
      patientAge,
      weight: patient?.weight_kg,
      height: patient?.height_cm,
      headCircumference: patient?.head_circumference_cm,
      allergies: patient?.allergies,
      bloodType: patient?.blood_type,
      medicalHistory: patient?.medical_history,
      currentMedications: patient?.current_medications,
    });

    console.log("📊 Campos extraídos:", Object.keys(extractedFields));

    // Salvar campos extraídos e versão original para versionamento
    await supabase
      .from("consultations")
      .update({
        chief_complaint: extractedFields.chief_complaint,
        history: extractedFields.history,
        physical_exam: extractedFields.physical_exam,
        diagnosis: extractedFields.diagnosis,
        plan: extractedFields.plan,
        notes: extractedFields.notes,
        weight_kg: extractedFields.weight_kg,
        height_cm: extractedFields.height_cm,
        head_circumference_cm: extractedFields.head_circumference_cm,
        development_notes: extractedFields.development_notes,
        prenatal_perinatal_history: extractedFields.prenatal_perinatal_history, // NOVO: histórico gestacional
        original_ai_version: extractedFields, // Guardar versão original
        status: "completed",
        processing_completed_at: new Date().toISOString(),
      })
      .eq("id", consultationId);

    await updateProcessingStep(supabase, consultationId, "extraction", "completed");

    console.log("✅ Processamento concluído com sucesso!\n");

    return {
      success: true,
      consultationId,
      extractedFields,
    };
  } catch (error: any) {
    console.error("❌ Erro no processamento:", error);

    // Tentar salvar erro no banco
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
    } catch (dbError) {
      console.error("❌ Erro ao salvar erro no banco:", dbError);
    }

    throw error;
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
