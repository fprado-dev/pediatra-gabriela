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
 * IMPORTANTE: Recebe string no formato yyyy-MM-dd para evitar problemas de timezone
 */
export function isWeekend(dateString: string): boolean {
  // Usar formato local sem problemas de timezone
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
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
export function isWithinWorkingHours(time: string, schedule?: DoctorSchedule, durationMinutes: number = 0): boolean {
  const [hour, minute] = time.split(':').map(Number);
  const startHour = schedule ? parseInt(schedule.start_time.split(':')[0]) : DEFAULT_SCHEDULE.startHour;
  const endHour = schedule ? parseInt(schedule.end_time.split(':')[0]) : DEFAULT_SCHEDULE.endHour;

  // Verificar se o horário inicial está dentro do expediente
  if (hour < startHour || hour >= endHour) {
    return false;
  }

  // Se há duração, verificar se o horário final também está dentro do expediente
  if (durationMinutes > 0) {
    const totalMinutes = hour * 60 + minute + durationMinutes;
    const endTimeHour = Math.floor(totalMinutes / 60);

    if (endTimeHour > endHour) {
      return false;
    }
  }

  return true;
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
  const dateString = format(date, 'yyyy-MM-dd');
  if (isWeekend(dateString)) {
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
    const currentDateString = format(currentDate, 'yyyy-MM-dd');
    if (!isWeekend(currentDateString)) {
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
  blocks: ScheduleBlock[] = [],
  durationMinutes: number = 30
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Verifica se é no passado (usando formato local para evitar problemas de timezone)
  const now = new Date();
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const appointmentDateTime = new Date(year, month - 1, day, hour, minute);

  if (isBefore(appointmentDateTime, now)) {
    errors.push('Não é possível agendar no passado');
  }

  // Verifica se é fim de semana (passando string para evitar timezone)
  if (isWeekend(date)) {
    errors.push('Não é possível agendar em finais de semana');
  }

  // Verifica horário de almoço
  if (isLunchTime(time)) {
    errors.push('Horário de almoço indisponível');
  }

  // Verifica expediente (incluindo duração)
  if (!isWithinWorkingHours(time, schedule, durationMinutes)) {
    errors.push('Fora do horário de atendimento (8h-18h)');
  }

  // Verifica duplicidade de paciente no mesmo dia (apenas se patientId fornecido)
  if (patientId) {
    const patientHasAppointment = existingAppointments.some(
      apt =>
        apt.patient_id === patientId &&
        apt.appointment_date === date &&
        apt.status !== 'cancelled'
    );
    if (patientHasAppointment) {
      errors.push('Paciente já tem agendamento para este dia');
    }
  }

  // Verifica conflito de horário (overlap)
  const hasConflict = existingAppointments.some(apt => {
    if (apt.status === 'cancelled' || apt.appointment_date !== date) {
      return false;
    }

    const [aptHour, aptMinute] = apt.appointment_time.split(':').map(Number);
    const aptStart = aptHour * 60 + aptMinute;
    const aptEnd = aptStart + apt.duration_minutes;

    const [newHour, newMinute] = time.split(':').map(Number);
    const newStart = newHour * 60 + newMinute;
    const newEnd = newStart + durationMinutes;

    // Verifica overlap
    return newStart < aptEnd && newEnd > aptStart;
  });

  if (hasConflict) {
    errors.push('Horário conflita com outro agendamento');
  }

  // Verifica bloqueios
  const isBlocked = blocks.some(block => {
    const blockStart = new Date(block.start_datetime);
    const blockEnd = new Date(block.end_datetime);

    return (
      (isAfter(appointmentDateTime, blockStart) || isEqual(appointmentDateTime, blockStart)) &&
      isBefore(appointmentDateTime, blockEnd)
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
