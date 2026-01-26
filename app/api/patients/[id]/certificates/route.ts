import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/patients/[id]/certificates
 * List all certificates for a patient
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar atestados do paciente com dados da consulta
    const { data: certificates, error } = await supabase
      .from("medical_certificates")
      .select(`
        *,
        consultation:consultations(created_at)
      `)
      .eq("patient_id", patientId)
      .eq("doctor_id", user.id)
      .order("generated_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar atestados:", error);
      return NextResponse.json(
        { error: "Erro ao buscar atestados" },
        { status: 500 }
      );
    }

    // Mapear para incluir consultation_date
    const certificatesWithDate = certificates?.map((cert: any) => ({
      ...cert,
      consultation_date: cert.consultation?.created_at,
    })) || [];

    return NextResponse.json(certificatesWithDate);
  } catch (error: any) {
    console.error("Erro ao listar atestados do paciente:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
