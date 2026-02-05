import { Suspense } from "react";
import { AppointmentsPageClientV2 } from "./page-client-v2";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Agenda | Pediatra Gabriela",
  description: "Gerenciar agendamentos de consultas",
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      <Skeleton className="h-[700px] w-full rounded-lg" />
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <div className="min-h-screen py-8">
      <div className="px-6 max-w-7xl mx-auto">
        <Suspense fallback={<LoadingSkeleton />}>
          <AppointmentsPageClientV2 />
        </Suspense>
      </div>
    </div>
  );
}
