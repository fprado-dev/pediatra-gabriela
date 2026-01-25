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

const chartConfig = {
  total: {
    label: "Pacientes",
  },
  "0-1 ano": {
    label: "0-1 ano",
    color: "var(--chart-1)",
  },
  "1-3 anos": {
    label: "1-3 anos",
    color: "var(--chart-2)",
  },
  "4-6 anos": {
    label: "4-6 anos",
    color: "var(--chart-3)",
  },
  "7+ anos": {
    label: "7+ anos",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export function AgeDistributionChart({ data }: AgeDistributionChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    fill: `var(--color-${item.faixa.replace(/\s+/g, "-")})`,
  }));

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
              return (
                <div key={item.faixa} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: `var(--color-${item.faixa.replace(/\s+/g, "-")})` }}
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
