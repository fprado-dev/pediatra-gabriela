"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BlockSlotModal } from "./block-slot-modal";

interface WeekNavigationProps {
  currentWeekStart: Date;
  onWeekChange: (newWeekStart: Date) => void;
  onBlockCreated?: () => void;
}

export function WeekNavigation({ currentWeekStart, onWeekChange, onBlockCreated }: WeekNavigationProps) {
  const [showBlockModal, setShowBlockModal] = useState(false);
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

  // Criar data normalizada (meia-noite local) para evitar problemas de timezone
  const today = new Date();
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayWeekStart = startOfWeek(normalizedToday, { weekStartsOn: 1 });

  const handlePreviousWeek = () => {
    const newWeekStart = subWeeks(currentWeekStart, 1);
    // Normalizar a data para evitar problemas de timezone
    const normalized = new Date(newWeekStart.getFullYear(), newWeekStart.getMonth(), newWeekStart.getDate());
    onWeekChange(normalized);
  };

  const handleNextWeek = () => {
    const newWeekStart = addWeeks(currentWeekStart, 1);
    // Normalizar a data para evitar problemas de timezone
    const normalized = new Date(newWeekStart.getFullYear(), newWeekStart.getMonth(), newWeekStart.getDate());
    onWeekChange(normalized);
  };

  const handleCurrentWeek = () => {
    onWeekChange(todayWeekStart);
  };

  const isCurrentWeek = format(currentWeekStart, "yyyy-MM-dd") === format(todayWeekStart, "yyyy-MM-dd");

  return (
    <div className="flex items-center justify-between py-3 px-2">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handlePreviousWeek}
          aria-label="Semana anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleNextWeek}
          aria-label="Próxima semana"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-center flex-1">
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentWeekStart, "d", { locale: ptBR })} - {format(weekEnd, "d 'de' MMMM, yyyy", { locale: ptBR })}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => setShowBlockModal(true)}
        >
          <Lock className="h-3.5 w-3.5 mr-1.5" />
          Bloquear
        </Button>
        <Button
          variant={isCurrentWeek ? "default" : "ghost"}
          size="sm"
          className="h-8"
          onClick={handleCurrentWeek}
          disabled={isCurrentWeek}
        >
          Hoje
        </Button>
      </div>

      {/* Modal de bloqueio */}
      <BlockSlotModal
        open={showBlockModal}
        onOpenChange={setShowBlockModal}
        onSuccess={() => {
          onBlockCreated?.();
        }}
      />
    </div>
  );
}
