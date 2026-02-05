import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/dashboard/hero-section";
import { TodayAgenda } from "@/components/dashboard/today-agenda";
import { InsightsCard } from "@/components/dashboard/insights-card";
import { EfficiencyMetrics } from "@/components/dashboard/efficiency-metrics";
import { UpcomingActivities } from "@/components/dashboard/upcoming-activities";
import { startOfMonth, format, subDays, startOfWeek, addDays, endOfWeek } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const monthStart = startOfMonth(today).toISOString();
  const previousMonthStart = startOfMonth(subDays(monthStart, 1)).toISOString();
  const previousMonthEnd = subDays(monthStart, 1).toISOString();

  // === HERO SECTION DATA ===

  // Agendamentos hoje
  const { data: todayAppointments } = await supabase
    .from("appointments")
    .select(`
      id,
      appointment_time,
      status,
      patient_id,
      patient:patients(id, full_name, date_of_birth)
    `)
    .eq("doctor_id", user.id)
    .eq("appointment_date", todayStr)
    .neq("status", "cancelled")
    .order("appointment_time", { ascending: true });

  const consultationsToday = todayAppointments?.length || 0;
  const nextAppointment = todayAppointments?.[0];
  const nextAppointmentTime = nextAppointment?.appointment_time || null;

  // Total pacientes ativos
  const { count: totalActivePatients } = await supabase
    .from("patients")
    .select("*", { count: "exact", head: true })
    .eq("doctor_id", user.id)
    .eq("is_active", true);

  // === TODAY AGENDA DATA ===
  const formattedTodayAppointments = (todayAppointments || []).map((a: any) => ({
    id: a.id,
    patient_id: a.patient_id,
    appointment_time: a.appointment_time,
    status: a.status,
    patient: a.patient,
  }));

  // === INSIGHTS CARD DATA ===

  // Consultas mês atual
  const { count: currentMonthTotal } = await supabase
    .from("consultations")
    .select("*", { count: "exact", head: true })
    .eq("doctor_id", user.id)
    .gte("consultation_date", monthStart);

  // Consultas mês anterior
  const { count: previousMonthTotal } = await supabase
    .from("consultations")
    .select("*", { count: "exact", head: true })
    .eq("doctor_id", user.id)
    .gte("consultation_date", previousMonthStart)
    .lte("consultation_date", previousMonthEnd);

  // Dados diários (últimos 30 dias para o gráfico)
  const thirtyDaysAgo = subDays(today, 30).toISOString();
  const { data: dailyConsultations } = await supabase
    .from("consultations")
    .select("consultation_date")
    .eq("doctor_id", user.id)
    .gte("consultation_date", thirtyDaysAgo)
    .order("consultation_date", { ascending: true });

  // Agrupar por dia
  const dailyData = (() => {
    const days: Record<string, number> = {};

    for (let i = 30; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      days[dateStr] = 0;
    }

    dailyConsultations?.forEach((c) => {
      const dateStr = format(new Date(c.consultation_date), "yyyy-MM-dd");
      if (days[dateStr] !== undefined) {
        days[dateStr]++;
      }
    });

    return Object.entries(days).map(([date, count]) => ({ date, count }));
  })();

  // === EFFICIENCY METRICS DATA ===

  const timeSavedMinutes = (currentMonthTotal || 0) * 15;

  // Taxa de retorno (pacientes com 2+ consultas)
  const { data: patientConsultations } = await supabase
    .from("consultations")
    .select("patient_id")
    .eq("doctor_id", user.id);

  const patientCounts = patientConsultations?.reduce((acc: Record<string, number>, c) => {
    acc[c.patient_id] = (acc[c.patient_id] || 0) + 1;
    return acc;
  }, {});

  const returningPatients = Object.values(patientCounts || {}).filter((count) => count >= 2).length;
  const uniquePatients = Object.keys(patientCounts || {}).length;
  const returnRate = uniquePatients > 0 ? Math.round((returningPatients / uniquePatients) * 100) : 0;

  // Distribuição etária
  const { data: patientsData } = await supabase
    .from("patients")
    .select("date_of_birth")
    .eq("doctor_id", user.id)
    .eq("is_active", true);

  const ageDistribution = (() => {
    const faixas: Record<string, number> = {
      "0-1 ano": 0,
      "1-3 anos": 0,
      "4-6 anos": 0,
      "7+ anos": 0,
    };

    patientsData?.forEach((patient) => {
      const birthDate = new Date(patient.date_of_birth);
      const ageInYears = (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

      if (ageInYears < 1) faixas["0-1 ano"]++;
      else if (ageInYears < 4) faixas["1-3 anos"]++;
      else if (ageInYears < 7) faixas["4-6 anos"]++;
      else faixas["7+ anos"]++;
    });

    return Object.entries(faixas)
      .filter(([, total]) => total > 0)
      .map(([faixa, total]) => ({ faixa, total }));
  })();

  // === UPCOMING ACTIVITIES DATA ===

  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });

  const { data: weekAppointments } = await supabase
    .from("appointments")
    .select("appointment_date")
    .eq("doctor_id", user.id)
    .gte("appointment_date", format(weekStart, "yyyy-MM-dd"))
    .lte("appointment_date", format(weekEnd, "yyyy-MM-dd"))
    .neq("status", "cancelled");

  const weekData = (() => {
    const days: Record<string, number> = {};

    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const dateStr = format(date, "yyyy-MM-dd");
      days[dateStr] = 0;
    }

    weekAppointments?.forEach((a) => {
      const dateStr = a.appointment_date;
      if (days[dateStr] !== undefined) {
        days[dateStr]++;
      }
    });

    return Object.entries(days).map(([date, count]) => ({ date, count }));
  })();

  return (
    <div className="space-y-6">

      <div className="py-8 max-w-7xl mx-auto space-y-6">
        {/* Hero Section */}
        <HeroSection
          consultationsToday={consultationsToday}
          nextAppointmentTime={nextAppointmentTime}
          totalActivePatients={totalActivePatients || 0}
        />

        {/* Grid Principal: Agenda + Insights */}
        <div className="grid gap-6 lg:grid-cols-2">
          <TodayAgenda appointments={formattedTodayAppointments} />
          <InsightsCard
            currentMonthTotal={currentMonthTotal || 0}
            previousMonthTotal={previousMonthTotal || 0}
            dailyData={dailyData}
          />
        </div>

        {/* Atividades Futuras */}
        <UpcomingActivities weekAppointments={weekData} />

        {/* Métricas de Eficiência */}
        <EfficiencyMetrics
          consultationsThisMonth={currentMonthTotal || 0}
          timeSavedMinutes={timeSavedMinutes}
          returnRate={returnRate}
          ageDistribution={ageDistribution}
        />
      </div>
    </div>
  );
}
