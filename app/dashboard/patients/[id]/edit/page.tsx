import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PatientForm } from "@/components/patients/patient-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function EditPatientPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Buscar paciente
  const { data: patient, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", params.id)
    .eq("doctor_id", user.id)
    .eq("is_active", true)
    .single();

  if (error || !patient) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/patients/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Paciente</h1>
          <p className="text-muted-foreground mt-1">
            Atualize as informações de {patient.full_name}
          </p>
        </div>
      </div>

      {/* Form */}
      <PatientForm mode="edit" patient={patient} />
    </div>
  );
}
