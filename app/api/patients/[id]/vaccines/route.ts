import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  calculateAgeInMonths,
  isVaccineOverdue,
  isVaccineApplicable,
  groupVaccinesByAge,
  type VaccineReference,
  type PatientVaccine,
  type VaccineWithStatus,
} from "@/lib/types/vaccine";

export const dynamic = "force-dynamic";

// GET - Listar vacinas do paciente com status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se o paciente pertence ao médico
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id, date_of_birth")
      .eq("id", patientId)
      .eq("doctor_id", user.id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      );
    }

    // Buscar todas as vacinas de referência
    const { data: vaccineRef, error: refError } = await supabase
      .from("vaccine_reference")
      .select("*")
      .eq("is_active", true)
      .order("display_order");

    if (refError) {
      console.error("Erro ao buscar vacinas de referência:", refError);
      return NextResponse.json(
        { error: "Erro ao buscar vacinas" },
        { status: 500 }
      );
    }

    // Buscar vacinas aplicadas do paciente
    const { data: patientVaccines, error: pvError } = await supabase
      .from("patient_vaccines")
      .select("*")
      .eq("patient_id", patientId);

    if (pvError) {
      console.error("Erro ao buscar vacinas do paciente:", pvError);
    }

    // Calcular idade em meses
    const ageMonths = calculateAgeInMonths(patient.date_of_birth);

    // Mapear vacinas com status
    const patientVaccineMap = new Map<string, PatientVaccine>();
    (patientVaccines || []).forEach((pv) => {
      patientVaccineMap.set(pv.vaccine_code, pv as PatientVaccine);
    });

    const vaccinesWithStatus: VaccineWithStatus[] = (vaccineRef || []).map(
      (vaccine) => {
        const typedVaccine = vaccine as VaccineReference;
        const patientVaccine = patientVaccineMap.get(typedVaccine.code);
        const isApplicable = isVaccineApplicable(typedVaccine, ageMonths);
        const isOverdue = isVaccineOverdue(typedVaccine, ageMonths, patientVaccine);

        return {
          ...typedVaccine,
          patientVaccine,
          isApplicable,
          isOverdue,
          isApplied: patientVaccine?.status === "applied",
          isSkipped: patientVaccine?.status === "skipped",
          isPending:
            isApplicable &&
            !patientVaccine?.status &&
            !isOverdue,
        };
      }
    );

    // Filtrar apenas vacinas aplicáveis (esconder as que não se aplicam pela idade)
    const applicableVaccines = vaccinesWithStatus.filter(
      (v) => v.isApplicable || v.isApplied || v.isSkipped
    );

    // Separar por tipo
    const susVaccines = applicableVaccines.filter((v) => v.type === "sus");
    const particularVaccines = applicableVaccines.filter(
      (v) => v.type === "particular"
    );

    // Agrupar por faixa etária
    const susByAge = groupVaccinesByAge(susVaccines);
    const particularByAge = groupVaccinesByAge(particularVaccines);

    // Calcular estatísticas
    const stats = {
      total: applicableVaccines.length,
      applied: applicableVaccines.filter((v) => v.isApplied).length,
      pending: applicableVaccines.filter((v) => v.isPending).length,
      overdue: applicableVaccines.filter((v) => v.isOverdue).length,
      skipped: applicableVaccines.filter((v) => v.isSkipped).length,
    };

    return NextResponse.json({
      sus: susByAge,
      particular: particularByAge,
      stats,
      ageMonths,
    });
  } catch (error: any) {
    console.error("Erro ao listar vacinas:", error);
    return NextResponse.json(
      { error: "Erro ao listar vacinas" },
      { status: 500 }
    );
  }
}

// POST - Registrar/atualizar status de uma vacina
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { vaccine_code, status, applied_at, batch_number, notes } = body;

    if (!vaccine_code || !status) {
      return NextResponse.json(
        { error: "vaccine_code e status são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o paciente pertence ao médico
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .eq("doctor_id", user.id)
      .single();

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      );
    }

    // Upsert da vacina do paciente
    const { data, error } = await supabase
      .from("patient_vaccines")
      .upsert(
        {
          patient_id: patientId,
          vaccine_code,
          status,
          applied_at: status === "applied" ? applied_at || new Date().toISOString().split("T")[0] : null,
          batch_number: batch_number || null,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "patient_id,vaccine_code",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Erro ao salvar vacina:", error);
      return NextResponse.json(
        { error: "Erro ao salvar vacina" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, vaccine: data });
  } catch (error: any) {
    console.error("Erro ao salvar vacina:", error);
    return NextResponse.json(
      { error: "Erro ao salvar vacina" },
      { status: 500 }
    );
  }
}
