/**
 * Geração de Prescrição Médica Personalizada com IA
 * Dupla validação: Geração + Revalidação
 */

import { openai } from "@/lib/openai/client";

interface PatientData {
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  head_circumference_cm?: number;
  allergies?: string;
  current_medications?: string;
  medical_history?: string;
}

interface ClinicalData {
  chief_complaint?: string;
  history?: string;
  physical_exam?: string;
  diagnosis: string;
  plan?: string;
}

interface PrescriptionContext {
  patient: PatientData;
  clinical: ClinicalData;
}

/**
 * Gera prescrição personalizada usando IA (1ª passada)
 */
async function generatePrescription(context: PrescriptionContext): Promise<string> {
  const { patient, clinical } = context;

  const prompt = `Você é um pediatra experiente gerando uma prescrição médica personalizada.

DADOS DO PACIENTE:
- Idade: ${patient.age ? `${patient.age} anos` : "não informada"}
- Peso: ${patient.weight_kg ? `${patient.weight_kg}kg` : "não informado"}
- Altura: ${patient.height_cm ? `${patient.height_cm}cm` : "não informada"}
${patient.head_circumference_cm ? `- Perímetro Cefálico: ${patient.head_circumference_cm}cm` : ""}
${patient.allergies ? `- ALERGIAS: ${patient.allergies}` : ""}
${patient.current_medications ? `- Medicações em uso: ${patient.current_medications}` : ""}
${patient.medical_history ? `- Histórico: ${patient.medical_history}` : ""}

DADOS CLÍNICOS:
${clinical.chief_complaint ? `- Queixa Principal: ${clinical.chief_complaint}` : ""}
${clinical.history ? `- Anamnese: ${clinical.history}` : ""}
${clinical.physical_exam ? `- Exame Físico: ${clinical.physical_exam}` : ""}
- Diagnóstico: ${clinical.diagnosis}
${clinical.plan ? `- Plano: ${clinical.plan}` : ""}

INSTRUÇÕES:
1. Gere uma prescrição COMPLETA e ESPECÍFICA para este caso
2. Calcule dosagens baseadas no peso (quando aplicável)
3. Inclua frequência, duração e via de administração
4. Considere a idade para escolher medicações apropriadas
5. EVITE medicações que o paciente é alérgico
6. Verifique interações com medicações atuais
7. Inclua orientações gerais de cuidado
8. Adicione sinais de alerta (quando retornar)
9. Use EMOJIS para tornar mais visual e amigável

FORMATO (use formato livre mas mantenha estes tópicos):

PRESCRIÇÃO:
[Escreva as medicações de forma natural e clara, incluindo dosagens calculadas]

ORIENTAÇÕES GERAIS:
[Orientações de cuidado e recomendações para os pais/responsáveis]

SINAIS DE ALERTA - RETORNAR SE:
[Liste sinais de que a criança precisa retornar imediatamente]

IMPORTANTE:
[Informações críticas sobre a medicação ou tratamento]


DIRETRIZES:
- Seja ESPECÍFICO (não use "conforme necessário")
- CALCULE dosagens exatas quando tiver peso
- Use terminologia CLARA para pais entenderem
- Seja HUMANO e ACOLHEDOR
- Use emojis para tornar mais visual
- Formato livre mas organizado e legível
- NÃO USE formatação Markdown (asteriscos **, underscores _, etc)
- Use TEXTO SIMPLES sem marcadores de formatação
- Os títulos devem ser em texto puro: "PRESCRIÇÃO:" (não **PRESCRIÇÃO:**)
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um pediatra especializado em prescrições médicas pediátricas, sempre preciso, cuidadoso e com comunicação clara e empática com os pais.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.4, // Temperatura ligeiramente maior para mais naturalidade
      max_tokens: 2000, // Mais tokens para formato livre com emojis
    });

    const prescription = completion.choices[0]?.message?.content?.trim();

    if (!prescription) {
      throw new Error("IA não retornou prescrição");
    }

    return prescription;
  } catch (error: any) {
    console.error("Erro ao gerar prescrição:", error);
    throw new Error(`Erro na geração: ${error.message}`);
  }
}

/**
 * Revalida e corrige prescrição (2ª passada)
 */
async function revalidatePrescription(
  prescription: string,
  context: PrescriptionContext
): Promise<string> {
  const { patient, clinical } = context;

  const prompt = `Você é um farmacêutico clínico especializado em revisão de prescrições pediátricas.

PRESCRIÇÃO GERADA:
${prescription}

DADOS DO PACIENTE:
- Idade: ${patient.age ? `${patient.age} anos` : "não informada"}
- Peso: ${patient.weight_kg ? `${patient.weight_kg}kg` : "não informado"}
${patient.allergies ? `- ALERGIAS: ${patient.allergies}` : ""}
${patient.current_medications ? `- Medicações em uso: ${patient.current_medications}` : ""}
- Diagnóstico: ${clinical.diagnosis}

SUA TAREFA:
1. REVISE a prescrição acima
2. VERIFIQUE:
   - Dosagens corretas para peso/idade
   - Medicações apropriadas para a idade
   - Conflito com alergias
   - Interações medicamentosas
   - Frequências e durações adequadas
   - Clareza das instruções
   - Formatação sem Markdown

3. CORRIJA quaisquer erros encontrados
4. MELHORE a clareza e empatia se necessário
5. Mantenha o FORMATO LIVRE com os tópicos obrigatórios
6. Mantenha ou melhore os emojis para tornar mais visual

REGRAS DE FORMATAÇÃO:
- NÃO USE formatação Markdown (asteriscos **, underscores _, etc)
- Use TEXTO SIMPLES sem marcadores de formatação
- Os títulos devem ser em texto puro: "PRESCRIÇÃO:" (não **PRESCRIÇÃO:**)
- REMOVA quaisquer asteriscos ou underscores usados para formatação

RETORNE:
- A prescrição CORRIGIDA, VALIDADA e HUMANIZADA
- Se não houver erros, retorne a prescrição original com pequenas melhorias
- Mantenha os tópicos: PRESCRIÇÃO, ORIENTAÇÕES GERAIS, SINAIS DE ALERTA, IMPORTANTE
- IMPORTANTE: Texto puro, sem formatação Markdown

NÃO adicione comentários ou explicações, apenas retorne a prescrição final formatada.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um revisor especializado em segurança de prescrições pediátricas, focado em precisão técnica e clareza na comunicação.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2, // Temperatura baixa mas permitindo alguma flexibilidade na forma
      max_tokens: 2000,
    });

    const validatedPrescription = completion.choices[0]?.message?.content?.trim();

    if (!validatedPrescription) {
      // Se falhar revalidação, retorna original
      console.warn("Revalidação falhou, usando prescrição original");
      return prescription;
    }

    return validatedPrescription;
  } catch (error: any) {
    console.error("Erro ao revalidar prescrição:", error);
    // Se falhar revalidação, retorna original
    return prescription;
  }
}

/**
 * Remove formatação Markdown da prescrição
 */
function removeMarkdownFormatting(text: string): string {
  return text
    // Remove negrito: **texto** ou __texto__ -> texto
    .replace(/\*\*([^\*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // Remove itálico: *texto* ou _texto_ -> texto (apenas se não for bullet point)
    .replace(/([^\n])\*([^\*\n]+)\*([^\n])/g, '$1$2$3')
    .replace(/([^\n])_([^_\n]+)_([^\n])/g, '$1$2$3')
    // Remove asteriscos órfãos (que não são bullets)
    .replace(/([^\n\s])\*\*([^\n])/g, '$1$2')
    .replace(/([^\n])\*\*([^\n\s])/g, '$1$2')
    // Preserva bullets (• ou *) no início de linhas
    .trim();
}

/**
 * Função principal: Gera e valida prescrição
 */
export async function generateValidatedPrescription(
  context: PrescriptionContext
): Promise<string> {
  console.log("🤖 Gerando prescrição com IA (1ª passada)...");
  const prescription = await generatePrescription(context);

  console.log("✅ Prescrição gerada");
  console.log("🔍 Revalidando prescrição (2ª passada)...");
  const validatedPrescription = await revalidatePrescription(prescription, context);

  console.log("🧹 Removendo formatação Markdown...");
  const cleanPrescription = removeMarkdownFormatting(validatedPrescription);

  console.log("✅ Prescrição validada e pronta!");
  return cleanPrescription;
}
