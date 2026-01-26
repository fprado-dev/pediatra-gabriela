// Tipos para o sistema de Timer de Consultas

export type TimerStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export type TimerStartedFrom = 'appointment' | 'manual';

export interface TimerPause {
  started_at: string; // ISO timestamp
  resumed_at?: string; // ISO timestamp
}

export interface ConsultationTimer {
  id: string;
  doctor_id: string;
  patient_id: string;
  appointment_id: string | null;
  consultation_id: string | null;
  
  started_at: string;
  ended_at: string | null;
  
  pauses: TimerPause[];
  
  total_duration_seconds: number | null;
  active_duration_seconds: number | null;
  
  status: TimerStatus;
  started_from: TimerStartedFrom;
  notes: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface TimerWithPatient extends ConsultationTimer {
  patient: {
    id: string;
    full_name: string;
    date_of_birth: string;
    phone: string;
  };
}

export interface TimerWithDetails extends TimerWithPatient {
  appointment?: {
    id: string;
    appointment_date: string;
    appointment_time: string;
    appointment_type: string;
  };
  consultation?: {
    id: string;
    chief_complaint: string;
    created_at: string;
  };
}

export interface TimerStats {
  today: {
    total_seconds: number;
    active_seconds: number;
    consultations_count: number;
    average_seconds: number;
  };
  week: {
    total_seconds: number;
    active_seconds: number;
    consultations_count: number;
    average_seconds: number;
  };
  month: {
    total_seconds: number;
    active_seconds: number;
    consultations_count: number;
    average_seconds: number;
  };
  daily_breakdown: {
    date: string;
    total_seconds: number;
    consultations_count: number;
  }[];
}

export interface StartTimerRequest {
  patient_id: string;
  appointment_id?: string;
  started_from: TimerStartedFrom;
}

export interface FinishTimerRequest {
  notes?: string;
}

export const TIMER_STATUS_LABELS: Record<TimerStatus, string> = {
  active: 'Ativo',
  paused: 'Pausado',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
};

export const TIMER_STARTED_FROM_LABELS: Record<TimerStartedFrom, string> = {
  appointment: 'Agendamento',
  manual: 'Avulso',
};

// Helpers para formatação
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDurationShort(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  
  return `${minutes}min`;
}

export function calculateActiveDuration(
  startedAt: string,
  endedAt: string | null,
  pauses: TimerPause[]
): number {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  
  const totalMs = end - start;
  
  // Calcular tempo total de pausas
  const pauseMs = pauses.reduce((total, pause) => {
    const pauseStart = new Date(pause.started_at).getTime();
    const pauseEnd = pause.resumed_at 
      ? new Date(pause.resumed_at).getTime() 
      : Date.now();
    return total + (pauseEnd - pauseStart);
  }, 0);
  
  return Math.floor((totalMs - pauseMs) / 1000);
}
