/**
 * Gerador de Templates de Prescrição com IA
 * Usa GPT-4o-mini para criar templates pediátricos profissionais
 */

import { openai } from "@/lib/openai/client";
import type { Medication, PrescriptionTemplateCreate } from "@/lib/types/prescription-template";

interface GenerateTemplateOptions {
  condition: string;           // Ex: "Febre infantil"
  category: string;            // Ex: "Sintomas Comuns"
  ageRange?: string;           // Ex: "2-12 anos"
  includeAlternatives?: boolean;
}

/**
 * Gera um template de prescrição usando IA
 */
export async function generatePrescriptionTemplate(
  options: GenerateTemplateOptions
): Promise<PrescriptionTemplateCreate> {
  const { condition, category, ageRange = "0-12 anos", includeAlternatives = false } = options;

  const prompt = `Você é um pediatra experiente criando um template de prescrição para uso recorrente.

CONDIÇÃO: ${condition}
CATEGORIA: ${category}
FAIXA ETÁRIA: ${ageRange}

Crie um template de prescrição profissional, prático e seguro, no formato JSON:

{
  "name": "Nome descritivo do template",
  "category": "${category}",
  "medications": [
    {
      "name": "Nome do medicamento",
      "dosage": "Dose (ex: '15mg/kg/dose' ou '500mg')",
      "frequency": "Frequência (ex: '6/6h', '3x/dia')",
      "route": "Via (ex: 'VO', 'IM', 'Tópico')",
      "condition": "Condição para uso (opcional, ex: 'se febre > 38°C')",
      "duration": "Duração (ex: 'por 7 dias', 'enquanto febre')",
      "notes": "Observações importantes (opcional)"
    }
  ],
  "instructions": "Orientações gerais para os pais/responsáveis (cuidados, sinais de alerta, alimentação, hidratação, etc)",
  "warnings": "Alertas importantes (contraindicações, quando retornar, sinais de gravidade)"
}

DIRETRIZES IMPORTANTES:
- Use doses pediátricas corretas e seguras
- Inclua 1-3 medicações principais (não exagere)
- Seja específico nas dosagens (mg/kg quando apropriado)
- Frequências claras (6/6h, 8/8h, 12/12h, etc)
- Orientações práticas e fáceis de seguir
- Alertas sobre sinais de gravidade
- Linguagem profissional mas acessível
${includeAlternatives ? "- Inclua medicações alternativas quando relevante" : ""}

IMPORTANTE: 
- Para antitérmicos/analgésicos, sempre usar dose por kg
- Para antibióticos, especificar claramente a duração
- Orientações devem ser diretas e práticas

Retorne APENAS o JSON, sem texto adicional.`;

  try {
    console.log(`🤖 Gerando template com IA: ${condition}...`);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    const template = JSON.parse(content) as PrescriptionTemplateCreate;

    console.log(`✅ Template gerado: ${template.name}`);
    return template;
  } catch (error) {
    console.error("❌ Erro ao gerar template com IA:", error);
    throw new Error(`Falha ao gerar template: ${error}`);
  }
}

/**
 * Gera múltiplos templates de uma vez
 */
export async function generateMultipleTemplates(
  conditions: Array<{ condition: string; category: string; ageRange?: string }>
): Promise<PrescriptionTemplateCreate[]> {
  console.log(`🤖 Gerando ${conditions.length} templates com IA...`);

  const templates: PrescriptionTemplateCreate[] = [];

  for (const config of conditions) {
    try {
      const template = await generatePrescriptionTemplate(config);
      templates.push(template);
      
      // Delay para não sobrecarregar API
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Erro ao gerar template para ${config.condition}:`, error);
    }
  }

  console.log(`✅ ${templates.length}/${conditions.length} templates gerados com sucesso`);
  return templates;
}

/**
 * Templates padrão para seed
 */
export const DEFAULT_TEMPLATES_CONFIG = [
  // Sintomas Comuns
  { condition: "Febre infantil", category: "Sintomas Comuns", ageRange: "2-12 anos" },
  { condition: "Gripe e resfriado", category: "Sintomas Comuns", ageRange: "2-12 anos" },
  { condition: "Dor de garganta", category: "Sintomas Comuns", ageRange: "3-12 anos" },
  { condition: "Tosse seca", category: "Sintomas Comuns", ageRange: "2-12 anos" },
  { condition: "Diarreia aguda", category: "Sintomas Comuns", ageRange: "6 meses-12 anos" },
  
  // Antibióticos
  { condition: "Amigdalite bacteriana", category: "Antibióticos", ageRange: "3-12 anos" },
  { condition: "Otite média aguda", category: "Antibióticos", ageRange: "6 meses-12 anos" },
  { condition: "Sinusite bacteriana", category: "Antibióticos", ageRange: "2-12 anos" },
  { condition: "Infecção urinária", category: "Antibióticos", ageRange: "1-12 anos" },
  
  // Doenças Crônicas
  { condition: "Asma leve persistente", category: "Doenças Crônicas", ageRange: "4-12 anos" },
  { condition: "Rinite alérgica", category: "Doenças Crônicas", ageRange: "3-12 anos" },
  { condition: "Dermatite atópica", category: "Doenças Crônicas", ageRange: "6 meses-12 anos" },
  
  // Preventivos
  { condition: "Suplementação de ferro", category: "Preventivos", ageRange: "6 meses-5 anos" },
  { condition: "Vitamina D profilática", category: "Preventivos", ageRange: "0-2 anos" },
  { condition: "Verminose - tratamento profilático", category: "Preventivos", ageRange: "2-12 anos" },
];
