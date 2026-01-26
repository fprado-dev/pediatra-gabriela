import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format } from "date-fns";
import type { TimerStats } from "@/lib/types/timer";

export const dynamic = 'force-dynamic';

// GET /api/timers/stats
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const now = new Date();
    
    // Buscar timers finalizados
    const { data: timers, error } = await supabase
      .from("consultation_timers")
      .select("started_at, total_duration_seconds, active_duration_seconds")
      .eq("doctor_id", user.id)
      .eq("status", "completed")
      .order("started_at", { ascending: false });

    if (error) throw error;

    const allTimers = timers || [];

    // Filtrar por períodos
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Segunda-feira
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const todayTimers = allTimers.filter((t) => {
      const date = new Date(t.started_at);
      return date >= todayStart && date <= todayEnd;
    });

    const weekTimers = allTimers.filter((t) => {
      const date = new Date(t.started_at);
      return date >= weekStart && date <= weekEnd;
    });

    const monthTimers = allTimers.filter((t) => {
      const date = new Date(t.started_at);
      return date >= monthStart && date <= monthEnd;
    });

    // Calcular estatísticas
    const stats: TimerStats = {
      today: calculatePeriodStats(todayTimers),
      week: calculatePeriodStats(weekTimers),
      month: calculatePeriodStats(monthTimers),
      daily_breakdown: calculateDailyBreakdown(weekTimers, weekStart, weekEnd),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching timer stats:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 }
    );
  }
}

function calculatePeriodStats(timers: any[]) {
  const totalSeconds = timers.reduce((sum, t) => sum + (t.total_duration_seconds || 0), 0);
  const activeSeconds = timers.reduce((sum, t) => sum + (t.active_duration_seconds || 0), 0);
  const count = timers.length;

  return {
    total_seconds: totalSeconds,
    active_seconds: activeSeconds,
    consultations_count: count,
    average_seconds: count > 0 ? Math.floor(activeSeconds / count) : 0,
  };
}

function calculateDailyBreakdown(timers: any[], start: Date, end: Date) {
  const days: { date: string; total_seconds: number; consultations_count: number }[] = [];
  
  let currentDate = new Date(start);
  while (currentDate <= end) {
    const dayStart = startOfDay(currentDate);
    const dayEnd = endOfDay(currentDate);
    
    const dayTimers = timers.filter((t) => {
      const date = new Date(t.started_at);
      return date >= dayStart && date <= dayEnd;
    });

    days.push({
      date: format(currentDate, 'yyyy-MM-dd'),
      total_seconds: dayTimers.reduce((sum, t) => sum + (t.active_duration_seconds || 0), 0),
      consultations_count: dayTimers.length,
    });

    currentDate = subDays(currentDate, -1); // Próximo dia
  }

  return days;
}
