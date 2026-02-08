"use client";

import { Calendar, Users, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

interface HeroSectionProps {
  consultationsToday: number;
  nextAppointmentTime: string | null | undefined;
  totalActivePatients: number;
}

export function HeroSection({
  consultationsToday,
  nextAppointmentTime,
  totalActivePatients,
}: HeroSectionProps) {
  return (
    <Card className="bg-primary/5 border-primary/20">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Sua Clínica Hoje
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visão geral do seu dia e progresso
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Consultas Hoje */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">
                {consultationsToday}
              </p>
              <p className="text-sm text-muted-foreground">
                {consultationsToday === 1 ? "Consulta hoje" : "Consultas hoje"}
              </p>
            </div>
          </div>

          {/* Próxima Consulta */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              {nextAppointmentTime ? (
                <>
                  <p className="text-3xl font-bold text-foreground">
                    {nextAppointmentTime}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Próxima consulta
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-muted-foreground">
                    -
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sem agendamentos
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Total Pacientes */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">
                {totalActivePatients}
              </p>
              <p className="text-sm text-muted-foreground">
                {totalActivePatients === 1 ? "Paciente ativo" : "Pacientes ativos"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
