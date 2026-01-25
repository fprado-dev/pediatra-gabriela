import { openai } from "./client";

interface PatientContext {
  patientName?: string;
  patientAge?: number | null;
  weight?: number | null;
  height?: number | null;
  headCircumference?: number | null;
  allergies?: string | null;
  bloodType?: string | null;
  medicalHistory?: string | null;
  currentMedications?: string | null;
}

export interface ConsultationFields {
  chief_complaint: string | null;
  history: string | null;
  physical_exam: string | null;
  diagnosis: string | null;
  diagnosis_is_ai_suggestion?: boolean;
  plan: string | null;
  notes: string | null;
  weight_kg: number | null;
  weight_source?: "audio" | "profile" | null;
  height_cm: number | null;
  height_source?: "audio" | "profile" | null;
  head_circumference_cm: number | null;
  head_circumference_source?: "audio" | "profile" | null;
  development_notes: string | null;
  medication_alerts?: string | null;
}

const MIN_WORDS_FOR_EXTRACTION = 20;

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

  // Validar quantidade mínima de palavras
  const wordCount = cleanedText.trim().split(/\s+/).length;
  if (wordCount < MIN_WORDS_FOR_EXTRACTION) {
    throw new Error(
      `DADOS_INSUFICIENTES: O áudio não contém informações médicas suficientes para processar a consulta. ` +
      `Foram detectadas apenas ${wordCount} palavras. Por favor, grave novamente com mais detalhes sobre a consulta.`
    );
  }

  try {
    console.log("🤖 Iniciando extração de campos estruturados...");

    // Criar contexto rico do paciente
    let patientContextText = "";
    if (context) {
      patientContextText = "\n\n=== DADOS DO PACIENTE (do cadastro) ===\n";
      
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
      if (context.headCircumference) {
        patientContextText += `- Perímetro cefálico cadastrado: ${context.headCircumference} cm\n`;
      }
      if (context.bloodType) {
        patientContextText += `- Tipo sanguíneo: ${context.bloodType}\n`;
      }
      if (context.allergies) {
        patientContextText += `- ⚠️ ALERGIAS: ${context.allergies}\n`;
      }
      if (context.medicalHistory) {
        patientContextText += `- Histórico médico prévio: ${context.medicalHistory}\n`;
      }
      if (context.currentMedications) {
        patientContextText += `- Medicações em uso contínuo: ${context.currentMedications}\n`;
      }
    }

    const prompt = `Você é um assistente médico especializado em pediatria com expertise em organizar documentação clínica.
${patientContextText}

=== TAREFA ===
Analise a transcrição da consulta médica pediátrica e extraia as informações de forma estruturada.

**REGRAS IMPORTANTES:**

1. **DADOS ANTROPOMÉTRICOS (peso, altura, perímetro cefálico):**
   - Se mencionado no ÁUDIO: use o valor do áudio e marque source como "audio"
   - Se NÃO mencionado no áudio mas existe no CADASTRO: use o valor do cadastro e marque source como "profile"
   - Se não existe em nenhum: retorne null

2. **HISTÓRICO/ANAMNESE:**
   - MESCLE o histórico do cadastro com as informações da consulta atual
   - Inclua o histórico prévio do paciente como contexto
   - Adicione as informações novas da gravação

3. **DIAGNÓSTICO:**
   - SEMPRE gere uma hipótese diagnóstica baseada nos sintomas + contexto do paciente
   - Marque diagnosis_is_ai_suggestion como TRUE se o diagnóstico não foi explicitamente dito na gravação
   - Use os dados do paciente (idade, histórico, alergias) para contextualizar

4. **ALERTAS DE MEDICAÇÃO:**
   - Se o paciente tem medicações em uso contínuo, SEMPRE mencione em medication_alerts
   - Alerte sobre possíveis interações com o plano terapêutico
   - Considere alergias ao avaliar prescrições

**CAMPOS A EXTRAIR:**

1. **chief_complaint**: Queixa principal / motivo da consulta
2. **history**: Anamnese completa (MESCLAR histórico prévio do cadastro + informações da gravação)
3. **physical_exam**: Achados do exame físico
4. **diagnosis**: Diagnóstico ou hipótese diagnóstica (SEMPRE preencher com base nos sintomas)
5. **diagnosis_is_ai_suggestion**: true se a IA sugeriu o diagnóstico, false se foi dito na gravação
6. **plan**: Plano terapêutico
7. **notes**: Observações adicionais
8. **weight_kg**: Peso em kg
9. **weight_source**: "audio" ou "profile"
10. **height_cm**: Altura em cm
11. **height_source**: "audio" ou "profile"
12. **head_circumference_cm**: Perímetro cefálico em cm
13. **head_circumference_source**: "audio" ou "profile"
14. **development_notes**: Observações sobre desenvolvimento
15. **medication_alerts**: Alertas sobre medicações em uso (sempre preencher se houver)

**VALIDAÇÃO:**
- has_sufficient_data: false se não houver queixa principal clara na gravação

=== TRANSCRIÇÃO DA CONSULTA ===
${cleanedText}

Retorne APENAS um objeto JSON válido:
{
  "has_sufficient_data": true ou false,
  "chief_complaint": "texto ou null",
  "history": "texto mesclando histórico prévio + consulta atual",
  "physical_exam": "texto ou null",
  "diagnosis": "hipótese diagnóstica (sempre preencher se houver sintomas)",
  "diagnosis_is_ai_suggestion": true ou false,
  "plan": "texto ou null",
  "notes": "texto ou null",
  "weight_kg": número ou null,
  "weight_source": "audio" ou "profile" ou null,
  "height_cm": número ou null,
  "height_source": "audio" ou "profile" ou null,
  "head_circumference_cm": número ou null,
  "head_circumference_source": "audio" ou "profile" ou null,
  "development_notes": "texto ou null",
  "medication_alerts": "alertas sobre medicações ou null"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 3000,
    });

    const content = response.choices[0].message.content;

    if (!content) {
      throw new Error("Resposta vazia da API");
    }

    const parsedResponse = JSON.parse(content);

    // Verificar se a IA indicou dados insuficientes
    if (parsedResponse.has_sufficient_data === false) {
      throw new Error(
        "DADOS_INSUFICIENTES: O áudio não contém informações médicas suficientes para processar a consulta. " +
        "Por favor, grave novamente incluindo: queixa principal, sintomas, e informações relevantes da consulta."
      );
    }

    // Remover o campo de controle antes de retornar
    const { has_sufficient_data, ...extractedFields } = parsedResponse;

    // Validar que pelo menos a queixa principal foi preenchida
    if (!extractedFields.chief_complaint) {
      throw new Error(
        "DADOS_INSUFICIENTES: Não foi possível identificar a queixa principal do áudio. " +
        "Por favor, grave novamente mencionando claramente o motivo da consulta."
      );
    }

    const result = extractedFields as ConsultationFields;

    console.log("✅ Campos extraídos com sucesso");
    console.log(`   - Queixa: ${result.chief_complaint ? '✓' : '✗'}`);
    console.log(`   - História: ${result.history ? '✓' : '✗'}`);
    console.log(`   - Exame: ${result.physical_exam ? '✓' : '✗'}`);
    console.log(`   - Diagnóstico: ${result.diagnosis ? '✓' : '✗'} ${result.diagnosis_is_ai_suggestion ? '(sugestão IA)' : ''}`);
    console.log(`   - Plano: ${result.plan ? '✓' : '✗'}`);
    console.log(`   - Peso: ${result.weight_kg ? `${result.weight_kg}kg (${result.weight_source})` : '✗'}`);
    console.log(`   - Altura: ${result.height_cm ? `${result.height_cm}cm (${result.height_source})` : '✗'}`);
    if (result.medication_alerts) {
      console.log(`   - ⚠️ Alertas: ${result.medication_alerts}`);
    }

    return result;
  } catch (error: any) {
    console.error("❌ Erro na extração de campos:", error);
    throw new Error(`Erro ao extrair campos: ${error.message}`);
  }
}
