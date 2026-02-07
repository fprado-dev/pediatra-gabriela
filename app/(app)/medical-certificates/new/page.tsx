import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { PatientSelector } from "@/components/shared/patient-selector";
import { getActivePatients } from "@/lib/supabase/queries";
import { Award } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewMedicalCertificatePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Buscar pacientes ativos
  const { data: patients, error } = await getActivePatients(supabase, user.id);

  if (error) {
    console.error("Erro ao buscar pacientes:", error);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="px-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Award className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerar Atestado</h1>
            <p className="text-gray-600 mt-1">
              Selecione um paciente para continuar
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Seletor de Pacientes */}
        <PatientSelector
          patients={patients || []}
          baseUrl="/medical-certificates/new"
        />
      </div>
    </div>
  );
}
