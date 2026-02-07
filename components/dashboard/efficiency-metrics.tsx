"use client";

import { Clock, TrendingUp, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EfficiencyData } from "@/lib/queries/appointments/get-all-appoitments-by-status";

interface EfficiencyMetricsProps {
  statusData: EfficiencyData['statusData'];
  timeData: EfficiencyData['timeData'];
}

// Componente de barra de progresso customizado
function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function EfficiencyMetrics({ statusData, timeData }: EfficiencyMetricsProps) {
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  console.log({ timeData });
  const total = statusData.pending + statusData.confirmed +
    statusData.completed + statusData.cancelled;

  const timePercentChange = timeData.completedCountData.minutesSaved > 0
    ? Math.round((timeData.completedCountData.minutesSaved / timeData.completedCountData.completedCount) * 100)
    : 0;

  return (
    <div className="grid gap-4">
      {/* Card 1: Status das Consultas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Status das Consultas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-2xl font-bold">{total}</span>
          </div>

          {/* Breakdown por Status */}
          <div className="space-y-3">
            {/* Finalizadas */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Finalizadas</span>
                </div>
                <span className="font-medium">{statusData.completed}</span>
              </div>
              <ProgressBar
                value={(statusData.completed / total) * 100}
                color="bg-green-600"
              />
            </div>

            {/* Confirmadas */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span>Confirmadas</span>
                </div>
                <span className="font-medium">{statusData.confirmed}</span>
              </div>
              <ProgressBar
                value={(statusData.confirmed / total) * 100}
                color="bg-blue-600"
              />
            </div>

            {/* Pendentes */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>Pendentes</span>
                </div>
                <span className="font-medium">{statusData.pending}</span>
              </div>
              <ProgressBar
                value={(statusData.pending / total) * 100}
                color="bg-amber-600"
              />
            </div>

            {/* Canceladas */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>Canceladas</span>
                </div>
                <span className="font-medium">{statusData.cancelled}</span>
              </div>
              <ProgressBar
                value={(statusData.cancelled / total) * 100}
                color="bg-red-600"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Tempo Economizado */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Eficiência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                Tempo Economizado
              </p>
              <p className="text-3xl font-bold text-foreground">
                {formatTime(timeData.completedCountData.minutesSaved)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ~15min por consulta completada
              </p>
            </div>
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-chart-2/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-chart-2" />
            </div>
          </div>

          {/* Comparação com Mês Anterior */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 ${timePercentChange > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                <TrendingUp className="h-4 w-4" />
                {formatTime(timeData.completedCountData.minutesSaved)} economizados
              </div>

            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
