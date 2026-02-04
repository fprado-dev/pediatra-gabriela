"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import type { TimerWithPatient } from "@/lib/types/timer";
import { compressAudio } from "@/lib/utils/audio-compressor";
import { useRouter } from "next/navigation";

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';
type WidgetState = 'minimized' | 'compact' | 'expanded' | 'recording';

interface TimerRecordingContextValue {
  // Timer state
  activeTimer: TimerWithPatient | null;
  timerDuration: number;
  isTimerPaused: boolean;
  
  // Recording state
  recordingState: RecordingState;
  audioBlob: Blob | null;
  audioDuration: number;
  audioLevel: number;
  
  // UI state
  widgetState: WidgetState;
  isMinimized: boolean;
  showStartModal: boolean;
  showFinishDialog: boolean;
  
  // Timer actions
  fetchActiveTimer: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  finishTimer: () => Promise<void>;
  
  // Recording actions
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  cancelRecording: () => void;
  confirmUpload: () => Promise<void>;
  
  // UI actions
  setWidgetState: (state: WidgetState) => void;
  setIsMinimized: (value: boolean) => void;
  setShowStartModal: (value: boolean) => void;
  setShowFinishDialog: (value: boolean) => void;
  toggleWidget: () => void;
  
  // Sync
  syncPauseTimer: () => void;
  syncResumeTimer: () => void;
}

const TimerRecordingContext = createContext<TimerRecordingContextValue | undefined>(undefined);

export function TimerRecordingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  // Timer state
  const [activeTimer, setActiveTimer] = useState<TimerWithPatient | null>(null);
  const [timerDuration, setTimerDuration] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  
  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // UI state
  const [widgetState, setWidgetState] = useState<WidgetState>('minimized');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch active timer
  const fetchActiveTimer = useCallback(async () => {
    try {
      const response = await fetch("/api/timers/active");
      const data = await response.json();

      if (data.timer) {
        setActiveTimer(data.timer);
        setIsTimerPaused(data.timer.status === "paused");
        
        // Update widget state based on timer
        if (widgetState === 'minimized' && data.timer) {
          setWidgetState('compact');
        }
      } else {
        setActiveTimer(null);
        setTimerDuration(0);
        setIsTimerPaused(false);
        setWidgetState('minimized');
      }
    } catch (error) {
      console.error("Error fetching active timer:", error);
    }
  }, [widgetState]);
  
  // Timer duration calculation
  useEffect(() => {
    if (!activeTimer || isTimerPaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const start = new Date(activeTimer.started_at).getTime();
      const elapsedMs = now - start;

      // Subtract pauses
      const pauses = Array.isArray(activeTimer.pauses) ? activeTimer.pauses : [];
      const pauseMs = pauses.reduce((total, pause) => {
        const pauseStart = new Date(pause.started_at).getTime();
        const pauseEnd = pause.resumed_at
          ? new Date(pause.resumed_at).getTime()
          : now;
        return total + (pauseEnd - pauseStart);
      }, 0);

      setTimerDuration(Math.floor((elapsedMs - pauseMs) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer, isTimerPaused]);
  
  // Sync with server every 30s
  useEffect(() => {
    if (!activeTimer) return;

    const interval = setInterval(() => {
      fetchActiveTimer();
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTimer, fetchActiveTimer]);
  
  // Initial fetch
  useEffect(() => {
    fetchActiveTimer();
  }, []);
  
  // Timer actions
  const pauseTimer = async () => {
    if (!activeTimer) return;

    try {
      const response = await fetch(`/api/timers/${activeTimer.id}?action=pause`, {
        method: "PATCH",
      });

      if (response.ok) {
        setIsTimerPaused(true);
        toast.success("Timer pausado");
        fetchActiveTimer();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao pausar timer");
      }
    } catch (error) {
      toast.error("Erro ao pausar timer");
    }
  };
  
  const resumeTimer = async () => {
    if (!activeTimer) return;

    try {
      const response = await fetch(`/api/timers/${activeTimer.id}?action=resume`, {
        method: "PATCH",
      });

      if (response.ok) {
        setIsTimerPaused(false);
        toast.success("Timer retomado");
        fetchActiveTimer();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao retomar timer");
      }
    } catch (error) {
      toast.error("Erro ao retomar timer");
    }
  };
  
  const finishTimer = async () => {
    if (!activeTimer) return;

    try {
      const response = await fetch(`/api/timers/${activeTimer.id}?action=finish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Consulta finalizada!", {
          description: `Tempo total: ${formatDuration(data.summary.active_duration)}`,
        });
        setActiveTimer(null);
        setTimerDuration(0);
        setShowFinishDialog(false);
        setWidgetState('minimized');
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao finalizar timer");
      }
    } catch (error) {
      toast.error("Erro ao finalizar timer");
    }
  };
  
  // Recording actions
  const startRecording = async () => {
    try {
      setRecordingState('idle');
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      // Monitor audio level
      monitorAudioLevel(stream);

      // Setup MediaRecorder
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
        setRecordingState('stopped');
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Stop audio analysis
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      };

      // Start recording
      mediaRecorder.start(1000);
      setRecordingState('recording');
      setAudioDuration(0);
      setWidgetState('recording');

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setAudioDuration((prev) => prev + 1);
      }, 1000);

      toast.success("Gravação iniciada");
    } catch (err: any) {
      console.error("Error starting recording:", err);
      if (err.name === "NotAllowedError") {
        toast.error("Permissão de microfone necessária");
      } else {
        toast.error("Erro ao acessar o microfone");
      }
    }
  };
  
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
        setAudioLevel(Math.min(100, (average / 255) * 200));
      }
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState !== 'idle') {
      mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      toast.success("Gravação finalizada");
    }
  };
  
  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      // Sync pause timer
      pauseTimer();
      toast.info("Gravação pausada");
    }
  };
  
  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      
      // Resume recording timer
      recordingTimerRef.current = setInterval(() => {
        setAudioDuration((prev) => prev + 1);
      }, 1000);
      
      // Sync resume timer
      resumeTimer();
      toast.success("Gravação retomada");
    }
  };
  
  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    
    setRecordingState('idle');
    setAudioDuration(0);
    setAudioBlob(null);
    setAudioLevel(0);
    audioChunksRef.current = [];
    setWidgetState('expanded');
    
    toast.info("Gravação cancelada");
  };
  
  const confirmUpload = async () => {
    if (!audioBlob || !activeTimer) return;

    const MAX_SIZE = 200 * 1024 * 1024; // 200MB
    let finalBlob = audioBlob;

    try {
      // Compress if necessary
      if (audioBlob.size > MAX_SIZE) {
        toast.info("Áudio muito grande, comprimindo...");
        const file = new File([audioBlob], "audio.webm", { type: audioBlob.type });
        
        const compressed = await compressUntilFits(file, MAX_SIZE);
        finalBlob = compressed;
      }

      // Upload
      const formData = new FormData();
      formData.append("audio", finalBlob);
      formData.append("patientId", activeTimer.patient_id);
      formData.append("duration", audioDuration.toString());
      formData.append("timer_id", activeTimer.id);

      const response = await fetch("/api/consultations/upload-audio", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Consulta processada!");
        
        // Clean up
        setAudioBlob(null);
        setRecordingState('idle');
        setAudioDuration(0);
        
        // Redirect to preview
        router.push(`/consultations/${data.consultationId}/preview`);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao fazer upload");
    }
  };
  
  const compressUntilFits = async (file: File, maxSize: number): Promise<Blob> => {
    const bitrates = [96, 64, 48, 32];
    
    for (const bitrate of bitrates) {
      const result = await compressAudio(file, {
        bitrate,
        onProgress: (progress) => {
          console.log(`Compressing at ${bitrate}kbps: ${progress}%`);
        },
      });

      if (result.compressedSize <= maxSize) {
        toast.success(`Comprimido: ${(result.compressedSize / 1024 / 1024).toFixed(2)}MB`);
        return result.compressedBlob;
      }
    }

    // Return last attempt
    const lastAttempt = await compressAudio(file, { bitrate: 32 });
    return lastAttempt.compressedBlob;
  };
  
  // Sync functions
  const syncPauseTimer = () => {
    if (!isTimerPaused && recordingState === 'recording') {
      pauseTimer();
    }
  };
  
  const syncResumeTimer = () => {
    if (isTimerPaused && recordingState === 'recording') {
      resumeTimer();
    }
  };
  
  // UI actions
  const toggleWidget = () => {
    if (widgetState === 'compact') {
      setWidgetState('expanded');
    } else if (widgetState === 'expanded') {
      setWidgetState('compact');
    }
  };
  
  // Warning before unload during recording
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (recordingState === 'recording') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [recordingState]);
  
  // Warning at 2h of recording
  useEffect(() => {
    if (audioDuration >= 7200) {
      toast.warning("Atenção: 2h de gravação. Considere finalizar.");
    }
    if (audioDuration >= 8100) {
      toast.error("Ultrapassando limite recomendado");
    }
  }, [audioDuration]);
  
  const value: TimerRecordingContextValue = {
    // Timer state
    activeTimer,
    timerDuration,
    isTimerPaused,
    
    // Recording state
    recordingState,
    audioBlob,
    audioDuration,
    audioLevel,
    
    // UI state
    widgetState,
    isMinimized,
    showStartModal,
    showFinishDialog,
    
    // Timer actions
    fetchActiveTimer,
    pauseTimer,
    resumeTimer,
    finishTimer,
    
    // Recording actions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    confirmUpload,
    
    // UI actions
    setWidgetState,
    setIsMinimized,
    setShowStartModal,
    setShowFinishDialog,
    toggleWidget,
    
    // Sync
    syncPauseTimer,
    syncResumeTimer,
  };

  return (
    <TimerRecordingContext.Provider value={value}>
      {children}
    </TimerRecordingContext.Provider>
  );
}

export function useTimerRecording() {
  const context = useContext(TimerRecordingContext);
  if (context === undefined) {
    throw new Error('useTimerRecording must be used within a TimerRecordingProvider');
  }
  return context;
}

// Helper
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
