import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { cleanupOldChunks } from "@/lib/utils/cleanup-chunks";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/consultations/upload-chunk
 * 
 * Recebe chunks individuais de um arquivo de áudio grande
 * Cada chunk é salvo temporariamente até que todos sejam recebidos
 * 
 * IMPORTANTE: Vercel tem limite de 4.5MB por request
 * 
 * FormData:
 *   - chunk: Blob (max 4.5MB - limite Vercel)
 *   - sessionId: string (ID único da sessão de upload)
 *   - chunkIndex: number (índice deste chunk, começando em 0)
 *   - totalChunks: number (total de chunks esperados)
 */
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

    // Parsear FormData
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (formError: any) {
      console.error("❌ Erro ao parsear FormData do chunk:", formError);
      return NextResponse.json(
        { error: "Erro ao processar chunk" },
        { status: 400 }
      );
    }

    const chunkBlob = formData.get("chunk") as Blob;
    const sessionId = formData.get("sessionId") as string;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string);
    const totalChunks = parseInt(formData.get("totalChunks") as string);

    // Validar parâmetros
    if (!chunkBlob || !sessionId || isNaN(chunkIndex) || isNaN(totalChunks)) {
      return NextResponse.json(
        { error: "Parâmetros inválidos" },
        { status: 400 }
      );
    }

    // Validar tamanho do chunk (deve ser <= 4.5MB - limite da Vercel)
    const MAX_CHUNK_SIZE = 4.5 * 1024 * 1024; // 4.5MB - limite Vercel
    if (chunkBlob.size > MAX_CHUNK_SIZE) {
      return NextResponse.json(
        { error: `Chunk muito grande: ${(chunkBlob.size / 1024 / 1024).toFixed(2)}MB (max: 4.5MB - limite Vercel)` },
        { status: 400 }
      );
    }

    // Validar índice do chunk
    if (chunkIndex < 0 || chunkIndex >= totalChunks) {
      return NextResponse.json(
        { error: `Índice de chunk inválido: ${chunkIndex} (total: ${totalChunks})` },
        { status: 400 }
      );
    }

    console.log(
      `📦 Recebendo chunk ${chunkIndex + 1}/${totalChunks} ` +
      `(${(chunkBlob.size / 1024 / 1024).toFixed(2)}MB) - Session: ${sessionId.substring(0, 20)}...`
    );

    // Limpar chunks órfãos periodicamente (apenas no primeiro chunk para evitar overhead)
    if (chunkIndex === 0) {
      cleanupOldChunks().catch(err => {
        console.warn("⚠️ Erro na limpeza automática de chunks:", err);
        // Não é crítico, continuar
      });
    }

    // Criar diretório para a sessão se não existir
    const sessionDir = join(tmpdir(), 'audio-chunks', sessionId);
    await mkdir(sessionDir, { recursive: true });

    // Salvar chunk
    const chunkFileName = `chunk-${chunkIndex.toString().padStart(4, '0')}.bin`;
    const chunkPath = join(sessionDir, chunkFileName);
    const chunkBuffer = Buffer.from(await chunkBlob.arrayBuffer());

    await writeFile(chunkPath, chunkBuffer);

    console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} salvo: ${chunkFileName}`);

    // Calcular progresso
    const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);

    return NextResponse.json({
      success: true,
      chunkIndex,
      totalChunks,
      progress,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} recebido`,
    });
  } catch (error: any) {
    console.error("❌ Erro ao processar chunk:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar chunk" },
      { status: 500 }
    );
  }
}
