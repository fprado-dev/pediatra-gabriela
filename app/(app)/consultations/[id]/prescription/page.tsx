import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PrescriptionForm } from "@/components/prescriptions/prescription-form";
import { calculateDetailedAge } from "../preview/page";

export const dynamic = 'force-dynamic';

export default async function PrescriptionPage({
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

  // Buscar consulta com dados do paciente
  const { data: consultation, error } = await supabase
    .from("consultations")
    .select(`
      id,
      chief_complaint,
      diagnosis,
      plan,
      prescription,
      prescription_data,
      patient:patients(
        id, 
        full_name, 
        date_of_birth, 
        weight_kg, 
        height_cm,
        allergies,
        current_medications
      )
    `)
    .eq("id", id)
    .eq("doctor_id", user.id)
    .single();

  if (error || !consultation) {
    notFound();
  }

  // Buscar perfil do médico (nome e CRM)
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, crm")
    .eq("id", user.id)
    .single();

  // Buscar templates do médico
  const { data: templates } = await supabase
    .from("prescription_templates")
    .select("id, name, medications, orientations, alert_signs, prevention, notes")
    .eq("doctor_id", user.id)
    .order("name");

  const patient = Array.isArray(consultation.patient)
    ? consultation.patient[0]
    : consultation.patient;

  const patientAge = calculateDetailedAge(patient.date_of_birth);

  return (
    <PrescriptionForm
      consultationId={id}
      patient={{
        id: patient?.id,
        name: patient?.full_name || "Paciente",
        age: patientAge,
        weight: patient?.weight_kg,
        allergies: patient?.allergies,
        height: patient?.height_cm,
        currentMedications: patient?.current_medications,
      }}
      clinicalData={{
        chiefComplaint: consultation.chief_complaint || undefined,
        diagnosis: consultation.diagnosis || undefined,
        plan: consultation.plan || undefined,
      }}
      existingPrescription={consultation.prescription_data as any}
      doctor={{
        name: profile?.full_name || "Médico",
        crm: profile?.crm || "",
      }}
      templates={(templates as any) || []}
    />
  );
}
