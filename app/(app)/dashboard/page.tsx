// COMPONENTS

import { HeroSection } from "@/components/dashboard/hero-section";
import { InsightsCard } from "@/components/dashboard/insights-card";
import { EfficiencyMetrics } from "@/components/dashboard/efficiency-metrics";

// LIB

import { startOfMonth, format, subDays, startOfWeek, addDays, endOfWeek } from "date-fns";
import { getActivePatients, getTodayAppointments, getCurrentUser } from "@/lib/queries";
import { getMonthlyAppointments } from "@/lib/queries/appointments/get-montly-appointments";
import { getAllAppointments } from "@/lib/queries/appointments/get-all-appoitments";
import { getAppointmentsByStatus } from "@/lib/queries/appointments/get-all-appoitments-by-status";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {

  const user = await getCurrentUser();
  if (!user) return null;


  // Agendamentos hoje
  const {
    todayAppointments,
    totalAppointments,
    nextAppointment,
    nextAppointmentTime } = await getTodayAppointments();

  // Total pacientes ativos
  const { totalActivePatients } = await getActivePatients(user);
  const { appointments: monthlyAppointments } = await getMonthlyAppointments();

  const { week, month, year } = await getAllAppointments();

  const { statusData, timeData } = await getAppointmentsByStatus();


  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <HeroSection
        consultationsToday={totalAppointments}
        nextAppointmentTime={monthlyAppointments[0]?.appointment_date}
        totalActivePatients={totalActivePatients || 0}
      />
      {/* Métricas de Eficiência */}

      {/* Grid Principal: Insights + Métricas */}
      <div className="grid gap-4 lg:grid-cols-3 min-h-[400px]">

        {/* Insights com gráficos e seletor de período */}
        <InsightsCard appointmentsGroupedData={{ week, month, year }} />

        {/* Métricas de eficiência com status e comparações */}
        <EfficiencyMetrics statusData={statusData} timeData={timeData} />

      </div>


      {/* Atividades Futuras */}
    </div>
  );
}
