/**
 * Utilitário para comprimir arquivos de áudio antes do upload
 * Usa Web Audio API + lamejs para converter para MP3 com bitrate otimizado
 */

import { encode } from "lamejs";

interface CompressionOptions {
  bitrate?: number; // kbps (padrão: 96)
  sampleRate?: number; // Hz (padrão: 44100)
  onProgress?: (progress: number) => void;
}

interface CompressionResult {
  compressedBlob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  duration: number;
}

/**
 * Comprime um arquivo de áudio para MP3 com bitrate otimizado
 * Ideal para transcrição de voz (64-96 kbps é suficiente)
 */
export async function compressAudio(
  audioFile: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    bitrate = 96, // 96 kbps é um bom equilíbrio para voz
    sampleRate = 44100,
    onProgress,
  } = options;

  const originalSize = audioFile.size;

  try {
    console.log("🗜️  Iniciando compressão de áudio...");
    console.log(`   Original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Target bitrate: ${bitrate} kbps`);

    // Criar AudioContext
    const audioContext = new AudioContext({ sampleRate });

    // Ler arquivo como ArrayBuffer
    const arrayBuffer = await audioFile.arrayBuffer();

    // Decodificar áudio
    onProgress?.(10);
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const duration = audioBuffer.duration;

    console.log(`   Duração: ${duration.toFixed(1)}s`);
    console.log(`   Canais: ${audioBuffer.numberOfChannels}`);

    onProgress?.(30);

    // Converter para mono se necessário (reduz tamanho)
    let leftChannel: Float32Array;
    let rightChannel: Float32Array;

    if (audioBuffer.numberOfChannels === 2) {
      // Estéreo - pegar ambos os canais
      leftChannel = audioBuffer.getChannelData(0);
      rightChannel = audioBuffer.getChannelData(1);
    } else {
      // Mono - usar o mesmo canal para esquerda e direita
      leftChannel = audioBuffer.getChannelData(0);
      rightChannel = leftChannel;
    }

    onProgress?.(50);

    // Converter Float32Array para Int16Array (MP3 usa 16-bit)
    const leftChannelInt16 = convertFloat32ToInt16(leftChannel);
    const rightChannelInt16 = convertFloat32ToInt16(rightChannel);

    onProgress?.(60);

    // Configurar encoder MP3
    const mp3encoder = new encode(
      audioBuffer.numberOfChannels === 2 ? 2 : 1, // channels
      sampleRate,
      bitrate
    );

    // Encodar para MP3 em chunks
    const mp3Data: Int8Array[] = [];
    const sampleBlockSize = 1152; // Tamanho padrão do bloco MP3

    for (let i = 0; i < leftChannelInt16.length; i += sampleBlockSize) {
      const leftChunk = leftChannelInt16.subarray(i, i + sampleBlockSize);
      const rightChunk = rightChannelInt16.subarray(i, i + sampleBlockSize);

      const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }

      // Atualizar progresso (60-90%)
      const progress = 60 + ((i / leftChannelInt16.length) * 30);
      onProgress?.(Math.floor(progress));
    }

    onProgress?.(90);

    // Finalizar encoder
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }

    // Criar Blob do MP3 (converter Int8Array para Uint8Array)
    const mp3DataBuffers = mp3Data.map(arr => new Uint8Array(arr.buffer) as BlobPart);
    const compressedBlob = new Blob(mp3DataBuffers, { type: "audio/mp3" });
    const compressedSize = compressedBlob.size;

    // Fechar AudioContext
    await audioContext.close();

    onProgress?.(100);

    const compressionRatio = ((1 - compressedSize / originalSize) * 100);

    console.log(`✅ Compressão concluída!`);
    console.log(`   Comprimido: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Economia: ${compressionRatio.toFixed(1)}%`);

    return {
      compressedBlob,
      originalSize,
      compressedSize,
      compressionRatio,
      duration,
    };
  } catch (error) {
    console.error("❌ Erro na compressão:", error);
    throw new Error(`Falha ao comprimir áudio: ${error}`);
  }
}

/**
 * Converte Float32Array para Int16Array
 */
function convertFloat32ToInt16(buffer: Float32Array): Int16Array {
  const int16 = new Int16Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

/**
 * Verifica se o arquivo deve ser comprimido
 * Arquivos muito pequenos ou já MP3 com bitrate baixo podem não valer a pena
 */
export function shouldCompress(file: File): boolean {
  // Não comprimir se já for MP3 e menor que 5MB
  if (file.type === "audio/mpeg" && file.size < 5 * 1024 * 1024) {
    return false;
  }

  // Comprimir se for maior que 2MB
  return file.size > 2 * 1024 * 1024;
}

/**
 * Formata tamanho de arquivo para exibição
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
}
