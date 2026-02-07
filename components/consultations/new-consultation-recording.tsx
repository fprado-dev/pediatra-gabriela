"use client";

import { useState, useMemo, useEffect } from "react";
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
import { DuplicateAudioDialog } from "./duplicate-audio-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle, CheckCircle2, Sparkles, Clock, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { calculateAudioHash } from "@/lib/utils/calculate-audio-hash";
import { divideIntoChunks, shouldUseChunking, generateSessionId } from "@/lib/utils/audio-chunker";
import { ConsultationType, PuericulturaSubtype } from "@/lib/types/consultation";

interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string;
  allergies?: string;
  blood_type?: string;
}

interface NewConsultationRecordingProps {
  patients: Patient[];
  preSelectedPatientId?: string;
  appointmentId?: string;
}

type InputMode = "record" | "upload";
type FlowState =
  | "select-patient"
  | "select-mode"
  | "input"
  | "preview"
  | "processing"
  | "completed"
  | "error";

const STEPS = [
  { id: "patient", label: "Paciente" },
  { id: "method", label: "Método" },
  { id: "audio", label: "Áudio" },
  { id: "review", label: "Revisão" },
  { id: "process", label: "Processar" },
];

const MIN_AUDIO_DURATION_SECONDS = 30;

export function NewConsultationRecording({
  patients,
  preSelectedPatientId,
  appointmentId
}: NewConsultationRecordingProps) {
  const router = useRouter();
  const [flowState, setFlowState] = useState<FlowState>(
    preSelectedPatientId ? "select-mode" : "select-patient"
  );
  const [inputMode, setInputMode] = useState<InputMode | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    preSelectedPatientId || null
  );
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Consultation type state (NOVO)
  const [consultationType, setConsultationType] = useState<ConsultationType | null>(null);
  const [consultationSubtype, setConsultationSubtype] = useState<PuericulturaSubtype | null>(null);

  // Audio state
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioHash, setAudioHash] = useState<string | null>(null);

  // Duplicate detection state
  const [duplicateInfo, setDuplicateInfo] = useState<{
    existingConsultation: {
      id: string;
      patientId: string;
      patientName: string;
      createdAt: string;
      status: string;
      hasTranscription: boolean;
    };
    isSamePatient: boolean;
  } | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [isReusing, setIsReusing] = useState(false);

  // Avança automaticamente se paciente já está selecionado (vindo da agenda)
  useEffect(() => {
    if (preSelectedPatientId && appointmentId) {
      toast.success("Paciente pré-selecionado do agendamento", {
        description: selectedPatient?.full_name || "Paciente selecionado"
      });
    }
  }, [preSelectedPatientId, appointmentId]);

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
      case "error": return 4;
      default: return 0;
    }
  }, [flowState]);

  const handlePatientSelected = () => {
    if (!selectedPatientId) {
      toast.error("Por favor, selecione um paciente");
      return;
    }
    if (!consultationType) {
      toast.error("Por favor, selecione o tipo de consulta");
      return;
    }
    if (consultationType === 'puericultura' && !consultationSubtype) {
      toast.error("Por favor, selecione o período de puericultura");
      return;
    }
    setFlowState("select-mode");
  };
  
  const handleConsultationTypeSelected = (type: ConsultationType, subtype?: PuericulturaSubtype) => {
    setConsultationType(type);
    setConsultationSubtype(subtype || null);
  };

  const handleModeSelected = (mode: InputMode) => {
    setInputMode(mode);
    setFlowState("input");
  };

  const handleAudioCaptured = (blob: Blob, duration: number) => {
    // Validar duração mínima
    if (duration < MIN_AUDIO_DURATION_SECONDS) {
      toast.error(
        `O áudio deve ter no mínimo ${MIN_AUDIO_DURATION_SECONDS} segundos. ` +
        `Duração atual: ${Math.floor(duration)} segundos.`
      );
      return;
    }

    setAudioBlob(blob);
    setAudioDuration(duration);
    setFlowState("preview");
  };

  const handleConfirmAndUpload = async () => {
    if (!selectedPatientId || !audioBlob) {
      toast.error("Dados incompletos");
      return;
    }

    // Validar novamente a duração
    if (audioDuration < MIN_AUDIO_DURATION_SECONDS) {
      toast.error(`O áudio deve ter no mínimo ${MIN_AUDIO_DURATION_SECONDS} segundos`);
      return;
    }

    setIsUploading(true);
    setError(null);
    setProcessingError(null);
    setUploadProgress(0);

    try {
      const audioSizeMB = audioBlob.size / (1024 * 1024);
      const useChunking = shouldUseChunking(audioBlob.size);

      if (useChunking) {
        console.log(`📦 Arquivo grande (${audioSizeMB.toFixed(1)}MB), usando upload chunked`);
        toast.info("Enviando arquivo grande em partes...", {
          description: `${audioSizeMB.toFixed(1)}MB será dividido em chunks de 4MB`,
        });
      }

      let hash: string | null = null;
      // 1. Calcular hash do áudio (sempre, mesmo para arquivos grandes)
      console.log("🔢 Calculando hash do áudio...");
      setUploadProgress(5);

      try {
        hash = await calculateAudioHash(audioBlob);
        setAudioHash(hash);
        console.log(`✅ Hash calculado: ${hash.substring(0, 16)}...`);
        setUploadProgress(10);
      } catch (hashError) {
        console.warn("⚠️ Não foi possível calcular hash, continuando sem verificação:", hashError);
      }

      // 2. Verificar se é duplicata (sempre, mesmo para arquivos grandes)
      if (hash) {
        console.log("🔍 Verificando duplicatas...");
        setUploadProgress(15);

        try {
          const checkResponse = await fetch(
            `/api/consultations/check-duplicate?hash=${hash}&patientId=${selectedPatientId}`
          );

          if (checkResponse.ok) {
            const checkData = await checkResponse.json();

            // Se encontrou duplicata, mostrar diálogo e parar aqui
            if (checkData.duplicate) {
              console.log("♻️ Duplicata detectada, mostrando opções ao usuário");
              setDuplicateInfo(checkData);
              setShowDuplicateDialog(true);
              setIsUploading(false);
              setUploadProgress(0);
              return; // Para aqui e aguarda decisão do usuário
            } else {
              console.log("✅ Nenhuma duplicata encontrada, prosseguindo com upload");
            }
          } else {
            console.warn("⚠️ Erro ao verificar duplicatas, continuando com upload normal");
          }
        } catch (checkError) {
          console.warn("⚠️ Falha na verificação de duplicatas, continuando:", checkError);
        }
      }

      setUploadProgress(20);

      // 3. Fazer upload (chunked ou normal dependendo do tamanho)
      if (useChunking) {
        await uploadChunked(hash);
      } else {
        await uploadAudioNormally(hash);
      }
    } catch (err: any) {
      console.error("❌ Erro no processo de upload:", err);
      setError(err.message || "Erro ao processar áudio");
      toast.error("Erro ao enviar áudio");
      setIsUploading(false);
    }
  };

  // Função para upload chunked (arquivos grandes)
  const uploadChunked = async (hash: string | null) => {
    try {
      if (!audioBlob) throw new Error("Áudio não disponível");

      // Determinar nome e tipo do arquivo baseado no blob
      const fileType = audioBlob.type || "audio/webm";
      const extension = fileType.includes("mp4") ? "mp4" : fileType.includes("webm") ? "webm" : "mp3";
      const fileName = `audio.${extension}`;

      console.log(`📝 Arquivo detectado: ${fileName} (${fileType})`);

      const chunks = divideIntoChunks(audioBlob, undefined, fileName);
      const sessionId = chunks[0].metadata.sessionId; // Usar sessionId dos chunks

      console.log(`🧩 Iniciando upload chunked: ${chunks.length} chunks (session: ${sessionId.substring(0, 20)}...)`);

      // Enviar cada chunk sequencialmente
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const formData = new FormData();

        formData.append("chunk", chunk.blob);
        formData.append("sessionId", chunk.metadata.sessionId);
        formData.append("chunkIndex", chunk.metadata.chunkIndex.toString());
        formData.append("totalChunks", chunk.metadata.totalChunks.toString());

        console.log(`📤 Enviando chunk ${i + 1}/${chunks.length}...`);

        const response = await fetch("/api/consultations/upload-chunk", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Erro ao enviar chunk ${i + 1}`);
        }

        // Atualizar progresso (20% já foi usado para hash/duplicata, 20-90% para chunks)
        const chunkProgress = 20 + Math.round(((i + 1) / chunks.length) * 70);
        setUploadProgress(chunkProgress);

        console.log(`✅ Chunk ${i + 1}/${chunks.length} enviado (${chunkProgress}%)`);
      }

      console.log(`✅ Todos os chunks enviados, finalizando upload...`);
      setUploadProgress(90);

      // Finalizar upload (servidor juntará os chunks)
      const formData = new FormData();
      formData.append("sessionId", sessionId); // Usar o mesmo sessionId dos chunks
      formData.append("patientId", selectedPatientId!);
      formData.append("duration", audioDuration.toString());
      formData.append("fileName", fileName);
      formData.append("fileType", fileType);
      if (hash) {
        formData.append("hash", hash);
      }
      // Adicionar tipo de consulta (NOVO)
      if (consultationType) {
        formData.append("consultationType", consultationType);
      }
      if (consultationSubtype) {
        formData.append("consultationSubtype", consultationSubtype);
      }

      const response = await fetch("/api/consultations/upload-audio", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao finalizar upload");
      }

      const data = await response.json();
      setUploadProgress(100);
      setConsultationId(data.consultationId);
      setFlowState("processing");
      toast.success("Áudio enviado com sucesso!");

      // Iniciar processamento
      fetch("/api/consultations/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultationId: data.consultationId }),
      }).catch((err) => {
        console.error("Erro ao iniciar processamento:", err);
      });
    } finally {
      setIsUploading(false);
      // Não resetar uploadProgress aqui - deixar visível até transição para "processing"
    }
  };

  // Função auxiliar para fazer upload normal
  const uploadAudioNormally = async (hash: string | null) => {
    try {
      if (!audioBlob) {
        throw new Error("Áudio não disponível");
      }

      const formData = new FormData();

      // Detectar extensão baseada no tipo do blob ou modo de input
      let fileName = "consultation.mp3"; // padrão
      if (inputMode === "record") {
        fileName = "consultation.webm";
      } else if (audioBlob.type) {
        // Detectar extensão pelo MIME type
        if (audioBlob.type.includes("mp4")) {
          fileName = "consultation.mp4";
        } else if (audioBlob.type.includes("webm")) {
          fileName = "consultation.webm";
        } else if (audioBlob.type.includes("wav")) {
          fileName = "consultation.wav";
        } else if (audioBlob.type.includes("m4a")) {
          fileName = "consultation.m4a";
        } else if (audioBlob.type.includes("aac")) {
          fileName = "consultation.aac";
        } else if (audioBlob.type.includes("ogg")) {
          fileName = "consultation.ogg";
        }
      }

      console.log(`📤 Preparando upload: ${fileName} (${(audioBlob.size / 1024 / 1024).toFixed(2)}MB)`);

      formData.append("audio", audioBlob, fileName);
      formData.append("patientId", selectedPatientId!);
      formData.append("duration", audioDuration.toString());
      if (hash) {
        formData.append("hash", hash);
      }
      // Adicionar tipo de consulta (NOVO)
      if (consultationType) {
        formData.append("consultationType", consultationType);
      }
      if (consultationSubtype) {
        formData.append("consultationSubtype", consultationSubtype);
      }

      // Simular progresso durante upload (20% já foi usado para hash/duplicata)
      setUploadProgress(30);
      
      // Usar XMLHttpRequest para ter progresso real de upload
      await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Listener de progresso
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            // Mapear progresso de upload (0-100%) para nossa escala (30-90%)
            const percentComplete = (e.loaded / e.total) * 100;
            const mappedProgress = 30 + Math.round((percentComplete / 100) * 60);
            setUploadProgress(mappedProgress);
            console.log(`📊 Upload: ${percentComplete.toFixed(0)}% (${mappedProgress}%)`);
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(90);
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || "Erro ao fazer upload do áudio"));
            } catch {
              reject(new Error(`Erro HTTP ${xhr.status}`));
            }
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Erro de rede ao fazer upload'));
        });
        
        xhr.open('POST', '/api/consultations/upload-audio');
        xhr.send(formData);
      }).then((data) => {
        setUploadProgress(100);
        setConsultationId(data.consultationId);
        setFlowState("processing");
        toast.success("Áudio enviado! Processando com IA...");

        // Iniciar processamento (chamada separada para funcionar na Vercel)
        fetch("/api/consultations/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consultationId: data.consultationId }),
        }).catch((err) => {
          console.error("Erro ao iniciar processamento:", err);
        });
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReRecord = () => {
    setAudioBlob(null);
    setAudioDuration(0);
    setFlowState("input");
    setProcessingError(null);
    setUploadProgress(0); // Resetar progresso ao regravar
  };

  // Handlers para o diálogo de duplicata
  const handleViewExisting = () => {
    if (duplicateInfo?.existingConsultation.id) {
      router.push(`/consultations/${duplicateInfo.existingConsultation.id}/preview`);
    }
  };

  const handleReuse = async () => {
    if (!duplicateInfo || !selectedPatientId) return;

    setIsReusing(true);
    try {
      const response = await fetch("/api/consultations/reuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceConsultationId: duplicateInfo.existingConsultation.id,
          patientId: selectedPatientId,
          // timerId: se tiver timer, adicionar aqui
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao reutilizar consulta");
      }

      const data = await response.json();

      toast.success("Consulta criada instantaneamente! ⚡", {
        description: "Dados reutilizados com sucesso. Você economizou tempo e custos.",
      });

      // Redirecionar para a nova consulta
      router.push(`/consultations/${data.consultationId}/preview`);
    } catch (err: any) {
      console.error("Erro ao reutilizar consulta:", err);
      toast.error("Erro ao reutilizar consulta", {
        description: err.message,
      });
    } finally {
      setIsReusing(false);
    }
  };

  const handleProcessAnyway = async () => {
    setShowDuplicateDialog(false);
    setIsUploading(true);

    toast.info("Processando áudio novamente...", {
      description: "Isso consumirá tempo e recursos de API.",
    });

    // Fazer upload normal ignorando a duplicata
    await uploadAudioNormally(audioHash);
  };

  const handleCancelDuplicate = () => {
    setShowDuplicateDialog(false);
    setDuplicateInfo(null);
  };

  const handleProcessingComplete = (id: string) => {
    toast.success("Consulta processada com sucesso!");
    setUploadProgress(0); // Resetar progresso ao completar
    // Redirecionar imediatamente sem setTimeout para evitar refresh
    router.push(`/consultations/${id}/preview`);
  };

  const handleProcessingError = (errorMessage: string) => {
    setProcessingError(errorMessage);
    setFlowState("error");
  };

  const handleClearPatient = () => {
    setSelectedPatientId(null);
    setFlowState("select-patient");
    setInputMode(null);
    setAudioBlob(null);
    setAudioDuration(0);
    setProcessingError(null);
  };

  const handleStartOver = () => {
    setAudioBlob(null);
    setAudioDuration(0);
    setConsultationId(null);
    setFlowState("select-mode");
    setProcessingError(null);
    setError(null);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 max-w-7xl mx-auto">
          <div className="py-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Nova Consulta
                </h1>
                <p className="text-gray-600 mt-1">
                  Grave ou envie um áudio para criar uma nova consulta
                </p>
              </div>
              <Link href="/consultations">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="pb-6">
            <StepIndicator steps={STEPS} currentStep={currentStepIndex} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-6 py-8 max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Patient Mini Card (shown after selection) */}
          {selectedPatient && flowState !== "select-patient" && flowState !== "completed" && (
            <PatientMiniCard
              patient={selectedPatient}
              onClear={flowState === "select-mode" ? handleClearPatient : undefined}
              showClear={flowState === "select-mode"}
            />
          )}
          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Select Patient & Consultation Type */}
          {flowState === "select-patient" && (
            <PatientSelector
              patients={patients}
              selectedPatientId={selectedPatientId}
              onSelectPatient={setSelectedPatientId}
              selectedConsultationType={consultationType}
              selectedConsultationSubtype={consultationSubtype}
              onSelectConsultationType={handleConsultationTypeSelected}
              onContinue={handlePatientSelected}
            />
          )}

          {/* Step 2: Select Mode */}
          {flowState === "select-mode" && (
            <>
              <ModeSelector onSelectMode={handleModeSelected} />

              {/* Info sobre duração mínima */}
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  O áudio deve ter no mínimo <strong>{MIN_AUDIO_DURATION_SECONDS} segundos</strong> para
                  que a IA possa extrair informações adequadas da consulta.
                </AlertDescription>
              </Alert>

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
              uploadProgress={uploadProgress}
            />
          )}

          {/* Step 5: Processing */}
          {flowState === "processing" && consultationId && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mb-6">
                  <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Processando com IA
                </h2>
                <p className="text-gray-600">
                  Estamos transcrevendo e analisando a consulta...
                </p>
              </div>
              <ProcessingStatus
                consultationId={consultationId}
                onComplete={handleProcessingComplete}
                onError={handleProcessingError}
              />
            </div>
          )}

          {/* Error State - Insufficient Data */}
          {flowState === "error" && (
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-red-50 mb-6">
                  <AlertCircle className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Não foi possível processar
                </h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {processingError || "O áudio não contém informações suficientes para extrair dados da consulta."}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" onClick={handleStartOver} size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                  <Link href="/consultations">
                    <Button variant="ghost" size="sm">
                      Voltar para Consultas
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Completed */}
          {flowState === "completed" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-green-50 mb-8">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Consulta Processada!
                </h2>
                <p className="text-gray-600 text-lg">
                  Redirecionando para revisão...
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Diálogo de Duplicata */}
      {duplicateInfo && selectedPatient && (
        <DuplicateAudioDialog
          open={showDuplicateDialog}
          existingConsultation={duplicateInfo.existingConsultation}
          currentPatientId={selectedPatientId!}
          currentPatientName={selectedPatient.full_name}
          isSamePatient={duplicateInfo.isSamePatient}
          onViewExisting={handleViewExisting}
          onReuse={handleReuse}
          onProcessAnyway={handleProcessAnyway}
          onCancel={handleCancelDuplicate}
          isReusing={isReusing}
        />
      )}
    </div>
  );
}
