import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  PhysicalExamTemplate,
  TemplatesBySystem,
  CompleteExamTemplate,
  getAgeGroup,
  PHYSICAL_EXAM_SYSTEMS,
  type SystemName,
} from "@/lib/types/physical-exam";

/**
 * GET /api/physical-exam-templates
 * Fetch templates based on patient's age and sex
 * Query params:
 * - dateOfBirth: string (required)
 * - sex: 'male' | 'female' (required)
 * - systems: comma-separated system names (optional, returns all if not specified)
 * - complete: 'true' to get a complete exam template with all systems (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const dateOfBirth = searchParams.get("dateOfBirth");
    const sex = searchParams.get("sex") as 'male' | 'female';
    const systemsParam = searchParams.get("systems");
    const complete = searchParams.get("complete") === "true";

    if (!dateOfBirth || !sex) {
      return NextResponse.json(
        { error: "dateOfBirth e sex são obrigatórios" },
        { status: 400 }
      );
    }

    // Calculate age group
    const ageGroup = getAgeGroup(dateOfBirth);

    // Build query
    let query = supabase
      .from("physical_exam_templates")
      .select("*")
      .eq("age_group", ageGroup)
      .in("sex", [sex, "both"])
      .eq("is_default", true)
      .order("system_name");

    // Filter by specific systems if provided
    if (systemsParam) {
      const systems = systemsParam.split(",");
      query = query.in("system_name", systems);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error("Error fetching templates:", error);
      return NextResponse.json(
        { error: "Erro ao buscar templates" },
        { status: 500 }
      );
    }

    // If complete template requested, combine all systems
    if (complete) {
      const completeTemplate: CompleteExamTemplate = {
        templates: (templates || []) as PhysicalExamTemplate[],
        full_text: (templates || [])
          .map(
            (t) => `**${t.system_label}**\n${t.template_text}`
          )
          .join("\n\n"),
      };
      return NextResponse.json(completeTemplate);
    }

    // Group by system
    const templatesBySystem: TemplatesBySystem[] = PHYSICAL_EXAM_SYSTEMS.map(
      (system) => ({
        system_name: system.name,
        system_label: system.label,
        templates:
          (templates?.filter((t) => t.system_name === system.name) || []) as PhysicalExamTemplate[],
      })
    ).filter((group) => group.templates.length > 0);

    return NextResponse.json({
      age_group: ageGroup,
      sex,
      templates: templatesBySystem,
    });
  } catch (error) {
    console.error("Error in GET /api/physical-exam-templates:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/physical-exam-templates
 * Create a custom template
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { system_name, system_label, age_group, sex, template_text } = body;

    // Validate required fields
    if (!system_name || !system_label || !age_group || !sex || !template_text) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("physical_exam_templates")
      .insert({
        system_name,
        system_label,
        age_group,
        sex,
        template_text,
        is_default: false,
        doctor_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating template:", error);
      return NextResponse.json(
        { error: "Erro ao criar template" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/physical-exam-templates:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
