"use client";

import { Button } from "@/components/ui/button";
import {
  User,
  Cake,
  Stethoscope,
  MessageSquare,
  Clock,
  ArrowRight,
  FileText,
  Loader2,
  Search,
  Eye,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, differenceInYears, differenceInMonths, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "../ui/badge";

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
  diagnosis?: string;
  patient?: Patient;
}

interface ConsultationListProps {
  consultations: Consultation[];
  isSearching?: boolean;
  hasAnyConsultations?: boolean;
}

// Função para calcular idade detalhada
function calculateDetailedAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const today = new Date();

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  // Formatação baseada na idade
  if (years === 0 && months === 0) {
    return `${days} ${days === 1 ? 'dia' : 'dias'}`;
  } else if (years === 0) {
    if (days === 0) {
      return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    }
    return `${months} ${months === 1 ? 'mês' : 'meses'} e ${days} ${days === 1 ? 'dia' : 'dias'}`;
  } else {
    if (months === 0) {
      return `${years} ${years === 1 ? 'ano' : 'anos'}`;
    }
    return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`;
  }
}

export function ConsultationList({
  consultations,
  isSearching = false,
  hasAnyConsultations = true
}: ConsultationListProps) {
  // Empty State - Nenhuma consulta criada ainda
  if (!hasAnyConsultations && consultations.length === 0 && !isSearching) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <Stethoscope className="h-16 w-16 text-gray-300 mb-6" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhuma consulta registrada
        </h3>
        <p className="text-gray-500 mb-8 max-w-md">
          Comece criando sua primeira consulta com gravação de áudio e documentação automática por IA
        </p>
        <Link href="/consultations/new-recording">
          <Button size="lg" className="gap-2">
            <FileText className="h-5 w-5" />
            Nova Consulta
          </Button>
        </Link>
      </div>
    );
  }

  // Busca Sem Resultados
  if (consultations.length === 0 && isSearching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white border border-gray-200 rounded-lg">
        <Search className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-base font-medium text-gray-700 mb-1">
          Nenhuma consulta encontrada
        </h3>
        <p className="text-sm text-gray-500">
          Tente buscar por outro termo
        </p>
      </div>
    );
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          dot: "bg-green-600",
          text: "text-gray-700",
          label: "Completo",
        };
      case "processing":
        return {
          dot: "bg-blue-600",
          text: "text-gray-700",
          label: "Processando",
        };
      case "error":
        return {
          dot: "bg-red-600",
          text: "text-gray-700",
          label: "Erro",
        };
      default:
        return {
          dot: "bg-gray-600",
          text: "text-gray-700",
          label: "Desconhecido",
        };
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
      {consultations.map((consultation) => {
        const statusConfig = getStatusConfig(consultation.status);
        const patientAge = consultation.patient?.date_of_birth
          ? calculateDetailedAge(consultation.patient.date_of_birth)
          : null;

        return (
          <div
            key={consultation.id}
            className="bg-white border border-gray-200 rounded-lg flex flex-col"
          >
            {/* Header: Status + Tempo */}
            <div className="p-4 flex items-center justify-between border-b border-gray-100">
              <Badge variant="outline" className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                <span className={`text-xs font-medium ${statusConfig.text}`}>
                  {statusConfig.label}
                </span>
              </Badge>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(consultation.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>

            {/* Body: Informações */}
            <div className="p-4 flex-1 space-y-3">
              {/* Nome do Paciente */}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="font-semibold text-gray-900 truncate">
                  {consultation.patient?.full_name || "Paciente não encontrado"}
                </span>
              </div>

              {/* Idade */}
              {patientAge && (
                <div className="flex items-center gap-2">
                  <Cake className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-600">
                    {patientAge}
                  </span>
                </div>
              )}

              {/* Diagnóstico */}
              {consultation.diagnosis ? (
                <div className="flex items-start gap-2">
                  <Stethoscope className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 line-clamp-2">
                    {consultation.diagnosis}
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <Stethoscope className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-500 italic">
                    {consultation.status === "processing"
                      ? "Processando diagnóstico..."
                      : "Diagnóstico não disponível"}
                  </span>
                </div>
              )}

              {/* Queixa */}
              {consultation.chief_complaint && (
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600 line-clamp-2">
                    {consultation.chief_complaint}
                  </span>
                </div>
              )}

              {/* Duração */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-600">
                  {formatDuration(consultation.audio_duration_seconds)} de duração.
                </span>
              </div>
            </div>

            {/* Footer: Ação */}
            <div className="p-4 flex justify-end border-t border-gray-100">
              {consultation.status === "completed" && (
                <Link href={`/consultations/${consultation.id}/preview`} className="block">
                  <Button className="gap-2 cursor-pointer" size="xs">
                    <Eye className="h-3 w-3" />
                    Ver Consulta
                  </Button>
                </Link>
              )}
              {consultation.status === "processing" && (
                <Link href={`/consultations/${consultation.id}/preview`} className="block">
                  <Button variant="outline" className="gap-2" size="icon-sm" disabled>
                    <Loader2 className="h-3 w-3 animate-spin" />
                  </Button>
                </Link>
              )}
              {consultation.status === "error" && (
                <Link href={`/consultations/${consultation.id}/preview`} className="block">
                  <Button variant="destructive" className="gap-2" size="icon-sm">
                    <AlertCircle className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
