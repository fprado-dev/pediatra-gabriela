"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  User,
  Phone,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  X,
  Play,
  Edit,
  Loader2,
} from "lucide-react";
import { EditAppointmentModal } from "./edit-appointment-modal";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppointmentWithPatient, APPOINTMENT_STATUS_LABELS, APPOINTMENT_TYPE_LABELS } from "@/lib/types/appointment";
import { calculateAge } from "@/lib/utils/date-helpers";

interface AppointmentDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AppointmentWithPatient | null;
  onUpdate: () => void;
}

const STATUS_BADGE_VARIANTS = {
  pending: "secondary",
  confirmed: "default",
  in_progress: "secondary",
  completed: "secondary",
  cancelled: "secondary",
} as const;

export function AppointmentDetailsDrawer({
  open,
  onOpenChange,
  appointment,
  onUpdate,
}: AppointmentDetailsDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  if (!appointment) return null;

  const appointmentDate = new Date(`${appointment.appointment_date}T00:00:00`);
  const endTime = (() => {
    const [hours, minutes] = appointment.appointment_time.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + appointment.duration_minutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
  })();

  const handleStatusChange = async (newStatus: "confirmed" | "completed") => {
    setLoading(true);
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        onUpdate();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancellation_reason: "Cancelado pelo médico" }),
      });

      if (response.ok) {
        onUpdate();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
    } finally {
      setLoading(false);
      setShowCancelDialog(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:w-[540px] sm:max-w-[540px] overflow-y-auto p-0">
          <div className="p-6">
            <SheetHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant={STATUS_BADGE_VARIANTS[appointment.status]}>
                  {APPOINTMENT_STATUS_LABELS[appointment.status]}
                </Badge>
              </div>
              <SheetTitle className="text-2xl">
                {appointment.appointment_time} - {endTime}
              </SheetTitle>
              <SheetDescription>
                {format(appointmentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Dados do Paciente */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  Paciente
                </h3>
                <Link
                  href={`/patients/${appointment.patient_id}`}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{appointment.patient.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {calculateAge(appointment.patient.date_of_birth)}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{appointment.patient.phone}</span>
                    </div>
                  </div>
                </Link>
              </div>

              <Separator />

              {/* Detalhes da Consulta */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  Detalhes da Consulta
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Tipo de Consulta</p>
                      <p className="text-sm text-muted-foreground">
                        {APPOINTMENT_TYPE_LABELS[appointment.appointment_type]}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Duração</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.duration_minutes} minutos
                      </p>
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="flex items-start gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Observações</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Criado em</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(appointment.created_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Ações */}
              <div className="space-y-3">
                {/* Botão Editar (disponível para pending e confirmed) */}
                {(appointment.status === "pending" || appointment.status === "confirmed") && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowEditModal(true)}
                    disabled={loading}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Agendamento
                  </Button>
                )}

                {appointment.status === "pending" && (
                  <div className="flex gap-3">
                    <Button
                      className="flex-1"
                      onClick={() => handleStatusChange("confirmed")}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirmar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-destructive"
                      onClick={() => setShowCancelDialog(true)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}

                {appointment.status === "confirmed" && (
                  <div className="flex gap-3">
                    <Button
                      className="flex-1"
                      asChild
                    >
                      <Link
                        href={`/consultations/new-recording?patient_id=${appointment.patient_id}&appointment_id=${appointment.id}`}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Iniciar Consulta
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-destructive"
                      onClick={() => setShowCancelDialog(true)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}

                {appointment.status === "completed" && (
                  <div className="text-center py-4">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-600" />
                    <p className="font-medium">Consulta Realizada</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Acesse o prontuário do paciente para mais detalhes
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog de Confirmação de Cancelamento */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar Agendamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Edição */}
      <EditAppointmentModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        appointment={appointment}
        onSuccess={() => {
          setShowEditModal(false);
          onUpdate();
          onOpenChange(false);
        }}
      />
    </>
  );
}
