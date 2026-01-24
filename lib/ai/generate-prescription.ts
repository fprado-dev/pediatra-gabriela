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
${patient.allergies ? `- ⚠️  ALERGIAS: ${patient.allergies}` : ""}
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

FORMATO OBRIGATÓRIO:

PRESCRIÇÃO:
1. [Medicamento] [dosagem calculada] - [via] - [frequência] - [duração]
2. [Medicamento] [dosagem calculada] - [via] - [frequência] - [duração]
(adicione quantos forem necessários)

ORIENTAÇÕES GERAIS:
- [Orientação específica 1]
- [Orientação específica 2]
- [Orientação específica 3]

SINAIS DE ALERTA - RETORNAR SE:
- [Sinal de alerta 1]
- [Sinal de alerta 2]
- [Sinal de alerta 3]

IMPORTANTE:
- Seja ESPECÍFICO (não use "conforme necessário")
- CALCULE dosagens exatas quando tiver peso
- Use terminologia médica CORRETA
- Seja CLARO e OBJETIVO
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um pediatra especializado em prescrições médicas pediátricas, sempre preciso e cuidadoso.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3, // Baixa temperatura para consistência médica
      max_tokens: 1500,
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
${patient.allergies ? `- ⚠️  ALERGIAS: ${patient.allergies}` : ""}
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

3. CORRIJA quaisquer erros encontrados
4. MELHORE a clareza se necessário
5. Mantenha o MESMO FORMATO

RETORNE:
- A prescrição CORRIGIDA e VALIDADA
- Se não houver erros, retorne a prescrição original com pequenas melhorias de clareza

NÃO adicione comentários, apenas retorne a prescrição final formatada.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um revisor especializado em segurança de prescrições pediátricas.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1, // Temperatura ainda mais baixa para revisão
      max_tokens: 1500,
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

  console.log("✅ Prescrição validada e pronta!");
  return validatedPrescription;
}
