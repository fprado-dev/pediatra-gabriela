"use client";

import { FileText, Clock, RefreshCw, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts";

interface AgeDistribution {
  faixa: string;
  total: number;
}

interface EfficiencyMetricsProps {
  consultationsThisMonth: number;
  timeSavedMinutes: number;
  returnRate: number;
  ageDistribution: AgeDistribution[];
}

export function EfficiencyMetrics({
  consultationsThisMonth,
  timeSavedMinutes,
  returnRate,
  ageDistribution,
}: EfficiencyMetricsProps) {
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  // Cores para o donut chart (tons pasteis da brand)
  const COLORS = [
    'hsl(212, 79%, 81%)',  // Azul brand
    'hsl(173, 58%, 65%)',  // Verde-água mais claro
    'hsl(197, 37%, 50%)',  // Azul médio
    'hsl(43, 74%, 70%)',   // Amarelo pastel
  ];

  // Preparar dados do donut
  const chartData = ageDistribution.map((item) => ({
    name: item.faixa,
    value: item.total,
  }));

  const totalPatients = ageDistribution.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Consultas Este Mês */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                Consultas Este Mês
              </p>
              <p className="text-3xl font-bold text-foreground">
                {consultationsThisMonth}
              </p>
            </div>
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Tempo Economizado */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                Tempo Economizado
              </p>
              <p className="text-3xl font-bold text-foreground">
                {formatTime(timeSavedMinutes)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ~15min por consulta
              </p>
            </div>
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-chart-2/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-chart-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Taxa de Retorno */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                Taxa de Retorno
              </p>
              <p className="text-3xl font-bold text-foreground">
                {returnRate}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Pacientes que voltaram
              </p>
            </div>
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-chart-4/20 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-chart-4" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Distribuição Etária */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm text-muted-foreground">
              Distribuição Etária
            </p>
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-chart-3/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-chart-3" />
            </div>
          </div>

          {chartData.length > 0 ? (
            <div className="flex items-center gap-3">
              {/* Mini Donut Chart */}
              <div className="w-16 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={16}
                      outerRadius={28}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legenda Compacta */}
              <div className="flex-1 space-y-1">
                {chartData.slice(0, 2).map((item, index) => {
                  const percentage = totalPatients > 0
                    ? Math.round((item.value / totalPatients) * 100)
                    : 0;
                  return (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: COLORS[index] }}
                        />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                  );
                })}
                {chartData.length > 2 && (
                  <p className="text-xs text-muted-foreground">
                    +{chartData.length - 2} outras
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">
              Sem dados
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
