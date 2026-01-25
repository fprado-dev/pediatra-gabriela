"use client";

import { useEffect, useState } from "react";
import { GrowthAlertCard } from "./growth-alert-card";
import { GrowthChart } from "./growth-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  AlertTriangle, 
  Scale, 
  Ruler, 
  Brain,
  LineChart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GrowthAnalysis } from "@/lib/growth";

interface GrowthMeasurement {
  date: string;
  value: number;
  percentile: number;
}

interface PatientGrowthSectionProps {
  patientId: string;
  patientName: string;
  dateOfBirth: string;
  medicalHistory?: string;
}

export function PatientGrowthSection({
  patientId,
  patientName,
  dateOfBirth,
  medicalHistory,
}: PatientGrowthSectionProps) {
  const [analysis, setAnalysis] = useState<GrowthAnalysis | null>(null);
  const [measurements, setMeasurements] = useState<{
    weight: GrowthMeasurement[];
    height: GrowthMeasurement[];
    hc: GrowthMeasurement[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(false);

  // Calculate age in months
  const calculateAgeInMonths = () => {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    return years * 12 + months;
  };

  useEffect(() => {
    const fetchGrowthData = async () => {
      try {
        const response = await fetch(`/api/patients/${patientId}/growth`);
        if (!response.ok) {
          throw new Error("Falha ao carregar dados de crescimento");
        }
        const data = await response.json();
        setAnalysis(data.analysis);
        setMeasurements(data.measurements);
      } catch (err: any) {
        console.error("Erro ao buscar dados de crescimento:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGrowthData();
  }, [patientId]);

  const handleGenerateInsights = async (): Promise<string> => {
    const response = await fetch(`/api/patients/${patientId}/growth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        analysis,
        patientName,
        ageMonths: calculateAgeInMonths(),
        medicalHistory,
      }),
    });

    if (!response.ok) {
      throw new Error("Falha ao gerar insights");
    }

    const data = await response.json();
    return data.insights;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return null; // Silently fail - growth analysis is optional
  }

  if (!analysis) {
    return null; // No data available
  }

  const hasAlerts = analysis.alerts.length > 0;
  const hasMeasurements = measurements && (
    measurements.weight.length > 1 ||
    measurements.height.length > 1 ||
    measurements.hc.length > 1
  );

  return (
    <div className="space-y-4">
      {/* Card de Status / Alertas */}
      {hasAlerts ? (
        <GrowthAlertCard
          analysis={analysis}
          patientName={patientName}
          onGenerateInsights={handleGenerateInsights}
        />
      ) : (
        <Card className="border-green-200 bg-gradient-to-r from-green-50/50 to-white">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Crescimento Saudável</p>
                  <p className="text-xs text-muted-foreground">
                    Dentro dos parâmetros esperados para a idade
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                {analysis.current.weight && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Peso</p>
                    <p className="font-semibold text-green-700">P{analysis.current.weight.percentile}</p>
                  </div>
                )}
                {analysis.current.height && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Altura</p>
                    <p className="font-semibold text-green-700">P{analysis.current.height.percentile}</p>
                  </div>
                )}
                {analysis.current.headCircumference && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">P. Cefálico</p>
                    <p className="font-semibold text-green-700">P{analysis.current.headCircumference.percentile}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Crescimento */}
      {hasMeasurements && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <LineChart className="h-5 w-5" />
                Curvas de Crescimento
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChart(!showChart)}
                className="text-sm"
              >
                {showChart ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Expandir
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          
          {showChart && (
            <CardContent className="pt-2">
              <Tabs defaultValue="weight" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="weight" className="gap-1.5 text-xs">
                    <Scale className="h-3.5 w-3.5" />
                    Peso
                  </TabsTrigger>
                  <TabsTrigger value="height" className="gap-1.5 text-xs">
                    <Ruler className="h-3.5 w-3.5" />
                    Altura
                  </TabsTrigger>
                  <TabsTrigger value="hc" className="gap-1.5 text-xs">
                    <Brain className="h-3.5 w-3.5" />
                    P. Cefálico
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="weight">
                  {measurements.weight.length > 1 ? (
                    <GrowthChart measurements={measurements.weight} type="weight" />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Dados insuficientes para gerar o gráfico de peso.
                      <br />
                      Pelo menos 2 medições são necessárias.
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="height">
                  {measurements.height.length > 1 ? (
                    <GrowthChart measurements={measurements.height} type="height" />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Dados insuficientes para gerar o gráfico de altura.
                      <br />
                      Pelo menos 2 medições são necessárias.
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="hc">
                  {measurements.hc.length > 1 ? (
                    <GrowthChart measurements={measurements.hc} type="hc" />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Dados insuficientes para gerar o gráfico de perímetro cefálico.
                      <br />
                      Pelo menos 2 medições são necessárias.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
