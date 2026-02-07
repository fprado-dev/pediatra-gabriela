import { Database } from "@/types/database.types";

export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  in_progress: 'Em Atendimento',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
};

type AppointmentRow = Database['public']['Tables']['appointments']['Row'];
type PatientRow = Database['public']['Tables']['patients']['Row'];

// Tipo customizado para appointments com paciente incluído
export interface TodayAppointment extends AppointmentRow {
  patient: Pick<PatientRow, 'id' | 'full_name' | 'date_of_birth' | 'phone' | 'email'>;
}

// Um appointment individual do mês com dados do paciente
export interface MonthlyAppointmentItem extends Pick<AppointmentRow, 'id' | 'appointment_date' | 'appointment_time' | 'status'> {
  patient: Pick<PatientRow, 'id' | 'full_name' | 'date_of_birth' | 'phone' | 'email'>;
}

// Resposta completa com total + lista de appointments
export interface MonthlyAppointmentsResponse {
  totalMonthlyAppointments: number;
  appointments: MonthlyAppointmentItem[];
}