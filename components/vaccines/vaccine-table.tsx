"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  SkipForward,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { VaccinesByAgeGroup, VaccineWithStatus } from "@/lib/types/vaccine";

interface VaccineTableProps {
  vaccineGroups: VaccinesByAgeGroup[];
  patientId: string;
  onUpdate: () => void;
}

export function VaccineTable({
  vaccineGroups,
  patientId,
  onUpdate,
}: VaccineTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(vaccineGroups.slice(0, 3).map((g) => g.ageGroup))
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState<VaccineWithStatus | null>(null);
  const [appliedDate, setAppliedDate] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const toggleGroup = (ageGroup: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(ageGroup)) {
      newExpanded.delete(ageGroup);
    } else {
      newExpanded.add(ageGroup);
    }
    setExpandedGroups(newExpanded);
  };

  const handleMarkApplied = (vaccine: VaccineWithStatus) => {
    setSelectedVaccine(vaccine);
    setAppliedDate(new Date().toISOString().split("T")[0]);
    setBatchNumber("");
    setIsDialogOpen(true);
  };

  const handleSaveVaccine = async (status: "applied" | "skipped") => {
    if (!selectedVaccine) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/patients/${patientId}/vaccines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vaccine_code: selectedVaccine.code,
          status,
          applied_at: status === "applied" ? appliedDate : null,
          batch_number: batchNumber || null,
        }),
      });

      if (!response.ok) throw new Error("Erro ao salvar");

      toast.success(
        status === "applied"
          ? "Vacina marcada como aplicada!"
          : "Vacina marcada como pulada"
      );
      setIsDialogOpen(false);
      onUpdate();
    } catch (error) {
      toast.error("Erro ao salvar vacina");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (vaccine: VaccineWithStatus) => {
    if (vaccine.isApplied) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Aplicada
        </Badge>
      );
    }
    if (vaccine.isOverdue) {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Atrasada
        </Badge>
      );
    }
    if (vaccine.isSkipped) {
      return (
        <Badge className="bg-gray-100 text-gray-600 border-gray-200">
          <SkipForward className="h-3 w-3 mr-1" />
          Pulada
        </Badge>
      );
    }
    if (vaccine.isPending) {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          <Clock className="h-3 w-3 mr-1" />
          Pendente
        </Badge>
      );
    }
    return null;
  };

  const getGroupStats = (vaccines: VaccineWithStatus[]) => {
    const applied = vaccines.filter((v) => v.isApplied).length;
    const overdue = vaccines.filter((v) => v.isOverdue).length;
    return { applied, total: vaccines.length, overdue };
  };

  if (vaccineGroups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Nenhuma vacina disponível para exibir
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {vaccineGroups.map((group) => {
          const isExpanded = expandedGroups.has(group.ageGroup);
          const stats = getGroupStats(group.vaccines);

          return (
            <Collapsible
              key={group.ageGroup}
              open={isExpanded}
              onOpenChange={() => toggleGroup(group.ageGroup)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between px-3 py-2 h-auto",
                    stats.overdue > 0 && "bg-red-50 hover:bg-red-100",
                    stats.applied === stats.total && "bg-green-50 hover:bg-green-100"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isExpanded && "rotate-90"
                      )}
                    />
                    <span className="font-medium text-sm">{group.ageGroup}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {stats.applied}/{stats.total}
                    </span>
                    {stats.overdue > 0 && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        {stats.overdue} atrasada{stats.overdue > 1 ? "s" : ""}
                      </Badge>
                    )}
                    {stats.applied === stats.total && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="border rounded-lg mt-1 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-medium">Vacina</TableHead>
                        <TableHead className="text-xs font-medium w-24">Dose</TableHead>
                        <TableHead className="text-xs font-medium w-28">Status</TableHead>
                        <TableHead className="text-xs font-medium w-28 text-right">
                          Data
                        </TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.vaccines.map((vaccine) => (
                        <TableRow
                          key={vaccine.code}
                          className={cn(
                            vaccine.isOverdue && "bg-red-50/50",
                            vaccine.isApplied && "bg-green-50/30"
                          )}
                        >
                          <TableCell className="font-medium text-sm py-2">
                            {vaccine.name}
                            {vaccine.notes && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {vaccine.notes}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground py-2">
                            {vaccine.dose_label}
                          </TableCell>
                          <TableCell className="py-2">
                            {getStatusBadge(vaccine)}
                          </TableCell>
                          <TableCell className="text-xs text-right py-2">
                            {vaccine.patientVaccine?.applied_at
                              ? new Date(
                                  vaccine.patientVaccine.applied_at
                                ).toLocaleDateString("pt-BR")
                              : "-"}
                          </TableCell>
                          <TableCell className="py-2">
                            {!vaccine.isApplied && !vaccine.isSkipped && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleMarkApplied(vaccine)}
                              >
                                Marcar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* Dialog para marcar vacina */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Vacina</DialogTitle>
          </DialogHeader>
          {selectedVaccine && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedVaccine.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedVaccine.dose_label} • {selectedVaccine.age_group}
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="applied_at">Data de Aplicação</Label>
                  <Input
                    id="applied_at"
                    type="date"
                    value={appliedDate}
                    onChange={(e) => setAppliedDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch_number">Lote (opcional)</Label>
                  <Input
                    id="batch_number"
                    placeholder="Ex: ABC123"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => handleSaveVaccine("skipped")}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Pular Vacina
            </Button>
            <Button
              onClick={() => handleSaveVaccine("applied")}
              disabled={isSaving || !appliedDate}
              className="w-full sm:w-auto"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Marcar como Aplicada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
