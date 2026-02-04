import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type CondenseMode = 'summary' | 'bullets' | 'key_info';

interface CondenseRequest {
  field: string;
  mode: CondenseMode;
  originalText: string;
}

const PROMPTS: Record<CondenseMode, (text: string) => string> = {
  summary: (text: string) => `Você é um assistente médico especializado em resumir documentação clínica.

TAREFA: Resuma o seguinte texto da consulta pediátrica mantendo:
- Todas as informações médicas relevantes
- Sintomas principais e duração
- Achados significativos do exame
- Medicações e doses
- Orientações importantes

REMOVER:
- Detalhes redundantes
- Conversas paralelas
- Contextualizações excessivas

Meta: 30-40% do tamanho original mantendo clareza médica.

TEXTO ORIGINAL:
${text}

Retorne apenas o texto resumido, sem comentários adicionais.`,

  bullets: (text: string) => `Você é um assistente médico especializado em organizar documentação clínica.

TAREFA: Converta o seguinte texto em lista de tópicos organizados e concisos.

ESTRUTURA:
• Sintomas Principais
  - [lista concisa]
• Exame Físico
  - [achados principais]
• Conduta
  - [ações e orientações]
• Observações
  - [informações adicionais relevantes]

Use apenas os tópicos que tiverem informação no texto.
Seja objetivo e mantenha terminologia médica.

TEXTO ORIGINAL:
${text}

Retorne apenas a lista formatada, sem comentários.`,

  key_info: (text: string) => `Você é um assistente médico especializado em extrair informações críticas.

TAREFA: Extraia APENAS as informações críticas do texto:
1. Diagnóstico/Hipótese diagnóstica
2. Sintomas principais (máximo 3)
3. Conduta imediata
4. Alertas importantes (alergias, interações, etc)

Seja extremamente conciso (máximo 200 palavras).
Mantenha apenas o essencial para tomada de decisão clínica.

TEXTO ORIGINAL:
${text}

Retorne apenas as informações-chave, sem comentários.`,
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verificar ownership da consulta
    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .select("id")
      .eq("id", id)
      .eq("doctor_id", user.id)
      .single();

    if (consultationError || !consultation) {
      return NextResponse.json(
        { error: "Consulta não encontrada" },
        { status: 404 }
      );
    }

    // Parse request body
    const body: CondenseRequest = await request.json();
    const { field, mode, originalText } = body;

    // Validações
    if (!field || !mode || !originalText) {
      return NextResponse.json(
        { error: "Parâmetros obrigatórios: field, mode, originalText" },
        { status: 400 }
      );
    }

    if (!['summary', 'bullets', 'key_info'].includes(mode)) {
      return NextResponse.json(
        { error: "Modo inválido. Use: summary, bullets, key_info" },
        { status: 400 }
      );
    }

    const originalLength = originalText.length;

    // Verificar se texto é muito curto (não precisa condensar)
    if (originalLength < 500) {
      return NextResponse.json({
        condensedText: originalText,
        originalLength,
        condensedLength: originalLength,
        compressionRatio: 0,
        skipped: true,
        reason: "Texto muito curto, não precisa condensação",
      });
    }

    console.log(`🗜️  Condensando campo ${field} no modo ${mode} (${originalLength} caracteres)`);

    // Chamar OpenAI para condensar
    const prompt = PROMPTS[mode](originalText);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const condensedText = response.choices[0].message.content?.trim();

    if (!condensedText) {
      throw new Error("Resposta vazia da API");
    }

    const condensedLength = condensedText.length;
    const compressionRatio = Math.round(((originalLength - condensedLength) / originalLength) * 100);

    console.log(`✅ Condensação concluída: ${originalLength} → ${condensedLength} chars (${compressionRatio}% redução)`);

    return NextResponse.json({
      condensedText,
      originalLength,
      condensedLength,
      compressionRatio,
      skipped: false,
    });
  } catch (error: any) {
    console.error("❌ Erro ao condensar texto:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao condensar texto" },
      { status: 500 }
    );
  }
}
