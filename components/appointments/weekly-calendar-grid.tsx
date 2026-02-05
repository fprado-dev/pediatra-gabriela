"use client";

import { useState, useEffect } from "react";
import { format, addDays, isSameDay, isPast, isBefore, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Lock } from "lucide-react";
import { AppointmentWithPatient, ScheduleBlock } from "@/lib/types/appointment";
import { AppointmentBlock } from "./appointment-block";
import { TimeSlotIndicator } from "./time-slot-indicator";
import { cn } from "@/lib/utils";

interface WeeklyCalendarGridProps {
  weekStart: Date;
  appointments: AppointmentWithPatient[];
  blocks?: ScheduleBlock[];
  onSlotClick: (date: Date, time: string) => void;
  onAppointmentClick: (appointment: AppointmentWithPatient) => void;
  onBlockClick?: (block: ScheduleBlock) => void;
}

const SLOT_HEIGHT = 40; // pixels (15min)
const START_HOUR = 8;
const END_HOUR = 18;

function timeToGridRow(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = (hours - START_HOUR) * 60 + minutes;
  return totalMinutes / 15;
}

function durationToGridRows(minutes: number): number {
  return minutes / 15;
}

export function WeeklyCalendarGrid({
  weekStart,
  appointments,
  blocks = [],
  onSlotClick,
  onAppointmentClick,
  onBlockClick,
}: WeeklyCalendarGridProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualizar hora atual a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1 minuto

    return () => clearInterval(interval);
  }, []);

  // Gerar array de dias da semana (Seg-Sex)
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  // Agrupar bloqueios por dia
  const blocksByDay = weekDays.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    return blocks.filter((block) => {
      const blockDate = format(new Date(block.start_datetime), "yyyy-MM-dd");
      return blockDate === dayStr;
    });
  });

  // Gerar slots de 15 em 15 minutos (8h-18h = 40 slots)
  const totalSlots = ((END_HOUR - START_HOUR) * 60) / 15;
  const slots = Array.from({ length: totalSlots }, (_, i) => {
    const totalMinutes = i * 15;
    const hour = START_HOUR + Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  });

  // Calcular altura total do grid (incluindo última linha visual)
  const gridHeight = totalSlots * SLOT_HEIGHT;

  // Agrupar agendamentos por dia
  const appointmentsByDay = weekDays.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    return appointments.filter((apt) => apt.appointment_date === dayStr);
  });

  const handleSlotClick = (dayIndex: number, slotTime: string) => {
    const date = weekDays[dayIndex];
    const slotDateTime = parse(`${format(date, "yyyy-MM-dd")} ${slotTime}`, "yyyy-MM-dd HH:mm", new Date());

    // Não permitir criar agendamento no passado
    if (isBefore(slotDateTime, currentTime)) {
      return;
    }

    onSlotClick(date, slotTime);
  };

  // Calcular posição da linha da hora atual
  const getCurrentTimePosition = (): number | null => {
    const now = currentTime;
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Verificar se está dentro do horário de trabalho
    if (hours < START_HOUR || hours >= END_HOUR) {
      return null;
    }

    const totalMinutes = (hours - START_HOUR) * 60 + minutes;
    return (totalMinutes / 15) * SLOT_HEIGHT;
  };

  const currentTimePosition = getCurrentTimePosition();

  return (
    <div className="flex border border-border rounded-lg overflow-hidden bg-card">
      {/* Coluna de horários */}
      <div className="flex-shrink-0 w-20">
        <TimeSlotIndicator startHour={START_HOUR} endHour={END_HOUR} slotMinutes={15} />
      </div>

      {/* Grid de dias */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="grid grid-cols-5 min-w-[800px]">
          {/* Header dos dias */}
          {weekDays.map((day, dayIndex) => {
            const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

            return (
              <div
                key={dayIndex}
                className={cn(
                  "h-16 flex flex-col items-center justify-center border-r border-b border-border",
                  isToday && "bg-primary/5"
                )}
              >
                <span className="text-sm font-medium text-muted-foreground uppercase">
                  {format(day, "EEE", { locale: ptBR })}
                </span>
                <span className={cn(
                  "text-2xl font-bold",
                  isToday && "text-primary"
                )}>
                  {format(day, "d")}
                </span>
              </div>
            );
          })}

          {/* Grid de slots */}
          {weekDays.map((day, dayIndex) => {
            const isToday = isSameDay(day, today);
            const isPastDay = isPast(day) && !isSameDay(day, today);

            return (
              <div
                key={dayIndex}
                className="relative border-r border-b"
              >
                {/* Container de slots com altura fixa e posicionamento relativo */}
                <div className="relative" style={{ height: `${gridHeight}px` }}>
                  {/* Linhas de slots */}
                  {slots.map((slotTime, slotIndex) => {
                    const slotDateTime = parse(`${format(day, "yyyy-MM-dd")} ${slotTime}`, "yyyy-MM-dd HH:mm", new Date());
                    const isPastSlot = isBefore(slotDateTime, currentTime);
                    const isLastSlot = slotIndex === slots.length - 1;

                    return (
                      <button
                        key={slotTime}
                        onClick={() => handleSlotClick(dayIndex, slotTime)}
                        disabled={isPastSlot}
                        className={cn(
                          "w-full transition-colors",
                          !isLastSlot && "border-b border-border",
                          isPastSlot
                            ? "bg-muted/30 cursor-not-allowed opacity-40"
                            : "hover:bg-primary/5 cursor-pointer"
                        )}
                        style={{ height: `${SLOT_HEIGHT}px` }}
                        aria-label={`${format(day, "EEEE, d 'de' MMMM", { locale: ptBR })} às ${slotTime}`}
                      />
                    );
                  })}

                  {/* Bloqueios posicionados absolutamente */}
                  <div className="absolute inset-0 pointer-events-none">
                    {blocksByDay[dayIndex].map((block) => {
                      const startDate = new Date(block.start_datetime);
                      const endDate = new Date(block.end_datetime);
                      const startHour = startDate.getHours();
                      const startMinute = startDate.getMinutes();
                      const endHour = endDate.getHours();
                      const endMinute = endDate.getMinutes();

                      const startTotalMinutes = (startHour - START_HOUR) * 60 + startMinute;
                      const endTotalMinutes = (endHour - START_HOUR) * 60 + endMinute;
                      const durationMinutes = endTotalMinutes - startTotalMinutes;

                      const topPosition = (startTotalMinutes / 15) * SLOT_HEIGHT;
                      const height = (durationMinutes / 15) * SLOT_HEIGHT;

                      return (
                        <div
                          key={block.id}
                          className="absolute inset-x-0 px-1 pointer-events-auto"
                          style={{ top: `${topPosition}px` }}
                        >
                          <button
                            onClick={() => onBlockClick?.(block)}
                            className="w-full rounded-md bg-gray-200 border-2 border-gray-400 border-dashed p-2 flex items-center justify-center hover:bg-gray-300 hover:border-gray-500 transition-colors cursor-pointer"
                            style={{ height: `${height}px` }}
                            title={`${block.reason || "Horário bloqueado"} - Clique para desbloquear`}
                          >
                            <div className="text-center">
                              <Lock className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                              <p className="text-xs font-medium text-gray-700">
                                {block.reason || "Bloqueado"}
                              </p>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Agendamentos posicionados absolutamente */}
                  <div className="absolute inset-0 pointer-events-none">
                    {appointmentsByDay[dayIndex].map((appointment) => {
                      const gridRow = timeToGridRow(appointment.appointment_time);
                      const gridRows = durationToGridRows(appointment.duration_minutes);
                      const topPosition = gridRow * SLOT_HEIGHT;

                      return (
                        <div
                          key={appointment.id}
                          className="absolute inset-x-0 px-1 pointer-events-auto"
                          style={{ top: `${topPosition}px` }}
                        >
                          <AppointmentBlock
                            appointment={appointment}
                            gridRows={gridRows}
                            onClick={() => onAppointmentClick(appointment)}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Linha da hora atual (apenas no dia de hoje) */}
                  {isToday && currentTimePosition !== null && (
                    <div
                      className="absolute inset-x-0 z-10 pointer-events-none"
                      style={{ top: `${currentTimePosition}px` }}
                    >
                      <div className="relative">
                        <div className="absolute left-0 w-2 h-2 -translate-y-1 bg-red-500 rounded-full" />
                        <div className="h-0.5 bg-red-500" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
