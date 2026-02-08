import { createClient } from "@/lib/supabase/server";
import { uploadAudio, uploadOriginalAudio, listChunks, downloadChunk, deleteChunks } from "@/lib/cloudflare/r2-client";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const maxDuration = 60; // 60 segundos para upload
export const dynamic = 'force-dynamic';
// Permitir arquivos grandes (200MB)
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

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

    // Obter FormData com tratamento de erro melhorado
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (formError: any) {
      console.error("❌ Erro ao parsear FormData:", formError);
      return NextResponse.json(
        {
          error: "Erro ao processar arquivo enviado. Verifique se o arquivo não está corrompido.",
          details: formError.message
        },
        { status: 400 }
      );
    }

    const sessionId = formData.get("sessionId") as string | null;
    const patientId = formData.get("patientId") as string;
    const duration = parseInt(formData.get("duration") as string);
    const timerId = formData.get("timer_id") as string | null;
    const clientHash = formData.get("hash") as string | null;
    // Tipo de consulta (NOVO)
    const consultationType = formData.get("consultationType") as string | null;
    const consultationSubtype = formData.get("consultationSubtype") as string | null;

    let audioFile: File | null = null;
    let buffer: Buffer;
    let fileName: string;
    let fileType: string;

    // Verificar se é upload chunked ou normal
    if (sessionId) {
      // MODO CHUNKED: Juntar chunks do R2
      console.log(`🧩 Modo chunked detectado - Session: ${sessionId}`);

      try {
        // Listar todos os chunks no R2
        const chunkKeys = await listChunks(sessionId);

        if (chunkKeys.length === 0) {
          throw new Error("Nenhum chunk encontrado para esta sessão no R2");
        }

        console.log(`📦 ${chunkKeys.length} chunks encontrados no R2`);
        console.log(`📦 Baixando e juntando chunks...`);

        // Baixar e juntar todos os chunks em paralelo
        const chunkBuffers = await Promise.all(
          chunkKeys.map(async (key, idx) => {
            const chunkBuffer = await downloadChunk(key);
            console.log(`  ✓ Chunk ${idx}: ${(chunkBuffer.length / 1024).toFixed(1)}KB`);
            return chunkBuffer;
          })
        );

        buffer = Buffer.concat(chunkBuffers);

        console.log(`✅ Chunks juntados: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`);

        // Validar que o buffer não está vazio
        if (buffer.length === 0) {
          throw new Error("Buffer final está vazio após juntar chunks");
        }

        // Detectar tipo de arquivo pelo FormData
        fileName = formData.get("fileName") as string || "audio.mp3";
        fileType = formData.get("fileType") as string || "audio/mpeg";

        console.log(`📄 Arquivo: ${fileName} (${fileType})`);

        // Limpar chunks do R2 após juntar
        await deleteChunks(sessionId);
        console.log(`🗑️  Chunks temporários removidos do R2`);
      } catch (chunkError: any) {
        console.error("❌ Erro ao processar chunks:", chunkError);

        // Tentar limpar chunks do R2 em caso de erro
        try {
          await deleteChunks(sessionId);
        } catch { }

        return NextResponse.json(
          { error: "Erro ao processar chunks enviados" },
          { status: 500 }
        );
      }
    } else {
      // MODO NORMAL: Arquivo direto (< 10MB)
      audioFile = formData.get("audio") as File;

      if (!audioFile) {
        return NextResponse.json(
          { error: "Áudio não fornecido" },
          { status: 400 }
        );
      }

      console.log(`📦 Arquivo recebido: ${audioFile.name}, ${(audioFile.size / 1024 / 1024).toFixed(2)}MB`);

      const arrayBuffer = await audioFile.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      fileName = audioFile.name;
      fileType = audioFile.type;
    }

    if (!patientId) {
      return NextResponse.json(
        { error: "Paciente não fornecido" },
        { status: 400 }
      );
    }

    // Validar tamanho (200MB máx - suporta até ~2h de áudio)
    const MAX_SIZE = 200 * 1024 * 1024; // 200MB
    if (buffer.length > MAX_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo: 200MB" },
        { status: 400 }
      );
    }

    // Validar duração (2h30min máx = 9000s - suporta consultas longas)
    const MAX_DURATION = 9000;
    if (duration > MAX_DURATION) {
      return NextResponse.json(
        { error: "Áudio muito longo. Máximo: 2h30min" },
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

    // Validar tipo de consulta (NOVO)
    if (!consultationType) {
      return NextResponse.json(
        { error: "Tipo de consulta não fornecido" },
        { status: 400 }
      );
    }

    // Buscar últimas 3 consultas do paciente para contexto (NOVO)
    const { data: previousConsultations } = await supabase
      .from("consultations")
      .select("id, consultation_date, diagnosis, previous_consultations_summary")
      .eq("patient_id", patientId)
      .eq("doctor_id", user.id)
      .eq("status", "completed")
      .order("consultation_date", { ascending: false })
      .limit(3);

    console.log(`📋 Encontradas ${previousConsultations?.length || 0} consultas anteriores do paciente`);

    console.log(`📤 Upload de áudio iniciado - Tamanho: ${(buffer.length / 1024 / 1024).toFixed(2)}MB, Duração: ${duration}s`);

    // Calcular hash do áudio (usar hash do cliente se fornecido, senão calcular no servidor)
    let audioHash: string | null = null;
    try {
      if (clientHash) {
        console.log(`🔢 Hash fornecido pelo cliente: ${clientHash.substring(0, 16)}...`);
        audioHash = clientHash;
      } else {
        console.log(`🔢 Calculando hash no servidor...`);
        const hash = crypto.createHash('sha256');
        hash.update(buffer);
        audioHash = hash.digest('hex');
        console.log(`✅ Hash calculado: ${audioHash.substring(0, 16)}...`);
      }
    } catch (hashError) {
      console.warn(`⚠️ Erro ao processar hash, continuando sem hash:`, hashError);
      // Continuar sem hash - não é crítico
    }

    // Criar registro na tabela consultations
    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .insert({
        doctor_id: user.id,
        patient_id: patientId,
        status: "processing",
        consultation_type: consultationType, // NOVO
        consultation_subtype: consultationSubtype, // NOVO
        audio_hash: audioHash, // Salvar hash para detecção de duplicatas
        audio_duration_seconds: duration,
        audio_size_bytes: buffer.length,
        audio_format: fileType.includes("webm") ? "webm" : fileType.includes("mp4") ? "mp4" : "mp3",
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

    // Upload para Cloudflare R2
    const extension = fileType.includes("webm") ? "webm" : fileType.includes("mp4") ? "mp4" : "mp3";
    const r2FileName = `${user.id}/${consultation.id}.${extension}`;

    // STEP 1: Upload áudio original (backup) PRIMEIRO
    let originalAudioUrl: string | null = null;
    try {
      console.log(`📦 Fazendo backup do áudio original...`);
      originalAudioUrl = await uploadOriginalAudio(r2FileName, buffer, fileType);
      console.log(`✅ Backup do áudio original salvo: ${originalAudioUrl}`);

      // Salvar original_audio_url imediatamente no banco
      await supabase
        .from("consultations")
        .update({ original_audio_url: originalAudioUrl })
        .eq("id", consultation.id);
    } catch (originalError: any) {
      // Log warning mas não bloquear - backup é best-effort
      console.warn(`⚠️ Falha ao salvar backup do áudio original (continuando): ${originalError.message}`);
    }

    // STEP 2: Upload normal do áudio
    let audioUrl: string;
    try {
      audioUrl = await uploadAudio(r2FileName, buffer, fileType);
    } catch (uploadError: any) {
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

    // Atualizar consulta com URL do áudio
    await supabase
      .from("consultations")
      .update({
        audio_url: audioUrl,
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
    console.log(`📤 Retornando resposta ao cliente (cliente iniciará processamento)...`);

    return NextResponse.json({
      consultationId: consultation.id,
      audioUrl: audioUrl,
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
