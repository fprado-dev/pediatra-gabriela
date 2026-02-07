import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateConsultationSummary } from "@/lib/openai/generate-consultation-summary";

/**
 * POST /api/consultations/[id]/finalize
 * 
 * Marca uma consulta como finalizada e gera resumo automático para histórico
 * O resumo será usado nas próximas consultas do paciente para contexto
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const consultationId = params.id;

    console.log(`📋 Finalizando consulta ${consultationId}...`);

    // Buscar dados completos da consulta
    const { data: consultation, error: fetchError } = await supabase
      .from("consultations")
      .select(`
        id,
        patient_id,
        created_at,
        status,
        consultation_type,
        consultation_subtype,
        chief_complaint,
        hma,
        physical_exam,
        diagnosis,
        conduct,
        plan,
        weight_kg,
        height_cm,
        development_notes,
        previous_consultations_summary
      `)
      .eq("id", consultationId)
      .eq("doctor_id", user.id)
      .single();

    if (fetchError || !consultation) {
      console.error("Erro ao buscar consulta:", fetchError);
      return NextResponse.json(
        { error: "Consulta não encontrada" },
        { status: 404 }
      );
    }

    // Validar se consulta pode ser finalizada
    if (consultation.status === "completed") {
      return NextResponse.json(
        { 
          error: "Consulta já está finalizada",
          already_finalized: true 
        },
        { status: 400 }
      );
    }

    if (!consultation.chief_complaint && !consultation.diagnosis) {
      return NextResponse.json(
        { error: "Consulta não possui dados suficientes para ser finalizada (faltam queixa ou diagnóstico)" },
        { status: 400 }
      );
    }

    // Gerar resumo automático com IA
    console.log("🤖 Gerando resumo automático da consulta...");
    
    let newSummary;
    try {
      newSummary = await generateConsultationSummary({
        consultation_id: consultation.id,
        created_at: consultation.created_at,
        consultation_type: consultation.consultation_type,
        consultation_subtype: consultation.consultation_subtype,
        chief_complaint: consultation.chief_complaint,
        hma: consultation.hma,
        physical_exam: consultation.physical_exam,
        diagnosis: consultation.diagnosis,
        conduct: consultation.conduct,
        plan: consultation.plan,
        weight_kg: consultation.weight_kg,
        height_cm: consultation.height_cm,
        development_notes: consultation.development_notes,
      });

      console.log("✅ Resumo gerado:", newSummary.key_points.length, "pontos");
    } catch (summaryError: any) {
      console.error("⚠️ Erro ao gerar resumo:", summaryError);
      // Não bloqueia finalização - resumo pode ser gerado depois manualmente
    }

    // Marcar consulta como completa
    const { error: updateError } = await supabase
      .from("consultations")
      .update({ 
        status: "completed",
        updated_at: new Date().toISOString()
      })
      .eq("id", consultationId);

    if (updateError) {
      console.error("Erro ao atualizar status:", updateError);
      return NextResponse.json(
        { error: "Erro ao finalizar consulta" },
        { status: 500 }
      );
    }

    // Se resumo foi gerado, adicionar ao histórico de consultas do paciente
    if (newSummary) {
      console.log("📝 Adicionando resumo ao histórico do paciente...");

      // Buscar histórico atual
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("id", consultation.patient_id)
        .single();

      if (patient) {
        // Buscar todas as consultas completas do paciente exceto a atual
        const { data: completedConsultations } = await supabase
          .from("consultations")
          .select("previous_consultations_summary")
          .eq("patient_id", consultation.patient_id)
          .eq("status", "completed")
          .neq("id", consultationId)
          .order("created_at", { ascending: false })
          .limit(3);

        // Extrair summaries existentes
        const existingSummaries = completedConsultations
          ?.map(c => c.previous_consultations_summary?.consultations || [])
          .flat()
          .filter(Boolean) || [];

        // Criar novo summary para esta consulta
        const consultationSummary = {
          ...newSummary,
          auto_generated: true,
          edited_by_doctor: false
        };

        // Combinar (máximo 3 últimas)
        const allSummaries = [consultationSummary, ...existingSummaries].slice(0, 3);

        // Atualizar o campo previous_consultations_summary da consulta atual
        const { error: summaryUpdateError } = await supabase
          .from("consultations")
          .update({
            previous_consultations_summary: {
              consultations: [consultationSummary],
              last_updated: new Date().toISOString()
            }
          })
          .eq("id", consultationId);

        if (summaryUpdateError) {
          console.error("⚠️ Erro ao salvar resumo na consulta:", summaryUpdateError);
        } else {
          console.log("✅ Resumo salvo com sucesso");
        }

        // Atualizar futuras consultas do paciente com histórico atualizado
        // (será usado na próxima consulta)
        const { error: futureUpdateError } = await supabase
          .from("consultations")
          .update({
            previous_consultations_summary: {
              consultations: allSummaries,
              last_updated: new Date().toISOString()
            }
          })
          .eq("patient_id", consultation.patient_id)
          .eq("status", "processing")
          .neq("id", consultationId);

        if (futureUpdateError) {
          console.error("⚠️ Erro ao atualizar consultas futuras:", futureUpdateError);
        }
      }
    }

    console.log("✅ Consulta finalizada com sucesso");

    return NextResponse.json({
      success: true,
      message: "Consulta finalizada com sucesso",
      summary: newSummary || null,
      consultation: {
        id: consultationId,
        status: "completed"
      }
    });

  } catch (error: any) {
    console.error("❌ Erro ao finalizar consulta:", error);
    return NextResponse.json(
      { 
        error: "Erro ao finalizar consulta",
        details: error.message 
      },
      { status: 500 }
    );
  }
}
