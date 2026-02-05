"use client";

import { Calendar, dateFnsLocalizer, View, EventPropGetter, SlotPropGetter } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarEvent } from '@/lib/types/appointment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './calendar-styles.css';

const DragAndDropCalendar = withDragAndDrop<CalendarEvent>(Calendar);

// Tipo para eventos de drag & drop (start e end podem ser string ou Date)
interface DragDropEventArgs {
  event: CalendarEvent;
  start: string | Date;
  end: string | Date;
  isAllDay?: boolean;
}

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }), // Semana começa na segunda
  getDay,
  locales,
});

// Mensagens em português
const messages = {
  date: 'Data',
  time: 'Hora',
  event: 'Evento',
  allDay: 'Dia Inteiro',
  week: 'Semana',
  work_week: 'Semana de Trabalho',
  day: 'Dia',
  month: 'Mês',
  previous: 'Anterior',
  next: 'Próximo',
  yesterday: 'Ontem',
  tomorrow: 'Amanhã',
  today: 'Hoje',
  agenda: 'Agenda',
  noEventsInRange: 'Não há agendamentos neste período.',
  showMore: (total: number) => `+ Ver mais (${total})`,
};

interface CalendarViewProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectSlot: (slotInfo: { start: Date; end: Date; action: string }) => void;
  onNavigate: (date: Date) => void;
  onView: (view: View) => void;
  date: Date;
  view: View;
  onEventDrop?: (data: DragDropEventArgs) => void;
  onEventResize?: (data: DragDropEventArgs) => void;
}

export function CalendarView({
  events,
  onSelectEvent,
  onSelectSlot,
  onNavigate,
  onView,
  date,
  view,
  onEventDrop,
  onEventResize,
}: CalendarViewProps) {
  // Configuração de horários
  const min = new Date();
  min.setHours(8, 0, 0); // Início: 8h

  const max = new Date();
  max.setHours(18, 0, 0); // Fim: 18h

  // Estilizar eventos baseado no tipo
  const eventStyleGetter: EventPropGetter<CalendarEvent> = (event) => {
    let style: React.CSSProperties = {
      borderRadius: '6px',
      opacity: 0.95,
      border: '0',
      display: 'block',
      fontSize: '0.875rem',
      padding: '4px 8px',
    };

    if (event.type === 'block') {
      // Bloqueios: tons pastéis cinza
      style = {
        ...style,
        backgroundColor: '#f3f4f6',
        border: '2px dashed #d1d5db',
        color: '#9ca3af',
      };
    } else if (event.resource && 'appointment_type' in event.resource) {
      // Agendamentos: tons pastéis suaves
      const apt = event.resource;
      switch (apt.appointment_type) {
        case 'consultation':
          style.backgroundColor = '#dbeafe'; // Azul pastel
          style.color = '#1e40af';
          style.border = '1px solid #93c5fd';
          break;
        case 'return':
          style.backgroundColor = '#d1fae5'; // Verde pastel
          style.color = '#065f46';
          style.border = '1px solid #6ee7b7';
          break;
        case 'urgent':
          style.backgroundColor = '#fed7aa'; // Laranja pastel
          style.color = '#c2410c';
          style.border = '1px solid #fdba74';
          break;
      }

      // Status: cancelado fica mais opaco
      if (apt.status === 'cancelled') {
        style.opacity = 0.4;
        style.textDecoration = 'line-through';
      }
      // Status: completado fica com borda mais forte
      else if (apt.status === 'completed') {
        style.border = '2px solid #10b981';
      }
      // Status: em atendimento fica com animação
      else if (apt.status === 'in_progress') {
        style.border = '2px solid #f59e0b';
        style.animation = 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite';
      }
    }

    return { style };
  };

  // Handler para validar e executar drag & drop
  const handleEventDrop = async (data: DragDropEventArgs) => {
    // Não permitir mover bloqueios
    if (data.event.type === 'block') {
      return;
    }

    // Converter start para Date se for string
    const startDate = typeof data.start === 'string' ? new Date(data.start) : data.start;

    // Não permitir mover para o passado
    if (startDate < new Date()) {
      alert('Não é possível mover agendamento para o passado');
      return;
    }

    // Validar horário de trabalho (8h-18h)
    const hours = startDate.getHours();
    if (hours < 8 || hours >= 18) {
      alert('Horário fora do expediente (8h-18h)');
      return;
    }

    // Validar dias úteis (seg-sex)
    const dayOfWeek = startDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      alert('Não é possível agendar em finais de semana');
      return;
    }

    // Executar callback se fornecido
    if (onEventDrop) {
      onEventDrop(data);
    }
  };

  const handleEventResize = async (data: DragDropEventArgs) => {
    // Não permitir redimensionar bloqueios
    if (data.event.type === 'block') {
      return;
    }

    // Converter para Date se necessário
    const startDate = typeof data.start === 'string' ? new Date(data.start) : data.start;
    const endDate = typeof data.end === 'string' ? new Date(data.end) : data.end;

    // Validar duração mínima (15 minutos)
    const duration = (endDate.getTime() - startDate.getTime()) / 60000;
    if (duration < 15) {
      alert('Duração mínima: 15 minutos');
      return;
    }

    // Validar duração máxima (4 horas)
    if (duration > 240) {
      alert('Duração máxima: 4 horas');
      return;
    }

    // Executar callback se fornecido
    if (onEventResize) {
      onEventResize(data);
    }
  };

  // Ajustar altura para ocupar 100% do conteúdo disponível
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const calendarHeight = isMobile ? 'calc(100vh - 180px)' : 'calc(100vh - 200px)';

  // Horário de scroll inicial - 9h da manhã
  const scrollToTime = new Date();
  scrollToTime.setHours(9, 0, 0);

  // Estilizar slots baseado na data (para marcar dias passados e finais de semana)
  const slotPropGetter: SlotPropGetter = (date) => {
    const now = new Date();
    const today = startOfDay(now);
    const slotDate = startOfDay(date);
    const dayOfWeek = date.getDay();

    // Finais de semana (0 = domingo, 6 = sábado)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        className: 'rbc-off-range-bg rbc-weekend-slot',
        style: {
          backgroundColor: 'hsl(var(--muted) / 0.5)',
          cursor: 'not-allowed',
        },
      };
    }

    // Se o slot é de um dia passado, retorna classe especial
    if (isBefore(slotDate, today)) {
      return {
        className: 'rbc-off-range-bg',
        style: {
          backgroundColor: 'hsl(var(--muted) / 0.4)',
          cursor: 'not-allowed',
        },
      };
    }

    return {};
  };

  return (
    <div className="calendar-container" style={{ height: calendarHeight }}>
      <DragAndDropCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        date={date}
        view={view}
        onNavigate={onNavigate}
        onView={onView}
        onSelectEvent={onSelectEvent}
        onSelectSlot={onSelectSlot}
        selectable
        messages={messages}
        culture="pt-BR"
        min={min}
        max={max}
        step={15}
        timeslots={4}
        scrollToTime={scrollToTime}
        eventPropGetter={eventStyleGetter}
        slotPropGetter={slotPropGetter}
        views={['month', 'week', 'day', 'agenda']}
        defaultView="week"
        dayLayoutAlgorithm="no-overlap"
        // Drag & Drop
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        resizable
        draggableAccessor={(event: CalendarEvent) => event.type === 'appointment'} // Apenas agendamentos
        formats={{
          timeGutterFormat: 'HH:mm',
          eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
            `${localizer?.format(start, 'HH:mm', culture)} - ${localizer?.format(end, 'HH:mm', culture)}`,
          agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
            `${localizer?.format(start, 'HH:mm', culture)} - ${localizer?.format(end, 'HH:mm', culture)}`,
          dayFormat: (date, culture, localizer) =>
            localizer?.format(date, 'EEE dd', culture) || '',
          dayHeaderFormat: (date, culture, localizer) =>
            localizer?.format(date, 'EEEE, dd/MM', culture) || '',
          monthHeaderFormat: (date, culture, localizer) =>
            localizer?.format(date, 'MMMM yyyy', culture) || '',
          dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
            `${localizer?.format(start, 'dd MMM', culture)} - ${localizer?.format(end, 'dd MMM yyyy', culture)}`,
        }}
      />
    </div>
  );
}
