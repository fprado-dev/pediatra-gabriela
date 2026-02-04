"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Play,
  Pause,
  Square,
  Minimize2,
  Maximize2,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/types/timer";
import { StartTimerModal } from "./start-timer-modal";
import { useTimerRecording } from "@/lib/contexts/timer-recording-context";
import { ExpandedView } from "./timer-states/expanded-view";
import { RecordingView } from "./timer-states/recording-view";
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
  const {
    activeTimer: timer,
    timerDuration: elapsed,
    isTimerPaused: isPaused,
    isMinimized,
    showStartModal,
    showFinishDialog,
    widgetState,
    setIsMinimized,
    setShowStartModal,
    setShowFinishDialog,
    pauseTimer: handlePause,
    resumeTimer: handleResume,
    finishTimer: handleFinish,
    fetchActiveTimer,
  } = useTimerRecording();

  const handleStartSuccess = () => {
    setShowStartModal(false);
    fetchActiveTimer();
  };

  // Recording state - show RecordingView
  if (widgetState === 'recording') {
    return (
      <>
        <RecordingView />
        <StartTimerModal
          open={showStartModal}
          onOpenChange={setShowStartModal}
          onSuccess={handleStartSuccess}
        />
      </>
    );
  }

  // Expanded state - show ExpandedView
  if (widgetState === 'expanded') {
    return (
      <>
        <ExpandedView />
        
        {/* Finish Timer Dialog */}
        <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Finalizar Consulta?</AlertDialogTitle>
              <AlertDialogDescription>
                Deseja finalizar o atendimento de <strong>{timer?.patient.full_name}</strong>?
                <br />
                <br />
                Tempo decorrido: <strong>{formatDuration(elapsed)}</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleFinish}>
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

  // Minimized state - show floating button
  if (!timer || widgetState === 'minimized') {
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

  // Compact state - timer minimizado (compact pill)
  if (timer && isMinimized) {
    return (
      <>
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

        <StartTimerModal
          open={showStartModal}
          onOpenChange={setShowStartModal}
          onSuccess={handleStartSuccess}
        />
      </>
    );
  }

  // Default compact view (shouldn't reach here normally)
  return (
    <>
      <ExpandedView />
      
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar Consulta?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja finalizar o atendimento de <strong>{timer?.patient.full_name}</strong>?
              <br />
              <br />
              Tempo decorrido: <strong>{formatDuration(elapsed)}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinish}>
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
