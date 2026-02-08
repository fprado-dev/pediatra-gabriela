"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Upload, FileAudio, Bot, CheckCheck, AlertCircle, Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ProcessingStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  status: "pending" | "processing" | "completed" | "error";
}

interface ProcessingStatusProps {
  consultationId: string;
  onComplete?: (consultationId: string) => void;
  onError?: (errorMessage: string) => void;
}

export function ProcessingStatus({ consultationId, onComplete, onError }: ProcessingStatusProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasOriginalAudio, setHasOriginalAudio] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: "upload",
      label: "Upload do Áudio",
      description: "Enviando gravação para processamento",
      icon: <Upload className="h-4 w-4" />,
      status: "completed", // Já foi feito antes de chegar aqui
    },
    {
      id: "transcribe",
      label: "Transcrição",
      description: "Convertendo áudio em texto com IA",
      icon: <FileAudio className="h-4 w-4" />,
      status: "pending",
    },
    {
      id: "clean",
      label: "Limpeza de Texto",
      description: "Removendo ruídos e conversas irrelevantes",
      icon: <Bot className="h-4 w-4" />,
      status: "pending",
    },
    {
      id: "extract",
      label: "Extração de Campos",
      description: "Estruturando informações clínicas",
      icon: <CheckCheck className="h-4 w-4" />,
      status: "pending",
    },
  ]);

  // Polling real do status no Supabase
  useEffect(() => {
    const supabase = createClient();
    let pollingInterval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const { data: consultation, error: fetchError } = await supabase
          .from("consultations")
          .select("status, processing_steps, processing_error, original_audio_url")
          .eq("id", consultationId)
          .single();

        if (fetchError) {
          console.error("Erro ao buscar status:", fetchError);
          return;
        }

        if (!consultation) {
          console.error("Consulta não encontrada");
          return;
        }

        console.log("Status da consulta:", consultation.status);
        console.log("Processing steps:", consultation.processing_steps);

        // Verificar se tem áudio original disponível
        if (consultation.original_audio_url) {
          setHasOriginalAudio(true);
        }

        // Calcular progresso baseado nos steps
        const processingSteps = consultation.processing_steps || [];
        const completedSteps = (processingSteps as any[]).filter(
          (s: any) => s.status === "completed"
        ).length;

        // Atualizar steps UI baseado nos dados reais
        const newSteps = [...steps];
        if ((processingSteps as any[]).length > 0) {
          // Upload sempre completo
          // Transcribe
          const transcribeStep = (processingSteps as any[]).find((s: any) => s.step === "transcription");
          if (transcribeStep) {
            newSteps[1].status = transcribeStep.status === "completed" ? "completed" : "processing";
          }
          // Clean
          const cleanStep = (processingSteps as any[]).find((s: any) => s.step === "cleaning");
          if (cleanStep) {
            newSteps[2].status = cleanStep.status === "completed" ? "completed" : "processing";
          }
          // Extract
          const extractStep = (processingSteps as any[]).find((s: any) => s.step === "extraction");
          if (extractStep) {
            newSteps[3].status = extractStep.status === "completed" ? "completed" : "processing";
          }
          setSteps(newSteps);
        }

        // Calcular progresso: 25% por step (4 steps = 100%)
        const newProgress = Math.min(25 + (completedSteps * 20), 100);
        setProgress(newProgress);

        // Verificar status final
        if (consultation.status === "completed") {
          setProgress(100);
          clearInterval(pollingInterval);
          if (onComplete) {
            // Chamar onComplete imediatamente sem setTimeout
            onComplete(consultationId);
          }
        } else if (consultation.status === "error") {
          const errorMessage = consultation.processing_error || "Erro desconhecido no processamento";
          setError(errorMessage);
          clearInterval(pollingInterval);
          if (onError) {
            onError(errorMessage);
          }
        }
      } catch (err: any) {
        console.error("Erro no polling:", err);
      }
    };

    // Primeira verificação imediata
    checkStatus();

    // Polling a cada 2 segundos
    pollingInterval = setInterval(checkStatus, 2000);

    return () => clearInterval(pollingInterval);
  }, [consultationId, onComplete]);

  const updateStepStatus = (index: number, status: ProcessingStep["status"]) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, status } : step))
    );
  };

  return (
    <div className="space-y-6">
      {/* Barra de progresso principal */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 font-medium">Progresso</span>
          <span className="font-semibold text-gray-900">{progress}%</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* Lista de steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "flex items-start gap-4 p-4 rounded-lg border transition-all",
              step.status === "completed" && "bg-green-50 border-green-200",
              step.status === "processing" && "bg-blue-50 border-blue-200 animate-pulse",
              step.status === "pending" && "bg-gray-50 border-gray-200 opacity-60"
            )}
          >
            {/* Ícone de status */}
            <div className="flex-shrink-0 mt-0.5">
              {step.status === "completed" && (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              )}
              {step.status === "processing" && (
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              )}
              {step.status === "pending" && (
                <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
              )}
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-base text-gray-900">{step.label}</span>
                {step.status === "completed" && (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs">
                    Concluído
                  </Badge>
                )}
                {step.status === "processing" && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                    Em andamento
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>

            {/* Ícone do step */}
            <div className="flex-shrink-0 text-gray-400">
              {step.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 mb-3">{error}</p>

              {hasOriginalAudio && (
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/consultations/${consultationId}/original-audio`);
                        if (response.ok) {
                          const data = await response.json();
                          window.open(data.signedUrl, '_blank');
                        }
                      } catch (err) {
                        console.error('Erro ao baixar áudio original:', err);
                      }
                    }}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Baixar Áudio Original
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    disabled={isRetrying}
                    onClick={async () => {
                      try {
                        setIsRetrying(true);
                        setError(null);
                        setProgress(25); // Reset para início do processamento

                        const response = await fetch('/api/consultations/process', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            consultationId,
                            useOriginal: true
                          }),
                        });

                        if (response.ok) {
                          // Polling vai detectar e atualizar automaticamente
                        } else {
                          const data = await response.json();
                          setError(data.error || 'Erro ao reprocessar');
                          setIsRetrying(false);
                        }
                      } catch (err) {
                        console.error('Erro ao reprocessar:', err);
                        setError('Erro ao tentar reprocessar');
                        setIsRetrying(false);
                      }
                    }}
                    className="gap-2"
                  >
                    {isRetrying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Reprocessando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Reprocessar com Áudio Original
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Informação */}
      {progress < 100 && !error && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Este processo pode levar de 30 segundos a 2 minutos, dependendo do tamanho do áudio.
          </p>
        </div>
      )}
    </div>
  );
}
