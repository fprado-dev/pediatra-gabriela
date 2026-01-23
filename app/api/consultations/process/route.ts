import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/openai/transcribe";
import { cleanTranscription } from "@/lib/openai/clean-text";
import { extractConsultationFields } from "@/lib/openai/extract-fields";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export const maxDuration = 300; // 5 minutos para processamento
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const tempFilePath = join(tmpdir(), `audio-${Date.now()}.mp3`);
  
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
    const { consultationId } = body;
    
    console.log(`📋 Consultation ID: ${consultationId}`);

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

    if (!consultation.audio_url) {
      return NextResponse.json(
        { error: "URL do áudio não encontrada" },
        { status: 400 }
      );
    }

    // Step 1: Baixar áudio do Supabase Storage
    console.log("📥 Step 1/4: Baixando áudio...");
    await updateProcessingStep(supabase, consultationId, "download", "in_progress");

    // Extrair o caminho do arquivo do audio_url
    const audioUrl = consultation.audio_url;
    console.log(`📍 Audio URL: ${audioUrl}`);
    
    // O path está no formato: {user_id}/{consultation_id}.webm
    const pathMatch = audioUrl.match(/consultation-audios\/(.+)$/);
    if (!pathMatch) {
      throw new Error(`Não foi possível extrair o path do áudio da URL: ${audioUrl}`);
    }
    
    const audioPath = pathMatch[1];
    console.log(`📁 Path do áudio: ${audioPath}`);

    const { data: audioData, error: downloadError } = await supabase.storage
      .from("consultation-audios")
      .download(audioPath);

    if (downloadError) {
      console.error("❌ Erro no download:", downloadError);
      throw new Error(`Erro ao baixar áudio: ${downloadError.message}`);
    }

    if (!audioData) {
      throw new Error("Dados do áudio não retornados");
    }

    console.log(`📦 Áudio baixado: ${audioData.size} bytes`);

    // Salvar áudio temporariamente
    const arrayBuffer = await audioData.arrayBuffer();
    await writeFile(tempFilePath, Buffer.from(arrayBuffer));
    console.log(`💾 Áudio salvo temporariamente em: ${tempFilePath}`);
    
    await updateProcessingStep(supabase, consultationId, "download", "completed");

    // Step 2: Transcrever com Whisper
    console.log("🎤 Step 2/4: Transcrevendo áudio...");
    await updateProcessingStep(supabase, consultationId, "transcription", "in_progress");

    const rawTranscription = await transcribeAudio({
      audioPath: tempFilePath,
      language: "pt",
    });

    await supabase
      .from("consultations")
      .update({ raw_transcription: rawTranscription })
      .eq("id", consultationId);

    await updateProcessingStep(supabase, consultationId, "transcription", "completed");

    // Step 3: Limpar texto
    console.log("🧹 Step 3/4: Limpando texto...");
    await updateProcessingStep(supabase, consultationId, "cleaning", "in_progress");

    const cleanedText = await cleanTranscription(rawTranscription);

    await supabase
      .from("consultations")
      .update({ cleaned_transcription: cleanedText })
      .eq("id", consultationId);

    await updateProcessingStep(supabase, consultationId, "cleaning", "completed");

    // Step 4: Extrair campos estruturados
    console.log("🤖 Step 4/4: Extraindo campos estruturados...");
    await updateProcessingStep(supabase, consultationId, "extraction", "in_progress");

    const extractedFields = await extractConsultationFields(cleanedText);

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
        original_ai_version: extractedFields, // Guardar versão original
        status: "completed",
        processing_completed_at: new Date().toISOString(),
      })
      .eq("id", consultationId);

    await updateProcessingStep(supabase, consultationId, "extraction", "completed");

    console.log("✅ Processamento concluído com sucesso!\n");

    return NextResponse.json({
      success: true,
      consultationId,
      message: "Consulta processada com sucesso",
      extractedFields,
    });
  } catch (error: any) {
    console.error("❌ Erro no processamento:", error);

    // Tentar salvar erro no banco
    try {
      const supabase = await createClient();
      const { consultationId } = await request.json();
      
      if (consultationId) {
        await supabase
          .from("consultations")
          .update({
            status: "error",
            processing_error: error.message,
            processing_completed_at: new Date().toISOString(),
          })
          .eq("id", consultationId);
      }
    } catch (dbError) {
      console.error("❌ Erro ao salvar erro no banco:", dbError);
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
