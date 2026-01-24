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
    <div className="space-y-4">
      {consultations.map((consultation) => (
        <Card key={consultation.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              {/* Info principal */}
              <div className="flex-1 space-y-3">
                {/* Linha 1: Paciente e Status */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">
                      {consultation.patient?.full_name || "Paciente não encontrado"}
                    </span>
                  </div>
                  {getStatusBadge(consultation.status)}
                </div>

                {/* Linha 2: Queixa principal ou placeholder */}
                {consultation.chief_complaint ? (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {consultation.chief_complaint}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {consultation.status === "processing" 
                      ? "Processando com IA..."
                      : "Queixa principal não disponível"}
                  </p>
                )}

                {/* Linha 3: Metadados */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(consultation.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>Áudio: {formatDuration(consultation.audio_duration_seconds)}</span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-col gap-2">
                {consultation.status === "completed" && (
                  <Link href={`/consultations/${consultation.id}/preview`}>
                    <Button size="sm" variant="default">
                      Ver Consulta
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                )}
                {consultation.status === "processing" && (
                  <Link href={`/consultations/${consultation.id}/preview`}>
                    <Button size="sm" variant="outline">
                      Acompanhar
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    </Button>
                  </Link>
                )}
                {consultation.status === "error" && (
                  <Link href={`/consultations/${consultation.id}/preview`}>
                    <Button size="sm" variant="outline">
                      Ver Erro
                      <AlertCircle className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
