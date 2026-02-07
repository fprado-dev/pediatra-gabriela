import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type ImproveMode = 'condensar' | 'encurtar' | 'alongar' | 'profissional' | 'informal';

interface ImproveRequest {
  mode: ImproveMode;
  text: string;
}

const PROMPTS: Record<ImproveMode, (text: string) => string> = {
  condensar: (text: string) => `Você é um assistente médico especializado em documentação clínica pediátrica.

TAREFA: Condense o seguinte texto mantendo todas as informações médicas essenciais.

MANTER:
- Sintomas principais e duração
- Achados do exame físico
- Medidas antropométricas
- Medicações e doses
- Diagnóstico
- Orientações importantes

REMOVER:
- Redundâncias e repetições
- Detalhes excessivos não-essenciais
- Contextualizações muito longas

META: Reduzir para 40-60% do tamanho original mantendo clareza e precisão médica.

TEXTO ORIGINAL:
${text}

Retorne apenas o texto condensado, sem comentários adicionais.`,

  encurtar: (text: string) => `Você é um assistente médico especializado em documentação clínica pediátrica.

TAREFA: Encurte drasticamente o texto mantendo APENAS informações críticas.

MANTER APENAS:
- Sintoma principal
- Achados positivos do exame
- Diagnóstico
- Conduta imediata
- Alertas importantes

META: Versão ultra-resumida com 25-40% do tamanho original. Seja direto e objetivo.

TEXTO ORIGINAL:
${text}

Retorne apenas o texto encurtado, sem comentários adicionais.`,

  alongar: (text: string) => `Você é um assistente médico especializado em documentação clínica pediátrica.

TAREFA: Expanda o texto adicionando detalhes clínicos relevantes e contexto médico.

ADICIONAR:
- Detalhamento de sintomas (localização, intensidade, fatores de melhora/piora)
- Contexto epidemiológico quando relevante
- Raciocínio clínico por trás das condutas
- Orientações mais detalhadas para a família
- Sinais de alerta para retorno

IMPORTANTE: 
- NÃO invente dados que não foram mencionados (valores, datas, medicações)
- Adicione apenas contexto médico padrão e detalhamento
- Mantenha terminologia técnica apropriada

META: Texto mais completo e didático, aproximadamente 150-200% do tamanho original.

TEXTO ORIGINAL:
${text}

Retorne apenas o texto expandido, sem comentários adicionais.`,

  profissional: (text: string) => `Você é um assistente médico especializado em documentação clínica pediátrica.

TAREFA: Reescreva o texto com linguagem técnica profissional, como em um prontuário médico formal.

DIRETRIZES:
- Use terminologia médica adequada (não exagere em latinismos)
- Estrutura formal e organizada
- Verbos no pretérito perfeito para histórico, presente para exame atual
- Tom impessoal e objetivo
- Abreviações médicas padrão quando apropriado (HMA, EF, PC, etc)

MANTER:
- Todos os valores numéricos exatos
- Nomes de medicamentos
- Informações específicas do caso

TEXTO ORIGINAL:
${text}

Retorne apenas o texto reescrito de forma profissional, sem comentários adicionais.`,

  informal: (text: string) => `Você é um assistente médico especializado em documentação clínica pediátrica.

TAREFA: Reescreva o texto com linguagem mais acessível e coloquial, mantendo precisão médica.

DIRETRIZES:
- Use linguagem simples e direta, como se estivesse conversando
- Substitua termos técnicos por equivalentes coloquiais quando possível
- Mantenha precisão em doses, valores e diagnósticos
- Tom mais próximo e menos formal
- Evite jargão médico excessivo

MANTER TÉCNICO:
- Nomes de medicamentos
- Valores de medidas
- Diagnósticos específicos

TEXTO ORIGINAL:
${text}

Retorne apenas o texto reescrito de forma mais informal, sem comentários adicionais.`,
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Parse request body
    const body: ImproveRequest = await request.json();
    const { mode, text } = body;

    // Validações
    if (!mode || !text) {
      return NextResponse.json(
        { error: "Parâmetros obrigatórios: mode, text" },
        { status: 400 }
      );
    }

    if (!['condensar', 'encurtar', 'alongar', 'profissional', 'informal'].includes(mode)) {
      return NextResponse.json(
        { error: "Modo inválido. Use: condensar, encurtar, alongar, profissional, informal" },
        { status: 400 }
      );
    }

    const originalLength = text.length;

    // Verificar se texto é muito curto
    if (originalLength < 50) {
      return NextResponse.json({
        improvedText: text,
        originalLength,
        improvedLength: originalLength,
        skipped: true,
        reason: "Texto muito curto (mínimo 50 caracteres)",
      });
    }

    console.log(`✨ Aprimorando texto no modo "${mode}" (${originalLength} caracteres)`);

    // Chamar OpenAI para processar
    const prompt = PROMPTS[mode](text);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 3000,
    });

    const improvedText = response.choices[0].message.content?.trim();

    if (!improvedText) {
      throw new Error("Resposta vazia da API");
    }

    const improvedLength = improvedText.length;

    console.log(`✅ Aprimoramento concluído: ${originalLength} → ${improvedLength} chars`);

    return NextResponse.json({
      improvedText,
      originalLength,
      improvedLength,
      skipped: false,
    });
  } catch (error: any) {
    console.error("❌ Erro ao aprimorar texto:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao aprimorar texto" },
      { status: 500 }
    );
  }
}
