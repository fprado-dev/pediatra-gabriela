"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AudioRecorder } from "./audio-recorder";
import { AudioUploader } from "./audio-uploader";
import { ModeSelector } from "./mode-selector";
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

type InputMode = "record" | "upload";
type FlowState = "select-patient" | "select-mode" | "input" | "processing" | "completed";

export function NewConsultationRecording({ patients }: NewConsultationRecordingProps) {
  const router = useRouter();
  const [flowState, setFlowState] = useState<FlowState>("select-patient");
  const [inputMode, setInputMode] = useState<InputMode | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePatientSelected = () => {
    if (!selectedPatientId) {
      toast.error("Por favor, selecione um paciente");
      return;
    }
    setFlowState("select-mode");
  };

  const handleModeSelected = (mode: InputMode) => {
    setInputMode(mode);
    setFlowState("input");
  };

  const handleAudioComplete = async (audioBlob: Blob, duration: number) => {
    if (!selectedPatientId) {
      toast.error("Paciente não selecionado");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Criar FormData para upload
      const formData = new FormData();
      
      // Determinar extensão baseada no modo
      const fileName = inputMode === "record" ? "consultation.webm" : "consultation.mp3";
      formData.append("audio", audioBlob, fileName);
      formData.append("patientId", selectedPatientId);
      formData.append("duration", duration.toString());

      // Upload do áudio
      const response = await fetch("/api/consultations/upload-audio", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao fazer upload do áudio");
      }

      const data = await response.json();
      setConsultationId(data.consultationId);
      setFlowState("processing");
      
      toast.success("Áudio enviado! Processando...");
    } catch (err: any) {
      console.error("Erro no upload:", err);
      setError(err.message || "Erro ao processar áudio");
      toast.error("Erro ao enviar áudio");
    } finally {
      setIsUploading(false);
    }
  };

  const handleProcessingComplete = (consultationId: string) => {
    setFlowState("completed");
    toast.success("Consulta processada com sucesso!");
    
    // Redirecionar para preview da consulta
    setTimeout(() => {
      router.push(`/consultations/${consultationId}/preview`);
    }, 1500);
  };

  const handleBackToPatientSelection = () => {
    setFlowState("select-patient");
    setInputMode(null);
  };

  const handleBackToModeSelection = () => {
    setFlowState("select-mode");
    setInputMode(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/consultations">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Nova Consulta</h1>
              <p className="text-sm text-muted-foreground">
                {flowState === "select-patient" && "Selecione o paciente"}
                {flowState === "select-mode" && "Escolha como adicionar o áudio"}
                {flowState === "input" && inputMode === "record" && "Grave a consulta"}
                {flowState === "input" && inputMode === "upload" && "Envie o arquivo de áudio"}
                {flowState === "processing" && "Processando com IA..."}
                {flowState === "completed" && "Consulta processada!"}
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
                  Continuar
                </Button>
              </div>
            </>
          )}

          {/* Fluxo: Seleção de Modo */}
          {flowState === "select-mode" && (
            <>
              <ModeSelector onSelectMode={handleModeSelected} />
              <div className="flex justify-start">
                <Button
                  variant="ghost"
                  onClick={handleBackToPatientSelection}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </>
          )}

          {/* Fluxo: Input (Gravação ou Upload) */}
          {flowState === "input" && (
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
                    onClick={handleBackToModeSelection}
                  >
                    Alterar Método
                  </Button>
                </div>
              </div>

              {inputMode === "record" && (
                <AudioRecorder
                  onRecordingComplete={handleAudioComplete}
                  onCancel={handleBackToModeSelection}
                />
              )}

              {inputMode === "upload" && (
                <AudioUploader
                  onUploadComplete={handleAudioComplete}
                  onCancel={handleBackToModeSelection}
                />
              )}

              {isUploading && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Enviando áudio...
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
