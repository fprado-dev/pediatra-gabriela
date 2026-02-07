import { openai } from "./client";
import { PreviousConsultationSummary } from "@/lib/types/consultation";

interface ConsultationDataForSummary {
  consultation_id: string;
  created_at: string;
  consultation_type: string;
  consultation_subtype?: string | null;
  chief_complaint?: string | null;
  hma?: string | null;
  physical_exam?: string | null;
  diagnosis?: string | null;
  conduct?: string | null;
  plan?: string | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  development_notes?: string | null;
}

/**
 * Gera resumo automático de uma consulta finalizada para histórico
 * @param consultationData - Dados da consulta a ser resumida
 * @returns Resumo estruturado com 3-5 pontos principais
 */
export async function generateConsultationSummary(
  consultationData: ConsultationDataForSummary
): Promise<Omit<PreviousConsultationSummary, "auto_generated" | "edited_by_doctor">> {
  console.log(`🤖 Gerando resumo automático da consulta ${consultationData.consultation_id}...`);

  // Validar dados mínimos
  if (!consultationData.chief_complaint && !consultationData.diagnosis) {
    throw new Error("Consulta não possui dados suficientes para gerar resumo (faltam queixa e diagnóstico)");
  }

  const prompt = `=== ROLE ===
Você é uma médica pediatra especialista em documentação clínica com foco em continuidade do cuidado.
Sua expertise é sintetizar consultas pediátricas em pontos-chave concisos e clinicamente relevantes.

=== CONTEXTO DA TAREFA ===
Você receberá os dados estruturados de uma consulta pediátrica finalizada.
Seu objetivo é gerar um resumo de 3-5 pontos principais que serão exibidos no histórico da PRÓXIMA consulta do paciente.

Este resumo deve ajudar a médica a:
1. Relembrar rapidamente o que ocorreu na última consulta
2. Identificar orientações que foram dadas e devem ser verificadas
3. Contextualizar queixas atuais com histórico recente
4. Garantir continuidade do cuidado

=== DADOS DA CONSULTA ===
Data: ${new Date(consultationData.created_at).toLocaleDateString('pt-BR')}
Tipo: ${consultationData.consultation_type}${consultationData.consultation_subtype ? ` - ${consultationData.consultation_subtype}` : ''}

Queixa Principal: ${consultationData.chief_complaint || 'Não registrada'}

História da Moléstia Atual:
${consultationData.hma || 'Não registrada'}

Exame Físico:
${consultationData.physical_exam || 'Não registrado'}

Diagnóstico: ${consultationData.diagnosis || 'Não registrado'}

Conduta:
${consultationData.conduct || 'Não registrada'}

Plano Terapêutico:
${consultationData.plan || 'Não registrado'}

${consultationData.development_notes ? `Desenvolvimento:\n${consultationData.development_notes}` : ''}

${consultationData.weight_kg || consultationData.height_cm ? `Medidas: ${consultationData.weight_kg ? `${consultationData.weight_kg}kg` : ''} ${consultationData.height_cm ? `${consultationData.height_cm}cm` : ''}` : ''}

=== INSTRUÇÕES PARA CRIAÇÃO DO RESUMO ===

**ETAPA 1: IDENTIFICAR INFORMAÇÕES CRÍTICAS**
Analise os dados e identifique os pontos mais relevantes para continuidade do cuidado:
- Diagnóstico principal
- Orientações/prescrições que devem ser verificadas no retorno
- Exames solicitados que devem ter resultado avaliado
- Encaminhamentos realizados
- Alertas sobre medicações ou alergias
- Marcos de desenvolvimento importantes (em puericulturas)
- Medidas antropométricas se relevantes (ex: desnutrição, obesidade)

**ETAPA 2: PRIORIZAR POR TIPO DE CONSULTA**
${consultationData.consultation_type === 'puericultura' 
  ? `PUERICULTURA: Focar em:
- Marcos de desenvolvimento atingidos
- Orientações sobre alimentação/sono dadas
- Medidas de crescimento (peso/altura em percentil)
- Calendário vacinal
- Próximos marcos esperados` 
  : consultationData.consultation_type === 'urgencia_emergencia'
  ? `URGÊNCIA/EMERGÊNCIA: Focar em:
- Diagnóstico do quadro agudo
- Medicações prescritas e duração
- Sinais de alerta orientados
- Necessidade de reavaliação ou exames de controle`
  : `CONSULTA DE ROTINA: Focar em:
- Problema identificado e conduta
- Exames solicitados
- Encaminhamentos realizados
- Orientações preventivas`}

**ETAPA 3: ESTRUTURAR PONTOS-CHAVE**
Crie 3-5 pontos concisos (máximo 150 caracteres cada):
- Use linguagem médica clara e objetiva
- Cada ponto deve ser auto-contido (não depender de outros)
- Priorize informações acionáveis (o que checar, o que reavaliar)
- Use verbos no passado para diagnósticos/achados
- Use verbos no imperativo para ações pendentes

**ETAPA 4: VALIDAR QUALIDADE**
Antes de retornar, verifique:
□ Cada ponto tem entre 50-150 caracteres?
□ Informações são clinicamente relevantes?
□ Pontos são claros sem contexto adicional?
□ Incluí orientações que devem ser verificadas?
□ Diagnóstico está presente se foi feito?

=== EXEMPLOS (Few-Shot Learning) ===

EXEMPLO 1 - Puericultura 6 meses:
Input: Puericultura rotina, criança com 6 meses, desenvolvimento adequado, 7,5kg (P50), aleitamento materno exclusivo, orientada introdução alimentar.
Output:
{
  "key_points": [
    "Desenvolvimento neuropsicomotor adequado para idade (senta com apoio, balbucia)",
    "Peso 7,5kg (P50) - curva de crescimento mantida",
    "Aleitamento materno exclusivo até momento - orientada introdução alimentar",
    "Calendário vacinal em dia, próxima dose aos 9 meses",
    "Verificar na próxima: aceitação de papinhas e ganho ponderal"
  ]
}

EXEMPLO 2 - Urgência (Faringite):
Input: Urgência, criança com faringite bacteriana, febre 39°C há 3 dias, amoxicilina prescrita por 10 dias.
Output:
{
  "key_points": [
    "Faringoamigdalite bacteriana (amígdalas com exsudato purulento)",
    "Prescrito Amoxicilina 50mg/kg/dia por 10 dias",
    "Orientado retorno se febre persistir após 48h de antibiótico",
    "Sinais de alerta orientados: dificuldade respiratória, prostração",
    "Verificar na próxima: resolução completa do quadro"
  ]
}

EXEMPLO 3 - Consulta Rotina (Asma):
Input: Consulta rotina, tosse noturna recorrente há 2 semanas, história familiar de asma, solicitado espirometria, iniciado budesonida.
Output:
{
  "key_points": [
    "Síndrome de hiperreatividade brônquica (tosse noturna + história familiar)",
    "Solicitada espirometria para confirmação diagnóstica - avaliar resultado",
    "Iniciado budesonida 200mcg 12/12h por 30 dias",
    "Orientadas medidas ambientais (evitar ácaros, mofo)",
    "Verificar na próxima: melhora dos sintomas noturnos e resultado espirometria"
  ]
}

=== CONSTRAINTS ===
❌ NUNCA ultrapasse 150 caracteres por ponto
❌ NUNCA inclua informações irrelevantes ou óbvias
❌ NUNCA use jargão incompreensível
❌ NUNCA omita o diagnóstico se foi estabelecido
❌ NUNCA esqueça de mencionar exames/encaminhamentos pendentes

✅ SEMPRE seja conciso e direto
✅ SEMPRE priorize continuidade do cuidado
✅ SEMPRE mencione ações a verificar no retorno
✅ SEMPRE use terminologia médica adequada
✅ SEMPRE contextualize o tipo de consulta

=== OUTPUT FORMAT (JSON) ===
Retorne APENAS um objeto JSON com este formato:
{
  "consultation_id": "${consultationData.consultation_id}",
  "date": "${consultationData.created_at}",
  "key_points": [
    "Ponto 1 (50-150 chars)",
    "Ponto 2 (50-150 chars)",
    "Ponto 3 (50-150 chars)",
    "Ponto 4 (50-150 chars) - OPCIONAL",
    "Ponto 5 (50-150 chars) - OPCIONAL"
  ],
  "diagnosis": "Diagnóstico principal da consulta"
}

IMPORTANTE: Retorne entre 3 e 5 pontos. Mínimo 3, máximo 5.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é uma médica pediatra especialista em sintetizar consultas em resumos concisos para continuidade do cuidado."
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4, // Balanço entre criatividade e consistência
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;

    if (!content) {
      throw new Error("Resposta vazia da API");
    }

    const parsedResponse = JSON.parse(content);

    // Validar estrutura
    if (!parsedResponse.key_points || !Array.isArray(parsedResponse.key_points)) {
      throw new Error("Resposta inválida: faltam key_points");
    }

    if (parsedResponse.key_points.length < 3 || parsedResponse.key_points.length > 5) {
      throw new Error(`Número inválido de pontos: ${parsedResponse.key_points.length} (esperado 3-5)`);
    }

    // Validar tamanho de cada ponto
    parsedResponse.key_points.forEach((point: string, index: number) => {
      if (point.length < 20) {
        console.warn(`⚠️ Ponto ${index + 1} muito curto (${point.length} chars): "${point}"`);
      }
      if (point.length > 150) {
        console.warn(`⚠️ Ponto ${index + 1} muito longo (${point.length} chars) - será truncado`);
        parsedResponse.key_points[index] = point.substring(0, 147) + "...";
      }
    });

    console.log("✅ Resumo gerado com sucesso");
    console.log(`   - ${parsedResponse.key_points.length} pontos principais`);
    console.log(`   - Diagnóstico: ${parsedResponse.diagnosis}`);

    return {
      consultation_id: consultationData.consultation_id,
      date: consultationData.created_at,
      key_points: parsedResponse.key_points,
      diagnosis: parsedResponse.diagnosis || consultationData.diagnosis || "Diagnóstico não registrado"
    };

  } catch (error: any) {
    console.error("❌ Erro ao gerar resumo:", error);
    throw new Error(`Erro ao gerar resumo: ${error.message}`);
  }
}
