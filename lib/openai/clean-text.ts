import { openai } from "./client";

/**
 * Limpa a transcrição removendo ruídos, conversas irrelevantes e melhorando o texto
 * @param rawText - Texto bruto da transcrição
 * @returns Texto limpo e estruturado
 */
export async function cleanTranscription(rawText: string): Promise<string> {
  if (!rawText || rawText.trim().length === 0) {
    throw new Error("Texto para limpeza está vazio");
  }

  try {
    console.log("🧹 Iniciando limpeza de texto...");

    const prompt = `Você é um assistente especializado em processar transcrições de consultas médicas pediátricas.

TAREFA: Limpe e melhore o texto abaixo seguindo estas diretrizes:

1. REMOVER:
   - Ruídos de fundo e sons não verbais (tosse, riso, "hum", "ahn", etc)
   - Conversas paralelas não relacionadas à consulta
   - Repetições desnecessárias e redundâncias
   - Gagueira, hesitações e preenchimentos verbais
   - Interrupções e fragmentos de frases
   - Saudações e despedidas genéricas

2. MANTER E PRESERVAR:
   - TODO o conteúdo clínico relevante
   - Termos médicos e técnicos exatos
   - Medições e valores numéricos
   - Nomes de medicamentos
   - Sintomas descritos
   - Achados do exame físico
   - Diagnósticos e hipóteses
   - Orientações e prescrições

3. MELHORAR:
   - Corrigir erros gramaticais óbvios
   - Estruturar frases de forma clara
   - Manter linguagem natural e fluida
   - Preservar o tom profissional médico

IMPORTANTE: 
- NÃO invente ou adicione informações que não estejam no texto original
- NÃO estruture em seções ainda (isso será feito depois)
- Mantenha apenas um parágrafo contínuo e limpo

TEXTO ORIGINAL:
${rawText}

TEXTO LIMPO:`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3, // Conservador para não inventar informações
      max_tokens: 2000,
    });

    const cleanedText = response.choices[0].message.content?.trim();

    if (!cleanedText) {
      throw new Error("Resposta vazia da API");
    }

    console.log("✅ Texto limpo com sucesso");
    
    return cleanedText;
  } catch (error: any) {
    console.error("❌ Erro na limpeza de texto:", error);
    throw new Error(`Erro ao limpar texto: ${error.message}`);
  }
}
