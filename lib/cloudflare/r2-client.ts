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
