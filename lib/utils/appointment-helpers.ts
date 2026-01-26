import { 
  DEFAULT_SCHEDULE, 
  TimeSlot, 
  DoctorSchedule,
  ScheduleBlock,
  AppointmentWithPatient 
} from '@/lib/types/appointment';
import { format, parse, addMinutes, isAfter, isBefore, isEqual, startOfDay } from 'date-fns';

/**
 * Verifica se uma data é fim de semana
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Verifica se um horário está no intervalo de almoço
 */
export function isLunchTime(time: string): boolean {
  const hour = parseInt(time.split(':')[0]);
  return hour >= DEFAULT_SCHEDULE.lunchStart && hour < DEFAULT_SCHEDULE.lunchEnd;
}

/**
 * Verifica se um horário está dentro do expediente
 */
export function isWithinWorkingHours(time: string, schedule?: DoctorSchedule): boolean {
  const hour = parseInt(time.split(':')[0]);
  const startHour = schedule ? parseInt(schedule.start_time.split(':')[0]) : DEFAULT_SCHEDULE.startHour;
  const endHour = schedule ? parseInt(schedule.end_time.split(':')[0]) : DEFAULT_SCHEDULE.endHour;
  
  return hour >= startHour && hour < endHour;
}

/**
 * Verifica se um horário está disponível considerando duração da consulta
 */
function isSlotAvailable(
  slotTime: Date,
  durationMinutes: number,
  existingAppointments: AppointmentWithPatient[],
  blocks: ScheduleBlock[]
): { available: boolean; reason?: string } {
  const slotTimeString = format(slotTime, 'HH:mm');
  const slotEnd = addMinutes(slotTime, durationMinutes);

  // Verifica se algum agendamento existente conflita
  for (const apt of existingAppointments) {
    if (apt.status === 'cancelled') continue;

    const aptTime = new Date(slotTime);
    const [hours, minutes] = apt.appointment_time.substring(0, 5).split(':');
    aptTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const aptEnd = addMinutes(aptTime, apt.duration_minutes);

    // Verifica overlap: slot inicia antes do apt terminar E slot termina depois do apt iniciar
    if (isBefore(slotTime, aptEnd) && isAfter(slotEnd, aptTime)) {
      return { available: false, reason: 'occupied' };
    }
  }

  // Verifica bloqueios
  for (const block of blocks) {
    const blockStart = new Date(block.start_datetime);
    const blockEnd = new Date(block.end_datetime);
    
    if (isBefore(slotTime, blockEnd) && isAfter(slotEnd, blockStart)) {
      return { available: false, reason: 'blocked' };
    }
  }

  return { available: true };
}

/**
 * Gera lista de horários disponíveis para um dia
 */
export function generateTimeSlots(
  date: Date,
  schedule?: DoctorSchedule,
  existingAppointments: AppointmentWithPatient[] = [],
  blocks: ScheduleBlock[] = [],
  requestedDuration: number = DEFAULT_SCHEDULE.slotDuration
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  // Verifica se é fim de semana
  if (isWeekend(date)) {
    return [];
  }

  const startHour = schedule ? parseInt(schedule.start_time.split(':')[0]) : DEFAULT_SCHEDULE.startHour;
  const endHour = schedule ? parseInt(schedule.end_time.split(':')[0]) : DEFAULT_SCHEDULE.endHour;
  const slotDuration = DEFAULT_SCHEDULE.slotDuration;

  let currentTime = new Date(date);
  currentTime.setHours(startHour, 0, 0, 0);
  const endTime = new Date(date);
  endTime.setHours(endHour, 0, 0, 0);

  while (isBefore(currentTime, endTime)) {
    const timeString = format(currentTime, 'HH:mm');
    
    // Verifica horário de almoço
    if (isLunchTime(timeString)) {
      currentTime = addMinutes(currentTime, slotDuration);
      continue;
    }

    // Verifica se há tempo suficiente até o fim do expediente
    const slotEnd = addMinutes(currentTime, requestedDuration);
    if (isAfter(slotEnd, endTime)) {
      break; // Não cabe mais consultas neste dia
    }

    // Verifica disponibilidade considerando duração
    const availability = isSlotAvailable(currentTime, requestedDuration, existingAppointments, blocks);

    slots.push({
      time: timeString,
      available: availability.available,
      reason: availability.reason,
    });

    currentTime = addMinutes(currentTime, slotDuration);
  }

  return slots;
}

/**
 * Encontra próximos horários disponíveis
 */
export function findAvailableSlots(
  startDate: Date,
  count: number,
  existingAppointments: AppointmentWithPatient[],
  schedule?: DoctorSchedule,
  blocks: ScheduleBlock[] = []
): { date: string; time: string }[] {
  const availableSlots: { date: string; time: string }[] = [];
  let currentDate = new Date(startDate);
  let daysChecked = 0;
  const maxDaysToCheck = 30;

  while (availableSlots.length < count && daysChecked < maxDaysToCheck) {
    if (!isWeekend(currentDate)) {
      const daySlots = generateTimeSlots(
        currentDate,
        schedule,
        existingAppointments.filter(apt => apt.appointment_date === format(currentDate, 'yyyy-MM-dd')),
        blocks
      );

      const available = daySlots.filter(slot => slot.available);
      
      for (const slot of available) {
        if (availableSlots.length < count) {
          availableSlots.push({
            date: format(currentDate, 'yyyy-MM-dd'),
            time: slot.time,
          });
        }
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
    daysChecked++;
  }

  return availableSlots;
}

/**
 * Valida se um horário de agendamento é válido
 */
export function validateAppointmentTime(
  date: string,
  time: string,
  patientId: string,
  existingAppointments: AppointmentWithPatient[],
  schedule?: DoctorSchedule,
  blocks: ScheduleBlock[] = []
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const appointmentDate = new Date(date);

  // Verifica se é no passado
  const now = new Date();
  const appointmentDateTime = new Date(`${date}T${time}`);
  if (isBefore(appointmentDateTime, now)) {
    errors.push('Não é possível agendar no passado');
  }

  // Verifica se é fim de semana
  if (isWeekend(appointmentDate)) {
    errors.push('Não é possível agendar em finais de semana');
  }

  // Verifica horário de almoço
  if (isLunchTime(time)) {
    errors.push('Horário de almoço indisponível');
  }

  // Verifica expediente
  if (!isWithinWorkingHours(time, schedule)) {
    errors.push('Fora do horário de atendimento');
  }

  // Verifica duplicidade de paciente no mesmo dia
  const patientHasAppointment = existingAppointments.some(
    apt => 
      apt.patient_id === patientId && 
      apt.appointment_date === date && 
      apt.status !== 'cancelled'
  );
  if (patientHasAppointment) {
    errors.push('Paciente já tem agendamento para este dia');
  }

  // Verifica se horário está ocupado
  const slotOccupied = existingAppointments.some(
    apt => 
      apt.appointment_date === date && 
      apt.appointment_time === time && 
      apt.status !== 'cancelled'
  );
  if (slotOccupied) {
    errors.push('Horário já ocupado');
  }

  // Verifica bloqueios
  const isBlocked = blocks.some(block => {
    const blockStart = new Date(block.start_datetime);
    const blockEnd = new Date(block.end_datetime);
    const slotDateTime = new Date(`${date}T${time}`);
    
    return (
      (isAfter(slotDateTime, blockStart) || isEqual(slotDateTime, blockStart)) &&
      isBefore(slotDateTime, blockEnd)
    );
  });
  if (isBlocked) {
    errors.push('Horário bloqueado');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Formata duração em minutos para texto legível
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}min`;
}

/**
 * Calcula horário de término baseado no início e duração
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  const endDate = addMinutes(date, durationMinutes);
  return format(endDate, 'HH:mm');
}
