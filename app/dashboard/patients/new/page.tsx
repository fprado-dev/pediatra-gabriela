import { PatientForm } from "@/components/patients/patient-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewPatientPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/patients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Novo Paciente</h1>
          <p className="text-muted-foreground mt-1">
            Cadastre um novo paciente no sistema
          </p>
        </div>
      </div>

      {/* Form */}
      <PatientForm mode="create" />
    </div>
  );
}
