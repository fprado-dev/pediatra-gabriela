import { Skeleton } from "@/components/ui/skeleton";
import {
  WeekNavigationSkeleton,
  WeeklyCalendarGridSkeleton,
} from "@/components/appointments/weekly-calendar-skeleton";

export default function AppointmentsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Navegação Semanal Skeleton */}
      <WeekNavigationSkeleton />

      {/* Grid Semanal Skeleton */}
      <WeeklyCalendarGridSkeleton />
    </div>
  );
}
