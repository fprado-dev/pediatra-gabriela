import { openai } from "./client";
import fs from "fs";
import { needsCompression, compressAudio } from "../utils/compress-audio";
import { splitAudioByTime, cleanupChunks, calculateOptimalChunkDuration, type AudioChunk } from "../utils/split-audio";
import { deduplicateText } from "../utils/deduplicate-text";
import { join } from "path";
import { tmpdir } from "os";
import { unlink, stat } from "fs/promises";

/**
 * Constrói prompt otimizado para Whisper usando CORE Framework
 * Baseado em Prompt Expert Skill para máxima precisão
 */
function buildOptimizedWhisperPrompt(): string {
  return `ROLE: Transcritor médico especializado em consultas pediátricas no Brasil.

CONTEXT: Gravação de consulta pediátrica com médica pediatra e responsável (mãe/pai) discutindo saúde da criança. Português brasileiro formal e coloquial misturado.

TASK: Transcrever áudio com alta precisão mantendo:
1. Terminologia médica exata (sem simplificações)
2. Pontuação adequada (vírgulas, pontos, interrogações)
3. Fala natural (não corrigir gramática coloquial)
4. Números e medidas exatos (doses, peso, altura, temperatura)

VOCABULÁRIO CRÍTICO (usar exatamente):
Sintomas: febre, tosse, coriza, diarreia, vômito, dor abdominal, cefaleia
Exames: ausculta pulmonar, palpação abdominal, oroscopia, otoscopia
Medidas: peso (kg), altura (cm), perímetro cefálico (PC em cm), temperatura (°C)
Medicamentos: dipirona, paracetamol, ibuprofeno, amoxicilina, azitromicina
Desenvolvimento: marcos do desenvolvimento, linguagem, motor, cognitivo
Gestação: pré-natal, parto, idade gestacional, bolsa rota, prematuro
Alimentação: aleitamento materno, aleitamento exclusivo, pega, fissura mamilar
Vacinação: BCG, hepatite B, pentavalente, rotavírus, pneumocócica, tríplice viral

CONSTRAINTS:
NEVER: Omitir números ou medidas
NEVER: Simplificar termos médicos para leigos
NEVER: Adicionar informações não faladas
ALWAYS: Manter acentuação correta do português BR
ALWAYS: Usar vírgulas para pausas naturais da fala

OUTPUT: Texto corrido com pontuação adequada, pronto para revisão médica.`;
}

interface TranscribeOptions {
  audioPath: string;
  language?: string;
  prompt?: string;
}

/**
 * Transcreve um arquivo de áudio usando Whisper API (whisper-1)
 * 
 * Estratégia:
 * 1. Se arquivo < 25MB: transcreve diretamente
 * 2. Se arquivo ≥ 25MB: comprime ou divide em chunks
 * 
 * @param options - Opções de transcrição
 * @returns Texto transcrito (sem diarização)
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

    // 🎯 PROMPT OTIMIZADO usando CORE Framework (Prompt Expert Skill)
    const contextPrompt = prompt || buildOptimizedWhisperPrompt();

    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: language || "pt",
      prompt: contextPrompt,
      response_format: "text",
      temperature: 0, // Mais preciso e determinístico
    });

    const transcription = response.trim();
    console.log(`✅ Transcrição concluída: ${transcription.length} caracteres`);

    // Limpar arquivo comprimido temporário
    if (compressedPath) {
      try {
        await unlink(compressedPath);
        console.log("🗑️  Arquivo comprimido temporário removido");
      } catch (cleanupError) {
        console.warn("⚠️ Erro ao remover arquivo comprimido:", cleanupError);
      }
    }

    // 🔥 DEDUPLIZAÇÃO DESABILITADA: Preservar conteúdo máximo
    // GPT-4o na extração já lida bem com repetições naturais
    console.log("ℹ️  Deduplização desabilitada - preservando conteúdo completo");
    console.log(`📊 Transcrição final: ${transcription.length} caracteres`);
    
    return transcription;
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

    // Validar tamanho do chunk antes de transcrever
    let chunkStats;
    try {
      chunkStats = await fs.promises.stat(chunk.path);
      const chunkSizeKB = chunkStats.size / 1024;
      const chunkSizeMB = chunkSizeKB / 1024;
      
      console.log(`  📦 Chunk ${i + 1}: ${chunkSizeMB.toFixed(2)}MB (${chunk.path})`);
      
      // Se chunk está vazio ou muito pequeno (< 10KB), pular
      if (chunkSizeKB < 10) {
        console.warn(`  ⚠️ Chunk ${i + 1} muito pequeno (${chunkSizeKB.toFixed(2)}KB), pulando...`);
        
        // Se já temos transcrições, parar aqui (chegamos no fim do áudio real)
        if (transcriptions.length > 0) {
          console.log(`  ℹ️ Fim do áudio real detectado no chunk ${i + 1}, parando transcrição.`);
          break;
        }
        
        // Se é o primeiro chunk e está vazio, algo está errado
        if (i === 0) {
          throw new Error("Primeiro chunk está vazio - áudio pode estar corrompido");
        }
        
        continue;
      }

      const audioFile = fs.createReadStream(chunk.path);

      // 🎯 PROMPT OTIMIZADO usando CORE Framework (chunks)
      const baseContextPrompt = basePrompt || buildOptimizedWhisperPrompt();

      const contextPrompt = previousText
        ? `${baseContextPrompt}\n\nCONTEXTO ANTERIOR: "${previousText.slice(-150)}..."`
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
      console.error(`     Path: ${chunk.path}`);
      console.error(`     Tamanho: ${(chunkStats?.size || 0) / 1024}KB`);
      
      // Se já temos pelo menos algumas transcrições E o erro é de decodificação,
      // continuar com o que temos em vez de falhar completamente
      if (transcriptions.length >= 3 && error.message.includes("could not be decoded")) {
        console.warn(`  ⚠️ Continuando sem chunk ${i + 1} - já temos ${transcriptions.length} chunks transcritos`);
        console.warn(`  ⚠️ Chunk problemático será ignorado para não perder todo o áudio`);
        
        // Adicionar nota na transcrição sobre o chunk perdido
        const missingNote = `\n[Nota: Trecho entre ${(chunk.startTime / 60).toFixed(0)}-${((chunk.startTime + chunk.duration) / 60).toFixed(0)} minutos não pôde ser transcrito devido a problema no áudio]\n`;
        transcriptions.push(missingNote);
        
        continue; // Continuar para próximo chunk
      }
      
      // Se é um dos primeiros chunks ou erro crítico, falhar
      throw new Error(`Falha ao transcrever chunk ${i + 1}: ${error.message}`);
    }
  }

  // Limpar chunks
  await cleanupChunks(chunks);

  // Juntar todas as transcrições
  const fullTranscription = transcriptions.join(" ");
  console.log(`✅ Transcrição completa: ${fullTranscription.length} caracteres`);

  // 🔥 DEDUPLIZAÇÃO DESABILITADA: Preservar conteúdo máximo
  // GPT-4o na extração já lida bem com repetições naturais
  console.log("ℹ️  Deduplização desabilitada - preservando conteúdo completo dos chunks");
  
  return fullTranscription;
}
