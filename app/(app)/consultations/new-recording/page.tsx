import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewConsultationRecording } from "@/components/consultations/new-consultation-recording";

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ patient_id?: string; appointment_id?: string }>;
}

export default async function NewConsultationRecordingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const patientId = params.patient_id;
  const appointmentId = params.appointment_id;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Buscar pacientes ativos do médico
  const { data: patients, error } = await supabase
    .from("patients")
    .select("id, full_name, date_of_birth, allergies, blood_type")
    .eq("doctor_id", user.id)
    .eq("is_active", true)
    .order("full_name");

  if (error) {
    console.error("Error fetching patients:", error);
  }

  return (
    <NewConsultationRecording 
      patients={(patients as any) || []} 
      preSelectedPatientId={patientId}
      appointmentId={appointmentId}
    />
  );
}
