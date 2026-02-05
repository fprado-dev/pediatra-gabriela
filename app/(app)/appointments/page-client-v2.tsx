"use client";

import { useEffect, useState } from "react";
import { View } from "react-big-calendar";

// Tipo para eventos de drag & drop (start e end podem ser string ou Date)
interface DragDropEventArgs {
  event: CalendarEvent;
  start: string | Date;
  end: string | Date;
  isAllDay?: boolean;
}
import { format } from "date-fns";
import { CalendarView } from "@/components/appointments/calendar-view";
import { NewAppointmentModalV2 } from "@/components/appointments/new-appointment-modal-v2";
import { AppointmentDetailsDrawer } from "@/components/appointments/appointment-details-drawer";
import { BlockSlotModal } from "@/components/appointments/block-slot-modal";
import { BlockDetailsModal } from "@/components/appointments/block-details-modal";
import { useCalendarStore } from "@/lib/stores/calendar-store";
import { CalendarEvent, AppointmentWithPatient, ScheduleBlock } from "@/lib/types/appointment";
import { Button } from "@/components/ui/button";
import { Lock, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function AppointmentsPageClientV2() {
  const {
    selectedDate,
    currentView,
    loading,
    setSelectedDate,
    setCurrentView,
    refreshCalendar,
    getCalendarEvents,
  } = useCalendarStore();

  // Modals state
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);
  const [blockSlotOpen, setBlockSlotOpen] = useState(false);
  const [appointmentDrawerOpen, setAppointmentDrawerOpen] = useState(false);
  const [blockDetailsOpen, setBlockDetailsOpen] = useState(false);

  // Selected items
  const [preselectedDate, setPreselectedDate] = useState<Date | undefined>();
  const [preselectedTime, setPreselectedTime] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithPatient | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(null);

  // Load initial data - apenas no mount e quando muda de view
  useEffect(() => {
    refreshCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]); // Removido selectedDate para navegação fluida

  // Handlers
  const handleSelectSlot = (slotInfo: { start: Date; end: Date; action: string }) => {
    const { start } = slotInfo;

    // Não permitir criar agendamento no passado
    if (start < new Date()) {
      return;
    }

    // Extrair hora do slot
    const hours = start.getHours().toString().padStart(2, '0');
    const minutes = start.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    setPreselectedDate(start);
    setPreselectedTime(timeString);
    setNewAppointmentOpen(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.type === 'appointment' && event.resource) {
      setSelectedAppointment(event.resource as AppointmentWithPatient);
      setAppointmentDrawerOpen(true);
    } else if (event.type === 'block' && event.resource) {
      setSelectedBlock(event.resource as ScheduleBlock);
      setBlockDetailsOpen(true);
    }
  };

  const handleNavigate = (date: Date) => {
    setSelectedDate(date);
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view as 'month' | 'week' | 'day' | 'agenda');
  };

  const handleSuccess = () => {
    refreshCalendar(true); // Force refresh após criar/editar/deletar
  };

  // Drag & Drop handler
  const handleEventDrop = async (data: DragDropEventArgs) => {
    if (data.event.type !== 'appointment' || !data.event.resource) return;

    const appointment = data.event.resource as AppointmentWithPatient;
    // Converter para Date se for string
    const newDate = typeof data.start === 'string' ? new Date(data.start) : data.start;
    const newTime = `${newDate.getHours().toString().padStart(2, '0')}:${newDate.getMinutes().toString().padStart(2, '0')}`;
    const newDateStr = format(newDate, 'yyyy-MM-dd');

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_date: newDateStr,
          appointment_time: newTime,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao mover agendamento');
        return;
      }

      // Refresh calendar
      refreshCalendar(true); // Force refresh após mover
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Erro ao mover agendamento');
    }
  };

  const handleEventResize = async (data: DragDropEventArgs) => {
    if (data.event.type !== 'appointment' || !data.event.resource) return;

    const appointment = data.event.resource as AppointmentWithPatient;
    // Converter para Date se for string
    const startDate = typeof data.start === 'string' ? new Date(data.start) : data.start;
    const endDate = typeof data.end === 'string' ? new Date(data.end) : data.end;
    const duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration_minutes: duration,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao redimensionar agendamento');
        return;
      }

      // Refresh calendar
      refreshCalendar(true); // Force refresh após redimensionar
    } catch (error) {
      console.error('Error updating appointment duration:', error);
      alert('Erro ao redimensionar agendamento');
    }
  };

  // Get events from store
  const events = getCalendarEvents();

  if (loading && events.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Skeleton className="h-[700px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
            <p className="text-muted-foreground">
              Gerencie os agendamentos dos seus pacientes
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setBlockSlotOpen(true)}
            >
              <Lock className="h-4 w-4 mr-2" />
              Bloquear Horário
            </Button>
            <Button onClick={() => {
              setPreselectedDate(new Date());
              const now = new Date();
              const hours = now.getHours().toString().padStart(2, '0');
              const minutes = Math.ceil(now.getMinutes() / 15) * 15; // Arredondar para próximos 15 min
              setPreselectedTime(`${hours}:${minutes.toString().padStart(2, '0')}`);
              setNewAppointmentOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </div>

        {/* Calendar */}
        <CalendarView
          events={events}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          date={selectedDate}
          view={currentView}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
        />
      </div>

      {/* Modals */}
      <NewAppointmentModalV2
        open={newAppointmentOpen}
        onOpenChange={setNewAppointmentOpen}
        onSuccess={handleSuccess}
        preselectedDate={preselectedDate}
        preselectedTime={preselectedTime}
      />

      <AppointmentDetailsDrawer
        open={appointmentDrawerOpen}
        onOpenChange={setAppointmentDrawerOpen}
        appointment={selectedAppointment}
        onUpdate={handleSuccess}
      />

      <BlockSlotModal
        open={blockSlotOpen}
        onOpenChange={setBlockSlotOpen}
        onSuccess={handleSuccess}
      />

      <BlockDetailsModal
        open={blockDetailsOpen}
        onOpenChange={setBlockDetailsOpen}
        block={selectedBlock}
        onUnblock={handleSuccess}
      />
    </>
  );
}
