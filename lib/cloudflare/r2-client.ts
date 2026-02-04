/**
 * Cloudflare R2 Storage Client
 * Compatível com S3 API usando AWS SDK v3
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET || "consultation-audios";

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  throw new Error(
    "Cloudflare R2 credentials are missing. Check your environment variables."
  );
}

// Configurar S3Client para Cloudflare R2
const r2Client = new S3Client({
  region: "auto", // Cloudflare R2 usa "auto"
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload de arquivo para Cloudflare R2
 * @param key - Caminho/nome do arquivo no bucket (ex: "user123/audio456.mp3")
 * @param body - Buffer ou Blob do arquivo
 * @param contentType - MIME type do arquivo
 * @returns URL pública do arquivo
 */
export async function uploadAudio(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  try {
    console.log(`📤 Uploading to R2: ${key} (${(body.length / 1024 / 1024).toFixed(2)}MB)`);

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await r2Client.send(command);

    // Construir URL pública do arquivo
    // Nota: Para acesso público direto, o bucket deve ter política pública configurada
    // Caso contrário, use signed URLs (getSignedUrl)
    const publicUrl = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${key}`;

    console.log(`✅ Upload concluído: ${key}`);
    return publicUrl;
  } catch (error: any) {
    console.error("❌ Erro no upload para R2:", error);
    throw new Error(`Falha ao fazer upload para R2: ${error.message}`);
  }
}

/**
 * Download de arquivo do Cloudflare R2
 * @param key - Caminho/nome do arquivo no bucket
 * @returns Buffer do arquivo e ContentType
 */
export async function downloadAudio(key: string): Promise<{ buffer: Buffer; contentType: string }> {
  try {
    console.log(`📥 Downloading from R2: ${key}`);

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });

    const response = await r2Client.send(command);

    if (!response.Body) {
      throw new Error("Nenhum dado retornado do R2");
    }

    // Converter stream para buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const contentType = response.ContentType || "audio/mpeg";

    console.log(`✅ Download concluído: ${key} (${(buffer.length / 1024 / 1024).toFixed(2)}MB, ${contentType})`);
    return { buffer, contentType };
  } catch (error: any) {
    console.error("❌ Erro no download do R2:", error);
    throw new Error(`Falha ao baixar do R2: ${error.message}`);
  }
}

/**
 * Gera URL assinada para acesso temporário ao arquivo
 * @param key - Caminho/nome do arquivo no bucket
 * @param expiresIn - Tempo de expiração em segundos (padrão: 3600 = 1h)
 * @returns URL assinada válida por expiresIn segundos
 */
export async function getSignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    console.log(`🔐 Gerando signed URL para: ${key} (expira em ${expiresIn}s)`);

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });

    const signedUrl = await getS3SignedUrl(r2Client, command, { expiresIn });

    console.log(`✅ Signed URL gerada para: ${key}`);
    return signedUrl;
  } catch (error: any) {
    console.error("❌ Erro ao gerar signed URL:", error);
    throw new Error(`Falha ao gerar signed URL: ${error.message}`);
  }
}

/**
 * Remove arquivo do Cloudflare R2
 * @param key - Caminho/nome do arquivo no bucket
 */
export async function deleteAudio(key: string): Promise<void> {
  try {
    console.log(`🗑️  Deletando do R2: ${key}`);

    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });

    await r2Client.send(command);

    console.log(`✅ Arquivo deletado: ${key}`);
  } catch (error: any) {
    console.error("❌ Erro ao deletar do R2:", error);
    throw new Error(`Falha ao deletar do R2: ${error.message}`);
  }
}

/**
 * Extrai o key (caminho) do arquivo de uma URL do R2
 * @param url - URL completa do arquivo no R2
 * @returns Key do arquivo (caminho relativo no bucket)
 */
export function extractKeyFromUrl(url: string): string {
  // Exemplo: https://account.r2.cloudflarestorage.com/consultation-audios/user123/audio456.mp3
  // Retorna: user123/audio456.mp3

  const match = url.match(/consultation-audios\/(.+)$/);
  if (!match) {
    throw new Error(`Não foi possível extrair key da URL: ${url}`);
  }

  return match[1];
}

// ========================================
// FUNÇÕES PARA CHUNKED UPLOAD
// Workaround para limite de 4.5MB da Vercel
// ========================================

/**
 * Upload de chunk temporário para R2
 * Usado para armazenar chunks durante upload em partes
 * 
 * @param sessionId - ID único da sessão de upload
 * @param chunkIndex - Índice do chunk
 * @param buffer - Buffer do chunk
 * @returns Key do chunk no R2
 */
export async function uploadChunk(
  sessionId: string,
  chunkIndex: number,
  buffer: Buffer
): Promise<string> {
  const chunkKey = `chunks/${sessionId}/${chunkIndex.toString().padStart(4, '0')}.bin`;

  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: chunkKey,
      Body: buffer,
      ContentType: "application/octet-stream",
      Metadata: {
        sessionId,
        chunkIndex: chunkIndex.toString(),
        uploadedAt: new Date().toISOString(),
      },
    });

    await r2Client.send(command);
    console.log(`✅ Chunk ${chunkIndex} uploaded to R2: ${chunkKey}`);
    return chunkKey;
  } catch (error: any) {
    console.error(`❌ Erro ao fazer upload do chunk ${chunkIndex} para R2:`, error);
    throw new Error(`Falha ao fazer upload do chunk: ${error.message}`);
  }
}

/**
 * Download de chunk temporário do R2
 * 
 * @param chunkKey - Key do chunk no R2
 * @returns Buffer do chunk
 */
export async function downloadChunk(chunkKey: string): Promise<Buffer> {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: chunkKey,
    });

    const response = await r2Client.send(command);

    if (!response.Body) {
      throw new Error("Chunk vazio retornado do R2");
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    return buffer;
  } catch (error: any) {
    console.error(`❌ Erro ao baixar chunk do R2: ${chunkKey}`, error);
    throw new Error(`Falha ao baixar chunk: ${error.message}`);
  }
}

/**
 * Lista todos os chunks de uma sessão
 * 
 * @param sessionId - ID da sessão
 * @returns Array de keys dos chunks, ordenados por índice
 */
export async function listChunks(sessionId: string): Promise<string[]> {
  try {
    const { ListObjectsV2Command } = await import("@aws-sdk/client-s3");

    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: `chunks/${sessionId}/`,
    });

    const response = await r2Client.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      return [];
    }

    // Ordenar por nome (que inclui índice com padding)
    const chunkKeys = response.Contents
      .map(obj => obj.Key!)
      .filter(key => key.endsWith('.bin'))
      .sort();

    return chunkKeys;
  } catch (error: any) {
    console.error(`❌ Erro ao listar chunks da sessão ${sessionId}:`, error);
    throw new Error(`Falha ao listar chunks: ${error.message}`);
  }
}

/**
 * Remove todos os chunks de uma sessão (cleanup)
 * 
 * @param sessionId - ID da sessão
 */
export async function deleteChunks(sessionId: string): Promise<void> {
  try {
    const chunkKeys = await listChunks(sessionId);

    if (chunkKeys.length === 0) {
      console.log(`ℹ️ Nenhum chunk encontrado para sessão ${sessionId}`);
      return;
    }

    // Deletar todos os chunks em paralelo
    await Promise.all(
      chunkKeys.map(key =>
        r2Client.send(new DeleteObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
        }))
      )
    );

    console.log(`🗑️ ${chunkKeys.length} chunks removidos da sessão ${sessionId}`);
  } catch (error: any) {
    console.warn(`⚠️ Erro ao deletar chunks da sessão ${sessionId}:`, error);
    // Não lançar erro - cleanup é best-effort
  }
}
