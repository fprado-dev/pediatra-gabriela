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

/**
 * Converte texto plano com quebras de linha em HTML para o Tiptap
 */
function convertTextToHTML(text: string): string {
  // Detectar se já é HTML (tem tags <p>, <ul>, etc)
  if (text.includes('<p>') || text.includes('<ul>') || text.includes('<ol>')) {
    return text;
  }

  // Dividir por linhas duplas (parágrafos)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  const htmlParagraphs = paragraphs.map(paragraph => {
    const trimmed = paragraph.trim();
    
    // Detectar listas com marcadores (-, *, •)
    if (/^[-*•]\s/.test(trimmed)) {
      const items = trimmed
        .split(/\n(?=[-*•]\s)/)
        .map(item => item.replace(/^[-*•]\s+/, '').trim())
        .filter(item => item.length > 0);
      
      const listItems = items.map(item => `<li><p>${item}</p></li>`).join('');
      return `<ul>${listItems}</ul>`;
    }
    
    // Detectar listas numeradas (1., 2., etc)
    if (/^\d+\.\s/.test(trimmed)) {
      const items = trimmed
        .split(/\n(?=\d+\.\s)/)
        .map(item => item.replace(/^\d+\.\s+/, '').trim())
        .filter(item => item.length > 0);
      
      const listItems = items.map(item => `<li><p>${item}</p></li>`).join('');
      return `<ol>${listItems}</ol>`;
    }
    
    // Parágrafo normal - substituir quebras de linha simples por <br>
    const withBreaks = trimmed.replace(/\n/g, '<br>');
    return `<p>${withBreaks}</p>`;
  });
  
  return htmlParagraphs.join('');
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

FORMATAÇÃO (CRÍTICO - SIGA EXATAMENTE):
- Use parágrafos curtos (2-3 linhas cada)
- Separe cada parágrafo com uma LINHA EM BRANCO (dois enters: \n\n)
- Se o texto tiver mais de 300 caracteres, OBRIGATORIAMENTE divida em múltiplos parágrafos
- Para listas, use marcadores (- ou •) no início de cada item, um por linha
- Evite blocos de texto corrido muito longos

EXEMPLO DE FORMATO:
Primeiro parágrafo sobre os sintomas.

Segundo parágrafo sobre o exame físico.

Orientações:
- Primeira orientação
- Segunda orientação
- Terceira orientação

META: Reduzir para 40-60% do tamanho original mantendo clareza e precisão médica.

TEXTO ORIGINAL:
${text}

Retorne apenas o texto condensado com formatação adequada, sem comentários adicionais.`,

  encurtar: (text: string) => `Você é um assistente médico especializado em documentação clínica pediátrica.

TAREFA: Encurte drasticamente o texto mantendo APENAS informações críticas.

MANTER APENAS:
- Sintoma principal
- Achados positivos do exame
- Diagnóstico
- Conduta imediata
- Alertas importantes

FORMATAÇÃO (CRÍTICO - SIGA EXATAMENTE):
- Use parágrafos curtos separados por LINHA EM BRANCO (\n\n)
- Se tiver mais de 200 caracteres, divida em pelo menos 2 parágrafos
- Use listas com marcadores (- ou •) para múltiplos itens, um por linha
- Evite blocos de texto corrido

EXEMPLO DE FORMATO:
Sintoma principal: febre há 3 dias.

Exame: hiperemia de orofaringe.

Conduta:
- Antitérmico
- Hidratação
- Retorno em 48h se piora

META: Versão ultra-resumida com 25-40% do tamanho original. Seja direto e objetivo.

TEXTO ORIGINAL:
${text}

Retorne apenas o texto encurtado com formatação adequada, sem comentários adicionais.`,

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

FORMATAÇÃO (EXTREMAMENTE IMPORTANTE - SIGA EXATAMENTE):
- SEMPRE divida o texto em múltiplos parágrafos curtos (2-4 linhas cada)
- Separe cada parágrafo com LINHA EM BRANCO (\n\n) - OBRIGATÓRIO
- Para textos com mais de 400 caracteres, use pelo menos 3 parágrafos
- Use listas numeradas (1., 2., 3.) ou marcadores (- ou •) quando listar orientações
- NUNCA gere um bloco de texto corrido sem quebras
- Organize por tópicos lógicos: sintomas, exame, raciocínio, conduta, orientações

EXEMPLO DE FORMATO:
Paciente apresenta quadro de febre há 3 dias, com pico de 39°C. Associado a tosse produtiva e coriza hialina. Sem sinais de dispneia ou outros sintomas respiratórios graves.

Ao exame físico, apresenta-se em bom estado geral, hidratado e corado. Ausculta pulmonar clara bilateralmente. Orofaringe com hiperemia leve.

Orientações à família:
1. Manter hidratação abundante
2. Uso de antitérmico conforme prescrito
3. Observar sinais de piora respiratória
4. Retornar se febre persistir por mais de 48h

META: Texto mais completo e didático, aproximadamente 150-200% do tamanho original.

TEXTO ORIGINAL:
${text}

Retorne apenas o texto expandido com formatação adequada, sem comentários adicionais.`,

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

FORMATAÇÃO (CRÍTICO - SIGA EXATAMENTE):
- Divida em parágrafos curtos separados por LINHA EM BRANCO (\n\n)
- Use quebras entre seções diferentes (HMA, EF, Conduta, etc)
- Para textos com mais de 300 caracteres, use múltiplos parágrafos
- Use listas numeradas (1., 2.) ou marcadores (- ou •) quando apropriado
- Organize de forma clara: cada tema em um parágrafo separado

EXEMPLO DE FORMATO:
HMA: Paciente com história de febre há 72 horas, com temperaturas até 39°C. Refere tosse produtiva e rinorreia hialina. Nega dispneia ou outros sintomas.

EF: BEG, hidratado, corado. AR: MV+ bilateralmente, sem RA. Orofaringe hiperêmica.

Conduta:
- Dipirona 15mg/kg/dose 6/6h
- Hidratação oral
- Retorno em 48h ou se sinais de piora

TEXTO ORIGINAL:
${text}

Retorne apenas o texto reescrito de forma profissional com formatação adequada, sem comentários adicionais.`,

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

FORMATAÇÃO (CRÍTICO - SIGA EXATAMENTE):
- Divida em parágrafos curtos (2-3 linhas) separados por LINHA EM BRANCO (\n\n)
- Use quebras de linha entre ideias diferentes
- Para textos com mais de 300 caracteres, use múltiplos parágrafos
- Use listas simples (- ou •) quando listar orientações, um item por linha
- Mantenha texto fluido e fácil de ler

EXEMPLO DE FORMATO:
A criança está com febre há uns 3 dias. A febre chega até 39°C e vem junto com tosse e nariz escorrendo. Mas ela está respirando bem e não tem falta de ar.

No exame, ela está bem, hidratada e sem sinais de gravidade. A garganta está um pouco avermelhada, mas nada muito grave.

Orientações:
- Dar bastante líquido
- Usar o antitérmico quando tiver febre
- Ficar de olho se piorar
- Voltar se a febre continuar depois de 2 dias

TEXTO ORIGINAL:
${text}

Retorne apenas o texto reescrito de forma mais informal com formatação adequada, sem comentários adicionais.`,
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

    // Converter quebras de linha em HTML para o Tiptap
    const improvedTextHTML = convertTextToHTML(improvedText);
    const improvedLength = improvedTextHTML.length;

    console.log(`✅ Aprimoramento concluído: ${originalLength} → ${improvedLength} chars`);
    console.log(`📝 Texto original (primeiras 200 chars): ${improvedText.substring(0, 200)}...`);
    console.log(`🌐 HTML convertido (primeiras 200 chars): ${improvedTextHTML.substring(0, 200)}...`);

    return NextResponse.json({
      improvedText: improvedTextHTML,
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
