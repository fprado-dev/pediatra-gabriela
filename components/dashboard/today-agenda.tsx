"use client";

import Link from "next/link";
import { Calendar, Clock, User, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { calculateAge } from "@/lib/utils/date-helpers";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/types/appointment";

interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  appointment_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  patient: Patient;
}

interface TodayAgendaProps {
  appointments: Appointment[];
}

export function TodayAgenda({ appointments }: TodayAgendaProps) {
  const activeAppointments = appointments.filter(
    (a) => a.status !== "cancelled"
  );
  const nextAppointment = activeAppointments[0];

  if (activeAppointments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5 text-primary" />
            Sua Agenda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="font-medium text-foreground mb-2">
              Agenda tranquila hoje
            </h3>
            <p className="text-sm text-muted-foreground">
              Aproveite para atualizar prontuários ou revisar casos pendentes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-5 w-5 text-primary" />
          Sua Agenda
        </CardTitle>
        <Link href="/appointments">
          <Button variant="ghost" size="sm" className="text-xs h-8">
            Ver completa
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Próximo Paciente em Destaque */}
        {nextAppointment && (
          <div className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-2 text-sm font-medium text-primary mb-3">
              <Clock className="h-4 w-4" />
              <span>Próximo Paciente</span>
            </div>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">
                  {nextAppointment.patient.full_name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span className="font-medium">{nextAppointment.appointment_time}</span>
                  <span>•</span>
                  <span>{calculateAge(nextAppointment.patient.date_of_birth)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant={
                    nextAppointment.status === "confirmed"
                      ? "default"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {APPOINTMENT_STATUS_LABELS[nextAppointment.status]}
                </Badge>
                <Link href={`/patients/${nextAppointment.patient_id}`}>
                  <Button size="sm" variant="outline" className="h-8">
                    Ver perfil
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Demais Agendamentos */}
        {activeAppointments.length > 1 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground px-1">
              Demais agendamentos
            </h4>
            {activeAppointments.slice(1, 5).map((appointment) => (
              <Link
                key={appointment.id}
                href={`/patients/${appointment.patient_id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{appointment.patient.full_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{appointment.appointment_time}</span>
                      <span>•</span>
                      <span>{calculateAge(appointment.patient.date_of_birth)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {appointment.status === "confirmed" && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  {appointment.status === "pending" && (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
              </Link>
            ))}

            {activeAppointments.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                + {activeAppointments.length - 5} outros agendamentos
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
