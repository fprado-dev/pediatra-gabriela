"use client";

import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, User, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppointmentWithPatient, APPOINTMENT_STATUS_LABELS } from "@/lib/types/appointment";
import { calculateAge } from "@/lib/utils/date-helpers";
import { cn } from "@/lib/utils";

interface MobileWeekListProps {
  weekStart: Date;
  appointments: AppointmentWithPatient[];
  onAppointmentClick: (appointment: AppointmentWithPatient) => void;
  onAddClick: (date: Date) => void;
}

const STATUS_COLORS = {
  pending: "bg-yellow-50 border-yellow-300 text-yellow-900",
  confirmed: "bg-green-50 border-green-300 text-green-900",
  in_progress: "bg-purple-50 border-purple-300 text-purple-900",
  completed: "bg-blue-50 border-blue-300 text-blue-900",
  cancelled: "bg-gray-50 border-gray-300 text-gray-600",
};

export function MobileWeekList({
  weekStart,
  appointments,
  onAppointmentClick,
  onAddClick,
}: MobileWeekListProps) {
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  // Agrupar agendamentos por dia
  const appointmentsByDay = weekDays.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayAppointments = appointments
      .filter((apt) => apt.appointment_date === dayStr && apt.status !== "cancelled")
      .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));

    return {
      date: day,
      dateStr: dayStr,
      appointments: dayAppointments,
      isToday: dayStr === todayStr,
    };
  });

  return (
    <div className="space-y-4">
      {appointmentsByDay.map(({ date, dateStr, appointments: dayAppointments, isToday }) => (
        <Card key={dateStr} className={cn(isToday && "border-primary/30 bg-primary/5")}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className={cn("h-5 w-5", isToday ? "text-primary" : "text-muted-foreground")} />
                <div>
                  <span className={cn("font-bold", isToday && "text-primary")}>
                    {format(date, "EEEE", { locale: ptBR })}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {format(date, "d 'de' MMMM", { locale: ptBR })}
                  </span>
                </div>
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddClick(date)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dayAppointments.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  Nenhum agendamento
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {dayAppointments.map((appointment) => (
                  <button
                    key={appointment.id}
                    onClick={() => onAppointmentClick(appointment)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-colors",
                      STATUS_COLORS[appointment.status]
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-white/50 flex-shrink-0">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {appointment.patient.full_name}
                          </p>
                          <div className="flex items-center gap-2 text-xs opacity-75 mt-1">
                            <Clock className="h-3 w-3" />
                            <span>{appointment.appointment_time}</span>
                            <span>•</span>
                            <span>{calculateAge(appointment.patient.date_of_birth)}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {APPOINTMENT_STATUS_LABELS[appointment.status]}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
