/**
 * API Route para gerar templates personalizados com IA
 * POST /api/templates/generate-custom
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePrescriptionTemplate } from "@/lib/ai/generate-templates";

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 minuto

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { description, count = 3 } = body;

    if (!description || description.trim().length < 5) {
      return NextResponse.json(
        { error: "Descrição muito curta. Mínimo 5 caracteres." },
        { status: 400 }
      );
    }

    console.log(`🤖 Gerando ${count} templates personalizados para: "${description}"`);

    // Gerar templates com IA
    const templates = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const template = await generatePrescriptionTemplate({
          condition: description,
          category: "Personalizado",
          ageRange: "0-12 anos",
          includeAlternatives: i > 0, // Variações nos templates seguintes
        });

        templates.push(template);

        // Delay entre gerações
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Erro ao gerar template ${i + 1}:`, error);
      }
    }

    if (templates.length === 0) {
      throw new Error("Não foi possível gerar nenhum template");
    }

    console.log(`✅ ${templates.length} templates gerados`);

    return NextResponse.json({
      success: true,
      count: templates.length,
      templates,
      message: `${templates.length} template(s) gerado(s) com IA!`,
    });
  } catch (error: any) {
    console.error("❌ Erro na geração de templates:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao gerar templates" },
      { status: 500 }
    );
  }
}
