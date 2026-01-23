import { openai } from "./client";

interface PatientContext {
  patientName?: string;
  patientAge?: number | null;
  weight?: number | null;
  height?: number | null;
  allergies?: string[] | null;
  bloodType?: string | null;
  medicalHistory?: string | null;
  currentMedications?: string | null;
}

export interface ConsultationFields {
  chief_complaint: string | null;
  history: string | null;
  physical_exam: string | null;
  diagnosis: string | null;
  plan: string | null;
  notes: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  head_circumference_cm: number | null;
  development_notes: string | null;
}

/**
 * Extrai campos estruturados de uma consulta médica a partir do texto limpo
 * @param cleanedText - Texto limpo e processado
 * @param context - Contexto do paciente para melhorar a análise
 * @returns Campos estruturados da consulta
 */
export async function extractConsultationFields(
  cleanedText: string,
  context?: PatientContext
): Promise<ConsultationFields> {
  if (!cleanedText || cleanedText.trim().length === 0) {
    throw new Error("Texto para extração está vazio");
  }

  try {
    console.log("🤖 Iniciando extração de campos estruturados...");

    // Criar contexto rico do paciente
    let patientContextText = "";
    if (context) {
      patientContextText = "\n\nCONTEXTO DO PACIENTE (para referência e análise):\n";
      
      if (context.patientName) {
        patientContextText += `- Nome: ${context.patientName}\n`;
      }
      if (context.patientAge !== null && context.patientAge !== undefined) {
        patientContextText += `- Idade: ${context.patientAge} anos\n`;
      }
      if (context.weight) {
        patientContextText += `- Peso cadastrado: ${context.weight} kg\n`;
      }
      if (context.height) {
        patientContextText += `- Altura cadastrada: ${context.height} cm\n`;
      }
      if (context.bloodType) {
        patientContextText += `- Tipo sanguíneo: ${context.bloodType}\n`;
      }
      if (context.allergies && context.allergies.length > 0) {
        patientContextText += `- Alergias conhecidas: ${context.allergies.join(", ")}\n`;
      }
      if (context.medicalHistory) {
        patientContextText += `- Histórico médico: ${context.medicalHistory}\n`;
      }
      if (context.currentMedications) {
        patientContextText += `- Medicações em uso: ${context.currentMedications}\n`;
      }

      patientContextText += "\nUSE ESTAS INFORMAÇÕES para:\n";
      patientContextText += "- Contextualizar melhor a consulta\n";
      patientContextText += "- Identificar mudanças nos valores (peso, altura)\n";
      patientContextText += "- Alertar sobre interações medicamentosas\n";
      patientContextText += "- Considerar alergias ao sugerir tratamentos\n";
      patientContextText += "- Analisar desenvolvimento considerando a idade\n";
    }

    const prompt = `Você é um assistente médico especializado em pediatria com expertise em organizar documentação clínica.
${patientContextText}

TAREFA: Analise a transcrição da consulta médica pediátrica e extraia as seguintes informações de forma estruturada e precisa:

**CAMPOS OBRIGATÓRIOS:**

1. **chief_complaint** (Queixa Principal):
   - O motivo principal da consulta
   - O que levou o paciente/responsável a procurar atendimento
   - Sintoma ou preocupação principal

2. **history** (História/Anamnese):
   - Histórico detalhado dos sintomas
   - Duração, evolução e características
   - Fatores desencadeantes ou agravantes
   - Tratamentos já realizados
   - Histórico médico relevante

3. **physical_exam** (Exame Físico):
   - Achados do exame clínico
   - Sinais vitais se mencionados
   - Inspeção, palpação, ausculta
   - Aspectos gerais (estado geral, hidratação, etc)

4. **diagnosis** (Diagnóstico/Avaliação):
   - Diagnóstico principal ou hipótese diagnóstica
   - Diagnósticos diferenciais se mencionados
   - Avaliação clínica geral

5. **plan** (Plano Terapêutico):
   - Medicações prescritas (com dosagem e posologia)
   - Exames solicitados
   - Orientações gerais
   - Retorno e acompanhamento
   - Encaminhamentos se necessário

6. **notes** (Observações Adicionais):
   - Qualquer informação relevante que não se encaixe nos campos acima
   - Observações especiais
   - Preocupações ou alertas

**CAMPOS PEDIÁTRICOS OPCIONAIS** (apenas se mencionados):

7. **weight_kg**: Peso atual em kg (número decimal)
8. **height_cm**: Altura atual em cm (número decimal)
9. **head_circumference_cm**: Perímetro cefálico em cm (número decimal)
10. **development_notes**: Observações sobre desenvolvimento neuropsicomotor

**INSTRUÇÕES IMPORTANTES:**
- Se um campo não tiver informação na transcrição, retorne null
- Seja preciso e objetivo, mas preserve informações clínicas importantes
- Use linguagem médica apropriada
- Para números, extraia apenas o valor numérico
- Organize as informações de forma clara e estruturada
- NÃO invente informações que não estejam no texto

TRANSCRIÇÃO DA CONSULTA:
${cleanedText}

Retorne APENAS um objeto JSON válido no seguinte formato (sem markdown, sem explicações):
{
  "chief_complaint": "texto ou null",
  "history": "texto ou null",
  "physical_exam": "texto ou null",
  "diagnosis": "texto ou null",
  "plan": "texto ou null",
  "notes": "texto ou null",
  "weight_kg": número ou null,
  "height_cm": número ou null,
  "head_circumference_cm": número ou null,
  "development_notes": "texto ou null"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2, // Muito conservador para extração precisa
      max_tokens: 2500,
    });

    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error("Resposta vazia da API");
    }

    const extractedFields = JSON.parse(content) as ConsultationFields;

    // Validar que pelo menos um campo foi preenchido
    const hasContent = Object.values(extractedFields).some(
      (value) => value !== null && value !== ""
    );

    if (!hasContent) {
      throw new Error("Nenhum campo foi extraído da transcrição");
    }

    console.log("✅ Campos extraídos com sucesso");
    console.log(`   - Queixa: ${extractedFields.chief_complaint ? '✓' : '✗'}`);
    console.log(`   - História: ${extractedFields.history ? '✓' : '✗'}`);
    console.log(`   - Exame: ${extractedFields.physical_exam ? '✓' : '✗'}`);
    console.log(`   - Diagnóstico: ${extractedFields.diagnosis ? '✓' : '✗'}`);
    console.log(`   - Plano: ${extractedFields.plan ? '✓' : '✗'}`);
    
    return extractedFields;
  } catch (error: any) {
    console.error("❌ Erro na extração de campos:", error);
    throw new Error(`Erro ao extrair campos: ${error.message}`);
  }
}
