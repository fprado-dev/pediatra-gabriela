"use client";

import Link from "next/link";
import { Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DayAppointments {
  date: string;
  count: number;
}

interface UpcomingActivitiesProps {
  weekAppointments: DayAppointments[];
}

export function UpcomingActivities({ weekAppointments }: UpcomingActivitiesProps) {
  const totalWeek = weekAppointments.reduce((acc, day) => acc + day.count, 0);
  const busiestDay = weekAppointments.reduce(
    (max, day) => (day.count > max.count ? day : max),
    weekAppointments[0] || { date: '', count: 0 }
  );

  // Garantir 7 dias (mesmo sem agendamentos)
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const fullWeek = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const existing = weekAppointments.find((d) => d.date === dateStr);
    return {
      date: dateStr,
      count: existing?.count || 0,
      dayName: format(date, 'EEE', { locale: ptBR }),
      isToday: isSameDay(date, today),
    };
  });

  if (totalWeek === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5 text-primary" />
            Próximos Dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Nenhum agendamento para esta semana
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5 text-primary" />
            Sua Semana
          </CardTitle>
          <Link href="/appointments">
            <Button variant="ghost" size="sm" className="text-xs h-8">
              Ver agenda
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo da Semana */}
        <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-primary/10">
          <div>
            <p className="text-sm text-muted-foreground">Total esta semana</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {totalWeek} {totalWeek === 1 ? 'consulta' : 'consultas'}
            </p>
          </div>
          {busiestDay && busiestDay.count > 0 && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-primary text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                <span>Dia mais movimentado</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(busiestDay.date), "EEEE", { locale: ptBR })}
              </p>
            </div>
          )}
        </div>


      </CardContent>
    </Card>
  );
}
