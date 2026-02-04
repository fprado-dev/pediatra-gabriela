"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, User, Clock, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import type { AppointmentWithPatient } from "@/lib/types/appointment";

interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string;
  phone: string;
}

interface StartTimerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  preselectedAppointment?: AppointmentWithPatient;
}

export function StartTimerModal({
  open,
  onOpenChange,
  onSuccess,
  preselectedAppointment,
}: StartTimerModalProps) {
  const [mode, setMode] = useState<"appointment" | "manual">(
    preselectedAppointment ? "appointment" : "manual"
  );
  const [todayAppointments, setTodayAppointments] = useState<AppointmentWithPatient[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithPatient | null>(
    preselectedAppointment || null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Buscar agendamentos de hoje
  useEffect(() => {
    if (open && mode === "appointment") {
      fetchTodayAppointments();
    }
  }, [open, mode]);

  // Buscar pacientes ao digitar
  useEffect(() => {
    if (open && mode === "manual" && searchTerm.length >= 2) {
      fetchPatients();
    }
  }, [open, mode, searchTerm]);

  const fetchTodayAppointments = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const response = await fetch(`/api/appointments?date=${today}&status=confirmed`);
      const data = await response.json();
      setTodayAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const fetchPatients = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      let query = supabase
        .from("patients")
        .select("*")
        .eq("doctor_id", user.id)
        .eq("is_active", true)
        .order("full_name");

      if (searchTerm.trim()) {
        query = query.ilike("full_name", `%${searchTerm}%`);
      }

      const { data } = await query.limit(10);
      setPatients(data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const handleStartFromAppointment = async (appointment: AppointmentWithPatient) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/timers/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: appointment.patient_id,
          appointment_id: appointment.id,
          started_from: "appointment",
        }),
      });

      if (response.ok) {
        toast.success("Timer iniciado!", {
          description: `Atendimento de ${appointment.patient.full_name}`,
        });
        onSuccess();
      } else {
        const data = await response.json();
        if (response.status === 409) {
          toast.error("Já existe uma consulta em andamento", {
            description: `Finalize o atendimento de ${data.existing_timer.patient.full_name} primeiro`,
          });
        } else {
          toast.error(data.error || "Erro ao iniciar timer");
        }
      }
    } catch (error) {
      toast.error("Erro ao iniciar timer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartManual = async () => {
    if (!selectedPatient) {
      toast.error("Selecione um paciente");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/timers/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          started_from: "manual",
        }),
      });

      if (response.ok) {
        toast.success("Timer iniciado!", {
          description: `Atendimento de ${selectedPatient.full_name}`,
        });
        onSuccess();
      } else {
        const data = await response.json();
        if (response.status === 409) {
          toast.error("Já existe uma consulta em andamento", {
            description: `Finalize o atendimento de ${data.existing_timer.patient.full_name} primeiro`,
          });
        } else {
          toast.error(data.error || "Erro ao iniciar timer");
        }
      }
    } catch (error) {
      toast.error("Erro ao iniciar timer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Iniciar Nova Consulta</DialogTitle>
          <DialogDescription>
            Escolha um agendamento ou inicie uma consulta avulsa
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="appointment">
              <Calendar className="h-4 w-4 mr-2" />
              Agendamento
            </TabsTrigger>
            <TabsTrigger value="manual">
              <User className="h-4 w-4 mr-2" />
              Avulso
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointment" className="space-y-4 mt-4">
            <div>
              <Label>Agendamentos de Hoje (Confirmados)</Label>
              {todayAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">
                  Nenhum agendamento confirmado para hoje
                </p>
              ) : (
                <div className="mt-2 space-y-2 max-h-[300px] overflow-y-auto">
                  {todayAppointments.map((apt) => (
                    <button
                      key={apt.id}
                      className="w-full text-left p-3 border rounded-lg hover:bg-muted transition-colors"
                      onClick={() => handleStartFromAppointment(apt)}
                      disabled={isLoading}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{apt.patient.full_name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3" />
                            {apt.appointment_time.substring(0, 5)} - {apt.duration_minutes}min
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Buscar Paciente</Label>
              <Input
                placeholder="Digite o nome do paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {selectedPatient ? (
              <div className="p-3 border rounded-lg bg-muted">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedPatient.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPatient.phone}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPatient(null)}
                  >
                    Alterar
                  </Button>
                </div>
              </div>
            ) : (
              patients.length > 0 && (
                <div className="max-h-[200px] overflow-y-auto border rounded-lg">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      className="w-full text-left p-3 hover:bg-muted transition-colors border-b last:border-b-0"
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <p className="font-medium">{patient.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {patient.phone}
                      </p>
                    </button>
                  ))}
                </div>
              )
            )}

            <Button
              className="w-full"
              disabled={!selectedPatient || isLoading}
              onClick={handleStartManual}
            >
              <Clock className="h-4 w-4 mr-2" />
              Iniciar Consulta Avulsa
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
