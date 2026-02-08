/**
 * API Route para gerar templates com IA
 * POST /api/templates/generate
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateMultipleTemplates, DEFAULT_TEMPLATES_CONFIG } from "@/lib/ai/generate-templates";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutos

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

    console.log(`🤖 Iniciando geração de templates para doctor: ${user.id}`);

    // Verificar se já tem templates
    const { count } = await supabase
      .from("prescription_templates")
      .select("*", { count: "exact", head: true })
      .eq("doctor_id", user.id);

    if (count && count > 0) {
      return NextResponse.json(
        {
          error: "Você já possui templates criados",
          count,
          message: "Para gerar novos templates, delete os existentes primeiro"
        },
        { status: 400 }
      );
    }

    // Gerar templates com IA
    const templates = await generateMultipleTemplates(DEFAULT_TEMPLATES_CONFIG);

    console.log(`✅ ${templates.length} templates gerados pela IA`);

    // Salvar no banco
    const templatesWithDoctorId = templates.map((t) => ({
      doctor_id: user.id,
      ...t,
    }));

    const { data, error } = await supabase
      .from("prescription_templates")
      .insert(templatesWithDoctorId as any)
      .select();

    if (error) {
      console.error("❌ Erro ao salvar templates:", error);
      throw error;
    }

    console.log(`🎉 ${data.length} templates salvos com sucesso`);

    return NextResponse.json({
      success: true,
      count: data.length,
      templates: data,
      message: `${data.length} templates de prescrição gerados com IA!`,
    });
  } catch (error: any) {
    console.error("❌ Erro na geração de templates:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao gerar templates" },
      { status: 500 }
    );
  }
}
