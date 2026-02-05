export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type AppointmentType = 'consultation' | 'return' | 'urgent';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: AppointmentStatus;
  appointment_type: AppointmentType;
  notes?: string;
  cancellation_reason?: string;
  reminder_sent: boolean;
  checked_in_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithPatient extends Appointment {
  patient: {
    id: string;
    full_name: string;
    date_of_birth: string;
    phone: string;
    email?: string;
  };
}

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  day_of_week: number; // 0-6, 0 = Domingo
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduleBlock {
  id: string;
  doctor_id: string;
  start_datetime: string;
  end_datetime: string;
  reason?: string;
  created_at: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string; // 'occupied', 'blocked', 'outside_hours', etc
}

export interface AppointmentConflict {
  type: 'duplicate_patient' | 'occupied_slot' | 'outside_hours' | 'blocked' | 'weekend';
  message: string;
  suggestedSlots?: string[];
}

export interface CreateAppointmentData {
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes?: number;
  appointment_type: AppointmentType;
  notes?: string;
}

export interface UpdateAppointmentData {
  appointment_date?: string;
  appointment_time?: string;
  duration_minutes?: number;
  status?: AppointmentStatus;
  appointment_type?: AppointmentType;
  notes?: string;
  cancellation_reason?: string;
  checked_in_at?: string;
}

// Configurações padrão de horário
export const DEFAULT_SCHEDULE = {
  startHour: 8,
  endHour: 18,
  lunchStart: 12,
  lunchEnd: 13,
  slotDuration: 60, // minutos (1 hora)
  workDays: [1, 2, 3, 4, 5], // Segunda a Sexta
};

// Labels para exibição
export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  in_progress: 'Em Atendimento',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
};

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  consultation: 'Consulta',
  return: 'Retorno',
  urgent: 'Urgência',
};

export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
};

// Tipos para react-big-calendar
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: AppointmentWithPatient | ScheduleBlock;
  type: 'appointment' | 'block';
  allDay?: boolean;
}

// Tipos para recorrência (futura implementação)
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly';

export interface RecurringPattern {
  frequency: RecurringFrequency;
  interval: number; // ex: cada 2 semanas = interval 2
  daysOfWeek?: number[]; // para recorrência semanal [1,3,5] = seg, qua, sex
  endDate?: string; // data final da recorrência
  occurrences?: number; // ou número de ocorrências
}

export interface RecurringAppointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  start_date: string;
  appointment_time: string;
  duration_minutes: number;
  appointment_type: AppointmentType;
  notes?: string;
  pattern: RecurringPattern;
  created_at: string;
  updated_at: string;
}
