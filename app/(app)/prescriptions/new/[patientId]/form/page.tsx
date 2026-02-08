import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PrescriptionForm } from "@/components/prescriptions/prescription-form";
import {
  getPatientById,
  getConsultationWithPatient,
  getDoctorProfile,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

function calculateDetailedAge(dateOfBirth: string): string {
  const birth = new Date(dateOfBirth);
  const today = new Date();

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years > 0) {
    return `${years} ano${years > 1 ? "s" : ""}`;
  } else if (months > 0) {
    return `${months} mês${months > 1 ? "es" : ""}`;
  } else {
    return `${days} dia${days > 1 ? "s" : ""}`;
  }
}

export default async function PrescriptionFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ patientId: string }>;
  searchParams: Promise<{ consultation_id?: string }>;
}) {
  const { patientId } = await params;
  const { consultation_id } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Buscar dados do paciente
  const { data: patient, error: patientError } = await getPatientById(
    supabase,
    patientId,
    user.id
  );

  if (patientError || !patient) {
    notFound();
  }

  // Buscar perfil do médico
  const { data: profile } = await getDoctorProfile(supabase, user.id);

  // Buscar templates do médico
  const { data: templates } = await supabase
    .from("prescription_templates")
    .select("id, name, medications, instructions, warnings")
    .eq("doctor_id", user.id)
    .order("name");

  const patientAge = calculateDetailedAge(patient.date_of_birth);

  // Se tem consultation_id, buscar dados da consulta
  let clinicalData = {
    chiefComplaint: undefined as string | undefined,
    diagnosis: undefined as string | undefined,
    plan: undefined as string | undefined,
  };
  let existingPrescription = null;

  if (consultation_id) {
    const { data: consultation, error: consultationError } =
      await getConsultationWithPatient(supabase, consultation_id, user.id);

    if (!consultationError && consultation) {
      clinicalData = {
        chiefComplaint: consultation.chief_complaint,
        diagnosis: consultation.diagnosis,
        plan: consultation.plan,
      };
      existingPrescription = consultation.prescription_data;
    }
  }

  return (
    <PrescriptionForm
      consultationId={consultation_id}
      patient={{
        id: patient.id,
        name: patient.full_name,
        age: patientAge,
        weight: patient.weight_kg,
        allergies: patient.allergies,
        height: patient.height_cm,
        currentMedications: patient.current_medications,
      }}
      clinicalData={clinicalData}
      existingPrescription={existingPrescription}
      doctor={{
        name: profile?.full_name || "Médico",
        crm: profile?.crm || "",
      }}
      templates={templates || [] as any[]}
    />
  );
}
