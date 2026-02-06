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
    console.log(`📝 Transcrição: ${rawTranscription.length} caracteres (${transcriptionDuration}s)`);
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

    // Step 3: Limpar texto
    console.log("🧹 Step 3/4: Limpando texto...");
    const cleaningStartTime = Date.now();
    await updateProcessingStep(supabase, consultationId, "cleaning", "in_progress");

    const cleanedText = await cleanTranscription(rawTranscription);

    const cleaningDuration = ((Date.now() - cleaningStartTime) / 1000).toFixed(1);
    console.log(`✅ Limpeza concluída (${cleaningDuration}s)`);

    await supabase
      .from("consultations")
      .update({ cleaned_transcription: cleanedText })
      .eq("id", consultationId);

    await updateProcessingStep(supabase, consultationId, "cleaning", "completed");

    // Step 4: Extrair campos estruturados
    console.log("🤖 Step 4/4: Extraindo campos estruturados...");
    const extractionStartTime = Date.now();
    await updateProcessingStep(supabase, consultationId, "extraction", "in_progress");

    const extractedFields = await extractConsultationFields(cleanedText);

    const extractionDuration = ((Date.now() - extractionStartTime) / 1000).toFixed(1);
    console.log(`✅ Extração concluída (${extractionDuration}s)`);

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
