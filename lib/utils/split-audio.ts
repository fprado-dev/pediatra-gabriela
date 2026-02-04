/**
 * Utilitário para dividir áudio em chunks de tempo
 * Usado para transcrever áudios muito longos que excedem o limite do Whisper
 */

import ffmpeg from "fluent-ffmpeg";
import { stat, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const WHISPER_MAX_SIZE = 25 * 1024 * 1024; // 25MB
const CHUNK_DURATION_MINUTES = 10; // 10 minutos por chunk

export interface AudioChunk {
  path: string;
  index: number;
  startTime: number; // segundos
  duration: number; // segundos
}

/**
 * Obtém metadados do áudio (duração, tamanho, etc)
 */
export function getAudioMetadata(filePath: string): Promise<ffmpeg.FfprobeData> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(new Error(`Erro ao ler metadados: ${err.message}`));
      } else {
        resolve(metadata);
      }
    });
  });
}

/**
 * Divide áudio em chunks de tempo
 * 
 * @param inputPath - Caminho do arquivo original
 * @param chunkDurationMinutes - Duração de cada chunk em minutos
 * @returns Array de chunks criados
 */
export async function splitAudioByTime(
  inputPath: string,
  chunkDurationMinutes: number = CHUNK_DURATION_MINUTES
): Promise<AudioChunk[]> {
  try {
    console.log(`✂️  Dividindo áudio em chunks de ${chunkDurationMinutes} minutos...`);

    // Obter duração total do áudio
    const metadata = await getAudioMetadata(inputPath);
    const totalDuration = metadata.format.duration || 0;
    const chunkDurationSeconds = chunkDurationMinutes * 60;
    const numChunks = Math.ceil(totalDuration / chunkDurationSeconds);

    console.log(`📊 Áudio total: ${(totalDuration / 60).toFixed(1)} min → ${numChunks} chunks`);

    const chunks: AudioChunk[] = [];
    const sessionId = Date.now();

    // Criar cada chunk
    for (let i = 0; i < numChunks; i++) {
      const startTime = i * chunkDurationSeconds;
      const chunkPath = join(tmpdir(), `audio-chunk-${sessionId}-${i}.mp3`);

      // Extrair chunk
      await extractAudioChunk(inputPath, chunkPath, startTime, chunkDurationSeconds);

      // Verificar tamanho do chunk
      const stats = await stat(chunkPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

      console.log(`  ✓ Chunk ${i + 1}/${numChunks}: ${sizeMB}MB (${startTime / 60}min - ${(startTime + chunkDurationSeconds) / 60}min)`);

      // Se chunk ainda for muito grande, avisar
      if (stats.size > WHISPER_MAX_SIZE) {
        console.warn(`  ⚠️  Chunk ${i + 1} ainda muito grande: ${sizeMB}MB`);
        // Tentar comprimir este chunk específico
        await compressChunk(chunkPath);
      }

      chunks.push({
        path: chunkPath,
        index: i,
        startTime,
        duration: Math.min(chunkDurationSeconds, totalDuration - startTime),
      });
    }

    console.log(`✅ ${chunks.length} chunks criados com sucesso`);
    return chunks;
  } catch (error: any) {
    console.error("❌ Erro ao dividir áudio:", error);
    throw new Error(`Falha ao dividir áudio: ${error.message}`);
  }
}

/**
 * Extrai um chunk de áudio específico
 */
function extractAudioChunk(
  inputPath: string,
  outputPath: string,
  startSeconds: number,
  durationSeconds: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startSeconds)
      .setDuration(durationSeconds)
      .audioCodec("libmp3lame")
      .audioBitrate("64k")
      .audioChannels(1)
      .audioFrequency(16000)
      .format("mp3")
      .on("error", (error) => {
        reject(new Error(`Erro ao extrair chunk: ${error.message}`));
      })
      .on("end", () => {
        resolve();
      })
      .save(outputPath);
  });
}

/**
 * Comprime um chunk que ainda está muito grande
 */
async function compressChunk(chunkPath: string): Promise<void> {
  const tempPath = `${chunkPath}.temp.mp3`;

  return new Promise((resolve, reject) => {
    ffmpeg(chunkPath)
      .audioCodec("libmp3lame")
      .audioBitrate("32k") // Bitrate ainda mais baixo
      .audioChannels(1)
      .audioFrequency(16000)
      .format("mp3")
      .on("error", reject)
      .on("end", async () => {
        // Substituir original pelo comprimido
        await unlink(chunkPath);
        const fs = await import("fs/promises");
        await fs.rename(tempPath, chunkPath);

        const stats = await stat(chunkPath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`    → Comprimido para ${sizeMB}MB`);
        resolve();
      })
      .save(tempPath);
  });
}

/**
 * Remove todos os chunks criados
 */
export async function cleanupChunks(chunks: AudioChunk[]): Promise<void> {
  console.log(`🗑️  Removendo ${chunks.length} chunks temporários...`);

  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        await unlink(chunk.path);
      } catch (error) {
        console.warn(`⚠️  Erro ao remover chunk ${chunk.index}:`, error);
      }
    })
  );

  console.log("✅ Chunks removidos");
}

/**
 * Calcula duração ideal do chunk baseado no tamanho do arquivo
 */
export async function calculateOptimalChunkDuration(
  filePath: string
): Promise<number> {
  const stats = await stat(filePath);
  const metadata = await getAudioMetadata(filePath);
  const totalDuration = metadata.format.duration || 0;
  const totalSize = stats.size;

  // Calcular MB por minuto
  const mbPerMinute = (totalSize / 1024 / 1024) / (totalDuration / 60);

  // Calcular duração ideal para ficar abaixo de 20MB (margem de segurança)
  const idealDurationMinutes = Math.floor(20 / mbPerMinute);

  // Mínimo 5 minutos, máximo 15 minutos
  return Math.max(5, Math.min(15, idealDurationMinutes));
}
