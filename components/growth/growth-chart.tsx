"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface GrowthChartProps {
  measurements: Array<{
    date: string;
    value: number;
    percentile: number;
  }>;
  type: "weight" | "height" | "hc";
}

const typeConfig = {
  weight: {
    label: "Peso (kg)",
    color: "hsl(212, 79%, 81%)",
    unit: "kg",
  },
  height: {
    label: "Altura (cm)",
    color: "hsl(173, 58%, 39%)",
    unit: "cm",
  },
  hc: {
    label: "P. Cefálico (cm)",
    color: "hsl(43, 74%, 66%)",
    unit: "cm",
  },
};

// Linhas de referência de percentis
const percentileLines = [
  { percentile: 3, label: "P3", color: "#ef4444" },
  { percentile: 15, label: "P15", color: "#f97316" },
  { percentile: 50, label: "P50", color: "#22c55e" },
  { percentile: 85, label: "P85", color: "#f97316" },
  { percentile: 97, label: "P97", color: "#ef4444" },
];

export function GrowthChart({ measurements, type }: GrowthChartProps) {
  const config = typeConfig[type];

  // Preparar dados para o gráfico (inverter ordem para mostrar cronologicamente)
  const chartData = [...measurements]
    .reverse()
    .map((m) => ({
      date: new Date(m.date).toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      }),
      value: m.value,
      percentile: m.percentile,
    }));

  const chartConfig = {
    value: {
      label: config.label,
      color: config.color,
    },
    percentile: {
      label: "Percentil",
      color: "hsl(212, 79%, 60%)",
    },
  } satisfies ChartConfig;

  // Calcular min/max para o eixo Y do percentil
  const minPercentile = Math.min(...chartData.map((d) => d.percentile));
  const maxPercentile = Math.max(...chartData.map((d) => d.percentile));

  return (
    <div className="space-y-4">
      {/* Gráfico de Valor */}
      <div>
        <p className="text-sm font-medium mb-2">{config.label}</p>
        <ChartContainer config={chartConfig} className="h-[150px] w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`fill-${type}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={config.color} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              domain={["auto", "auto"]}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [`${value} ${config.unit}`, config.label]}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={config.color}
              fill={`url(#fill-${type})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </div>

      {/* Gráfico de Percentil */}
      <div>
        <p className="text-sm font-medium mb-2">Evolução do Percentil</p>
        <ChartContainer config={chartConfig} className="h-[150px] w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fill-percentile" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(212, 79%, 60%)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(212, 79%, 60%)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              domain={[0, 100]}
              ticks={[3, 15, 50, 85, 97]}
            />
            {/* Linhas de referência */}
            <ReferenceLine y={3} stroke="#ef4444" strokeDasharray="3 3" />
            <ReferenceLine y={15} stroke="#f97316" strokeDasharray="3 3" />
            <ReferenceLine y={50} stroke="#22c55e" strokeDasharray="3 3" />
            <ReferenceLine y={85} stroke="#f97316" strokeDasharray="3 3" />
            <ReferenceLine y={97} stroke="#ef4444" strokeDasharray="3 3" />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [`P${value}`, "Percentil"]}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="percentile"
              stroke="hsl(212, 79%, 60%)"
              fill="url(#fill-percentile)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </div>

      {/* Legenda de percentis */}
      <div className="flex flex-wrap gap-4 text-xs justify-center pt-2 border-t">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-red-500" /> P3 / P97 (risco)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-orange-500" /> P15 / P85 (atenção)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-green-500" /> P50 (mediana)
        </span>
      </div>
    </div>
  );
}
