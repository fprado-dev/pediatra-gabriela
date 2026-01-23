import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PatientList } from "@/components/patients/patient-list";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Pacientes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus pacientes cadastrados
          </p>
        </div>
        <Link href="/dashboard/patients/new">
          <Button size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Novo Paciente
          </Button>
        </Link>
      </div>

      {/* Lista de Pacientes */}
      <PatientList patients={patients || []} />
    </div>
  );
}
