"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AudioRecorder } from "./audio-recorder";
import { AudioUploader } from "./audio-uploader";
import { AudioPreview } from "./audio-preview";
import { ModeSelector } from "./mode-selector";
import { PatientSelector } from "./patient-selector";
import { PatientMiniCard } from "./patient-mini-card";
import { ProcessingStatus } from "./processing-status";
import { StepIndicator } from "./step-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
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
type FlowState = 
  | "select-patient" 
  | "select-mode" 
  | "input" 
  | "preview"
  | "processing" 
  | "completed";

const STEPS = [
  { id: "patient", label: "Paciente" },
  { id: "method", label: "Método" },
  { id: "audio", label: "Áudio" },
  { id: "review", label: "Revisão" },
  { id: "process", label: "Processar" },
];

export function NewConsultationRecording({ patients }: NewConsultationRecordingProps) {
  const router = useRouter();
  const [flowState, setFlowState] = useState<FlowState>("select-patient");
  const [inputMode, setInputMode] = useState<InputMode | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Audio state
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId),
    [patients, selectedPatientId]
  );

  const currentStepIndex = useMemo(() => {
    switch (flowState) {
      case "select-patient": return 0;
      case "select-mode": return 1;
      case "input": return 2;
      case "preview": return 3;
      case "processing": return 4;
      case "completed": return 5;
      default: return 0;
    }
  }, [flowState]);

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

  const handleAudioCaptured = (blob: Blob, duration: number) => {
    setAudioBlob(blob);
    setAudioDuration(duration);
    setFlowState("preview");
  };

  const handleConfirmAndUpload = async () => {
    if (!selectedPatientId || !audioBlob) {
      toast.error("Dados incompletos");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      const fileName = inputMode === "record" ? "consultation.webm" : "consultation.mp3";
      formData.append("audio", audioBlob, fileName);
      formData.append("patientId", selectedPatientId);
      formData.append("duration", audioDuration.toString());

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
      toast.success("Áudio enviado! Processando com IA...");
    } catch (err: any) {
      console.error("Erro no upload:", err);
      setError(err.message || "Erro ao processar áudio");
      toast.error("Erro ao enviar áudio");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReRecord = () => {
    setAudioBlob(null);
    setAudioDuration(0);
    setFlowState("input");
  };

  const handleProcessingComplete = (id: string) => {
    setFlowState("completed");
    toast.success("Consulta processada com sucesso!");
    setTimeout(() => {
      router.push(`/consultations/${id}/preview`);
    }, 1500);
  };

  const handleClearPatient = () => {
    setSelectedPatientId(null);
    setFlowState("select-patient");
    setInputMode(null);
    setAudioBlob(null);
    setAudioDuration(0);
  };

  const handleBack = () => {
    switch (flowState) {
      case "select-mode":
        setFlowState("select-patient");
        break;
      case "input":
        setFlowState("select-mode");
        setInputMode(null);
        break;
      case "preview":
        setFlowState("input");
        break;
    }
  };

  const showBackButton = ["select-mode", "input", "preview"].includes(flowState);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/consultations">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Nova Consulta</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <StepIndicator steps={STEPS} currentStep={currentStepIndex} />
      </div>

      {/* Patient Mini Card (shown after selection) */}
      {selectedPatient && flowState !== "select-patient" && flowState !== "completed" && (
        <div className="container mx-auto px-4 pb-4 max-w-3xl">
          <PatientMiniCard
            patient={selectedPatient}
            onClear={flowState === "select-mode" ? handleClearPatient : undefined}
            showClear={flowState === "select-mode"}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-8 max-w-3xl">
        <div className="space-y-6">
          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Select Patient */}
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

          {/* Step 2: Select Mode */}
          {flowState === "select-mode" && (
            <>
              <ModeSelector onSelectMode={handleModeSelected} />
              <div className="flex justify-start">
                <Button variant="ghost" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Input (Record/Upload) */}
          {flowState === "input" && (
            <>
              {inputMode === "record" && (
                <AudioRecorder
                  onRecordingComplete={handleAudioCaptured}
                  onCancel={handleBack}
                />
              )}
              {inputMode === "upload" && (
                <AudioUploader
                  onUploadComplete={handleAudioCaptured}
                  onCancel={handleBack}
                />
              )}
            </>
          )}

          {/* Step 4: Preview */}
          {flowState === "preview" && audioBlob && (
            <AudioPreview
              audioBlob={audioBlob}
              duration={audioDuration}
              onConfirm={handleConfirmAndUpload}
              onReRecord={handleReRecord}
              isUploading={isUploading}
            />
          )}

          {/* Step 5: Processing */}
          {flowState === "processing" && consultationId && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
                    <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Processando com IA</h2>
                  <p className="text-muted-foreground text-sm">
                    Estamos transcrevendo e analisando a consulta...
                  </p>
                </div>
                <ProcessingStatus
                  consultationId={consultationId}
                  onComplete={handleProcessingComplete}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 6: Completed */}
          {flowState === "completed" && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Consulta Processada!</h2>
                  <p className="text-muted-foreground">
                    Redirecionando para revisão...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
