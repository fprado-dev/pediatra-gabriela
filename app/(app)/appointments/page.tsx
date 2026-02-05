import { Suspense } from "react";
import { Separator } from "@/components/ui/separator";
import { AppointmentsPageClient } from "./page-client";

export const metadata = {
  title: "Agenda | Pediatra Gabriela",
  description: "Gerenciar agendamentos de consultas",
};

export default function AppointmentsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="px-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Agenda da Semana
          </h1>
          <p className="text-gray-600 mt-1">
            Visualize e gerencie seus agendamentos semanais
          </p>
        </div>

        <Separator className="my-4" />

        <Suspense fallback={<div className="text-center py-8">Carregando...</div>}>
          <AppointmentsPageClient />
        </Suspense>
      </div>
    </div>
  );
}
