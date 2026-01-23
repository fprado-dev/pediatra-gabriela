"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AudioRecorder } from "./audio-recorder";
import { PatientSelector } from "./patient-selector";
import { ProcessingStatus } from "./processing-status";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string;
  allergies?: string;
  blood_type?: string;
}

interface NewConsultationRecordingProps {
  patients: Patient[];
}

type FlowState = "select-patient" | "recording" | "processing" | "completed";

export function NewConsultationRecording({ patients }: NewConsultationRecordingProps) {
  const router = useRouter();
  const [flowState, setFlowState] = useState<FlowState>("select-patient");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePatientSelected = () => {
    if (!selectedPatientId) {
      toast.error("Por favor, selecione um paciente");
      return;
    }
    setFlowState("recording");
  };

  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    if (!selectedPatientId) {
      toast.error("Paciente não selecionado");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Criar FormData para upload
      const formData = new FormData();
      formData.append("audio", audioBlob, "consultation.webm");
      formData.append("patientId", selectedPatientId);
      formData.append("duration", duration.toString());

      // Upload do áudio (esta rota será criada no backend)
      const response = await fetch("/api/consultations/upload-audio", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro ao fazer upload do áudio");
      }

      const data = await response.json();
      setConsultationId(data.consultationId);
      setFlowState("processing");
      
      toast.success("Áudio enviado! Processando...");
    } catch (err: any) {
      console.error("Erro no upload:", err);
      setError(err.message || "Erro ao processar gravação");
      toast.error("Erro ao enviar gravação");
    } finally {
      setIsUploading(false);
    }
  };

  const handleProcessingComplete = (consultationId: string) => {
    setFlowState("completed");
    toast.success("Consulta processada com sucesso!");
    
    // Redirecionar para preview da consulta
    setTimeout(() => {
      router.push(`/dashboard/consultations/${consultationId}/preview`);
    }, 1500);
  };

  const handleBackToPatientSelection = () => {
    setFlowState("select-patient");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/consultations">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Nova Consulta com Gravação</h1>
              <p className="text-sm text-muted-foreground">
                Grave a consulta e deixe a IA gerar a documentação
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          {/* Erro global */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Fluxo: Seleção de Paciente */}
          {flowState === "select-patient" && (
            <>
              <PatientSelector
                patients={patients}
                selectedPatientId={selectedPatientId}
                onSelectPatient={setSelectedPatientId}
              />
              <div className="flex justify-end">
                <Button
                  size="lg"
                  onClick={handlePatientSelected}
                  disabled={!selectedPatientId}
                >
                  Continuar para Gravação
                </Button>
              </div>
            </>
          )}

          {/* Fluxo: Gravação */}
          {flowState === "recording" && (
            <>
              {/* Info do paciente selecionado */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Paciente selecionado:</p>
                    <p className="font-semibold">
                      {patients.find((p) => p.id === selectedPatientId)?.full_name}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToPatientSelection}
                  >
                    Alterar
                  </Button>
                </div>
              </div>

              <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                onCancel={handleBackToPatientSelection}
              />

              {isUploading && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Enviando gravação...
                  </p>
                </div>
              )}
            </>
          )}

          {/* Fluxo: Processamento */}
          {flowState === "processing" && consultationId && (
            <ProcessingStatus
              consultationId={consultationId}
              onComplete={handleProcessingComplete}
            />
          )}

          {/* Fluxo: Concluído (temporário, antes do redirect) */}
          {flowState === "completed" && (
            <div className="text-center py-12">
              <div className="mb-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-3xl">✓</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Consulta Processada!</h2>
              <p className="text-muted-foreground">
                Redirecionando para revisão...
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
