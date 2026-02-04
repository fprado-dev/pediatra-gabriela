"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Play,
  Pause,
  Square,
  X,
  Upload,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/types/timer";
import { useTimerRecording } from "@/lib/contexts/timer-recording-context";
import { useState } from "react";
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

export function RecordingView() {
  const {
    activeTimer,
    timerDuration,
    audioDuration,
    audioLevel,
    recordingState,
    isTimerPaused,
    audioBlob,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    confirmUpload,
  } = useTimerRecording();

  const [showFinishTimerDialog, setShowFinishTimerDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (!activeTimer) return null;

  const handleConfirmUpload = async () => {
    setIsUploading(true);
    try {
      await confirmUpload();
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Stopped state - ready to upload
  if (recordingState === 'stopped' && audioBlob) {
    return (
      <>
        <Card className="fixed bottom-4 right-4 z-50 w-[360px] shadow-2xl border-2 transition-all duration-300 max-sm:w-[calc(100vw-2rem)] max-sm:right-4 max-sm:left-4">
          <CardHeader className="pb-3 bg-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">Gravação Concluída</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Paciente Info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {activeTimer.patient.full_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{activeTimer.patient.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  Timer: {formatDuration(timerDuration)}
                </p>
              </div>
            </div>

            {/* Audio Info */}
            <div className="space-y-2">
              <div className="text-center py-3 bg-muted/30 rounded-lg">
                <div className="text-2xl font-mono font-bold text-primary">
                  {formatTime(audioDuration)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Áudio gravado: {(audioBlob.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                className="w-full gap-2"
                onClick={() => setShowFinishTimerDialog(true)}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Processar Consulta
                  </>
                )}
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={cancelRecording}
                  disabled={isUploading}
                >
                  Regravar
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={cancelRecording}
                  disabled={isUploading}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Finish Timer Dialog */}
        <AlertDialog open={showFinishTimerDialog} onOpenChange={setShowFinishTimerDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Finalizar Timer?</AlertDialogTitle>
              <AlertDialogDescription>
                Você gravou {formatTime(audioDuration)} de áudio.
                <br /><br />
                Deseja finalizar o timer também?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleConfirmUpload}>
                Manter Timer Ativo
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmUpload}>
                Finalizar Timer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Recording or paused state
  return (
    <Card className="fixed bottom-4 right-4 z-50 w-[360px] shadow-2xl border-2 transition-all duration-300 max-sm:w-[calc(100vw-2rem)] max-sm:right-4 max-sm:left-4 max-sm:bottom-2">
      <CardHeader className="pb-3 bg-destructive/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                recordingState === 'recording' ? "bg-red-500 animate-pulse" : "bg-yellow-500"
              )}
            />
            <span className="text-sm font-medium">
              {recordingState === 'recording' ? "🔴 Gravando" : "⏸️ Pausado"}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Paciente Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {activeTimer.patient.full_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{activeTimer.patient.full_name}</p>
            <p className="text-xs text-muted-foreground">
              Timer: {formatDuration(timerDuration)}
            </p>
          </div>
        </div>

        {/* Recording Display */}
        <div className="space-y-2">
          <div className="text-center py-4 bg-destructive/10 rounded-lg">
            <div className="text-4xl font-mono font-bold tabular-nums text-destructive">
              {formatTime(audioDuration)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Tempo de gravação
            </p>
          </div>

          {/* Audio Level Visualization */}
          {recordingState === 'recording' && (
            <div className="relative h-16 bg-muted rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center gap-1 px-4">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-destructive rounded-full transition-all duration-100"
                    style={{
                      height: `${Math.random() * audioLevel}%`,
                      opacity: 0.8,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {recordingState === 'paused' ? (
            <Button
              className="flex-1"
              onClick={resumeRecording}
            >
              <Play className="h-4 w-4 mr-2" />
              Retomar
            </Button>
          ) : (
            <Button
              variant="outline"
              className="flex-1"
              onClick={pauseRecording}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pausar
            </Button>
          )}

          <Button
            variant="destructive"
            className="flex-1"
            onClick={stopRecording}
          >
            <Square className="h-4 w-4 mr-2" />
            Finalizar
          </Button>
        </div>

        <Button
          variant="ghost"
          className="w-full gap-2"
          onClick={cancelRecording}
        >
          <X className="h-4 w-4" />
          Cancelar Gravação
        </Button>
      </CardContent>
    </Card>
  );
}
