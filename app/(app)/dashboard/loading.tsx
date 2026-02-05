import {
  HeroSkeleton,
  TodayAgendaSkeleton,
  InsightsCardSkeleton,
  EfficiencyMetricsSkeleton,
  UpcomingActivitiesSkeleton,
} from "@/components/dashboard/dashboard-loading";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <HeroSkeleton />

      {/* Grid Principal */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TodayAgendaSkeleton />
        <InsightsCardSkeleton />
      </div>

      {/* Atividades Futuras */}
      <UpcomingActivitiesSkeleton />

      {/* Métricas de Eficiência */}
      <EfficiencyMetricsSkeleton />
    </div>
  );
}
