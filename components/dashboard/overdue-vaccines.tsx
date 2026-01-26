"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Syringe, AlertTriangle, ArrowRight, User } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PatientWithOverdue {
  id: string;
  name: string;
  overdueCount: number;
  overdueVaccines: string[];
}

export function OverdueVaccines() {
  const [patients, setPatients] = useState<PatientWithOverdue[]>([]);
  const [totalOverdue, setTotalOverdue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOverdue = async () => {
      try {
        const response = await fetch("/api/vaccines/overdue");
        if (!response.ok) throw new Error("Erro ao carregar");

        const data = await response.json();
        setPatients(data.patients || []);
        setTotalOverdue(data.totalOverdue || 0);
      } catch (error) {
        console.error("Erro ao buscar vacinas atrasadas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverdue();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (patients.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Syringe className="h-5 w-5 text-green-600" />
            Vacinas em Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Todos os pacientes estão com as vacinas em dia! 🎉
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-200 bg-red-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Vacinas Atrasadas
          </CardTitle>
          <Badge variant="destructive" className="text-xs">
            {totalOverdue} paciente{totalOverdue > 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {patients.map((patient) => (
          <Link
            key={patient.id}
            href={`/patients/${patient.id}`}
            className="block"
          >
            <div className="flex items-start justify-between p-3 bg-white rounded-lg border border-red-100 hover:border-red-300 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <User className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{patient.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {patient.overdueVaccines.map((vaccine, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-[10px] border-red-200 text-red-700"
                      >
                        {vaccine}
                      </Badge>
                    ))}
                    {patient.overdueCount > 3 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-red-200 text-red-700"
                      >
                        +{patient.overdueCount - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground mt-2" />
            </div>
          </Link>
        ))}

        {totalOverdue > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            + {totalOverdue - 5} outros pacientes com vacinas atrasadas
          </p>
        )}
      </CardContent>
    </Card>
  );
}
