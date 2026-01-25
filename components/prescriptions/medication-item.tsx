"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  quantity: string;
  instructions: string;
}

interface MedicationItemProps {
  medication: Medication;
  index: number;
  onUpdate: (field: keyof Medication, value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function MedicationItem({
  medication,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: MedicationItemProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">
          Medicamento {index + 1}
        </span>
        {canRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={`name-${medication.id}`}>Nome do Medicamento</Label>
            <Input
              id={`name-${medication.id}`}
              placeholder="Ex: Dipirona 500mg/ml"
              value={medication.name}
              onChange={(e) => onUpdate("name", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`quantity-${medication.id}`}>Quantidade</Label>
            <Input
              id={`quantity-${medication.id}`}
              placeholder="Ex: 1 frasco"
              value={medication.quantity}
              onChange={(e) => onUpdate("quantity", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`dosage-${medication.id}`}>Dosagem</Label>
          <Input
            id={`dosage-${medication.id}`}
            placeholder="Ex: 10 gotas (0,5ml)"
            value={medication.dosage}
            onChange={(e) => onUpdate("dosage", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`instructions-${medication.id}`}>Instruções de Uso</Label>
          <Textarea
            id={`instructions-${medication.id}`}
            placeholder="Ex: A cada 6 horas, se dor ou febre, por 3 dias"
            value={medication.instructions}
            onChange={(e) => onUpdate("instructions", e.target.value)}
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}
