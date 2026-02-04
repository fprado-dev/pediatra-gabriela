"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Download,
  Sparkles,
  FileText,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ProcessingStep = {
  step: string;
  status: "in_progress" | "completed" | "error";
  timestamp: string;
};

interface ProcessingRetryProps {
  consultationId: string;
  status: string;
  processingSteps?: ProcessingStep[];
  processingError?: string;
  rawTranscription?: string;
  cleanedTranscription?: string;
}

const STEP_INFO = {
  download: {
    label: "Download do Áudio",
    icon: Download,
    description: "Baixando áudio do R2",
    canRetry: false,
  },
  transcription: {
    label: "Transcrição",
    icon: FileText,
    description: "Convertendo áudio em texto com Whisper",
    canRetry: true,
  },
  cleaning: {
    label: "Limpeza de Texto",
    icon: Sparkles,
    description: "Removendo ruídos e organizando conteúdo",
    canRetry: true,
  },
  extraction: {
    label: "Extração de Campos",
    icon: FileText,
    description: "Estruturando informações médicas",
    canRetry: true,
  },
};

export function ProcessingRetry({
  consultationId,
  status,
  processingSteps = [],
  processingError,
  rawTranscription,
  cleanedTranscription,
}: ProcessingRetryProps) {
  const router = useRouter();
  const [retryingStep, setRetryingStep] = useState<string | null>(null);

  const handleRetry = async (step: string) => {
    setRetryingStep(step);
    
    try {
      const response = await fetch(`/api/consultations/${consultationId}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao tentar novamente");
      }

      toast.success(data.message);
      
      // Se completou a extração, redirecionar para preview
      if (step === "extraction" && data.nextStep === null) {
        setTimeout(() => {
          router.push(`/consultations/${consultationId}/preview`);
        }, 1500);
      } else {
        // Recarregar a página para atualizar status
        setTimeout(() => {
          router.refresh();
        }, 1000);
      }
    } catch (error: any) {
      console.error("Erro no retry:", error);
      toast.error(error.message || "Erro ao tentar novamente");
    } finally {
      setRetryingStep(null);
    }
  };

  const getStepStatus = (stepName: string): "in_progress" | "completed" | "error" | "pending" => {
    const step = processingSteps.find(s => s.step === stepName);
    if (!step) return "pending";
    return step.status;
  };

  const canRetryStep = (stepName: string): boolean => {
    const stepStatus = getStepStatus(stepName);
    
    // Pode fazer retry se:
    // 1. A etapa falhou (error)
    // 2. A etapa está em progresso há muito tempo (timeout)
    // 3. Para cleaning: precisa ter transcription
    // 4. Para extraction: precisa ter cleaning
    
    if (stepName === "transcription") {
      return stepStatus === "error" || stepStatus === "in_progress";
    }
    
    if (stepName === "cleaning") {
      return (stepStatus === "error" || stepStatus === "in_progress") && !!rawTranscription;
    }
    
    if (stepName === "extraction") {
      return (stepStatus === "error" || stepStatus === "in_progress") && !!cleanedTranscription;
    }
    
    return false;
  };

  const renderStepIcon = (stepName: string) => {
    const stepStatus = getStepStatus(stepName);
    const isRetrying = retryingStep === stepName;

    if (isRetrying) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    switch (stepStatus) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "in_progress":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const renderStepBadge = (stepName: string) => {
    const stepStatus = getStepStatus(stepName);
    
    switch (stepStatus) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">Concluído</Badge>;
      case "error":
        return <Badge variant="destructive">Falhou</Badge>;
      case "in_progress":
        return <Badge variant="secondary">Em progresso...</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  // Mostrar apenas se houver erro ou etapas em progresso
  if (status === "completed") {
    return null;
  }

  return (
    <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
              <AlertTriangle className="h-5 w-5" />
              Processamento Interrompido
            </CardTitle>
            <CardDescription>
              O processamento não foi concluído. Você pode tentar novamente cada etapa individualmente.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {processingError && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">
              <strong>Erro:</strong> {processingError}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {Object.entries(STEP_INFO).map(([stepKey, stepData]) => {
            const Icon = stepData.icon;
            const stepStatus = getStepStatus(stepKey);
            const canRetry = canRetryStep(stepKey);
            const isRetrying = retryingStep === stepKey;

            return (
              <div
                key={stepKey}
                className="flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-gray-950"
              >
                <div className="flex items-center gap-3 flex-1">
                  {renderStepIcon(stepKey)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{stepData.label}</p>
                      {renderStepBadge(stepKey)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stepData.description}
                    </p>
                  </div>
                </div>

                {stepData.canRetry && canRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRetry(stepKey)}
                    disabled={isRetrying}
                    className="ml-4"
                  >
                    {isRetrying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Tentar Novamente
                      </>
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <Alert>
          <AlertDescription className="text-xs">
            <strong>Dica:</strong> As etapas já concluídas não serão reprocessadas. 
            Apenas tente novamente a etapa que falhou para continuar de onde parou.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
