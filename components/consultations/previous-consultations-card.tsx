"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, AlertCircle, Edit2 } from "lucide-react";
import { PreviousConsultationsData } from "@/lib/types/consultation";
import { cn } from "@/lib/utils";

interface PreviousConsultationsCardProps {
  data: PreviousConsultationsData | null;
  className?: string;
}

export function PreviousConsultationsCard({
  data,
  className
}: PreviousConsultationsCardProps) {
  if (!data || !data.consultations || data.consultations.length === 0) {
    return null;
  }

  const consultations = data.consultations;
  const lastConsultation = consultations[0]; // Mais recente

  return (
    <Card className={cn("border-purple-200 bg-purple-50/50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-purple-900 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Consultas Anteriores
          </CardTitle>
          {data.last_updated && (
            <span className="text-xs text-purple-600">
              Atualizado em {new Date(data.last_updated).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {consultations.map((consultation, index) => {
          const isLastConsult = index === 0;
          const consultDate = new Date(consultation.date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });

          return (
            <div
              key={consultation.consultation_id}
              className={cn(
                "rounded-lg p-4 transition-colors",
                isLastConsult
                  ? "bg-purple-100 border-2 border-purple-300"
                  : "bg-white border border-purple-200"
              )}
            >
              {/* Header da Consulta */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isLastConsult && (
                    <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
                      Última Consulta
                    </Badge>
                  )}
                  <span className="font-semibold text-sm text-purple-900">
                    {consultDate}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {consultation.auto_generated && (
                    <Badge variant="outline" className="text-blue-600 border-blue-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Auto
                    </Badge>
                  )}
                  {consultation.edited_by_doctor && (
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      <Edit2 className="h-3 w-3 mr-1" />
                      Editado
                    </Badge>
                  )}
                </div>
              </div>

              {/* Diagnóstico */}
              <div className="mb-3 pb-3 border-b border-purple-200">
                <p className="text-sm font-medium text-purple-800">
                  Diagnóstico:
                </p>
                <p className="text-sm text-purple-900 mt-1">
                  {consultation.diagnosis}
                </p>
              </div>

              {/* Pontos Principais */}
              <div>
                <p className="text-sm font-medium text-purple-800 mb-2">
                  Pontos Principais:
                </p>
                <ul className="space-y-2">
                  {consultation.key_points.map((point, pointIndex) => (
                    <li
                      key={pointIndex}
                      className="flex items-start gap-2 text-sm text-purple-900"
                    >
                      <span className="text-purple-500 mt-1 shrink-0">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Indicador visual para última consulta */}
              {isLastConsult && (
                <div className="mt-3 pt-3 border-t border-purple-300">
                  <div className="flex items-center gap-2 text-xs text-purple-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">
                      Verificar evolução destes pontos na consulta atual
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Footer com informações adicionais */}
        <div className="text-xs text-purple-600 italic pt-2 border-t border-purple-200">
          {consultations.length === 1 
            ? "Exibindo a última consulta" 
            : `Exibindo as ${consultations.length} últimas consultas`}
        </div>
      </CardContent>
    </Card>
  );
}
