"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function WeekNavigationSkeleton() {
  return (
    <div className="flex items-center justify-between py-3 px-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-8 w-16 rounded" />
    </div>
  );
}

export function WeeklyCalendarGridSkeleton() {
  // 40 slots de 40px cada = 1600px total
  const SLOT_HEIGHT = 40;
  const SLOTS_PER_HOUR = 4; // 15min cada
  const TOTAL_HOURS = 10; // 8h-18h
  const TOTAL_SLOTS = TOTAL_HOURS * SLOTS_PER_HOUR;

  return (
    <div className="flex border border-border rounded-lg overflow-hidden bg-card">
      {/* Coluna de horários */}
      <div className="flex-shrink-0 w-20 border-r border-border">
        <div className="h-16 border-b border-border" />
        <div className="border-b border-border relative" style={{ height: `${TOTAL_SLOTS * SLOT_HEIGHT}px` }}>
          {Array.from({ length: TOTAL_SLOTS }).map((_, i) => {
            const isHourMark = i % SLOTS_PER_HOUR === 0;
            const isLastSlot = i === TOTAL_SLOTS - 1;
            return (
              <div
                key={i}
                className={cn(
                  "relative flex items-start justify-end pr-2",
                  !isLastSlot && "border-b border-border"
                )}
                style={{ height: `${SLOT_HEIGHT}px` }}
              >
                {isHourMark && (
                  <Skeleton className="h-3 w-10 -translate-y-1" />
                )}
              </div>
            );
          })}
          {/* Marcador de 18:00 */}
          <div className="absolute bottom-0 right-0 pr-2 translate-y-2">
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
      </div>

      {/* Grid de dias */}
      <div className="flex-1 overflow-x-auto">
        <div className="grid grid-cols-5 min-w-[800px]">
          {/* Header dos dias */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 flex flex-col items-center justify-center border-r border-b border-border">
              <Skeleton className="h-3 w-8 mb-1" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          ))}

          {/* Grid skeleton */}
          {Array.from({ length: 5 }).map((_, dayIndex) => (
            <div
              key={dayIndex}
              className="relative border-r border-b"
            >
              {/* Slots */}
              <div className="relative" style={{ height: `${TOTAL_SLOTS * SLOT_HEIGHT}px` }}>
                {Array.from({ length: TOTAL_SLOTS }).map((_, slotIndex) => {
                  const isLastSlot = slotIndex === TOTAL_SLOTS - 1;
                  return (
                    <div
                      key={slotIndex}
                      className={cn(
                        !isLastSlot && "border-b border-border"
                      )}
                      style={{ height: `${SLOT_HEIGHT}px` }}
                    />
                  );
                })}

                {/* Alguns blocos de agendamento fake */}
                {dayIndex % 2 === 0 && (
                  <div className="absolute inset-x-0 px-1" style={{ top: `${4 * SLOT_HEIGHT}px` }}>
                    <Skeleton className="h-[80px] w-full rounded-md" />
                  </div>
                )}
                {dayIndex === 2 && (
                  <div className="absolute inset-x-0 px-1" style={{ top: `${16 * SLOT_HEIGHT}px` }}>
                    <Skeleton className="h-[120px] w-full rounded-md" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
