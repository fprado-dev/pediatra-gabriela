import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { MedicalCertificateForm } from "@/components/medical-certificates/medical-certificate-form";
import {
  getPatientById,
  getConsultationWithPatient,
  getDoctorProfile,
} from "@/lib/supabase/queries";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function MedicalCertificateFormPage({
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

  // Data da consulta (usar data atual se não houver consultation_id)
  let consultationDate = format(new Date(), "yyyy-MM-dd");

  // Se tem consultation_id, buscar dados da consulta
  if (consultation_id) {
    const { data: consultation, error: consultationError } =
      await getConsultationWithPatient(supabase, consultation_id, user.id);

    if (!consultationError && consultation) {
      consultationDate = format(new Date(consultation.created_at), "yyyy-MM-dd");
    }
  }

  return (
    <MedicalCertificateForm
      patientId={patient.id}
      patientName={patient.full_name}
      patientDateOfBirth={patient.date_of_birth}
      responsibleName={patient.responsible_name}
      consultationId={consultation_id}
      consultationDate={consultationDate}
      doctorName={profile?.full_name || "Médico"}
      doctorCRM={profile?.crm || ""}
      doctorSpecialty={profile?.specialty}
    />
  );
}
