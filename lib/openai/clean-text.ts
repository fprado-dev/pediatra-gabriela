import { openai } from "./client";

interface PatientContext {
  patientName?: string;
  patientAge?: number | null;
}

interface CleaningResult {
  has_medical_content: boolean;
  cleaned_text: string | null;
  reason?: string;
}

/**
 * Limpa a transcrição removendo ruídos, conversas irrelevantes e melhorando o texto
 * @param rawText - Texto bruto da transcrição
 * @param context - Contexto do paciente para melhorar a análise
 * @returns Texto limpo e estruturado
 */
export async function cleanTranscription(
  rawText: string,
  context?: PatientContext
): Promise<string> {
  if (!rawText || rawText.trim().length === 0) {
    throw new Error("Texto para limpeza está vazio");
  }

  try {
    console.log("🧹 Iniciando limpeza de texto...");

    // Adicionar contexto do paciente ao prompt
    const patientInfo = context?.patientName && context?.patientAge
      ? `\n\nCONTEXTO DO PACIENTE (apenas para referência, NÃO use para inventar dados):\n- Nome: ${context.patientName}\n- Idade: ${context.patientAge} anos\n`
      : "";

    const prompt = `Você é um assistente especializado em processar transcrições de consultas médicas pediátricas.
${patientInfo}
TAREFA: Analise o texto abaixo e determine se contém informações médicas reais de uma consulta.

**PASSO 1 - ANÁLISE DE CONTEÚDO:**
Verifique se o texto contém informações médicas REAIS como:
- Queixa principal ou sintomas específicos
- Descrição de exame físico
- Diagnóstico ou hipótese diagnóstica
- Prescrição ou orientações médicas
- Medições (peso, altura, temperatura, etc)

Se o texto for:
- Conversa sem conteúdo médico
- Áudio sem informações clínicas relevantes
- Áudio sem informações médicas suficientes


Então retorne: { "has_medical_content": false, "cleaned_text": null, "reason": "motivo" }

**PASSO 2 - SE HOUVER CONTEÚDO MÉDICO:**
Limpe o texto seguindo estas diretrizes:

1. REMOVER:
   - Ruídos de fundo e sons não verbais
   - Conversas paralelas não relacionadas à consulta
   - Repetições desnecessárias
   - Gagueira, hesitações e preenchimentos verbais
   - Saudações e despedidas genéricas

2. MANTER E PRESERVAR:
   - TODO o conteúdo clínico EXATAMENTE como foi dito
   - Termos médicos e técnicos exatos
   - Medições e valores numéricos MENCIONADOS
   - Nomes de medicamentos
   - Sintomas descritos
   - Achados do exame físico
   - Diagnósticos e hipóteses

3. REGRAS CRÍTICAS:
   - NUNCA invente, adicione ou suponha informações
   - NUNCA crie uma consulta fictícia
   - Apenas LIMPE o que foi dito, não CRIE conteúdo

TEXTO ORIGINAL:
${rawText}

Retorne APENAS um JSON válido:
{
  "has_medical_content": true ou false,
  "cleaned_text": "texto limpo" ou null,
  "reason": "motivo se não houver conteúdo médico"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1, // Muito conservador
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content?.trim();

    if (!content) {
      throw new Error("Resposta vazia da API");
    }

    const result: CleaningResult = JSON.parse(content);

    // Verificar se tem conteúdo médico
    if (!result.has_medical_content) {
      console.log("⚠️ Texto não contém conteúdo médico:", result.reason);
      throw new Error(
        `DADOS_INSUFICIENTES: O áudio não contém informações médicas de uma consulta real. ` +
        `${result.reason || "Por favor, grave novamente com a consulta médica."}`
      );
    }

    if (!result.cleaned_text) {
      throw new Error(
        "DADOS_INSUFICIENTES: Não foi possível extrair conteúdo médico do áudio. " +
        "Por favor, grave novamente."
      );
    }

    console.log("✅ Texto limpo com sucesso");
    console.log(`   Conteúdo médico detectado: ${result.has_medical_content}`);

    return result.cleaned_text;
  } catch (error: any) {
    console.error("❌ Erro na limpeza de texto:", error);

    // Propagar erros de dados insuficientes
    if (error.message.includes("DADOS_INSUFICIENTES")) {
      throw error;
    }

    throw new Error(`Erro ao limpar texto: ${error.message}`);
  }
}
