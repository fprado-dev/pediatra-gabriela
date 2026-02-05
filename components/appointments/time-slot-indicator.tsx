"use client";

import { cn } from "@/lib/utils";

interface TimeSlotIndicatorProps {
  startHour?: number;
  endHour?: number;
  slotMinutes?: number;
}

export function TimeSlotIndicator({
  startHour = 8,
  endHour = 18,
  slotMinutes = 15,
}: TimeSlotIndicatorProps) {
  const slots: string[] = [];

  // Gerar slots de 8h às 18h (exclusive)
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotMinutes) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      slots.push(timeString);
    }
  }

  return (
    <div className="flex flex-col border-r border-border">
      {/* Espaço para header dos dias */}
      <div className="h-16 border-b border-border" />

      {/* Container de horários */}
      <div className="border-b border-border" style={{ height: `${slots.length * 40}px` }}>
        {slots.map((time, index) => {
          const isHourMark = time.endsWith(":00");
          const isLastSlot = index === slots.length - 1;

          return (
            <div
              key={time}
              className={cn(
                "relative flex items-start justify-end pr-2",
                !isLastSlot && "border-b border-border"
              )}
              style={{ height: "40px" }}
            >
              {isHourMark && (
                <span className="text-xs text-muted-foreground font-medium -translate-y-2">
                  {time}
                </span>
              )}
            </div>
          );
        })}

        {/* Marcador de 18:00 (posicionado na borda inferior) */}
        <div className="absolute bottom-0 right-0 pr-2 translate-y-2">
          <span className="text-xs text-muted-foreground font-medium">
            {endHour.toString().padStart(2, "0")}:00
          </span>
        </div>
      </div>
    </div>
  );
}
