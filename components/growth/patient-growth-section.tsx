"use client";

import { useEffect, useState } from "react";
import { GrowthAlertCard } from "./growth-alert-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, AlertTriangle } from "lucide-react";
import type { GrowthAnalysis } from "@/lib/growth";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return null; // Silently fail - growth analysis is optional
  }

  if (!analysis) {
    return null; // No data available
  }

  // Only show if there are alerts
  if (analysis.alerts.length === 0) {
    // Show a small success indicator instead
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
        <TrendingUp className="h-4 w-4 text-green-600" />
        <span className="text-sm text-green-700">
          Crescimento dentro dos parâmetros esperados
        </span>
        {analysis.current.weight && (
          <span className="text-xs text-green-600 ml-auto">
            Peso: P{analysis.current.weight.percentile}
          </span>
        )}
        {analysis.current.height && (
          <span className="text-xs text-green-600">
            Altura: P{analysis.current.height.percentile}
          </span>
        )}
      </div>
    );
  }

  return (
    <GrowthAlertCard
      analysis={analysis}
      patientName={patientName}
      onGenerateInsights={handleGenerateInsights}
    />
  );
}
