import {
  HeroSkeleton,
  InsightsCardSkeleton,
  EfficiencyMetricsSkeleton,
} from "@/components/dashboard/dashboard-loading";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <HeroSkeleton />

      {/* Grid Principal: Insights + Métricas */}
      <div className="grid gap-4 lg:grid-cols-3 min-h-[400px]">
        {/* Insights com gráficos e seletor de período */}
        <InsightsCardSkeleton />

        {/* Métricas de eficiência com status e comparações */}
        <EfficiencyMetricsSkeleton />
      </div>
    </div>
  );
}
