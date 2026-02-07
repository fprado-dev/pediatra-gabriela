import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EditConsultationForm } from "@/components/consultations/edit-consultation-form";

export const dynamic = 'force-dynamic';

export default async function EditConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Buscar consulta com dados COMPLETOS do paciente
  const { data: consultation, error } = await supabase
    .from("consultations")
    .select(`
      *,
      patient:patients(id, full_name, date_of_birth, weight_kg, height_cm, head_circumference_cm, allergies, current_medications, medical_history, blood_type)
    `)
    .eq("id", id)
    .eq("doctor_id", user.id)
    .single();

  if (error || !consultation) {
    return (
      <div className="space-y-6">
        <div className="max-w-4xl mx-auto py-8">
          <h1 className="text-2xl font-semibold">Consulta não encontrada</h1>
          <p className="text-muted-foreground mt-2">
            A consulta que você está procurando não existe ou você não tem permissão para acessá-la.
          </p>
        </div>
      </div>
    );
  }

  // Buscar última consulta anterior do paciente (para comparar crescimento)
  const patientId = Array.isArray(consultation.patient) 
    ? consultation.patient[0]?.id 
    : consultation.patient?.id;

  const { data: previousConsultations } = await supabase
    .from("consultations")
    .select("id, consultation_date, weight_kg, height_cm, head_circumference_cm")
    .eq("patient_id", patientId)
    .eq("status", "completed")
    .neq("id", id)
    .not("weight_kg", "is", null)
    .not("consultation_date", "is", null)
    .order("consultation_date", { ascending: false })
    .limit(5);

  // Filtrar consultas com consultation_date não nulo para garantir type safety
  const validPreviousMeasurements = (previousConsultations || []).filter(
    (c): c is typeof c & { consultation_date: string } => c.consultation_date !== null
  );

  return (
    <EditConsultationForm 
      consultation={consultation} 
      previousMeasurements={validPreviousMeasurements}
    />
  );
}
