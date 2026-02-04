"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Play,
  Pause,
  Square,
  Minimize2,
  Mic,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/types/timer";
import { useTimerRecording } from "@/lib/contexts/timer-recording-context";

export function ExpandedView() {
  const {
    activeTimer,
    timerDuration,
    isTimerPaused,
    setIsMinimized,
    setShowFinishDialog,
    pauseTimer,
    resumeTimer,
    startRecording,
  } = useTimerRecording();

  if (!activeTimer) return null;

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-2xl border-2 transition-all duration-300 max-sm:w-[calc(100vw-2rem)] max-sm:right-4 max-sm:left-4">
      <CardHeader className="pb-3 bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full animate-pulse",
                isTimerPaused ? "bg-yellow-500" : "bg-green-500"
              )}
            />
            <span className="text-sm font-medium">
              {isTimerPaused ? "⏸️ Pausado" : "🟢 Em Atendimento"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações do Paciente */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {activeTimer.patient.full_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{activeTimer.patient.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {activeTimer.started_from === "appointment" ? "📅 Agendamento" : "🆓 Avulso"}
            </p>
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center py-4 bg-muted/30 rounded-lg">
          <div className="text-4xl font-mono font-bold tabular-nums">
            {formatDuration(timerDuration)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Iniciado às {format(new Date(activeTimer.started_at), "HH:mm", { locale: ptBR })}
          </p>
        </div>

        {/* Botão de Iniciar Gravação */}
        <Button
          className="w-full gap-2 h-12 text-base"
          onClick={startRecording}
          disabled={isTimerPaused}
        >
          <Mic className="h-5 w-5" />
          Iniciar Gravação
        </Button>

        {/* Controles do Timer */}
        <div className="flex gap-2">
          {isTimerPaused ? (
            <Button
              className="flex-1"
              onClick={resumeTimer}
              variant="outline"
            >
              <Play className="h-4 w-4 mr-2" />
              Retomar
            </Button>
          ) : (
            <Button
              variant="outline"
              className="flex-1"
              onClick={pauseTimer}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pausar
            </Button>
          )}

          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => setShowFinishDialog(true)}
          >
            <Square className="h-4 w-4 mr-2" />
            Finalizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
