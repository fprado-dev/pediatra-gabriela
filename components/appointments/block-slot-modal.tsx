"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, Loader2, AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface BlockSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Gerar slots de 15 em 15 minutos de 8h às 18h
const TIME_SLOTS = Array.from({ length: 40 }, (_, i) => {
  const totalMinutes = i * 15;
  const hour = 8 + Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  if (hour >= 18) return null;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}).filter(Boolean) as string[];

export function BlockSlotModal({
  open,
  onOpenChange,
  onSuccess,
}: BlockSlotModalProps) {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!date || !startTime || !endTime) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    if (startTime >= endTime) {
      setError("O horário de término deve ser posterior ao horário de início");
      return;
    }

    setLoading(true);

    try {
      const dateStr = format(date, "yyyy-MM-dd");

      // Criar Date objects em horário local
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      const startLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startHour, startMinute);
      const endLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate(), endHour, endMinute);

      // Converter para UTC ISO string
      const startUTC = startLocal.toISOString();
      const endUTC = endLocal.toISOString();

      const response = await fetch("/api/appointments/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_datetime: startUTC,
          end_datetime: endUTC,
          reason: reason || "Horário reservado",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Erro ao bloquear horário");
        return;
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (err) {
      console.error("Error blocking slot:", err);
      setError("Erro ao bloquear horário. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDate(undefined);
    setStartTime("");
    setEndTime("");
    setReason("");
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Bloquear Horários
          </DialogTitle>
          <DialogDescription>
            Reserve um período na sua agenda para outras atividades
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Data */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Data <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-11",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(dateToCheck) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    // Verificar se é passado
                    if (dateToCheck < today) return true;

                    // Verificar se é fim de semana
                    const dayOfWeek = dateToCheck.getDay();
                    return dayOfWeek === 0 || dayOfWeek === 6;
                  }}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Horários */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Início <span className="text-red-500">*</span>
              </Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Término <span className="text-red-500">*</span>
              </Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label>Motivo (opcional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Reunião administrativa, Almoço com paciente..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Ações */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Bloquear Horário
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
