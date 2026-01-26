"use client";

import { useState, useEffect } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Phone, MoreVertical, Check, X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  AppointmentWithPatient,
  AppointmentStatus,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
} from "@/lib/types/appointment";
import { calculateAge } from "@/lib/utils/date-helpers";

interface AppointmentCalendarProps {
  onRefresh?: () => void;
}

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-green-100 text-green-800 border-green-300",
  completed: "bg-blue-100 text-blue-800 border-blue-300",
  cancelled: "bg-gray-100 text-gray-600 border-gray-300",
};

export function AppointmentCalendar({ onRefresh }: AppointmentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      console.log("Fetching appointments for date:", dateStr);
      const response = await fetch(`/api/appointments?date=${dateStr}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", response.status, errorData);
        setAppointments([]);
        return;
      }
      
      const data = await response.json();
      console.log("Appointments received:", data);
      
      // Garantir que data é um array
      if (Array.isArray(data)) {
        setAppointments(data);
      } else {
        console.error("Expected array, got:", typeof data, data);
        setAppointments([]);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchAppointments();
        onRefresh?.();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleCancel = async () => {
    if (!cancellingId) return;

    try {
      const response = await fetch(`/api/appointments/${cancellingId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancellation_reason: "Cancelado pelo médico" }),
      });

      if (response.ok) {
        fetchAppointments();
        onRefresh?.();
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
    } finally {
      setCancellingId(null);
    }
  };

  const timeSlots = Array.from({ length: 21 }, (_, i) => {
    const hour = 8 + Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${minute}`;
  });

  const getAppointmentForSlot = (time: string) => {
    return appointments.find((apt) => apt.appointment_time === time && apt.status !== "cancelled");
  };

  return (
    <div className="space-y-4">
      {/* Navegação de Data */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <h2 className="text-2xl font-bold">
              {format(selectedDate, "EEEE", { locale: ptBR })}
            </h2>
            <p className="text-muted-foreground">
              {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2 justify-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(new Date())}
          >
            Hoje
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(addDays(new Date(), 1))}
          >
            Amanhã
          </Button>
        </div>
      </Card>

      {/* Lista de Horários */}
      <Card className="p-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando...
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhum agendamento para este dia</p>
            <p className="text-sm text-muted-foreground mt-1">
              Use os botões de navegação para ver outros dias
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {timeSlots.map((time) => {
              const appointment = getAppointmentForSlot(time);
              const isLunchTime = time >= "12:00" && time < "14:00";

              if (isLunchTime && !appointment) {
                return null;
              }

              return (
                <div
                  key={time}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-lg border transition-colors",
                    appointment
                      ? STATUS_COLORS[appointment.status]
                      : "bg-muted/30 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{time}</span>
                  </div>

                  {appointment ? (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/patients/${appointment.patient_id}`}
                            className="font-medium hover:underline"
                          >
                            {appointment.patient.full_name}
                          </Link>
                          <Badge variant="outline" className="text-xs">
                            {calculateAge(appointment.patient.date_of_birth)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {appointment.patient.phone}
                          </span>
                          <span>•</span>
                          <span>{APPOINTMENT_TYPE_LABELS[appointment.appointment_type]}</span>
                          {appointment.notes && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[200px]">{appointment.notes}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {APPOINTMENT_STATUS_LABELS[appointment.status]}
                        </Badge>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {appointment.status === "pending" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(appointment.id, "confirmed")}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Confirmar
                              </DropdownMenuItem>
                            )}
                            {appointment.status === "confirmed" && (
                              <DropdownMenuItem asChild>
                                <Link href={`/consultations/new-recording?patient_id=${appointment.patient_id}&appointment_id=${appointment.id}`}>
                                  <Play className="h-4 w-4 mr-2" />
                                  Iniciar Consulta
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {appointment.status !== "cancelled" && appointment.status !== "completed" && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setCancellingId(appointment.id)}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-sm">Horário livre</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Dialog de Confirmação de Cancelamento */}
      <AlertDialog open={!!cancellingId} onOpenChange={() => setCancellingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancelar Agendamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
