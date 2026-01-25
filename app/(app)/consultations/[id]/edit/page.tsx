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
      patient:patients(id, full_name, date_of_birth, weight_kg, height_cm, allergies, current_medications, medical_history, blood_type)
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

  return <EditConsultationForm consultation={consultation} />;
}
