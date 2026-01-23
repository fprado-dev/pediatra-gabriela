"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Mic, Square, Pause, Play, Trash2, Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onCancel?: () => void;
}

type RecordingState = "idle" | "recording" | "paused" | "stopped";

export function AudioRecorder({ onRecordingComplete, onCancel }: AudioRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [audioUrl]);

  // Monitorar nível de áudio
  const monitorAudioLevel = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 256;
    microphone.connect(analyser);
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(Math.min(100, (average / 255) * 200)); // Amplificar um pouco
      }
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  };

  const startRecording = async () => {
    try {
      setError(null);
      
      // Solicitar permissão do microfone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });

      // Monitorar nível de áudio
      monitorAudioLevel(stream);

      // Configurar MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Parar todas as tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Parar análise de áudio
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      };

      // Iniciar gravação
      mediaRecorder.start(1000); // Capturar dados a cada 1 segundo
      setRecordingState("recording");
      setDuration(0);

      // Iniciar timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      toast.success("Gravação iniciada");
    } catch (err: any) {
      console.error("Erro ao iniciar gravação:", err);
      setError(
        err.name === "NotAllowedError"
          ? "Permissão de microfone negada. Por favor, permita o acesso ao microfone."
          : "Erro ao acessar o microfone. Verifique as configurações."
      );
      toast.error("Erro ao iniciar gravação");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      if (timerRef.current) clearInterval(timerRef.current);
      toast.info("Gravação pausada");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      
      // Retomar timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
      
      toast.success("Gravação retomada");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState !== "idle") {
      mediaRecorderRef.current.stop();
      setRecordingState("stopped");
      if (timerRef.current) clearInterval(timerRef.current);
      toast.success("Gravação finalizada");
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    
    setRecordingState("idle");
    setDuration(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setAudioLevel(0);
    audioChunksRef.current = [];
    
    if (onCancel) onCancel();
    toast.info("Gravação cancelada");
  };

  const handleUpload = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Gravação de Consulta
        </CardTitle>
        <CardDescription>
          Grave a consulta para gerar automaticamente a documentação clínica
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Visualização da forma de onda */}
        {(recordingState === "recording" || recordingState === "paused") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Nível de áudio</span>
              <span className="font-mono font-semibold text-lg text-foreground">
                {formatTime(duration)}
              </span>
            </div>
            <div className="relative h-20 bg-muted rounded-lg overflow-hidden">
              {/* Visualização simplificada do nível de áudio */}
              <div className="absolute inset-0 flex items-center justify-center gap-1 px-4">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary rounded-full transition-all duration-100"
                    style={{
                      height: `${Math.random() * audioLevel * (recordingState === "recording" ? 1 : 0.3)}%`,
                      opacity: recordingState === "recording" ? 0.8 : 0.3,
                    }}
                  />
                ))}
              </div>
              {recordingState === "paused" && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                  <span className="text-sm font-medium">PAUSADO</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Player de áudio após gravação */}
        {recordingState === "stopped" && audioUrl && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Pré-visualização</span>
              <span className="font-mono font-semibold text-foreground">
                {formatTime(duration)}
              </span>
            </div>
            <audio src={audioUrl} controls className="w-full" />
          </div>
        )}

        {/* Controles */}
        <div className="flex gap-2 justify-center">
          {recordingState === "idle" && (
            <Button size="lg" onClick={startRecording} className="gap-2">
              <Mic className="h-5 w-5" />
              Iniciar Gravação
            </Button>
          )}

          {recordingState === "recording" && (
            <>
              <Button size="lg" variant="outline" onClick={pauseRecording} className="gap-2">
                <Pause className="h-5 w-5" />
                Pausar
              </Button>
              <Button size="lg" variant="destructive" onClick={stopRecording} className="gap-2">
                <Square className="h-5 w-5" />
                Finalizar
              </Button>
            </>
          )}

          {recordingState === "paused" && (
            <>
              <Button size="lg" onClick={resumeRecording} className="gap-2">
                <Play className="h-5 w-5" />
                Retomar
              </Button>
              <Button size="lg" variant="destructive" onClick={stopRecording} className="gap-2">
                <Square className="h-5 w-5" />
                Finalizar
              </Button>
            </>
          )}

          {recordingState === "stopped" && (
            <>
              <Button size="lg" onClick={handleUpload} className="gap-2">
                <Upload className="h-5 w-5" />
                Processar Consulta
              </Button>
              <Button size="lg" variant="outline" onClick={cancelRecording} className="gap-2">
                <Trash2 className="h-5 w-5" />
                Descartar
              </Button>
            </>
          )}

          {(recordingState === "recording" || recordingState === "paused") && (
            <Button size="lg" variant="ghost" onClick={cancelRecording} className="gap-2">
              <Trash2 className="h-5 w-5" />
              Cancelar
            </Button>
          )}
        </div>

        {/* Informações */}
        <div className="text-xs text-muted-foreground space-y-1 text-center">
          <p>• A gravação será processada automaticamente pela IA</p>
          <p>• Você poderá revisar e editar os campos antes de salvar</p>
          {recordingState === "idle" && (
            <p className="text-amber-600">
              • Certifique-se de que seu microfone está funcionando
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
