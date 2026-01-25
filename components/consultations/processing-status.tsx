"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Upload, FileAudio, Bot, CheckCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
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
          .select("status, processing_steps, processing_error")
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

        // Calcular progresso baseado nos steps
        const processingSteps = consultation.processing_steps || [];
        const completedSteps = processingSteps.filter(
          (s: any) => s.status === "completed"
        ).length;

        // Atualizar steps UI baseado nos dados reais
        const newSteps = [...steps];
        if (processingSteps.length > 0) {
          // Upload sempre completo
          // Transcribe
          const transcribeStep = processingSteps.find((s: any) => s.step === "transcription");
          if (transcribeStep) {
            newSteps[1].status = transcribeStep.status === "completed" ? "completed" : "processing";
          }
          // Clean
          const cleanStep = processingSteps.find((s: any) => s.step === "cleaning");
          if (cleanStep) {
            newSteps[2].status = cleanStep.status === "completed" ? "completed" : "processing";
          }
          // Extract
          const extractStep = processingSteps.find((s: any) => s.step === "extraction");
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
            setTimeout(() => onComplete(consultationId), 1000);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 animate-pulse" />
          Processando Consulta com IA
        </CardTitle>
        <CardDescription>
          Aguarde enquanto processamos a gravação e geramos a documentação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Barra de progresso principal */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Lista de steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg transition-all",
                step.status === "completed" && "bg-green-50 dark:bg-green-950/20",
                step.status === "processing" && "bg-primary/5 animate-pulse",
                step.status === "pending" && "opacity-50"
              )}
            >
              {/* Ícone de status */}
              <div className="flex-shrink-0 mt-0.5">
                {step.status === "completed" && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {step.status === "processing" && (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                )}
                {step.status === "pending" && (
                  <div className="h-5 w-5 rounded-full border-2 border-muted" />
                )}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{step.label}</span>
                  {step.status === "completed" && (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">
                      Concluído
                    </Badge>
                  )}
                  {step.status === "processing" && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                      Em andamento
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>

              {/* Ícone do step */}
              <div className="flex-shrink-0 text-muted-foreground">
                {step.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Mensagem de conclusão */}
        {progress === 100 && (
          <div className="text-center py-4 space-y-2">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <p className="font-semibold text-green-600">Processamento Concluído!</p>
            <p className="text-sm text-muted-foreground">
              Redirecionando para revisão da consulta...
            </p>
          </div>
        )}

        {/* Erro */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Informação */}
        {progress < 100 && !error && (
          <div className="text-xs text-center text-muted-foreground">
            Este processo pode levar de 30 segundos a 2 minutos, dependendo do tamanho do áudio.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
