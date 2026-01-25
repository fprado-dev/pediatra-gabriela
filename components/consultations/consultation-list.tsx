"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  User, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  ArrowRight 
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string;
}

interface Consultation {
  id: string;
  patient_id: string;
  status: "processing" | "completed" | "error";
  created_at: string;
  audio_duration_seconds: number;
  chief_complaint?: string;
  patient?: Patient;
}

interface ConsultationListProps {
  consultations: Consultation[];
}

export function ConsultationList({ consultations }: ConsultationListProps) {
  if (consultations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">
          Nenhuma consulta ainda. Comece gravando sua primeira consulta!
        </p>
      </div>
    );
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completo
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processando
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Erro
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {consultations.map((consultation) => (
        <Card key={consultation.id} className="hover:shadow-md transition-shadow flex flex-col">
          <CardContent className="p-4 flex flex-col flex-1">
            {/* Header: Status */}
            <div className="flex items-center justify-between mb-3">
              {getStatusBadge(consultation.status)}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(consultation.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>

            {/* Paciente */}
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-semibold text-sm truncate">
                {consultation.patient?.full_name || "Paciente não encontrado"}
              </span>
            </div>

            {/* Queixa principal */}
            <div className="flex-1 mb-3">
              {consultation.chief_complaint ? (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {consultation.chief_complaint}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {consultation.status === "processing" 
                    ? "Processando com IA..."
                    : "Queixa não disponível"}
                </p>
              )}
            </div>

            {/* Footer: Metadados + Ação */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(consultation.audio_duration_seconds)}</span>
              </div>

              {consultation.status === "completed" && (
                <Link href={`/consultations/${consultation.id}/preview`}>
                  <Button size="sm" variant="default">
                    Ver
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              )}
              {consultation.status === "processing" && (
                <Link href={`/consultations/${consultation.id}/preview`}>
                  <Button size="sm" variant="outline">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Aguardar
                  </Button>
                </Link>
              )}
              {consultation.status === "error" && (
                <Link href={`/consultations/${consultation.id}/preview`}>
                  <Button size="sm" variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Ver Erro
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
