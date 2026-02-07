import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "../auth/get-current-user";
import {
  format,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isSameDay,
  isSameWeek,
  isSameMonth,
  parseISO
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChartData {
  name: string;
  value: number;
}

interface PeriodData {
  total: number;
  previous: number;
  chartData: ChartData[];
}

export interface AppointmentsGroupedData {
  week: PeriodData;
  month: PeriodData;
  year: PeriodData;
}

export async function getAllAppointments(): Promise<AppointmentsGroupedData> {
  const user = await getCurrentUser();
  const supabase = await createClient();
  if (!user) {
    throw new Error("User not found");
  }

  const now = new Date();

  // Buscar consultas do último ano (para ter dados suficientes)
  const oneYearAgo = subYears(now, 1);

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("appointment_date, status")
    .eq("doctor_id", user.id)
    .gte("appointment_date", format(oneYearAgo, "yyyy-MM-dd"))
    .neq("status", "cancelled");

  if (error) {
    console.error("Error fetching all appointments:", error);
    throw error;
  }

  const appointmentDates = (appointments || []).map(apt => parseISO(apt.appointment_date));

  // === SEMANAL (últimos 7 dias) ===
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Segunda-feira
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const previousWeekStart = subWeeks(weekStart, 1);
  const previousWeekEnd = subWeeks(weekEnd, 1);

  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weekChartData: ChartData[] = weekDays.map(day => ({
    name: format(day, "EEE", { locale: ptBR }).substring(0, 3), // Seg, Ter, Qua
    value: appointmentDates.filter(date => isSameDay(date, day)).length
  }));

  const weekTotal = weekChartData.reduce((sum, day) => sum + day.value, 0);
  const previousWeekTotal = appointmentDates.filter(date =>
    date >= previousWeekStart && date <= previousWeekEnd
  ).length;

  // === MENSAL (semanas do mês atual) ===
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const previousMonthStart = startOfMonth(subMonths(now, 1));
  const previousMonthEnd = endOfMonth(subMonths(now, 1));

  const monthWeeks = eachWeekOfInterval(
    { start: monthStart, end: monthEnd },
    { weekStartsOn: 1 }
  );

  const monthChartData: ChartData[] = monthWeeks.map((weekStartDate, index) => {
    const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
    const count = appointmentDates.filter(date =>
      date >= weekStartDate && date <= weekEndDate &&
      date >= monthStart && date <= monthEnd
    ).length;

    return {
      name: `Sem ${index + 1}`,
      value: count
    };
  });

  const monthTotal = appointmentDates.filter(date =>
    date >= monthStart && date <= monthEnd
  ).length;

  const previousMonthTotal = appointmentDates.filter(date =>
    date >= previousMonthStart && date <= previousMonthEnd
  ).length;

  // === ANUAL (meses do ano atual) ===
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);
  const previousYearStart = startOfYear(subYears(now, 1));
  const previousYearEnd = endOfYear(subYears(now, 1));

  const yearMonths = eachMonthOfInterval({ start: yearStart, end: yearEnd });
  const yearChartData: ChartData[] = yearMonths.map(month => ({
    name: format(month, "MMM", { locale: ptBR }), // Jan, Fev, Mar
    value: appointmentDates.filter(date => isSameMonth(date, month)).length
  }));

  const yearTotal = appointmentDates.filter(date =>
    date >= yearStart && date <= yearEnd
  ).length;

  const previousYearTotal = appointmentDates.filter(date =>
    date >= previousYearStart && date <= previousYearEnd
  ).length;

  return {
    week: {
      total: weekTotal,
      previous: previousWeekTotal,
      chartData: weekChartData
    },
    month: {
      total: monthTotal,
      previous: previousMonthTotal,
      chartData: monthChartData
    },
    year: {
      total: yearTotal,
      previous: previousYearTotal,
      chartData: yearChartData
    }
  };
}


