"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertTriangle, Building2, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VaccinesByAgeGroup, VaccineWithStatus } from "@/lib/types/vaccine";

interface VaccineSummaryProps {
  susVaccines: VaccinesByAgeGroup[];
  particularVaccines: VaccinesByAgeGroup[];
}

export function VaccineSummary({
  susVaccines,
  particularVaccines,
}: VaccineSummaryProps) {
  // Combinar e agrupar todas as vacinas aplicadas por faixa etária
  const allAppliedByAge = new Map<string, { sus: VaccineWithStatus[]; particular: VaccineWithStatus[] }>();

  susVaccines.forEach((group) => {
    const applied = group.vaccines.filter((v) => v.isApplied);
    if (applied.length > 0) {
      const existing = allAppliedByAge.get(group.ageGroup) || { sus: [], particular: [] };
      existing.sus.push(...applied);
      allAppliedByAge.set(group.ageGroup, existing);
    }
  });

  particularVaccines.forEach((group) => {
    const applied = group.vaccines.filter((v) => v.isApplied);
    if (applied.length > 0) {
      const existing = allAppliedByAge.get(group.ageGroup) || { sus: [], particular: [] };
      existing.particular.push(...applied);
      allAppliedByAge.set(group.ageGroup, existing);
    }
  });

  // Ordem das faixas etárias
  const ageOrder = [
    'Ao nascer',
    '0 a 8 meses',
    '2 meses',
    '3 meses',
    '4 meses',
    '5 meses',
    '6 meses',
    '7 meses',
    '9 meses',
    '12 meses',
    '15 meses',
    '18 meses',
    '4 anos',
    '4 a 14 anos',
    '7+ anos',
    '9 a 11 anos',
    '9 a 14 anos',
    '9 a 45 anos',
    '11 a 14 anos',
  ];

  const sortedAgeGroups = Array.from(allAppliedByAge.entries()).sort((a, b) => {
    const indexA = ageOrder.indexOf(a[0]);
    const indexB = ageOrder.indexOf(b[0]);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  // Coletar vacinas pendentes e atrasadas
  const allPending: VaccineWithStatus[] = [];
  const allOverdue: VaccineWithStatus[] = [];

  [...susVaccines, ...particularVaccines].forEach((group) => {
    group.vaccines.forEach((v) => {
      if (v.isPending) allPending.push(v);
      if (v.isOverdue) allOverdue.push(v);
    });
  });

  if (sortedAgeGroups.length === 0 && allPending.length === 0 && allOverdue.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Nenhuma vacina registrada ainda
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alertas de Vacinas Atrasadas */}
      {allOverdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800">
              Vacinas Atrasadas ({allOverdue.length})
            </h3>
          </div>
          <div className="space-y-2">
            {allOverdue.map((vaccine) => (
              <div
                key={vaccine.code}
                className="flex items-center justify-between bg-white rounded p-2 border border-red-100"
              >
                <div>
                  <p className="font-medium text-sm">{vaccine.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {vaccine.dose_label} • {vaccine.age_group}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {vaccine.type === "sus" ? (
                    <Building2 className="h-3 w-3 mr-1" />
                  ) : (
                    <Stethoscope className="h-3 w-3 mr-1" />
                  )}
                  {vaccine.type.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próximas Vacinas Pendentes */}
      {allPending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-amber-800">
              Próximas Vacinas ({allPending.length})
            </h3>
          </div>
          <div className="grid gap-2">
            {allPending.slice(0, 6).map((vaccine) => (
              <div
                key={vaccine.code}
                className="flex items-center justify-between bg-white rounded p-2 border border-amber-100"
              >
                <div>
                  <p className="font-medium text-sm">{vaccine.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {vaccine.dose_label} • {vaccine.age_group}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {vaccine.type === "sus" ? (
                    <Building2 className="h-3 w-3 mr-1" />
                  ) : (
                    <Stethoscope className="h-3 w-3 mr-1" />
                  )}
                  {vaccine.type.toUpperCase()}
                </Badge>
              </div>
            ))}
            {allPending.length > 6 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                + {allPending.length - 6} outras vacinas pendentes
              </p>
            )}
          </div>
        </div>
      )}

      {/* Sumário por Faixa Etária */}
      {sortedAgeGroups.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">Vacinas Aplicadas por Idade</h3>
          </div>
          <div className="space-y-3">
            {sortedAgeGroups.map(([ageGroup, vaccines]) => (
              <div
                key={ageGroup}
                className="bg-green-50/50 border border-green-100 rounded-lg p-3"
              >
                <h4 className="font-medium text-sm mb-2 text-green-800">
                  {ageGroup}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {vaccines.sus.map((v) => (
                    <Badge
                      key={v.code}
                      variant="outline"
                      className="bg-white text-xs border-green-200"
                    >
                      <Building2 className="h-2.5 w-2.5 mr-1 text-blue-600" />
                      {v.name} ({v.dose_label})
                    </Badge>
                  ))}
                  {vaccines.particular.map((v) => (
                    <Badge
                      key={v.code}
                      variant="outline"
                      className="bg-white text-xs border-purple-200"
                    >
                      <Stethoscope className="h-2.5 w-2.5 mr-1 text-purple-600" />
                      {v.name} ({v.dose_label})
                    </Badge>
                  ))}
                </div>
                {/* Datas de aplicação */}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {[...vaccines.sus, ...vaccines.particular]
                    .filter((v) => v.patientVaccine?.applied_at)
                    .map((v) => (
                      <span key={v.code}>
                        {v.name}:{" "}
                        {new Date(v.patientVaccine!.applied_at!).toLocaleDateString(
                          "pt-BR"
                        )}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
