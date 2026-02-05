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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AppointmentWithPatient,
  AppointmentType,
  APPOINTMENT_TYPE_LABELS,
} from "@/lib/types/appointment";

interface EditAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  appointment: AppointmentWithPatient;
}

// Gerar slots de 15 em 15 minutos de 8h às 18h (excluindo 18h)
const TIME_SLOTS = Array.from({ length: 40 }, (_, i) => {
  const totalMinutes = i * 15;
  const hour = 8 + Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  if (hour >= 18) return null;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}).filter(Boolean) as string[];

export function EditAppointmentModal({
  open,
  onOpenChange,
  onSuccess,
  appointment,
}: EditAppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date | undefined>(
    new Date(`${appointment.appointment_date}T00:00:00`)
  );
  const [time, setTime] = useState<string>(appointment.appointment_time);
  const [duration, setDuration] = useState<number>(appointment.duration_minutes);
  const [appointmentType, setAppointmentType] = useState<AppointmentType>(appointment.appointment_type);
  const [notes, setNotes] = useState(appointment.notes || "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDate(new Date(`${appointment.appointment_date}T00:00:00`));
      setTime(appointment.appointment_time);
      setDuration(appointment.duration_minutes);
      setAppointmentType(appointment.appointment_type);
      setNotes(appointment.notes || "");
      setError(null);
    }
  }, [open, appointment]);

  const handleSubmit = async () => {
    setError(null);

    if (!date || !time) {
      setError("Data e horário são obrigatórios");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_date: format(date, "yyyy-MM-dd"),
          appointment_time: time,
          duration_minutes: duration,
          appointment_type: appointmentType,
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Erro ao atualizar agendamento");
        return;
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("Error updating appointment:", err);
      setError("Erro ao atualizar agendamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Agendamento</DialogTitle>
          <DialogDescription>
            Atualize os dados do agendamento de {appointment.patient.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Paciente (somente leitura) */}
          <div className="space-y-2">
            <Label>Paciente</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="font-medium">{appointment.patient.full_name}</p>
              <p className="text-sm text-muted-foreground">{appointment.patient.phone}</p>
            </div>
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
            </div>
          </div>

          {/* Preview do tipo selecionado */}
          <div className={cn(
            "p-3 rounded-lg border",
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
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
