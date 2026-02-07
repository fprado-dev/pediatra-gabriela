"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Calendar, AlertCircle, PlusCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BackButton } from "@/components/consultations/back-button";
import { calculateAge } from "@/lib/utils/date-helpers";

interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string;
}

interface Consultation {
  id: string;
  created_at: string;
  chief_complaint?: string;
  diagnosis?: string;
  status: string;
}

interface ConsultationHistorySelectorProps {
  patient: Patient;
  consultations: Consultation[];
  baseFormUrl: string;
  title: string;
  description: string;
  noConsultationButtonText?: string;
}

export function ConsultationHistorySelector({
  patient,
  consultations,
  baseFormUrl,
  title,
  description,
  noConsultationButtonText = "Continuar sem Consulta",
}: ConsultationHistorySelectorProps) {
  const router = useRouter();

  const handleSelectConsultation = (consultationId: string) => {
    router.push(`${baseFormUrl}?consultation_id=${consultationId}`);
  };

  const handleProceedWithout = () => {
    router.push(baseFormUrl);
  };

  const age = calculateAge(patient.date_of_birth);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="px-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600 mt-1">{description}</p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Informações do Paciente */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-blue-600">
                {patient.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {patient.full_name}
              </h2>
              <p className="text-gray-600 mt-1">
                {age} • Data de Nascimento:{" "}
                {format(new Date(patient.date_of_birth), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>
        </Card>

        {/* Botão destacado para continuar sem consulta */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-primary" />
                Criar sem Consulta Vinculada
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Gerar o documento apenas com os dados do paciente, sem vincular a uma
                consulta específica
              </p>
            </div>
            <Button onClick={handleProceedWithout} size="lg" className="ml-4">
              {noConsultationButtonText}
            </Button>
          </div>
        </Card>

        {/* Histórico de Consultas */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Consultas Anteriores
            </h3>
            <Badge variant="secondary">{consultations.length}</Badge>
          </div>

          {consultations.length === 0 ? (
            <Card className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                Este paciente ainda não possui consultas registradas
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Você pode criar o documento sem vincular a uma consulta
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {consultations.map((consultation) => {
                const statusColors = {
                  completed: "bg-green-100 text-green-800",
                  pending: "bg-yellow-100 text-yellow-800",
                  in_progress: "bg-blue-100 text-blue-800",
                };

                const statusLabels = {
                  completed: "Concluída",
                  pending: "Pendente",
                  in_progress: "Em Andamento",
                };

                return (
                  <Card
                    key={consultation.id}
                    className="p-4 hover:border-primary transition-colors cursor-pointer"
                    onClick={() => handleSelectConsultation(consultation.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {format(
                              new Date(consultation.created_at),
                              "dd/MM/yyyy 'às' HH:mm",
                              { locale: ptBR }
                            )}
                          </span>
                          <Badge
                            variant="secondary"
                            className={
                              statusColors[
                                consultation.status as keyof typeof statusColors
                              ] || "bg-gray-100 text-gray-800"
                            }
                          >
                            {statusLabels[
                              consultation.status as keyof typeof statusLabels
                            ] || consultation.status}
                          </Badge>
                        </div>

                        {consultation.chief_complaint && (
                          <p className="text-sm text-gray-700 mb-1">
                            <span className="font-medium">Queixa:</span>{" "}
                            {consultation.chief_complaint}
                          </p>
                        )}

                        {consultation.diagnosis && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Diagnóstico:</span>{" "}
                            {consultation.diagnosis}
                          </p>
                        )}
                      </div>

                      <Button variant="outline" size="sm">
                        Selecionar
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
