"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  Square,
  Minimize2,
  Maximize2,
  Clock,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { TimerWithPatient } from "@/lib/types/timer";
import { formatDuration } from "@/lib/types/timer";
import { StartTimerModal } from "./start-timer-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function TimerWidget() {
  const [timer, setTimer] = useState<TimerWithPatient | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Buscar timer ativo ao montar
  useEffect(() => {
    fetchActiveTimer();
  }, []);

  // Atualizar elapsed a cada segundo
  useEffect(() => {
    if (!timer || isPaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const start = new Date(timer.started_at).getTime();
      const elapsedMs = now - start;

      // Subtrair pausas
      const pauses = Array.isArray(timer.pauses) ? timer.pauses : [];
      const pauseMs = pauses.reduce((total, pause) => {
        const pauseStart = new Date(pause.started_at).getTime();
        const pauseEnd = pause.resumed_at
          ? new Date(pause.resumed_at).getTime()
          : now;
        return total + (pauseEnd - pauseStart);
      }, 0);

      setElapsed(Math.floor((elapsedMs - pauseMs) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, isPaused]);

  // Sincronizar com servidor a cada 30s
  useEffect(() => {
    if (!timer) return;

    const interval = setInterval(() => {
      fetchActiveTimer();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [timer]);

  const fetchActiveTimer = async () => {
    try {
      const response = await fetch("/api/timers/active");
      const data = await response.json();

      if (data.timer) {
        setTimer(data.timer);
        setIsPaused(data.timer.status === "paused");
      } else {
        setTimer(null);
        setElapsed(0);
        setIsPaused(false);
      }
    } catch (error) {
      console.error("Error fetching active timer:", error);
    }
  };

  const handlePause = async () => {
    if (!timer) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/timers/${timer.id}?action=pause`, {
        method: "PATCH",
      });

      if (response.ok) {
        setIsPaused(true);
        toast.success("Timer pausado");
        fetchActiveTimer();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao pausar timer");
      }
    } catch (error) {
      toast.error("Erro ao pausar timer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    if (!timer) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/timers/${timer.id}?action=resume`, {
        method: "PATCH",
      });

      if (response.ok) {
        setIsPaused(false);
        toast.success("Timer retomado");
        fetchActiveTimer();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao retomar timer");
      }
    } catch (error) {
      toast.error("Erro ao retomar timer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!timer) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/timers/${timer.id}?action=finish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Consulta finalizada!", {
          description: `Tempo total: ${formatDuration(data.summary.active_duration)}`,
        });
        setTimer(null);
        setElapsed(0);
        setShowFinishDialog(false);
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao finalizar timer");
      }
    } catch (error) {
      toast.error("Erro ao finalizar timer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSuccess = () => {
    setShowStartModal(false);
    fetchActiveTimer();
  };

  // Sem timer ativo - mostrar botão para iniciar
  if (!timer) {
    return (
      <>
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            size="lg"
            className="shadow-lg"
            onClick={() => setShowStartModal(true)}
          >
            <Clock className="h-4 w-4 mr-2" />
            Iniciar Consulta
          </Button>
        </div>

        <StartTimerModal
          open={showStartModal}
          onOpenChange={setShowStartModal}
          onSuccess={handleStartSuccess}
        />
      </>
    );
  }

  // Timer minimizado
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="lg"
          className="shadow-lg"
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full animate-pulse",
                isPaused ? "bg-yellow-500" : "bg-green-500"
              )}
            />
            <span className="font-mono font-bold">{formatDuration(elapsed)}</span>
            <Maximize2 className="h-3 w-3 ml-1" />
          </div>
        </Button>
      </div>
    );
  }

  // Timer expandido
  return (
    <>
      <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-2xl border-2">
        <CardHeader className="pb-3 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-2 w-2 rounded-full animate-pulse",
                  isPaused ? "bg-yellow-500" : "bg-green-500"
                )}
              />
              <span className="text-sm font-medium">
                {isPaused ? "⏸️ Pausado" : "🟢 Em Atendimento"}
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
                {timer.patient.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{timer.patient.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {timer.started_from === "appointment" ? "📅 Agendamento" : "🆓 Avulso"}
              </p>
            </div>
          </div>

          {/* Timer Display */}
          <div className="text-center py-4 bg-muted/30 rounded-lg">
            <div className="text-4xl font-mono font-bold tabular-nums">
              {formatDuration(elapsed)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Iniciado às {format(new Date(timer.started_at), "HH:mm", { locale: ptBR })}
            </p>
          </div>

          {/* Controles */}
          <div className="flex gap-2">
            {isPaused ? (
              <Button
                className="flex-1"
                onClick={handleResume}
                disabled={isLoading}
              >
                <Play className="h-4 w-4 mr-2" />
                Retomar
              </Button>
            ) : (
              <Button
                variant="outline"
                className="flex-1"
                onClick={handlePause}
                disabled={isLoading}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </Button>
            )}

            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => setShowFinishDialog(true)}
              disabled={isLoading}
            >
              <Square className="h-4 w-4 mr-2" />
              Finalizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de confirmação */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar Consulta?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja finalizar o atendimento de <strong>{timer.patient.full_name}</strong>?
              <br />
              <br />
              Tempo decorrido: <strong>{formatDuration(elapsed)}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinish} disabled={isLoading}>
              Finalizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <StartTimerModal
        open={showStartModal}
        onOpenChange={setShowStartModal}
        onSuccess={handleStartSuccess}
      />
    </>
  );
}
