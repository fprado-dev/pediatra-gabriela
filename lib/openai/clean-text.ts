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

    // 🔥 PROTEÇÃO: Limitar tamanho do texto para evitar problemas com contexto muito grande
    const MAX_TEXT_LENGTH = 30000; // ~7500 tokens (gpt-4o-mini suporta mais que gpt-5-mini)
    let textToClean = rawText;

    if (rawText.length > MAX_TEXT_LENGTH) {
      console.warn(
        `⚠️ Texto muito longo (${rawText.length} chars). Truncando para ${MAX_TEXT_LENGTH}...`
      );
      textToClean =
        rawText.substring(0, MAX_TEXT_LENGTH) +
        "\n\n[... texto truncado para processamento ...]";
    }

    // Adicionar contexto do paciente ao prompt
    const patientInfo = context?.patientName && context?.patientAge
      ? `\n\nCONTEXTO DO PACIENTE (apenas para referência, NÃO use para inventar dados):\n- Nome: ${context.patientName}\n- Idade: ${context.patientAge} anos\n`
      : "";

    const prompt = `=== ROLE ===
Você é um especialista em processamento de linguagem natural com 10+ anos de experiência em transcrições médicas.
Sua especialidade é limpar e estruturar textos de consultas pediátricas, removendo ruídos enquanto preserva 100% do conteúdo clínico.
${patientInfo}

=== CONTEXTO DA TAREFA ===
Você receberá a transcrição bruta de um áudio de consulta médica feita pelo Whisper API.
A transcrição pode conter:
- Ruídos verbais (ãh, hmm, né, tá)
- Repetições e gagueira
- Conversas paralelas ou irrelevantes
- Sons ambiente transcritos incorretamente
- MAS também contém informações médicas valiosas que DEVEM ser preservadas

=== INSTRUÇÕES PASSO A PASSO (Chain-of-Thought) ===

**PASSO 1: ANÁLISE DE CONTEÚDO MÉDICO**
Verifique se o texto contém pelo menos UMA destas informações médicas REAIS:
✓ Queixa principal ou sintomas específicos
✓ História clínica (quando começou, evolução)
✓ Exame físico (temperatura, ausculta, palpação, inspeção)
✓ Medidas antropométricas (peso, altura, perímetro cefálico)
✓ Diagnóstico ou hipótese diagnóstica
✓ Prescrição ou plano terapêutico
✓ Orientações médicas específicas

Se o texto NÃO contém NENHUMA informação acima (apenas conversa casual, teste de gravação, etc):
→ Retorne: has_medical_content = false

**PASSO 2: LIMPEZA CONSERVADORA (Se houver conteúdo médico)**
Aplique limpeza CONSERVADORA seguindo esta hierarquia:

🔴 NUNCA REMOVA (Prioridade Máxima):
- Sintomas descritos pela mãe/paciente
- Achados do exame físico pela médica
- Valores numéricos (temperatura, peso, altura, doses)
- Nomes de medicamentos
- Diagnósticos mencionados
- Orientações terapêuticas
- Perguntas médicas relevantes
- Histórico gestacional/perinatal
- Alergias ou medicações em uso

🟡 PODE REMOVER (Ruídos):
- Preenchimentos verbais isolados: "ãh", "hmm", "né", "tá", "tipo assim"
- Gagueira: "ele ele ele tá"
- Repetições óbvias sem informação nova
- Saudações/despedidas genéricas: "oi", "tchau", "até logo"
- Sons ambiente incorretamente transcritos: "[música]", "[ruído]"

🟢 PRESERVAR CONTEXTO:
- Quem está falando (mãe vs médica) - manter indicadores
- Sequência cronológica dos eventos
- Relações causa-efeito
- Conectores importantes ("mas", "então", "porque")

**PASSO 3: VALIDAÇÃO FINAL**
Antes de retornar, verifique:
□ O texto limpo mantém TODAS as informações médicas?
□ A ordem cronológica foi preservada?
□ Não inventei ou adicionei informações?
□ O texto está gramaticalmente correto?
□ Tem pelo menos 50 palavras de conteúdo médico?

=== EXEMPLOS (Few-Shot Learning) ===

EXEMPLO 1 - Com Conteúdo Médico:
Input: "Oi doutora, então... ãh... ele tá com febre né, desde segunda-feira assim, começou com 38 graus e, e, e ontem chegou a 39,5. E tá tossindo também sabe, uma tosse seca que incomoda ele."

Output:
{
  "has_medical_content": true,
  "cleaned_text": "Ele está com febre desde segunda-feira, começou com 38 graus e ontem chegou a 39,5°C. Está tossindo também, uma tosse seca que incomoda.",
  "reason": null
}

EXEMPLO 2 - Sem Conteúdo Médico:
Input: "Oi, tá gravando? Acho que sim. Deixa eu ver... não, peraí, como é que funciona isso aqui? Ah tá, agora foi. Oi oi, teste teste."

Output:
{
  "has_medical_content": false,
  "cleaned_text": null,
  "reason": "Áudio contém apenas teste de gravação, sem informações médicas de consulta"
}

EXEMPLO 3 - Preservando Contexto Importante:
Input: "Mãe: Então doutora, na gestação eu tive diabetes gestacional tá, e ele nasceu com 4,2kg. Foi cesárea de urgência porque o líquido tava diminuindo né. Daí ele ficou 3 dias na UTI por causa de hipoglicemia."

Output:
{
  "has_medical_content": true,
  "cleaned_text": "Mãe relata que na gestação teve diabetes gestacional e o bebê nasceu com 4,2kg. Foi cesárea de urgência indicada por oligoidrâmnio. Recém-nascido necessitou internação em UTI neonatal por 3 dias devido a hipoglicemia.",
  "reason": null
}

=== CONSTRAINTS (NUNCA FAÇA ISSO) ===
❌ NUNCA invente dados que não foram mencionados
❌ NUNCA adicione valores numéricos que não foram ditos
❌ NUNCA crie uma consulta fictícia ou padronizada
❌ NUNCA remova informações médicas importantes
❌ NUNCA use o nome do paciente do contexto se não foi dito no áudio
❌ NUNCA retorne strings com aspas não escapadas (causa erro JSON)

=== SEMPRE FAÇA ISSO ===
✅ SEMPRE preserve 100% das informações médicas
✅ SEMPRE corrija erros gramaticais óbvios
✅ SEMPRE mantenha valores numéricos exatos
✅ SEMPRE indique quem está falando quando relevante
✅ SEMPRE escape aspas dentro de strings JSON (use \\" para aspas literais)
✅ SEMPRE retorne JSON válido sem quebras de linha dentro das strings

=== VALIDAÇÃO JSON ===
CRÍTICO: Sua resposta será parseada com JSON.parse()
- Use \\"n para quebras de linha dentro de strings
- Escape todas as aspas duplas dentro do texto: \\"
- Não use aspas simples dentro de strings
- Mantenha o JSON em uma única linha ou use escapes corretos

=== TRANSCRIÇÃO BRUTA PARA PROCESSAR ===
${textToClean}

=== OUTPUT FORMAT (OBRIGATÓRIO) ===
Retorne APENAS um objeto JSON válido com esta estrutura EXATA:
{
  "has_medical_content": boolean,
  "cleaned_text": "string com texto limpo OU null se sem conteúdo médico",
  "reason": "string explicando por que não tem conteúdo OU null se tem conteúdo"
}

IMPORTANTE: Garanta que o JSON seja válido! Teste mentalmente antes de retornar.`;

    console.log(`📊 Tamanho do prompt: ${prompt.length} caracteres`);
    console.log(`📊 Tamanho do texto: ${textToClean.length} caracteres`);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2, // Conservador mas permite naturalidade na limpeza
      max_tokens: 3000,
    });

    console.log(`📥 Resposta recebida:`, {
      choices: response.choices.length,
      finishReason: response.choices[0]?.finish_reason,
      hasContent: !!response.choices[0]?.message?.content,
      contentLength: response.choices[0]?.message?.content?.length || 0,
    });

    const content = response.choices[0].message.content?.trim();

    if (!content) {
      console.error("❌ Resposta vazia da API:", {
        response: JSON.stringify(response, null, 2).substring(0, 500),
      });

      // 🔥 FALLBACK: Se API retornar vazio mas texto tem conteúdo médico
      // assumir que tem conteúdo e retornar texto original
      const lowerText = textToClean.toLowerCase();
      const hasMedicalKeywords =
        lowerText.includes("febre") ||
        lowerText.includes("tosse") ||
        lowerText.includes("dor") ||
        lowerText.includes("médica") ||
        lowerText.includes("doutor") ||
        lowerText.includes("consulta") ||
        lowerText.includes("paciente") ||
        lowerText.includes("sintoma") ||
        lowerText.includes("medicação") ||
        lowerText.includes("exame");

      if (hasMedicalKeywords && textToClean.length > 100) {
        console.warn(
          "⚠️ API retornou vazio mas detectamos conteúdo médico - usando texto original"
        );
        return textToClean; // Retornar texto original como string
      }

      throw new Error(
        "Resposta vazia da API. Isso pode indicar um problema temporário. Tente novamente."
      );
    }

    // Tentar parsear JSON com tratamento robusto de erro
    let result: CleaningResult;
    try {
      result = JSON.parse(content);
    } catch (parseError: any) {
      console.error("❌ Erro ao parsear JSON:", parseError);
      console.error("📄 Conteúdo retornado:", content.substring(0, 500));

      // Tentar extrair informação útil mesmo com JSON inválido
      const hasContent = content.toLowerCase().includes('"has_medical_content": true');

      if (!hasContent) {
        // Se não tem conteúdo médico, retornar erro genérico
        throw new Error(
          "DADOS_INSUFICIENTES: O áudio não contém informações médicas suficientes. " +
          "Por favor, grave novamente com conteúdo da consulta."
        );
      }

      throw new Error(
        `Erro ao processar resposta da IA (JSON inválido): ${parseError.message}. ` +
        `Por favor, tente novamente.`
      );
    }

    // Validar estrutura do resultado
    if (typeof result.has_medical_content !== 'boolean') {
      throw new Error("Resposta da IA inválida: campo has_medical_content não é boolean");
    }

    // Verificar se tem conteúdo médico
    if (!result.has_medical_content) {
      console.log("⚠️ Texto não contém conteúdo médico:", result.reason);
      throw new Error(
        `DADOS_INSUFICIENTES: O áudio não contém informações médicas de uma consulta real. ` +
        `${result.reason || "Por favor, grave novamente com a consulta médica."}`
      );
    }

    if (!result.cleaned_text || result.cleaned_text.trim().length === 0) {
      throw new Error(
        "DADOS_INSUFICIENTES: Não foi possível extrair conteúdo médico do áudio. " +
        "Por favor, grave novamente."
      );
    }

    // Validar tamanho mínimo do texto limpo
    const wordCount = result.cleaned_text.trim().split(/\s+/).length;
    if (wordCount < 15) {
      throw new Error(
        `DADOS_INSUFICIENTES: O texto limpo contém apenas ${wordCount} palavras (mínimo 15). ` +
        `Por favor, grave uma consulta mais completa.`
      );
    }

    console.log("✅ Texto limpo com sucesso");
    console.log(`   Conteúdo médico detectado: ✓`);
    console.log(`   Palavras no texto limpo: ${wordCount}`);
    console.log(`   Preview: ${result.cleaned_text.substring(0, 100)}...`);

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
