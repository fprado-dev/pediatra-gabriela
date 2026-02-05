"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, Loader2, AlertCircle } from "lucide-react";
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
import { PatientCombobox } from "./patient-combobox";
import {
  AppointmentType,
  APPOINTMENT_TYPE_LABELS,
} from "@/lib/types/appointment";
import { Badge } from "@/components/ui/badge";

interface NewAppointmentModalV2Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  preselectedDate?: Date;
  preselectedTime?: string;
}

// Gerar slots de 15 em 15 minutos de 8h às 18h (excluindo 18h)
const TIME_SLOTS = Array.from({ length: 40 }, (_, i) => {
  const totalMinutes = i * 15;
  const hour = 8 + Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  if (hour >= 18) return null;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}).filter(Boolean) as string[];

export function NewAppointmentModalV2({
  open,
  onOpenChange,
  onSuccess,
  preselectedDate,
  preselectedTime = "",
}: NewAppointmentModalV2Props) {
  const [loading, setLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [date, setDate] = useState<Date | undefined>(preselectedDate);
  const [time, setTime] = useState<string>(preselectedTime);
  const [duration, setDuration] = useState<number>(60);
  const [appointmentType, setAppointmentType] = useState<AppointmentType>("consultation");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDate(preselectedDate);
      setTime(preselectedTime);
    }
  }, [open, preselectedDate, preselectedTime]);

  const handleSubmit = async () => {
    setError(null);

    if (!selectedPatientId || !date || !time) {
      setError("Selecione um paciente, data e horário para continuar");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedPatientId,
          appointment_date: format(date, "yyyy-MM-dd"),
          appointment_time: time,
          duration_minutes: duration,
          appointment_type: appointmentType,
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.validation_errors
            ? result.validation_errors.join(", ")
            : result.error || "Erro ao criar agendamento"
        );
        return;
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (err) {
      console.error("Error creating appointment:", err);
      setError("Erro ao criar agendamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPatientId("");
    setSelectedPatientName("");
    setDate(undefined);
    setTime("");
    setDuration(60);
    setAppointmentType("consultation");
    setNotes("");
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>
            Preencha os dados para agendar uma consulta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Paciente */}
          <div className="space-y-2">
            <Label>
              Paciente <span className="text-red-500">*</span>
            </Label>
            <PatientCombobox
              value={selectedPatientId}
              onValueChange={(id, name) => {
                setSelectedPatientId(id);
                setSelectedPatientName(name);
              }}
            />
          </div>

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

                    // Verificar se é fim de semana (0=domingo, 6=sábado)
                    const dayOfWeek = dateToCheck.getDay();
                    return dayOfWeek === 0 || dayOfWeek === 6;
                  }}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Horário */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horário <span className="text-red-500">*</span>
            </Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Selecione o horário" />
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

          {/* Duração e Tipo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duração</Label>
              <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1h 30min</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Consulta</Label>
              <Select
                value={appointmentType}
                onValueChange={(v: AppointmentType) => setAppointmentType(v)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(APPOINTMENT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            value === "consultation" && "bg-blue-50 text-blue-700 border-blue-200",
                            value === "return" && "bg-green-50 text-green-700 border-green-200",
                            value === "urgent" && "bg-orange-50 text-orange-700 border-orange-200"
                          )}
                        >
                          {label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Preview do tipo selecionado */}
              <div className={cn(
                "mt-2 p-3 rounded-lg border",
                appointmentType === "consultation" && "bg-blue-50/50 border-blue-200",
                appointmentType === "return" && "bg-green-50/50 border-green-200",
                appointmentType === "urgent" && "bg-orange-50/50 border-orange-200"
              )}>
                <Badge
                  variant="outline"
                  className={cn(
                    appointmentType === "consultation" && "bg-blue-100 text-blue-700 border-blue-300",
                    appointmentType === "return" && "bg-green-100 text-green-700 border-green-300",
                    appointmentType === "urgent" && "bg-orange-100 text-orange-700 border-orange-300"
                  )}
                >
                  {APPOINTMENT_TYPE_LABELS[appointmentType]}
                </Badge>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo da consulta, sintomas..."
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
              Agendar Consulta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
