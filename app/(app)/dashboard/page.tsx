import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ConsultationsChart } from "@/components/dashboard/consultations-chart";
import { AgeDistributionChart } from "@/components/dashboard/age-distribution-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { OverdueVaccines } from "@/components/dashboard/overdue-vaccines";
import { TodayAppointments } from "@/components/dashboard/today-appointments";
import { startOfMonth, format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Buscar perfil do usuário
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // Buscar contagem de pacientes
  const { count: patientsCount } = await supabase
    .from("patients")
    .select("*", { count: "exact", head: true })
    .eq("doctor_id", user.id)
    .eq("is_active", true);

  // Buscar contagem de consultas do mês atual
  const monthStart = startOfMonth(new Date()).toISOString();
  const { count: consultationsCount } = await supabase
    .from("consultations")
    .select("*", { count: "exact", head: true })
    .eq("doctor_id", user.id)
    .gte("consultation_date", monthStart);

  // Buscar pacientes com alergias
  const { count: allergiesCount } = await supabase
    .from("patients")
    .select("*", { count: "exact", head: true })
    .eq("doctor_id", user.id)
    .eq("is_active", true)
    .not("allergies", "is", null)
    .neq("allergies", "");

  // Calcular tempo economizado (estimativa: 15min por consulta)
  const timeSavedMinutes = (consultationsCount || 0) * 15;

  // Buscar consultas por mês (últimos 6 meses)
  const sixMonthsAgo = subMonths(new Date(), 5);
  const { data: monthlyData } = await supabase
    .from("consultations")
    .select("consultation_date")
    .eq("doctor_id", user.id)
    .gte("consultation_date", startOfMonth(sixMonthsAgo).toISOString())
    .order("consultation_date", { ascending: true });

  // Agrupar por mês
  const monthlyChartData = (() => {
    const months: Record<string, number> = {};
    
    // Inicializar os últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthLabel = format(monthDate, "MMM", { locale: ptBR });
      months[monthLabel] = 0;
    }

    // Contar consultas por mês
    monthlyData?.forEach((consultation) => {
      const consultationDate = new Date(consultation.consultation_date);
      const monthLabel = format(consultationDate, "MMM", { locale: ptBR });
      if (months[monthLabel] !== undefined) {
        months[monthLabel]++;
      }
    });

    return Object.entries(months).map(([month, total]) => ({ month, total }));
  })();

  // Buscar distribuição por faixa etária
  const { data: patientsData } = await supabase
    .from("patients")
    .select("date_of_birth")
    .eq("doctor_id", user.id)
    .eq("is_active", true);

  // Calcular faixas etárias
  const ageDistributionData = (() => {
    const faixas: Record<string, number> = {
      "0-1 ano": 0,
      "1-3 anos": 0,
      "4-6 anos": 0,
      "7+ anos": 0,
    };

    patientsData?.forEach((patient) => {
      const birthDate = new Date(patient.date_of_birth);
      const today = new Date();
      const ageInYears =
        (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

      if (ageInYears < 1) {
        faixas["0-1 ano"]++;
      } else if (ageInYears < 4) {
        faixas["1-3 anos"]++;
      } else if (ageInYears < 7) {
        faixas["4-6 anos"]++;
      } else {
        faixas["7+ anos"]++;
      }
    });

    return Object.entries(faixas)
      .filter(([, total]) => total > 0)
      .map(([faixa, total]) => ({ faixa, total }));
  })();

  // Buscar últimas 5 consultas
  const { data: recentConsultations } = await supabase
    .from("consultations")
    .select(
      `
      id,
      status,
      chief_complaint,
      created_at,
      patient:patients(full_name)
    `
    )
    .eq("doctor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Formatar dados para o componente
  const formattedConsultations = (recentConsultations || []).map((c: any) => ({
    id: c.id,
    status: c.status as "completed" | "processing" | "error",
    chief_complaint: c.chief_complaint,
    created_at: c.created_at,
    patient: {
      full_name: c.patient?.full_name || "Paciente",
    },
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Bem-vindo, Dr(a). {profile?.full_name?.split(" ")[0] || "Doutor"}!
          </h1>
          <p className="text-muted-foreground text-sm">
            Sua plataforma de documentação clínica está pronta.
          </p>
        </div>
        <Link href="/consultations/new-recording">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Consulta
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <StatsCards
        consultationsCount={consultationsCount || 0}
        patientsCount={patientsCount || 0}
        timeSavedMinutes={timeSavedMinutes}
        allergiesCount={allergiesCount || 0}
      />

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <ConsultationsChart data={monthlyChartData} />
        <AgeDistributionChart data={ageDistributionData} />
      </div>

      {/* Agendamentos de Hoje */}
      <TodayAppointments />

      {/* Recent Activity & Overdue Vaccines */}
      <div className="grid gap-4 md:grid-cols-2">
        <RecentActivity consultations={formattedConsultations} />
        <OverdueVaccines />
      </div>
    </div>
  );
}
