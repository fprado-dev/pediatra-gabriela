/**
 * Calculate SHA-256 hash of an audio file using Web Crypto API
 * 
 * @param file - Audio file (Blob or File) to hash
 * @returns Promise<string> - Hex string of SHA-256 hash (64 characters)
 * 
 * @example
 * const file = new File(['audio data'], 'recording.webm');
 * const hash = await calculateAudioHash(file);
 * // hash: "a3c8f9e2d4b7..." (64 hex chars)
 */
export async function calculateAudioHash(file: Blob | File): Promise<string> {
  try {
    // Convert file to ArrayBuffer
    const buffer = await file.arrayBuffer();

    // Calculate SHA-256 hash using Web Crypto API (available in all modern browsers)
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);

    // Convert hash buffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');

    return hashHex;
  } catch (error) {
    console.error('Erro ao calcular hash do áudio:', error);
    throw new Error('Não foi possível calcular o hash do arquivo de áudio');
  }
}

/**
 * Validate if a string is a valid SHA-256 hash
 * 
 * @param hash - String to validate
 * @returns boolean - True if valid SHA-256 hex string
 */
export function isValidSHA256Hash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}
