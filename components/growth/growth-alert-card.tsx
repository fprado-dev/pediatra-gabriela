"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Scale,
  Ruler,
  Brain,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  ArrowRight,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GrowthAlert, GrowthAnalysis } from "@/lib/growth";

interface GrowthAlertCardProps {
  analysis: GrowthAnalysis;
  patientName: string;
  onDismiss?: (alertType: string) => void;
  onGenerateInsights?: () => Promise<string>;
  className?: string;
}

export function GrowthAlertCard({
  analysis,
  patientName,
  onDismiss,
  onGenerateInsights,
  className,
}: GrowthAlertCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);

  const { alerts, current, previous } = analysis;

  if (alerts.length === 0) return null;

  const highSeverityCount = alerts.filter((a) => a.severity === "high").length;
  const hasHighSeverity = highSeverityCount > 0;

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

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "high":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          icon: "text-red-600",
          badge: "bg-red-100 text-red-700 border-red-200",
        };
      case "moderate":
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          icon: "text-amber-600",
          badge: "bg-amber-100 text-amber-700 border-amber-200",
        };
      default:
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          icon: "text-blue-600",
          badge: "bg-blue-100 text-blue-700 border-blue-200",
        };
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "weight_drop":
      case "weight_drop_severe":
        return TrendingDown;
      case "weight_excess":
        return TrendingUp;
      case "height_stagnation":
        return Ruler;
      case "head_circ_abnormal":
        return Brain;
      default:
        return AlertTriangle;
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden",
        hasHighSeverity
          ? "border-red-300 bg-gradient-to-r from-red-50/50 to-white"
          : "border-amber-300 bg-gradient-to-r from-amber-50/50 to-white",
        className
      )}
    >
      {/* Header Compacto */}
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-lg",
                hasHighSeverity ? "bg-red-100" : "bg-amber-100"
              )}
            >
              <AlertTriangle
                className={cn(
                  "h-5 w-5",
                  hasHighSeverity ? "text-red-600" : "text-amber-600"
                )}
              />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Alertas de Crescimento
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {alerts.length} {alerts.length === 1 ? "alerta detectado" : "alertas detectados"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
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
        <CardContent className="px-4 pb-4 pt-0 space-y-4">
          {/* Cards de Percentis */}
          <div className="grid grid-cols-3 gap-3">
            {current.weight && (
              <div className="bg-white rounded-lg border p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Scale className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Peso</span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-lg font-bold">P{current.weight.percentile}</span>
                  {previous?.weight && (
                    <span
                      className={cn(
                        "text-xs font-medium px-1.5 py-0.5 rounded",
                        current.weight.percentile < previous.weight.percentile
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      )}
                    >
                      {current.weight.percentile >= previous.weight.percentile ? "+" : ""}
                      {current.weight.percentile - previous.weight.percentile}
                    </span>
                  )}
                </div>
              </div>
            )}
            {current.height && (
              <div className="bg-white rounded-lg border p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Ruler className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Altura</span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-lg font-bold">P{current.height.percentile}</span>
                  {previous?.height && (
                    <span
                      className={cn(
                        "text-xs font-medium px-1.5 py-0.5 rounded",
                        current.height.percentile < previous.height.percentile
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      )}
                    >
                      {current.height.percentile >= previous.height.percentile ? "+" : ""}
                      {current.height.percentile - previous.height.percentile}
                    </span>
                  )}
                </div>
              </div>
            )}
            {current.headCircumference && (
              <div className="bg-white rounded-lg border p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Brain className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">P. Cefálico</span>
                </div>
                <span className="text-lg font-bold">P{current.headCircumference.percentile}</span>
              </div>
            )}
          </div>

          {/* Lista de Alertas */}
          <div className="space-y-2">
            {alerts.map((alert, index) => {
              const styles = getSeverityStyles(alert.severity);
              const Icon = getAlertIcon(alert.type);

              return (
                <div
                  key={index}
                  className={cn(
                    "rounded-lg border p-3",
                    styles.bg,
                    styles.border
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("mt-0.5", styles.icon)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm">{alert.title}</span>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] px-1.5 py-0", styles.badge)}
                        >
                          {alert.severity === "high" ? "ALTO" : "MODERADO"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {alert.description}
                      </p>

                      {/* Ações Sugeridas Compactas */}
                      {alert.suggestedActions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-dashed">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Info className="h-3 w-3" />
                            <span className="font-medium">Investigar:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {alert.suggestedActions.slice(0, 3).map((action, i) => (
                              <span
                                key={i}
                                className="text-xs bg-white/70 px-2 py-0.5 rounded border"
                              >
                                {action}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botão Gerar Insights IA */}
          {onGenerateInsights && (
            <div className="pt-2">
              {!aiInsights ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-white hover:bg-primary/5 hover:border-primary/50 transition-colors"
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
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </>
                  )}
                </Button>
              ) : (
                <div className="bg-gradient-to-br from-primary/5 to-white rounded-lg p-4 border border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-primary/10 rounded">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-semibold text-sm">Análise da IA</span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
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
