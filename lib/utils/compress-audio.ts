/**
 * Utilitário para comprimir arquivos de áudio usando FFmpeg
 * Reduz o tamanho para caber no limite de 25MB do Whisper API
 */

import ffmpeg from "fluent-ffmpeg";
import { stat } from "fs/promises";
import { execSync } from "child_process";

// Detectar caminho do ffmpeg (sistema ou Vercel)
function detectFfmpegPath(): string {
  // Tentar usar variável de ambiente (Vercel)
  if (process.env.FFMPEG_PATH) {
    return process.env.FFMPEG_PATH;
  }

  // Tentar detectar no PATH
  try {
    const ffmpegPath = execSync('which ffmpeg', { encoding: 'utf8' }).trim();
    if (ffmpegPath) {
      return ffmpegPath;
    }
  } catch {
    // Fallback para caminhos comuns
  }

  // Caminhos padrão por sistema operacional
  const commonPaths = [
    '/usr/bin/ffmpeg',           // Linux/Vercel
    '/usr/local/bin/ffmpeg',     // macOS homebrew (Intel)
    '/opt/homebrew/bin/ffmpeg',  // macOS homebrew (ARM)
    'ffmpeg'                      // PATH
  ];

  return commonPaths[0]; // Usar primeiro como fallback
}

// Configurar caminho do ffmpeg
const ffmpegPath = detectFfmpegPath();
console.log(`🎬 FFmpeg path: ${ffmpegPath}`);
ffmpeg.setFfmpegPath(ffmpegPath);

const WHISPER_MAX_SIZE = 25 * 1024 * 1024; // 25MB - limite do Whisper API
const TARGET_SIZE = 24 * 1024 * 1024; // 24MB - margem de segurança

/**
 * Verifica se um arquivo precisa ser comprimido
 */
export async function needsCompression(filePath: string): Promise<boolean> {
  try {
    const stats = await stat(filePath);
    return stats.size > WHISPER_MAX_SIZE;
  } catch (error) {
    console.error("❌ Erro ao verificar tamanho do arquivo:", error);
    return false;
  }
}

/**
 * Comprime um arquivo de áudio para caber no limite do Whisper
 * 
 * @param inputPath - Caminho do arquivo original
 * @param outputPath - Caminho para salvar arquivo comprimido
 * @returns Tamanho do arquivo comprimido em bytes
 */
export function compressAudio(inputPath: string, outputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Comprimindo áudio: ${inputPath} → ${outputPath}`);

    ffmpeg(inputPath)
      // Configurações de compressão
      .audioCodec("libmp3lame") // Codec MP3 (melhor compressão)
      .audioBitrate("64k") // Bitrate baixo (boa qualidade para voz)
      .audioChannels(1) // Mono (reduz pela metade o tamanho)
      .audioFrequency(16000) // 16kHz (suficiente para voz)
      .format("mp3") // Formato MP3

      // Eventos
      .on("start", (commandLine) => {
        console.log(`📝 Comando FFmpeg: ${commandLine}`);
      })
      .on("progress", (progress) => {
        if (progress.percent) {
          console.log(`⏳ Progresso: ${Math.round(progress.percent)}%`);
        }
      })
      .on("end", async () => {
        try {
          const stats = await stat(outputPath);
          const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
          console.log(`✅ Áudio comprimido com sucesso: ${sizeMB}MB`);

          if (stats.size > WHISPER_MAX_SIZE) {
            reject(new Error(
              `Arquivo ainda muito grande após compressão: ${sizeMB}MB (max: 25MB). ` +
              `Considere dividir o áudio em partes menores.`
            ));
          } else {
            resolve(stats.size);
          }
        } catch (error) {
          reject(error);
        }
      })
      .on("error", (error) => {
        console.error("❌ Erro na compressão:", error);
        reject(new Error(`Falha ao comprimir áudio: ${error.message}`));
      })

      // Salvar arquivo
      .save(outputPath);
  });
}

/**
 * Estima o bitrate necessário para atingir um tamanho alvo
 * 
 * @param durationSeconds - Duração do áudio em segundos
 * @param targetSizeBytes - Tamanho alvo em bytes
 * @returns Bitrate estimado em kbps
 */
export function estimateBitrate(durationSeconds: number, targetSizeBytes: number = TARGET_SIZE): number {
  // Fórmula: bitrate (kbps) = (tamanho em bytes * 8) / (duração em segundos * 1000)
  const bitrate = Math.floor((targetSizeBytes * 8) / (durationSeconds * 1000));

  // Limitar bitrate mínimo (32kbps) e máximo (128kbps)
  return Math.max(32, Math.min(128, bitrate));
}
