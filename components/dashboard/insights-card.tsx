"use client";

import { use, useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentsGroupedData, getAllAppointments } from "@/lib/queries/appointments/get-all-appoitments";

type PeriodType = 'week' | 'month' | 'year';

interface InsightsCardProps {
  appointmentsGroupedData: {
    week: AppointmentsGroupedData['week'];
    month: AppointmentsGroupedData['month'];
    year: AppointmentsGroupedData['year'];
  };
  // Dados mockados internos por enquanto
}

export function InsightsCard({ appointmentsGroupedData }: InsightsCardProps) {
  const [period, setPeriod] = useState<PeriodType>('week');



  const currentData = appointmentsGroupedData[period];
  const percentChange = currentData.previous > 0
    ? Math.round(((currentData.total - currentData.previous) / currentData.previous) * 100)
    : 0;

  const isGrowth = percentChange > 0;
  const periodLabels = {
    week: 'esta semana',
    month: 'este mês',
    year: 'este ano'
  };

  return (
    <Card className="flex flex-col flex-1 col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Tendência de Consultas</CardTitle>

          {/* Seletor de Período */}
          <Tabs value={period} onValueChange={(value) => setPeriod(value as PeriodType)}>
            <TabsList className="h-8">
              <TabsTrigger value="week" className="text-xs px-3">Semanal</TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-3">Mensal</TabsTrigger>
              <TabsTrigger value="year" className="text-xs px-3">Anual</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1">
        {/* Métrica Principal */}
        <div className="mb-6">
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-foreground">
              {currentData.total}
            </p>
            <p className="text-sm text-muted-foreground pb-1">
              {periodLabels[period]}
            </p>
          </div>

          {/* Indicador de Tendência */}
          <div className="flex items-center gap-2 mt-2">
            {isGrowth ? (
              <>
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">+{percentChange}%</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  vs período anterior
                </span>
              </>
            ) : percentChange < 0 ? (
              <>
                <div className="flex items-center gap-1 text-orange-600">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm font-medium">{percentChange}%</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  vs período anterior
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">
                Estável vs período anterior
              </span>
            )}
          </div>
        </div>

        {/* Gráfico de Área */}
        <div className="flex-1 w-full min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={currentData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="consultationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(212, 79%, 81%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(212, 79%, 81%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(0, 0%, 50%)', fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(0, 0%, 50%)', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(0, 0%, 100%)',
                  border: '1px solid hsl(0, 0%, 89.8%)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  padding: '8px 12px'
                }}
                labelStyle={{ color: 'hsl(0, 0%, 15%)', fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(212, 79%, 81%)"
                strokeWidth={2}
                fill="url(#consultationGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
