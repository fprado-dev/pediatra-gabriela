"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentCalendar } from "@/components/appointments/appointment-calendar";
import { NewAppointmentModal } from "@/components/appointments/new-appointment-modal";

export function AppointmentsPageClient() {
  const [showNewModal, setShowNewModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [preselectedDate, setPreselectedDate] = useState<Date | undefined>();
  const [preselectedTime, setPreselectedTime] = useState<string>("");

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleSlotClick = (date: Date, time: string) => {
    setPreselectedDate(date);
    setPreselectedTime(time);
    setShowNewModal(true);
  };

  const handleModalClose = (open: boolean) => {
    setShowNewModal(open);
    if (!open) {
      // Limpar pré-seleções ao fechar modal
      setPreselectedDate(undefined);
      setPreselectedTime("");
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowNewModal(true)}>
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      <AppointmentCalendar 
        key={refreshKey} 
        onRefresh={handleSuccess}
        onSlotClick={handleSlotClick}
      />

      <NewAppointmentModal
        open={showNewModal}
        onOpenChange={handleModalClose}
        onSuccess={handleSuccess}
        preselectedDate={preselectedDate}
        preselectedTime={preselectedTime}
      />
    </>
  );
}
