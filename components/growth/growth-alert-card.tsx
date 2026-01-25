"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Scale,
  Ruler,
  Brain,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GrowthAlert, GrowthAnalysis } from "@/lib/growth";

interface GrowthAlertCardProps {
  analysis: GrowthAnalysis;
  patientName: string;
  onDismiss?: (alertType: string) => void;
  onAddToConsultation?: (alert: GrowthAlert) => void;
  onGenerateInsights?: () => Promise<string>;
  className?: string;
}

export function GrowthAlertCard({
  analysis,
  patientName,
  onDismiss,
  onAddToConsultation,
  onGenerateInsights,
  className,
}: GrowthAlertCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);

  const { alerts, current, previous } = analysis;

  if (alerts.length === 0) return null;

  const highSeverityCount = alerts.filter((a) => a.severity === "high").length;

  const handleGenerateInsights = async () => {
    if (!onGenerateInsights) return;
    setIsLoadingInsights(true);
    try {
      const insights = await onGenerateInsights();
      setAiInsights(insights);
    } catch (error) {
      console.error("Erro ao gerar insights:", error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "border-red-200 bg-red-50";
      case "moderate":
        return "border-yellow-200 bg-yellow-50";
      default:
        return "border-blue-200 bg-blue-50";
    }
  };

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case "weight_drop":
      case "weight_drop_severe":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "weight_excess":
        return <TrendingUp className="h-4 w-4 text-orange-600" />;
      case "height_stagnation":
        return <Ruler className="h-4 w-4 text-yellow-600" />;
      case "head_circ_abnormal":
        return <Brain className="h-4 w-4 text-purple-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <Card className={cn("border-yellow-300 bg-yellow-50/50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle
              className={cn(
                "h-5 w-5",
                highSeverityCount > 0 ? "text-red-600" : "text-yellow-600"
              )}
            />
            Alertas de Crescimento
            <Badge
              variant="secondary"
              className={cn(
                "ml-2",
                highSeverityCount > 0
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              )}
            >
              {alerts.length}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Resumo de Percentis */}
          <div className="flex flex-wrap gap-4 p-3 bg-white rounded-lg border">
            {current.weight && (
              <div className="text-center">
                <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                  <Scale className="h-3 w-3" />
                  Peso
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">P{current.weight.percentile}</span>
                  {previous?.weight && (
                    <span
                      className={cn(
                        "text-xs",
                        current.weight.percentile < previous.weight.percentile
                          ? "text-red-600"
                          : "text-green-600"
                      )}
                    >
                      ({current.weight.percentile >= previous.weight.percentile ? "+" : ""}
                      {current.weight.percentile - previous.weight.percentile})
                    </span>
                  )}
                </div>
              </div>
            )}
            {current.height && (
              <div className="text-center">
                <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                  <Ruler className="h-3 w-3" />
                  Altura
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">P{current.height.percentile}</span>
                  {previous?.height && (
                    <span
                      className={cn(
                        "text-xs",
                        current.height.percentile < previous.height.percentile
                          ? "text-red-600"
                          : "text-green-600"
                      )}
                    >
                      ({current.height.percentile >= previous.height.percentile ? "+" : ""}
                      {current.height.percentile - previous.height.percentile})
                    </span>
                  )}
                </div>
              </div>
            )}
            {current.headCircumference && (
              <div className="text-center">
                <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                  <Brain className="h-3 w-3" />
                  P. Cefálico
                </div>
                <span className="font-semibold">P{current.headCircumference.percentile}</span>
              </div>
            )}
          </div>

          {/* Lista de Alertas */}
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <Alert
                key={index}
                className={cn("relative", getSeverityColor(alert.severity))}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(alert.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{alert.title}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          alert.severity === "high"
                            ? "border-red-300 text-red-700"
                            : "border-yellow-300 text-yellow-700"
                        )}
                      >
                        {alert.severity === "high" ? "Alto" : "Moderado"}
                      </Badge>
                    </div>
                    <AlertDescription className="text-sm">
                      {alert.description}
                    </AlertDescription>

                    {/* Ações Sugeridas */}
                    {alert.suggestedActions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Investigar:
                        </p>
                        <ul className="text-xs space-y-0.5">
                          {alert.suggestedActions.slice(0, 3).map((action, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <span className="text-muted-foreground">•</span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex gap-1">
                    {onAddToConsultation && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Adicionar à consulta"
                        onClick={() => onAddToConsultation(alert)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    {onDismiss && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Ignorar"
                        onClick={() => onDismiss(alert.type)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Alert>
            ))}
          </div>

          {/* Insights IA */}
          {onGenerateInsights && (
            <div className="pt-2 border-t">
              {!aiInsights ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleGenerateInsights}
                  disabled={isLoadingInsights}
                >
                  {isLoadingInsights ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando análise...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar análise com IA
                    </>
                  )}
                </Button>
              ) : (
                <div className="bg-white rounded-lg p-3 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Análise da IA</span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {aiInsights}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
