/**
 * Utilitário para converter áudio no cliente (browser)
 * Converte WebM/WAV/outros formatos para MP3 antes do upload
 */

export interface ConversionProgress {
  stage: "decoding" | "encoding" | "finalizing";
  progress: number; // 0-100
}

/**
 * Converte um Blob de áudio para MP3
 * 
 * @param audioBlob - Blob de áudio original (WebM, WAV, etc)
 * @param onProgress - Callback de progresso opcional
 * @returns Blob MP3 convertido
 */
export async function convertAudioToMp3(
  audioBlob: Blob,
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  console.log(`🔄 Iniciando conversão de ${audioBlob.type} para MP3...`);
  console.log(`📦 Tamanho original: ${(audioBlob.size / 1024 / 1024).toFixed(2)}MB`);

  try {
    // Importar lamejs dinamicamente (só funciona no cliente)
    const lamejs = await import('lamejs');
    
    // Stage 1: Decodificar áudio usando Web Audio API
    onProgress?.({ stage: "decoding", progress: 10 });
    console.log("🎵 Decodificando áudio com Web Audio API...");

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    onProgress?.({ stage: "decoding", progress: 30 });
    
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    
    console.log(`✅ Áudio decodificado: ${sampleRate}Hz, ${channels} canal(is), ${audioBuffer.duration.toFixed(1)}s`);
    
    // Stage 2: Converter para PCM (formato que lamejs aceita)
    onProgress?.({ stage: "encoding", progress: 40 });
    console.log("🔧 Convertendo para PCM...");
    
    // Obter dados do canal (mono ou mixar stereo para mono)
    let samples: Float32Array;
    if (channels === 1) {
      samples = audioBuffer.getChannelData(0);
    } else {
      // Mixar stereo para mono
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      samples = new Float32Array(left.length);
      for (let i = 0; i < left.length; i++) {
        samples[i] = (left[i] + right[i]) / 2;
      }
    }
    
    // Converter Float32Array para Int16Array (formato PCM)
    const int16Samples = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      int16Samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    onProgress?.({ stage: "encoding", progress: 50 });
    
    // Stage 3: Codificar para MP3 usando lamejs
    console.log("🎼 Codificando MP3...");
    
    const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128); // mono, sampleRate, bitrate 128kbps
    const mp3Data: Int8Array[] = [];
    
    const blockSize = 1152; // tamanho do bloco MP3
    const totalBlocks = Math.ceil(int16Samples.length / blockSize);
    
    for (let i = 0; i < int16Samples.length; i += blockSize) {
      const sampleBlock = int16Samples.subarray(i, i + blockSize);
      // Para mono, passamos o mesmo buffer como left e right channel vazio
      const mp3buf = mp3encoder.encodeBuffer(sampleBlock, new Int16Array(0));
      
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
      
      // Atualizar progresso (50-90%)
      const blockProgress = Math.floor((i / int16Samples.length) * 100);
      const overallProgress = 50 + Math.floor(blockProgress * 0.4);
      onProgress?.({ stage: "encoding", progress: overallProgress });
    }
    
    // Finalizar encoding
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
    
    onProgress?.({ stage: "finalizing", progress: 95 });
    console.log("🔄 Finalizando MP3...");
    
    // Stage 4: Criar Blob MP3 (converter Int8Array para Buffer compatível)
    const mp3Uint8 = mp3Data.map(chunk => {
      // Criar novo Uint8Array copiando os dados
      const uint8 = new Uint8Array(chunk.length);
      for (let j = 0; j < chunk.length; j++) {
        uint8[j] = chunk[j] < 0 ? chunk[j] + 256 : chunk[j];
      }
      return uint8;
    });
    const mp3Blob = new Blob(mp3Uint8, { type: "audio/mp3" });
    
    onProgress?.({ stage: "finalizing", progress: 100 });
    
    console.log(`✅ Conversão completa!`);
    console.log(`📦 Tamanho MP3: ${(mp3Blob.size / 1024 / 1024).toFixed(2)}MB`);
    console.log(`📉 Redução: ${(((audioBlob.size - mp3Blob.size) / audioBlob.size) * 100).toFixed(1)}%`);
    
    return mp3Blob;
  } catch (error: any) {
    console.error("❌ Erro na conversão de áudio:", error);
    throw new Error(`Falha ao converter áudio para MP3: ${error.message}`);
  }
}

/**
 * Verifica se um Blob de áudio precisa ser convertido para MP3
 * 
 * @param audioBlob - Blob de áudio
 * @returns true se precisa conversão
 */
export function needsConversion(audioBlob: Blob): boolean {
  const type = audioBlob.type.toLowerCase();
  
  // Já é MP3, não precisa converter
  if (type.includes("mp3") || type.includes("mpeg")) {
    return false;
  }
  
  // WebM, WAV, OGG, etc precisam de conversão
  return true;
}

/**
 * Converte áudio para MP3 se necessário
 * 
 * @param audioBlob - Blob de áudio original
 * @param onProgress - Callback de progresso opcional
 * @returns Blob MP3 (original se já for MP3, convertido se não)
 */
export async function ensureMp3(
  audioBlob: Blob,
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  if (!needsConversion(audioBlob)) {
    console.log("ℹ️ Áudio já é MP3, não precisa conversão");
    return audioBlob;
  }
  
  console.log(`🔄 Áudio ${audioBlob.type} precisa conversão para MP3`);
  return convertAudioToMp3(audioBlob, onProgress);
}
