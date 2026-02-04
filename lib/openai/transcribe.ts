import { openai } from "./client";
import fs from "fs";
import { needsCompression, compressAudio } from "../utils/compress-audio";
import { splitAudioByTime, cleanupChunks, calculateOptimalChunkDuration, type AudioChunk } from "../utils/split-audio";
import { deduplicateText } from "../utils/deduplicate-text";
import { join } from "path";
import { tmpdir } from "os";
import { unlink, stat } from "fs/promises";

interface TranscribeOptions {
  audioPath: string;
  language?: string;
  prompt?: string;
}

/**
 * Transcreve um arquivo de áudio usando Whisper API
 * Se o arquivo for muito grande, divide em chunks e transcreve separadamente
 * @param options - Opções de transcrição
 * @returns Texto transcrito
 */
export async function transcribeAudio(options: TranscribeOptions): Promise<string> {
  const { audioPath, language = "pt", prompt } = options;
  let compressedPath: string | null = null;
  let chunks: AudioChunk[] = [];

  try {
    console.log("📝 Iniciando transcrição com Whisper...");

    // Verificar tamanho do arquivo
    const stats = await stat(audioPath);
    const fileSizeMB = stats.size / (1024 * 1024);
    console.log(`📊 Tamanho do arquivo: ${fileSizeMB.toFixed(2)}MB`);

    // Estratégia 1: Tentar comprimir se > 25MB
    let finalPath = audioPath;
    const needsComp = await needsCompression(audioPath);

    if (needsComp) {
      console.log("⚠️ Arquivo muito grande para Whisper (>25MB), tentando comprimir...");
      compressedPath = join(tmpdir(), `compressed-${Date.now()}.mp3`);

      try {
        await compressAudio(audioPath, compressedPath);

        // Verificar se compressão foi suficiente
        const compressedStats = await stat(compressedPath);
        const compressedSizeMB = compressedStats.size / (1024 * 1024);

        if (compressedStats.size <= 25 * 1024 * 1024) {
          console.log(`✅ Compressão bem-sucedida: ${compressedSizeMB.toFixed(2)}MB`);
          finalPath = compressedPath;
        } else {
          // Compressão não foi suficiente, precisamos dividir
          console.log(`⚠️ Ainda muito grande após compressão: ${compressedSizeMB.toFixed(2)}MB`);
          console.log("✂️  Dividindo áudio em chunks para transcrição...");

          // Usar arquivo comprimido como base para dividir (já está otimizado)
          const chunkDuration = await calculateOptimalChunkDuration(compressedPath);
          chunks = await splitAudioByTime(compressedPath, chunkDuration);

          // Transcrever cada chunk e juntar
          return await transcribeChunks(chunks, language, prompt);
        }
      } catch (compressionError: any) {
        console.warn("⚠️ Erro na compressão, tentando dividir:", compressionError.message);

        // Se compressão falhou, dividir o arquivo original
        const chunkDuration = await calculateOptimalChunkDuration(audioPath);
        chunks = await splitAudioByTime(audioPath, chunkDuration);
        return await transcribeChunks(chunks, language, prompt);
      }
    }

    // Estratégia 2: Transcrever arquivo único (pequeno ou comprimido com sucesso)
    const audioFile = fs.createReadStream(finalPath);

    // 🎙️ CHAMAR API com configurações MÍNIMAS
    // NOTA: gpt-4o-transcribe-diarize NÃO aceita "prompt", "temperature" nem "verbose_json"
    // OBRIGATÓRIO: chunking_strategy para modelos de diarização
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "gpt-4o-transcribe-diarize",
      language: language || "pt",
      response_format: "json",
      chunking_strategy: "auto",
    } as any);

    console.log(`✅ Transcrição concluída`);

    // Limpar arquivo comprimido temporário
    if (compressedPath) {
      try {
        await unlink(compressedPath);
        console.log("🗑️  Arquivo comprimido temporário removido");
      } catch (cleanupError) {
        console.warn("⚠️ Erro ao remover arquivo comprimido:", cleanupError);
      }
    }

    // 🎙️ PROCESSAR DIARIZAÇÃO - Formatar com speakers
    let formattedTranscription = "";
    const responseData = response as any;

    if (responseData.segments && Array.isArray(responseData.segments) && responseData.segments.length > 0) {
      console.log(`🎙️ Diarização detectada: ${responseData.segments.length} segments`);

      const speakers = [...new Set(responseData.segments.map((s: any) => s.speaker))];
      console.log(`👥 Falantes identificados: ${speakers.join(", ")}`);

      // Formatar: [Speaker X]: texto
      formattedTranscription = responseData.segments
        .map((seg: any) => `[${seg.speaker}]: ${seg.text.trim()}`)
        .join("\n\n");

      console.log(`✅ Transcrição formatada com ${responseData.segments.length} falas separadas por speaker`);
    } else {
      console.warn("⚠️ Sem segments, usando texto padrão (sem diarização)");
      formattedTranscription = responseData.text || "";
    }

    // 🔥 DEDUPLIZAÇÃO: Remover repetições massivas
    console.log("\n🔄 Aplicando deduplização de texto...");
    const deduplicatedText = deduplicateText(formattedTranscription);

    if (deduplicatedText.length < formattedTranscription.length * 0.5) {
      console.warn(
        `⚠️ Deduplização removeu mais de 50% do texto (${formattedTranscription.length} → ${deduplicatedText.length} chars). ` +
        `Isso pode indicar um problema com o áudio ou transcrição.`
      );
    }

    return deduplicatedText;
  } catch (error: any) {
    console.error("❌ Erro na transcrição:", error);

    // Limpar arquivos temporários
    if (compressedPath) {
      try {
        await unlink(compressedPath);
      } catch { }
    }

    if (chunks.length > 0) {
      await cleanupChunks(chunks);
    }

    throw new Error(`Erro ao transcrever áudio: ${error.message}`);
  }
}

/**
 * Transcreve múltiplos chunks e junta as transcrições
 */
async function transcribeChunks(
  chunks: AudioChunk[],
  language: string,
  basePrompt?: string
): Promise<string> {
  const transcriptions: string[] = [];
  let previousText = "";

  console.log(`🎬 Transcrevendo ${chunks.length} chunks...`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const progress = ((i + 1) / chunks.length * 100).toFixed(0);

    console.log(`📝 Chunk ${i + 1}/${chunks.length} (${progress}%)...`);

    try {
      const audioFile = fs.createReadStream(chunk.path);

      // 🎯 PROMPT OTIMIZADO usando CORE Framework (chunks)
      const baseContextPrompt = basePrompt ||
        `Consulta pediátrica em português brasileiro. Médica pediatra e mãe conversam sobre saúde da criança.

VOCABULÁRIO: febre, tosse, coriza, diarreia, vômito, dor, ausculta, palpação, temperatura, dipirona, paracetamol, amoxicilina, desenvolvimento, marcos, gestação, pré-natal, bolsa rota, prematuro, aleitamento materno, pega, fissura, vacinas, BCG, hepatite, pentavalente, peso, altura, perímetro cefálico, curva de crescimento.

TRANSCREVER: Pontuação adequada, terminologia médica exata, fala natural.`;

      const contextPrompt = previousText
        ? `${baseContextPrompt}\nContinuação da consulta: ${previousText.slice(-120)}`
        : baseContextPrompt;

      const response = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: language || "pt", // Força PT-BR
        prompt: contextPrompt,
        response_format: "text",
        temperature: 0, // Mais preciso e determinístico
      });

      const text = response.trim();
      transcriptions.push(text);
      previousText = text;

      console.log(`  ✓ Chunk ${i + 1} transcrito (${text.length} caracteres)`);
    } catch (error: any) {
      console.error(`  ✗ Erro no chunk ${i + 1}:`, error.message);
      throw new Error(`Falha ao transcrever chunk ${i + 1}: ${error.message}`);
    }
  }

  // Limpar chunks
  await cleanupChunks(chunks);

  // Juntar todas as transcrições
  const fullTranscription = transcriptions.join(" ");
  console.log(`✅ Transcrição completa: ${fullTranscription.length} caracteres`);

  // 🔥 DEDUPLIZAÇÃO: Remover repetições massivas do Whisper
  console.log("\n🔄 Aplicando deduplização de texto (chunks)...");
  const deduplicatedText = deduplicateText(fullTranscription);

  if (deduplicatedText.length < fullTranscription.length * 0.5) {
    console.warn(
      `⚠️ Deduplização removeu mais de 50% do texto (${fullTranscription.length} → ${deduplicatedText.length} chars). ` +
      `Isso pode indicar um problema com o áudio ou transcrição.`
    );
  }

  return deduplicatedText;
}
