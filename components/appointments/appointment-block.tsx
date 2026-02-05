"use client";

import { AppointmentWithPatient, APPOINTMENT_TYPE_LABELS } from "@/lib/types/appointment";
import { cn } from "@/lib/utils";
import { Clock, Stethoscope, RefreshCw, Baby } from "lucide-react";

interface AppointmentBlockProps {
  appointment: AppointmentWithPatient;
  gridRows: number; // Número de linhas que o bloco ocupa
  onClick: () => void;
}

const STATUS_STYLES = {
  pending: "bg-yellow-50 text-yellow-900 hover:bg-yellow-100",
  confirmed: "bg-blue-50 text-blue-900 hover:bg-blue-100",
  in_progress: "bg-purple-50 text-purple-900 hover:bg-purple-100",
  completed: "bg-gray-50 text-gray-700 hover:bg-gray-100",
  cancelled: "bg-gray-50 text-gray-500 hover:bg-gray-100 opacity-60",
};

const TYPE_BORDER_STYLES = {
  consultation: "border-l-blue-500",
  return: "border-l-green-500",
  urgent: "border-l-orange-500",
};

const TYPE_ICONS = {
  consultation: Stethoscope,
  return: RefreshCw,
  urgent: Clock,
};

export function AppointmentBlock({ appointment, gridRows, onClick }: AppointmentBlockProps) {
  const height = gridRows * 40; // 40px por grid row (15min)
  const Icon = TYPE_ICONS[appointment.appointment_type] || Stethoscope;

  // Determinar se o bloco é pequeno (menos de 2 slots = 30min)
  const isSmall = gridRows < 2;

  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute left-0 right-0 rounded-md border-l-4 p-2 overflow-hidden transition-colors cursor-pointer shadow-sm",
        "flex flex-col justify-start text-left",
        STATUS_STYLES[appointment.status],
        TYPE_BORDER_STYLES[appointment.appointment_type]
      )}
      style={{ height: `${height}px` }}
      aria-label={`Agendamento de ${appointment.patient.full_name} às ${appointment.appointment_time}`}
    >
      <div className="flex items-start gap-1.5">
        <Icon className={cn("flex-shrink-0 mt-0.5", isSmall ? "h-3 w-3" : "h-4 w-4")} />
        <div className="flex-1 min-w-0">
          <p className={cn("font-semibold truncate", isSmall ? "text-xs" : "text-sm")}>
            {appointment.patient.full_name}
          </p>
          {!isSmall && (
            <>
              <p className="text-xs opacity-75 truncate">
                {APPOINTMENT_TYPE_LABELS[appointment.appointment_type]}
              </p>
              {gridRows >= 4 && appointment.notes && (
                <p className="text-xs opacity-60 truncate mt-1">
                  {appointment.notes}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </button>
  );
}
