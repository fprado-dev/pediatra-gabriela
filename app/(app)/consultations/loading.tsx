import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import { CardGridSkeleton } from "@/components/skeletons/list-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ConsultationsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      {/* Filters skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[180px]" />
      </div>

      {/* List card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <CardGridSkeleton items={6} />
        </CardContent>
      </Card>
    </div>
  );
}
