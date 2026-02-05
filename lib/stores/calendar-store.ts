import { create } from 'zustand';
import { AppointmentWithPatient, ScheduleBlock, CalendarEvent } from '@/lib/types/appointment';
import { startOfWeek, endOfWeek, format } from 'date-fns';

type ViewType = 'month' | 'week' | 'day' | 'agenda';

interface CalendarState {
  // Estado
  appointments: AppointmentWithPatient[];
  blocks: ScheduleBlock[];
  selectedDate: Date;
  currentView: ViewType;
  loading: boolean;
  error: string | null;
  cachedRange: { start: Date; end: Date } | null;

  // Ações
  setAppointments: (appointments: AppointmentWithPatient[]) => void;
  setBlocks: (blocks: ScheduleBlock[]) => void;
  setSelectedDate: (date: Date) => void;
  setCurrentView: (view: ViewType) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Fetch de dados
  fetchAppointments: (startDate?: Date, endDate?: Date) => Promise<void>;
  fetchBlocks: (startDate?: Date, endDate?: Date) => Promise<void>;
  refreshCalendar: (force?: boolean) => Promise<void>;

  // Helpers
  getCalendarEvents: () => CalendarEvent[];
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  // Estado inicial
  appointments: [],
  blocks: [],
  selectedDate: new Date(),
  currentView: 'week',
  loading: false,
  error: null,
  cachedRange: null,

  // Setters
  setAppointments: (appointments) => set({ appointments }),
  setBlocks: (blocks) => set({ blocks }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setCurrentView: (view) => set({ currentView: view }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Fetch appointments
  fetchAppointments: async (startDate, endDate) => {
    set({ loading: true, error: null });
    try {
      const { selectedDate, currentView } = get();

      // Calcular datas de início e fim baseado na view atual
      let start = startDate;
      let end = endDate;

      if (!start || !end) {
        if (currentView === 'week') {
          start = startOfWeek(selectedDate, { weekStartsOn: 1 });
          end = endOfWeek(selectedDate, { weekStartsOn: 1 });
        } else if (currentView === 'day') {
          start = selectedDate;
          end = selectedDate;
        } else {
          // month view - pegar todo o mês
          start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
          end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        }
      }

      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');

      const response = await fetch(
        `/api/appointments?start_date=${startStr}&end_date=${endStr}`
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar agendamentos');
      }

      const data = await response.json();

      // Filtrar agendamentos cancelados
      const activeAppointments = Array.isArray(data)
        ? data.filter((apt: AppointmentWithPatient) => apt.status !== 'cancelled')
        : [];

      set({ appointments: activeAppointments, loading: false });
    } catch (error) {
      console.error('Error fetching appointments:', error);
      set({
        error: error instanceof Error ? error.message : 'Erro ao buscar agendamentos',
        loading: false
      });
    }
  },

  // Fetch blocks
  fetchBlocks: async (startDate, endDate) => {
    try {
      const { selectedDate, currentView } = get();

      let start = startDate;
      let end = endDate;

      if (!start || !end) {
        if (currentView === 'week') {
          start = startOfWeek(selectedDate, { weekStartsOn: 1 });
          end = endOfWeek(selectedDate, { weekStartsOn: 1 });
        } else if (currentView === 'day') {
          start = selectedDate;
          end = selectedDate;
        } else {
          start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
          end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        }
      }

      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');

      const response = await fetch(
        `/api/appointments/blocks?start_date=${startStr}&end_date=${endStr}`
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar bloqueios');
      }

      const data = await response.json();
      set({ blocks: Array.isArray(data) ? data : [] });
    } catch (error) {
      console.error('Error fetching blocks:', error);
    }
  },

  // Refresh completo
  refreshCalendar: async (force = false) => {
    const { fetchAppointments, fetchBlocks, selectedDate, currentView, cachedRange } = get();

    // Calcular range necessário baseado na view
    let start: Date;
    let end: Date;

    if (currentView === 'week') {
      start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    } else if (currentView === 'day') {
      start = selectedDate;
      end = selectedDate;
    } else if (currentView === 'month') {
      start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    } else {
      // agenda - buscar 2 meses
      start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 2, 0);
    }

    // Expandir range para buscar mais dados (1 mês antes e depois)
    const expandedStart = new Date(start);
    expandedStart.setMonth(expandedStart.getMonth() - 1);
    const expandedEnd = new Date(end);
    expandedEnd.setMonth(expandedEnd.getMonth() + 1);

    // Verificar se precisa fazer fetch
    const needsFetch = force ||
      !cachedRange ||
      expandedStart < cachedRange.start ||
      expandedEnd > cachedRange.end;

    if (needsFetch) {
      set({ cachedRange: { start: expandedStart, end: expandedEnd } });
      await Promise.all([
        fetchAppointments(expandedStart, expandedEnd),
        fetchBlocks(expandedStart, expandedEnd)
      ]);
    }
  },

  // Converter appointments e blocks para CalendarEvents
  getCalendarEvents: () => {
    const { appointments, blocks } = get();
    const events: CalendarEvent[] = [];

    // Converter agendamentos
    appointments.forEach((apt) => {
      const [year, month, day] = apt.appointment_date.split('-').map(Number);
      const [hours, minutes] = apt.appointment_time.split(':').map(Number);

      const start = new Date(year, month - 1, day, hours, minutes);
      const end = new Date(start.getTime() + apt.duration_minutes * 60000);

      events.push({
        id: apt.id,
        title: apt.patient.full_name,
        start,
        end,
        resource: apt,
        type: 'appointment',
      });
    });

    // Converter bloqueios
    blocks.forEach((block) => {
      events.push({
        id: block.id,
        title: block.reason || 'Horário Bloqueado',
        start: new Date(block.start_datetime),
        end: new Date(block.end_datetime),
        resource: block,
        type: 'block',
      });
    });

    return events;
  },
}));
