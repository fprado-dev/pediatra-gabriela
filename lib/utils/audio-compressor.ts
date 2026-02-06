/**
 * Utilitário para lidar com arquivos de áudio
 * Nota: Compressão de áudio agora é feita no servidor via FFmpeg
 */

interface CompressionOptions {
  bitrate?: number; // kbps (não usado - mantido para compatibilidade)
  sampleRate?: number; // Hz (não usado - mantido para compatibilidade)
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
 * Placeholder para compressão de áudio
 * Retorna o arquivo original pois compressão agora é feita no servidor
 * 
 * @deprecated Compressão de áudio é feita no servidor via FFmpeg.
 *             Esta função apenas retorna o arquivo original.
 */
export async function compressAudio(
  audioFile: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const { onProgress } = options;

  console.log("ℹ️  Compressão de áudio não é feita no cliente");
  console.log("   Arquivo será enviado ao servidor para processamento");

  const originalSize = audioFile.size;

  // Simular progresso para manter compatibilidade de UI
  onProgress?.(25);
  await new Promise(resolve => setTimeout(resolve, 50));
  onProgress?.(50);
  await new Promise(resolve => setTimeout(resolve, 50));
  onProgress?.(75);
  await new Promise(resolve => setTimeout(resolve, 50));
  onProgress?.(100);

  // Retornar o arquivo original como Blob
  const blob = new Blob([audioFile], { type: audioFile.type });

  console.log(`✅ Arquivo preparado: ${formatFileSize(originalSize)}`);
  console.log("   (Compressão/conversão será feita no servidor se necessário)");

  return {
    compressedBlob: blob,
    originalSize,
    compressedSize: originalSize,
    compressionRatio: 0, // Sem compressão no cliente
    duration: 0, // Duração será detectada no servidor
  };
}

/**
 * Verifica se o arquivo deve ser comprimido
 * Arquivos muito pequenos ou já MP3 com bitrate baixo podem não valer a pena
 * 
 * @deprecated Não usada mais, compressão é feita no servidor
 */
export function shouldCompress(file: File): boolean {
  // Sempre retorna false pois não fazemos compressão no cliente
  return false;
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
