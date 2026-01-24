import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewConsultationRecording } from "@/components/consultations/new-consultation-recording";

export const dynamic = 'force-dynamic';

export default async function NewConsultationRecordingPage() {
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

  return <NewConsultationRecording patients={patients || []} />;
}
