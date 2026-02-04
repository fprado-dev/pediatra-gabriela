import { ConsultationListSkeleton } from "@/components/consultations/consultation-skeleton";
import { Separator } from "@/components/ui/separator";

export default function ConsultationsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="px-6 max-w-7xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-9 w-72 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-96 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-9 w-36 bg-gray-200 rounded animate-pulse" />
        </div>

        <Separator className="my-4" />

        {/* Search Skeleton */}
        <div className="h-11 max-w-md bg-gray-200 rounded animate-pulse" />

        {/* Cards Skeleton */}
        <ConsultationListSkeleton count={2} />
      </div>
    </div>
  );
}
