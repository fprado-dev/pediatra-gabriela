import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import { StatsCardsSkeleton } from "@/components/skeletons/stats-cards-skeleton";
import { ChartSkeleton, DonutChartSkeleton } from "@/components/skeletons/chart-skeleton";
import { ListSkeleton } from "@/components/skeletons/list-skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatsCardsSkeleton />
      <div className="grid gap-4 md:grid-cols-2">
        <ChartSkeleton />
        <DonutChartSkeleton />
      </div>
      <ListSkeleton items={5} />
    </div>
  );
}
