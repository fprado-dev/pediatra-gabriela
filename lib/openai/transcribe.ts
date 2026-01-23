import { openai } from "./client";
import fs from "fs";

interface TranscribeOptions {
  audioPath: string;
  language?: string;
  prompt?: string;
}

/**
 * Transcreve um arquivo de áudio usando Whisper API
 * @param options - Opções de transcrição
 * @returns Texto transcrito
 */
export async function transcribeAudio(options: TranscribeOptions): Promise<string> {
  const { audioPath, language = "pt", prompt } = options;

  try {
    console.log("📝 Iniciando transcrição com Whisper...");
    
    // Ler o arquivo de áudio
    const audioFile = fs.createReadStream(audioPath);

    // Prompt para contexto (ajuda o Whisper a entender termos médicos)
    const contextPrompt = prompt || 
      "Consulta médica pediátrica. Termos técnicos: diagnóstico, sintomas, tratamento, prescrição, anamnese, exame físico.";

    // Chamar API Whisper
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language,
      prompt: contextPrompt,
      response_format: "verbose_json", // Retorna timestamps e metadata
      temperature: 0.2, // Mais conservador para termos médicos
    });

    console.log(`✅ Transcrição concluída (${response.duration}s de áudio)`);
    
    return response.text;
  } catch (error: any) {
    console.error("❌ Erro na transcrição:", error);
    throw new Error(`Erro ao transcrever áudio: ${error.message}`);
  }
}
