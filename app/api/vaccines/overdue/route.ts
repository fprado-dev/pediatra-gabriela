import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateAgeInMonths } from "@/lib/types/vaccine";

export const dynamic = "force-dynamic";

// GET - Buscar pacientes com vacinas atrasadas
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar todos os pacientes do médico
    const { data: patients, error: patientsError } = await supabase
      .from("patients")
      .select("id, full_name, date_of_birth")
      .eq("doctor_id", user.id)
      .eq("is_active", true);

    if (patientsError) {
      console.error("Erro ao buscar pacientes:", patientsError);
      return NextResponse.json(
        { error: "Erro ao buscar pacientes" },
        { status: 500 }
      );
    }

    // Buscar vacinas de referência
    const { data: vaccineRef } = await supabase
      .from("vaccine_reference")
      .select("code, name, dose_label, age_months_min, age_months_max")
      .eq("is_active", true);

    // Buscar todas as vacinas aplicadas
    const { data: appliedVaccines } = await supabase
      .from("patient_vaccines")
      .select("patient_id, vaccine_code, status");

    // Mapear vacinas aplicadas por paciente
    const appliedByPatient = new Map<string, Set<string>>();
    (appliedVaccines || []).forEach((pv) => {
      if (pv.status === "applied" || pv.status === "skipped") {
        const set = appliedByPatient.get(pv.patient_id) || new Set();
        set.add(pv.vaccine_code);
        appliedByPatient.set(pv.patient_id, set);
      }
    });

    // Calcular pacientes com vacinas atrasadas
    const patientsWithOverdue: Array<{
      id: string;
      name: string;
      overdueCount: number;
      overdueVaccines: string[];
    }> = [];

    (patients || []).forEach((patient) => {
      const ageMonths = calculateAgeInMonths(patient.date_of_birth);
      const appliedSet = appliedByPatient.get(patient.id) || new Set();
      const overdueVaccines: string[] = [];

      (vaccineRef || []).forEach((vaccine) => {
        // Se a vacina já foi aplicada, ignorar
        if (appliedSet.has(vaccine.code)) return;

        // Verificar se está atrasada (idade passou do limite máximo)
        if (
          vaccine.age_months_max &&
          ageMonths > vaccine.age_months_max &&
          ageMonths >= vaccine.age_months_min
        ) {
          overdueVaccines.push(`${vaccine.name} (${vaccine.dose_label})`);
        }
      });

      if (overdueVaccines.length > 0) {
        patientsWithOverdue.push({
          id: patient.id,
          name: patient.full_name,
          overdueCount: overdueVaccines.length,
          overdueVaccines: overdueVaccines.slice(0, 3), // Máximo 3 para exibir
        });
      }
    });

    // Ordenar por quantidade de vacinas atrasadas
    patientsWithOverdue.sort((a, b) => b.overdueCount - a.overdueCount);

    return NextResponse.json({
      patients: patientsWithOverdue.slice(0, 5), // Top 5
      totalOverdue: patientsWithOverdue.length,
    });
  } catch (error: any) {
    console.error("Erro ao buscar vacinas atrasadas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar vacinas atrasadas" },
      { status: 500 }
    );
  }
}
