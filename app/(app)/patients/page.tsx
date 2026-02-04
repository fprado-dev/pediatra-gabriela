import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PatientList } from "@/components/patients/patient-list";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function PatientsPage() {
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
    .select("*")
    .eq("doctor_id", user.id)
    .eq("is_active", true)
    .order("full_name");

  if (error) {
    console.error("Error fetching patients:", error);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="px-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Pacientes
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie seus pacientes cadastrados
            </p>
          </div>
          <Link href="/patients/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Paciente
            </Button>
          </Link>
        </div>

        <Separator className="my-4" />

        {/* Lista de Pacientes */}
        <PatientList patients={patients || []} />
      </div>
    </div>
  );
}
