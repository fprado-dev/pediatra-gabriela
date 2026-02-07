"use client";

import { useState, useEffect } from "react";
import { startOfWeek, format } from "date-fns";
import { Calendar } from "lucide-react";
import { WeekNavigation } from "@/components/appointments/week-navigation";
import { WeeklyCalendarGrid } from "@/components/appointments/weekly-calendar-grid";
import { MobileWeekList } from "@/components/appointments/mobile-week-list";
import { NewAppointmentModalV2 } from "@/components/appointments/new-appointment-modal-v2";
import { AppointmentDetailsDrawer } from "@/components/appointments/appointment-details-drawer";
import { BlockDetailsModal } from "@/components/appointments/block-details-modal";
import { WeekNavigationSkeleton, WeeklyCalendarGridSkeleton } from "@/components/appointments/weekly-calendar-skeleton";
import { AppointmentWithPatient, ScheduleBlock } from "@/lib/types/appointment";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppointmentsPageClient() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // Criar data normalizada (meia-noite local) para evitar problemas de timezone
    const today = new Date();
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return startOfWeek(normalizedToday, { weekStartsOn: 1 });
  });
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [preselectedDate, setPreselectedDate] = useState<Date | undefined>();
  const [preselectedTime, setPreselectedTime] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithPatient | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(null);

  const isMobile = useIsMobile();

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekStart]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // Calcular data de início e fim da semana
      const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");
      const weekEndDate = new Date(currentWeekStart);
      weekEndDate.setDate(weekEndDate.getDate() + 4); // Segunda a Sexta
      const weekEndStr = format(weekEndDate, "yyyy-MM-dd");

      // Buscar agendamentos e bloqueios em paralelo
      const [appointmentsRes, blocksRes] = await Promise.all([
        fetch(`/api/appointments?start_date=${weekStartStr}&end_date=${weekEndStr}`),
        fetch(`/api/appointments/blocks?start_date=${weekStartStr}&end_date=${weekEndStr}`)
      ]);

      if (!appointmentsRes.ok) {
        console.error("Error fetching appointments:", appointmentsRes.status);
        setAppointments([]);
      } else {
        const data = await appointmentsRes.json();
        // Filtrar agendamentos cancelados
        const activeAppointments = Array.isArray(data)
          ? data.filter(apt => apt.status !== 'cancelled')
          : [];
        setAppointments(activeAppointments);
      }

      if (!blocksRes.ok) {
        console.error("Error fetching blocks:", blocksRes.status);
        setBlocks([]);
      } else {
        const blocksData = await blocksRes.json();
        setBlocks(Array.isArray(blocksData) ? blocksData : []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setAppointments([]);
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (date: Date, time: string) => {
    setPreselectedDate(date);
    setPreselectedTime(time);
    setModalOpen(true);
  };

  const handleAppointmentClick = (appointment: AppointmentWithPatient) => {
    setSelectedAppointment(appointment);
    setDrawerOpen(true);
  };

  const handleBlockClick = (block: ScheduleBlock) => {
    setSelectedBlock(block);
    setBlockModalOpen(true);
  };

  const handleSuccess = () => {
    fetchAppointments();
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="space-y-6">
        <WeekNavigationSkeleton />
        <WeeklyCalendarGridSkeleton />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <WeekNavigation
          currentWeekStart={currentWeekStart}
          onWeekChange={setCurrentWeekStart}
          onBlockCreated={fetchAppointments}
        />

        {/* Desktop: Grid / Mobile: List */}
        {isMobile ? (
          <MobileWeekList
            weekStart={currentWeekStart}
            appointments={appointments}
            onAppointmentClick={handleAppointmentClick}
            onAddClick={(date) => handleSlotClick(date, "09:00")}
          />
        ) : (
          <WeeklyCalendarGrid
            weekStart={currentWeekStart}
            appointments={appointments}
            blocks={blocks}
            onSlotClick={handleSlotClick}
            onAppointmentClick={handleAppointmentClick}
            onBlockClick={handleBlockClick}
          />
        )}
      </div>

      <NewAppointmentModalV2
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleSuccess}
        preselectedDate={preselectedDate}
        preselectedTime={preselectedTime}
      />

      <AppointmentDetailsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        appointment={selectedAppointment}
        onUpdate={handleSuccess}
      />

      <BlockDetailsModal
        open={blockModalOpen}
        onOpenChange={setBlockModalOpen}
        block={selectedBlock}
        onUnblock={handleSuccess}
      />
    </>
  );
}

