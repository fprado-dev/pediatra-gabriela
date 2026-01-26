"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Syringe,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VaccineTable } from "./vaccine-table";
import { VaccineSummary } from "./vaccine-summary";
import type { VaccinesByAgeGroup } from "@/lib/types/vaccine";

interface VaccineStats {
  total: number;
  applied: number;
  pending: number;
  overdue: number;
  skipped: number;
}

interface VaccineCalendarProps {
  patientId: string;
  patientName: string;
}

export function VaccineCalendar({ patientId, patientName }: VaccineCalendarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [susVaccines, setSusVaccines] = useState<VaccinesByAgeGroup[]>([]);
  const [particularVaccines, setParticularVaccines] = useState<VaccinesByAgeGroup[]>([]);
  const [stats, setStats] = useState<VaccineStats | null>(null);
  const [activeTab, setActiveTab] = useState<"sus" | "particular" | "summary">("sus");
  const [error, setError] = useState<string | null>(null);

  const fetchVaccines = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/patients/${patientId}/vaccines`);
      if (!response.ok) throw new Error("Falha ao carregar vacinas");

      const data = await response.json();
      setSusVaccines(data.sus || []);
      setParticularVaccines(data.particular || []);
      setStats(data.stats);
    } catch (err: any) {
      console.error("Erro ao buscar vacinas:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVaccines();
  }, [patientId]);

  const handleVaccineUpdate = () => {
    fetchVaccines();
  };

  const progressPercentage = stats
    ? Math.round((stats.applied / stats.total) * 100)
    : 0;

  if (error) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Syringe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Calendário Vacinal
              </CardTitle>
              {stats && !isLoading && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stats.applied}/{stats.total} vacinas aplicadas
                  {stats.overdue > 0 && (
                    <span className="text-red-600 ml-2">
                      • {stats.overdue} atrasada{stats.overdue > 1 ? "s" : ""}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Barra de Progresso */}
        {stats && !isLoading && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  {stats.applied} aplicadas
                </span>
                <span className="flex items-center gap-1 text-amber-600">
                  <Clock className="h-3 w-3" />
                  {stats.pending} pendentes
                </span>
                {stats.overdue > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    {stats.overdue} atrasadas
                  </span>
                )}
              </div>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "sus" | "particular" | "summary")}
            >
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="sus" className="gap-1.5 text-xs">
                  <Building2 className="h-3.5 w-3.5" />
                  SUS
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                    {susVaccines.reduce((acc, g) => acc + g.vaccines.length, 0)}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="particular" className="gap-1.5 text-xs">
                  <Stethoscope className="h-3.5 w-3.5" />
                  Particular
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                    {particularVaccines.reduce((acc, g) => acc + g.vaccines.length, 0)}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="summary" className="gap-1.5 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Sumário
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sus" className="mt-0">
                <VaccineTable
                  vaccineGroups={susVaccines}
                  patientId={patientId}
                  onUpdate={handleVaccineUpdate}
                />
              </TabsContent>

              <TabsContent value="particular" className="mt-0">
                <VaccineTable
                  vaccineGroups={particularVaccines}
                  patientId={patientId}
                  onUpdate={handleVaccineUpdate}
                />
              </TabsContent>

              <TabsContent value="summary" className="mt-0">
                <VaccineSummary
                  susVaccines={susVaccines}
                  particularVaccines={particularVaccines}
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      )}
    </Card>
  );
}
