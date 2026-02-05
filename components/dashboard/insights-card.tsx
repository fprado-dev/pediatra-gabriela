"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConsultationData {
  date: string;
  count: number;
}

interface InsightsCardProps {
  currentMonthTotal: number;
  previousMonthTotal: number;
  dailyData: ConsultationData[];
}

export function InsightsCard({
  currentMonthTotal,
  previousMonthTotal,
  dailyData,
}: InsightsCardProps) {
  // Calcular porcentagem de mudança
  const percentChange = previousMonthTotal > 0
    ? Math.round(((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100)
    : 0;

  const isGrowth = percentChange > 0;
  const isDecline = percentChange < 0;
  const isStable = percentChange === 0;

  // Preparar dados para o gráfico (últimos 7 dias)
  const chartData = dailyData.slice(-7).map((item, index) => ({
    name: new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
    value: item.count,
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Tendência de Consultas</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Métrica Principal */}
        <div className="mb-4">
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-foreground">
              {currentMonthTotal}
            </p>
            <p className="text-sm text-muted-foreground pb-1">
              este mês
            </p>
          </div>

          {/* Indicador de Crescimento */}
          <div className="flex items-center gap-2 mt-2">
            {isGrowth && (
              <>
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">+{percentChange}%</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  vs mês anterior
                </span>
              </>
            )}
            {isDecline && (
              <>
                <div className="flex items-center gap-1 text-orange-600">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm font-medium">{percentChange}%</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  vs mês anterior
                </span>
              </>
            )}
            {isStable && previousMonthTotal > 0 && (
              <>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Minus className="h-4 w-4" />
                  <span className="text-sm font-medium">Estável</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  vs mês anterior
                </span>
              </>
            )}
            {previousMonthTotal === 0 && (
              <span className="text-sm text-muted-foreground">
                Primeiro mês de dados
              </span>
            )}
          </div>
        </div>

        {/* Mini Gráfico */}
        {chartData.length > 0 ? (
          <div className="h-[100px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="consultationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(212, 79%, 81%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(212, 79%, 81%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(0, 0%, 50%)', fontSize: 11 }}
                />
                <YAxis hide />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(212, 79%, 81%)"
                  strokeWidth={2}
                  fill="url(#consultationGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Últimos 7 dias
            </p>
          </div>
        ) : (
          <div className="h-[100px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Dados insuficientes para gráfico
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
