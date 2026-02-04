/**
 * Utilitário para dividir arquivos grandes em chunks para upload
 * Resolve o limite de 4.5MB da Vercel Serverless Functions
 * Usa chunks de 4MB para garantir compatibilidade
 */

export interface ChunkMetadata {
  sessionId: string;
  chunkIndex: number;
  totalChunks: number;
  fileName: string;
  fileType: string;
  totalSize: number;
}

export interface ChunkInfo {
  blob: Blob;
  metadata: ChunkMetadata;
}

/**
 * Divide um arquivo em chunks menores
 * 
 * @param file - Arquivo ou Blob a ser dividido
 * @param chunkSize - Tamanho de cada chunk em bytes (padrão: 4MB para compatibilidade Vercel)
 * @param fileName - Nome do arquivo original
 * @returns Array de chunks com metadata
 */
export function divideIntoChunks(
  file: Blob,
  chunkSize: number = 4 * 1024 * 1024, // 4MB (limite Vercel: 4.5MB)
  fileName: string = 'audio'
): ChunkInfo[] {
  const chunks: ChunkInfo[] = [];
  const totalChunks = Math.ceil(file.size / chunkSize);
  const sessionId = generateSessionId();

  let offset = 0;
  let chunkIndex = 0;

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);

    chunks.push({
      blob: chunk,
      metadata: {
        sessionId,
        chunkIndex,
        totalChunks,
        fileName,
        fileType: file.type,
        totalSize: file.size,
      },
    });

    offset += chunkSize;
    chunkIndex++;
  }

  console.log(`📦 Arquivo dividido em ${totalChunks} chunks de até ${(chunkSize / 1024 / 1024).toFixed(1)}MB`);

  return chunks;
}

/**
 * Gera um ID único para a sessão de upload
 */
export function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `upload-${timestamp}-${random}`;
}

/**
 * Verifica se um arquivo deve usar upload chunked
 * 
 * IMPORTANTE: Na Vercel Serverless, cada Lambda tem seu próprio /tmp efêmero.
 * Chunks salvos em uma Lambda não estão disponíveis em outra.
 * Threshold aumentado para 10MB para evitar chunking desnecessário.
 * 
 * @param fileSizeBytes - Tamanho do arquivo em bytes
 * @param thresholdMB - Limite em MB (padrão: 10MB - limite Vercel Body Parsing)
 * @returns true se deve usar chunking
 */
export function shouldUseChunking(
  fileSizeBytes: number,
  thresholdMB: number = 10
): boolean {
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  return fileSizeMB >= thresholdMB;
}

/**
 * Calcula o tamanho ideal do chunk baseado no tamanho total do arquivo
 * IMPORTANTE: Vercel tem limite de 4.5MB por request, então mantemos 4MB sempre
 * 
 * @param totalSize - Tamanho total do arquivo em bytes
 * @returns Tamanho ideal do chunk em bytes (sempre 4MB para compatibilidade Vercel)
 */
export function getOptimalChunkSize(totalSize: number): number {
  // Mantemos 4MB sempre para garantir compatibilidade com Vercel
  return 4 * 1024 * 1024; // 4MB (seguro para Vercel 4.5MB limit)
}
