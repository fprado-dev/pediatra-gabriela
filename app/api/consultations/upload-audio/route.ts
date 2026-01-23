import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // 60 segundos para upload
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Obter FormData
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const patientId = formData.get("patientId") as string;
    const duration = parseInt(formData.get("duration") as string);

    if (!audioFile || !patientId) {
      return NextResponse.json(
        { error: "Áudio ou paciente não fornecido" },
        { status: 400 }
      );
    }

    // Validar tamanho (50MB máx)
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (audioFile.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo: 50MB" },
        { status: 400 }
      );
    }

    // Validar duração (30min máx = 1800s)
    const MAX_DURATION = 1800;
    if (duration > MAX_DURATION) {
      return NextResponse.json(
        { error: "Áudio muito longo. Máximo: 30 minutos" },
        { status: 400 }
      );
    }

    // Verificar se paciente pertence ao médico
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .eq("doctor_id", user.id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      );
    }

    console.log(`📤 Upload de áudio iniciado - Tamanho: ${(audioFile.size / 1024 / 1024).toFixed(2)}MB, Duração: ${duration}s`);

    // Criar registro na tabela consultations
    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .insert({
        doctor_id: user.id,
        patient_id: patientId,
        status: "processing",
        audio_duration_seconds: duration,
        audio_size_bytes: audioFile.size,
        audio_format: audioFile.type.includes("webm") ? "webm" : "mp3",
        processing_started_at: new Date().toISOString(),
        processing_steps: [
          {
            step: "upload",
            status: "in_progress",
            timestamp: new Date().toISOString(),
          },
        ],
      })
      .select()
      .single();

    if (consultationError || !consultation) {
      console.error("❌ Erro ao criar consulta:", consultationError);
      return NextResponse.json(
        { error: "Erro ao criar registro da consulta" },
        { status: 500 }
      );
    }

    // Upload para Supabase Storage
    const fileName = `${user.id}/${consultation.id}.${audioFile.type.includes("webm") ? "webm" : "mp3"}`;
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("consultation-audios")
      .upload(fileName, buffer, {
        contentType: audioFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Erro no upload:", uploadError);
      
      // Atualizar status para erro
      await supabase
        .from("consultations")
        .update({
          status: "error",
          processing_error: `Erro no upload: ${uploadError.message}`,
        })
        .eq("id", consultation.id);

      return NextResponse.json(
        { error: "Erro ao fazer upload do áudio" },
        { status: 500 }
      );
    }

    // Obter URL pública do áudio
    const { data: urlData } = supabase.storage
      .from("consultation-audios")
      .getPublicUrl(fileName);

    // Atualizar consulta com URL do áudio
    await supabase
      .from("consultations")
      .update({
        audio_url: urlData.publicUrl,
        processing_steps: [
          {
            step: "upload",
            status: "completed",
            timestamp: new Date().toISOString(),
          },
        ],
      })
      .eq("id", consultation.id);

    console.log(`✅ Upload concluído - Consulta ID: ${consultation.id}`);

    // Disparar processamento em background (importando função diretamente)
    console.log(`\n🚀 INICIANDO PROCESSAMENTO DIRETO`);
    console.log(`   Consultation ID: ${consultation.id}`);
    
    // Importar e chamar função diretamente (mais confiável que fetch)
    import("@/lib/openai/process-consultation")
      .then(({ processConsultation }) => {
        console.log("✅ Módulo importado, iniciando processamento...");
        return processConsultation(consultation.id);
      })
      .then((result) => {
        console.log("✅ Processamento concluído com sucesso!", result);
      })
      .catch((err) => {
        console.error("❌ ERRO NO PROCESSAMENTO:", err);
        console.error("   Tipo:", err.name);
        console.error("   Mensagem:", err.message);
        console.error("   Stack:", err.stack);
        
        // Erro já foi salvo no banco pela função processConsultation
      });

    console.log(`📤 Retornando resposta ao cliente (processamento em background)...`);

    return NextResponse.json({
      consultationId: consultation.id,
      audioUrl: urlData.publicUrl,
      message: "Upload concluído, processamento iniciado em background",
    });
  } catch (error: any) {
    console.error("❌ Erro no upload:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
