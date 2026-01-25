"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Consultation {
  id: string;
  status: "completed" | "processing" | "error";
  chief_complaint: string | null;
  created_at: string;
  patient: {
    full_name: string;
  };
}

interface RecentActivityProps {
  consultations: Consultation[];
}

export function RecentActivity({ consultations }: RecentActivityProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Atividade Recente</CardTitle>
        <Link href="/consultations">
          <Button variant="ghost" size="sm" className="text-xs">
            Ver todas
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {consultations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nenhuma consulta recente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {consultations.map((consultation) => (
              <Link
                key={consultation.id}
                href={`/consultations/${consultation.id}/preview`}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors"
              >
                {getStatusIcon(consultation.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {consultation.patient.full_name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {consultation.chief_complaint || "Queixa não informada"}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(consultation.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
