"use client";

import { Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface AgeData {
  faixa: string;
  total: number;
}

interface AgeDistributionChartProps {
  data: AgeData[];
}

// Mapeamento de faixas para chaves CSS válidas
const faixaToKey: Record<string, string> = {
  "0-1 ano": "age0to1",
  "1-3 anos": "age1to3",
  "4-6 anos": "age4to6",
  "7+ anos": "age7plus",
};

const chartConfig = {
  total: {
    label: "Pacientes",
  },
  age0to1: {
    label: "0-1 ano",
    color: "hsl(212, 79%, 81%)",
  },
  age1to3: {
    label: "1-3 anos",
    color: "hsl(173, 58%, 39%)",
  },
  age4to6: {
    label: "4-6 anos",
    color: "hsl(197, 37%, 24%)",
  },
  age7plus: {
    label: "7+ anos",
    color: "hsl(43, 74%, 66%)",
  },
} satisfies ChartConfig;

export function AgeDistributionChart({ data }: AgeDistributionChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Faixa Etária</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-sm text-muted-foreground">
            Sem dados suficientes
          </p>
        </CardContent>
      </Card>
    );
  }

  // Mapear dados para usar chaves válidas
  const chartData = data.map((item) => {
    const key = faixaToKey[item.faixa] || "age0to1";
    return {
      faixa: item.faixa,
      key,
      total: item.total,
      fill: `var(--color-${key})`,
    };
  });

  const total = data.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Faixa Etária</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <ChartContainer config={chartConfig} className="h-[160px] w-[160px]">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="total"
                nameKey="faixa"
                innerRadius={40}
                strokeWidth={2}
              />
            </PieChart>
          </ChartContainer>
          
          <div className="flex-1 space-y-2">
            {data.map((item) => {
              const percentage = total > 0 ? Math.round((item.total / total) * 100) : 0;
              const key = faixaToKey[item.faixa] || "age0to1";
              const config = chartConfig[key as keyof typeof chartConfig];
              const color = "color" in config ? config.color : undefined;
              
              return (
                <div key={item.faixa} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-muted-foreground">{item.faixa}</span>
                  </div>
                  <span className="font-medium">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
