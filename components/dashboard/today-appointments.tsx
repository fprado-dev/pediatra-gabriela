"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, User, ArrowRight, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentWithPatient, APPOINTMENT_STATUS_LABELS } from "@/lib/types/appointment";
import { calculateAge } from "@/lib/utils/date-helpers";

interface TodayAppointmentsStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

interface TodayAppointmentsData {
  appointments: AppointmentWithPatient[];
  stats: TodayAppointmentsStats;
  next: AppointmentWithPatient | null;
}

export function TodayAppointments() {
  const [data, setData] = useState<TodayAppointmentsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/appointments/today");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching today's appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agendamentos de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const activeAppointments = data.appointments.filter((a) => a.status !== "cancelled");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Agendamentos de Hoje
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatísticas */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{data.stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-3 bg-yellow-100 dark:bg-yellow-950 rounded-lg">
            <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
              {data.stats.pending}
            </div>
            <div className="text-xs text-yellow-700 dark:text-yellow-300">Pendentes</div>
          </div>
          <div className="text-center p-3 bg-green-100 dark:bg-green-950 rounded-lg">
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">
              {data.stats.confirmed}
            </div>
            <div className="text-xs text-green-700 dark:text-green-300">Confirmados</div>
          </div>
          <div className="text-center p-3 bg-blue-100 dark:bg-blue-950 rounded-lg">
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
              {data.stats.completed}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300">Finalizados</div>
          </div>
        </div>

        {/* Próximo Agendamento */}
        {data.next && (
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Clock className="h-4 w-4" />
              <span>Próximo Agendamento</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{data.next.patient.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {data.next.appointment_time} • {calculateAge(data.next.patient.date_of_birth)}
                </p>
              </div>
              <Badge variant="secondary">
                {APPOINTMENT_STATUS_LABELS[data.next.status]}
              </Badge>
            </div>
          </div>
        )}

        {/* Lista de Agendamentos */}
        {activeAppointments.length > 0 ? (
          <div className="space-y-2">
            {activeAppointments.slice(0, 5).map((appointment) => (
              <Link
                key={appointment.id}
                href={`/patients/${appointment.patient_id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{appointment.patient.full_name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{appointment.appointment_time}</span>
                      <span>•</span>
                      <span>{calculateAge(appointment.patient.date_of_birth)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {appointment.status === "pending" && (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  {appointment.status === "confirmed" && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  {appointment.status === "completed" && (
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhum agendamento para hoje</p>
          </div>
        )}

        {/* Ver Agenda Completa */}
        <Button variant="outline" className="w-full" asChild>
          <Link href="/appointments">
            Ver Agenda Completa
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
