import { Suspense } from "react";
import { Calendar } from "lucide-react";
import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import { AppointmentsPageClient } from "./page-client";

export const metadata = {
  title: "Agenda | Pediatra Gabriela",
  description: "Gerenciar agendamentos de consultas",
};

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<PageHeaderSkeleton />}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              Agenda
            </h1>
            <p className="text-muted-foreground">
              Visualize e gerencie seus agendamentos
            </p>
          </div>
        </div>
      </Suspense>

      <AppointmentsPageClient />
    </div>
  );
}
