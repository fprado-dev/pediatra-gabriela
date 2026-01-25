import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ConsultationsChart } from "@/components/dashboard/consultations-chart";
import { AgeDistributionChart } from "@/components/dashboard/age-distribution-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { startOfMonth, format, subWeeks, startOfWeek } from "date-fns";
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
    .gte("created_at", monthStart);

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

  // Buscar consultas por semana (últimas 4 semanas)
  const fourWeeksAgo = subWeeks(new Date(), 4).toISOString();
  const { data: weeklyData } = await supabase
    .from("consultations")
    .select("created_at")
    .eq("doctor_id", user.id)
    .gte("created_at", fourWeeksAgo)
    .order("created_at", { ascending: true });

  // Agrupar por semana
  const weeklyChartData = (() => {
    const weeks: Record<string, number> = {};
    
    // Inicializar as 4 semanas
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 0 });
      const weekLabel = `Sem ${4 - i}`;
      weeks[weekLabel] = 0;
    }

    // Contar consultas por semana
    weeklyData?.forEach((consultation) => {
      const consultationDate = new Date(consultation.created_at);
      for (let i = 3; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 0 });
        const weekEnd = subWeeks(new Date(), i - 1);
        if (consultationDate >= weekStart && consultationDate < weekEnd) {
          const weekLabel = `Sem ${4 - i}`;
          weeks[weekLabel]++;
          break;
        }
      }
    });

    return Object.entries(weeks).map(([week, total]) => ({ week, total }));
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
        <ConsultationsChart data={weeklyChartData} />
        <AgeDistributionChart data={ageDistributionData} />
      </div>

      {/* Recent Activity */}
      <RecentActivity consultations={formattedConsultations} />
    </div>
  );
}
