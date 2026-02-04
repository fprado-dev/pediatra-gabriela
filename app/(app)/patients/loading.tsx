import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import { CardGridSkeleton } from "@/components/skeletons/list-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function PatientsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="px-6 max-w-7xl mx-auto space-y-6">
        <PageHeaderSkeleton />

        {/* Filters skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>

        {/* Results count */}
        <Skeleton className="h-4 w-32" />

        {/* Cards grid */}
        <CardGridSkeleton items={2} />
      </div>
    </div>
  );
}
