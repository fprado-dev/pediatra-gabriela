import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ConsultationHistorySelector } from "@/components/shared/consultation-history-selector";
import {
  getPatientById,
  getRecentConsultationsByPatient,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function PrescriptionConsultationHistoryPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
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

  // Buscar consultas recentes do paciente (últimas 10)
  const { data: consultations, error: consultationsError } =
    await getRecentConsultationsByPatient(supabase, patientId, user.id, 10);

  if (consultationsError) {
    console.error("Erro ao buscar consultas:", consultationsError);
  }

  return (
    <ConsultationHistorySelector
      patient={{
        id: patient.id,
        full_name: patient.full_name,
        date_of_birth: patient.date_of_birth,
      }}
      consultations={consultations || []}
      baseFormUrl={`/prescriptions/new/${patientId}/form`}
      title="Gerar Receita"
      description="Selecione uma consulta para vincular ou continue sem consulta"
      noConsultationButtonText="Criar Receita"
    />
  );
}
