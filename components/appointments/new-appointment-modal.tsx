"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, User, Plus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QuickPatientForm } from "./quick-patient-form";
import { createClient } from "@/lib/supabase/client";
import {
  AppointmentType,
  APPOINTMENT_TYPE_LABELS,
  TimeSlot,
} from "@/lib/types/appointment";

interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string;
  phone: string;
}

interface NewAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  preselectedDate?: Date;
  preselectedTime?: string;
}

export function NewAppointmentModal({
  open,
  onOpenChange,
  onSuccess,
  preselectedDate,
  preselectedTime = "",
}: NewAppointmentModalProps) {
  const [step, setStep] = useState<"form" | "quick-patient">("form");
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [date, setDate] = useState<Date | undefined>(preselectedDate);
  const [time, setTime] = useState<string>(preselectedTime);
  const [duration, setDuration] = useState<number>(60);
  const [appointmentType, setAppointmentType] =
    useState<AppointmentType>("consultation");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [suggestedSlots, setSuggestedSlots] = useState<
    { date: string; time: string }[]
  >([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Buscar pacientes
  useEffect(() => {
    if (open && step === "form") {
      fetchPatients();
    }
  }, [open, step, searchTerm]);

  // Atualizar estados quando props mudarem (ao abrir modal com pré-seleção)
  useEffect(() => {
    if (open) {
      setDate(preselectedDate);
      setTime(preselectedTime);
    }
  }, [open, preselectedDate, preselectedTime]);

  // Buscar slots disponíveis quando a data ou duração mudar
  useEffect(() => {
    if (date) {
      fetchAvailableSlots(date, duration);
    }
  }, [date, duration]);

  const fetchPatients = async () => {
    try {
      const supabase = createClient();
      let query = supabase
        .from("patients")
        .select("id, full_name, date_of_birth, phone")
        .order("full_name");

      if (searchTerm) {
        query = query.ilike("full_name", `%${searchTerm}%`);
      }

      const { data } = await query.limit(50);
      setPatients(data || []);
    } catch (err) {
      console.error("Error fetching patients:", err);
    }
  };

  const fetchAvailableSlots = async (selectedDate: Date, requestedDuration?: number) => {
    setLoadingSlots(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const dur = requestedDuration || duration;
      const response = await fetch(
        `/api/appointments/available-slots?date=${dateStr}&count=5&duration=${dur}`
      );
      const data = await response.json();

      setAvailableSlots(data.slots || []);
      setSuggestedSlots(data.suggested_slots || []);
    } catch (err) {
      console.error("Error fetching slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!selectedPatient || !date || !time) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          appointment_date: format(date, "yyyy-MM-dd"),
          appointment_time: time,
          duration_minutes: duration,
          appointment_type: appointmentType,
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.suggested_slots) {
          setSuggestedSlots(result.suggested_slots);
        }
        setError(
          result.validation_errors
            ? result.validation_errors.join(", ")
            : result.error
        );
        return;
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (err) {
      console.error("Error creating appointment:", err);
      setError("Erro ao criar agendamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep("form");
    setSelectedPatient(null);
    setDate(undefined);
    setTime("");
    setDuration(30);
    setAppointmentType("consultation");
    setNotes("");
    setError(null);
    setSearchTerm("");
  };

  const handleQuickPatientSuccess = (patientId: string, patientName: string) => {
    setSelectedPatient({
      id: patientId,
      full_name: patientName,
      date_of_birth: "",
      phone: "",
    });
    setStep("form");
    fetchPatients(); // Atualizar lista
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "form"
              ? "Novo Agendamento"
              : "Cadastro Rápido de Paciente"}
          </DialogTitle>
          <DialogDescription>
            {step === "form"
              ? "Preencha os dados para criar um novo agendamento"
              : "Cadastre um novo paciente rapidamente"}
          </DialogDescription>
        </DialogHeader>

        {step === "quick-patient" ? (
          <QuickPatientForm
            onSuccess={handleQuickPatientSuccess}
            onCancel={() => setStep("form")}
          />
        ) : (
          <div className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* 1. Seleção de Paciente */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Paciente <span className="text-red-500">*</span>
              </Label>
              
              {selectedPatient ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted">
                  <div className="flex-1">
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
              ) : (
                <>
                  <Input
                    placeholder="Buscar paciente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  
                  {patients.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border rounded-lg">
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
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setStep("quick-patient")}
                  >
                    <Plus className="h-4 w-4" />
                    Cadastrar Novo Paciente
                  </Button>
                </>
              )}
            </div>

            {/* 2. Data */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Data <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    data-empty={!date}
                    className={cn(
                      "w-full justify-start text-left font-normal h-11",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(date, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="p-0 shadow-lg border-2" 
                  align="start"
                  style={{ width: 'var(--radix-popover-trigger-width)' }}
                >
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) =>
                      date < new Date() || date.getDay() === 0 || date.getDay() === 6
                    }
                    initialFocus
                    locale={ptBR}
                    className="rounded-md"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 3. Horário */}
            {date && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horário <span className="text-red-500">*</span>
                </Label>
                
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.slice(0, 12).map((slot) => (
                        <Button
                          key={slot.time}
                          variant={time === slot.time ? "default" : "outline"}
                          size="sm"
                          disabled={!slot.available}
                          onClick={() => setTime(slot.time)}
                          className="justify-center"
                        >
                          {slot.time}
                        </Button>
                      ))}
                    </div>

                    {suggestedSlots.length > 0 && (
                      <div className="pt-2">
                        <p className="text-sm text-muted-foreground mb-2">
                          ✨ Próximos horários disponíveis:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {suggestedSlots.slice(0, 5).map((slot, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="cursor-pointer hover:bg-secondary/80"
                              onClick={() => {
                                setDate(new Date(slot.date));
                                setTime(slot.time);
                              }}
                            >
                              {format(new Date(slot.date), "dd/MM")} às {slot.time}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 4. Duração e Tipo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duração da Consulta</Label>
                <Select
                  value={duration.toString()}
                  onValueChange={(v) => {
                    setDuration(parseInt(v));
                    setTime(""); // Limpa horário selecionado ao mudar duração
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1h 30min</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Consulta</Label>
                <Select
                  value={appointmentType}
                  onValueChange={(v: AppointmentType) => setAppointmentType(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(APPOINTMENT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 5. Observações */}
            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Febre há 3 dias, tosse..."
                rows={3}
              />
            </div>

            {/* Ações */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Agendar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
