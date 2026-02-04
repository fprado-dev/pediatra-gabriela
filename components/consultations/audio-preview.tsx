"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, Clock, FileAudio, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPreviewProps {
  audioBlob: Blob;
  duration: number;
  onConfirm: () => void;
  onReRecord: () => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

export function AudioPreview({
  audioBlob,
  duration,
  onConfirm,
  onReRecord,
  isUploading = false,
  uploadProgress = 0,
}: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");

  useEffect(() => {
    const url = URL.createObjectURL(audioBlob);
    setAudioUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [audioBlob]);

  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileAudio className="h-5 w-5 text-primary" />
          Preview do Áudio
        </CardTitle>
        <CardDescription>
          Ouça o áudio antes de enviar para processamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Player visual */}
        <div className="bg-muted/50 rounded-xl p-6">
          {/* Waveform placeholder */}
          <div className="relative h-16 mb-4 bg-muted rounded-lg overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-primary/30"
              style={{ width: `${progress}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center gap-1">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 rounded-full transition-all",
                    i / 40 * 100 < progress ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                  style={{
                    height: `${20 + Math.sin(i * 0.5) * 15 + Math.random() * 20}px`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono text-muted-foreground">
              {formatTime(currentTime)}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            <span className="text-sm font-mono text-muted-foreground">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>Duração: {formatTime(duration)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileAudio className="h-4 w-4" />
            <span>Tamanho: {formatFileSize(audioBlob.size)}</span>
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando áudio...
              </span>
              <span className="font-medium">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {uploadProgress < 20 && "Verificando duplicatas..."}
              {uploadProgress >= 20 && uploadProgress < 90 && "Enviando dados..."}
              {uploadProgress >= 90 && "Finalizando..."}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onReRecord}
            disabled={isUploading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Regravar
          </Button>
          <Button
            className="flex-1"
            onClick={onConfirm}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Confirmar e Enviar"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
