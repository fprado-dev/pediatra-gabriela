"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  File, 
  X, 
  FileAudio, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  Music
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/utils/audio-compressor";
import { ensureMp3 } from "@/lib/utils/convert-audio-client";

interface AudioUploaderProps {
  onUploadComplete: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

const ACCEPTED_FORMATS = {
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "audio/x-wav": [".wav"],
  "audio/mp4": [".m4a", ".mp4"],
  "audio/x-m4a": [".m4a"],
  "audio/aac": [".aac"],
  "audio/webm": [".webm"],
  "audio/ogg": [".ogg"],
  "video/mp4": [".mp4"], // Arquivos MP4 podem ter esse MIME type
};

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_DURATION = 9000; // 2h30min em segundos (suporta consultas longas)

export function AudioUploader({ onUploadComplete, onCancel }: AudioUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionStage, setConversionStage] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return `Arquivo muito grande. Tamanho máximo: 200MB`;
    }

    // Validar tipo
    const acceptedTypes = Object.keys(ACCEPTED_FORMATS);
    if (!acceptedTypes.includes(file.type) && !file.name.match(/\.(mp3|mp4|wav|m4a|aac|webm|ogg)$/i)) {
      return "Formato não suportado. Use: MP3, MP4, WAV, M4A, AAC, WebM ou OGG";
    }

    return null;
  }, []);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      // Validar arquivo
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setIsProcessing(false);
        return;
      }

      // Criar URL para preview
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setSelectedFile(file);

      // Obter duração do áudio
      const audio = new Audio(url);
      
      // Timeout para detectar problemas de carregamento
      const metadataTimeout = setTimeout(() => {
        console.warn("⚠️ Timeout ao carregar metadados do áudio. Usando estimativa...");
        
        // Estimar duração baseada no tamanho
        const estimatedMinutes = Math.ceil(file.size / (1024 * 1024));
        const estimatedDuration = estimatedMinutes * 60;
        
        setDuration(estimatedDuration);
        setIsProcessing(false);
        
        toast.warning(
          `Não foi possível carregar metadados. Duração estimada: ~${estimatedMinutes} minutos`,
          { duration: 5000 }
        );
      }, 10000); // 10 segundos timeout

      audio.addEventListener("loadedmetadata", async () => {
        clearTimeout(metadataTimeout);
        const rawDuration = audio.duration;
        
        // Log para debug
        console.log(`📊 Duração do áudio detectada:`, rawDuration);
        
        // Validar se a duração é um número válido
        let audioDuration: number;
        
        if (!isFinite(rawDuration) || isNaN(rawDuration) || rawDuration <= 0) {
          console.warn(`⚠️ Duração inválida detectada: ${rawDuration}. Estimando baseado no tamanho do arquivo...`);
          
          // Estimar duração baseada no tamanho do arquivo
          // Assumindo ~1MB por minuto para áudio comprimido (96kbps)
          const estimatedMinutes = Math.ceil(file.size / (1024 * 1024));
          audioDuration = estimatedMinutes * 60;
          
          console.log(`📊 Duração estimada: ${audioDuration} segundos (~${estimatedMinutes} minutos) baseado em ${(file.size / 1024 / 1024).toFixed(2)}MB`);
          
          toast.warning(
            `Não foi possível detectar a duração exata. Usando estimativa: ~${estimatedMinutes} minutos`,
            { duration: 5000 }
          );
        } else {
          audioDuration = Math.floor(rawDuration);
          console.log(`✅ Duração validada: ${audioDuration} segundos (${Math.floor(audioDuration / 60)}min ${audioDuration % 60}s)`);
        }
        
        setDuration(audioDuration);

        // Validar duração máxima
        if (audioDuration > MAX_DURATION) {
          setError(`Áudio muito longo. Duração máxima: 2h30min (arquivo tem ${Math.floor(audioDuration / 60)} minutos)`);
          setSelectedFile(null);
          setAudioUrl(null);
          URL.revokeObjectURL(url);
          setIsProcessing(false);
          return;
        }

        setIsProcessing(false);

        // Compressão desabilitada - upload direto do arquivo original
        // Arquivos grandes (até 200MB) são suportados sem problemas
      });

      audio.addEventListener("error", (e) => {
        clearTimeout(metadataTimeout);
        console.error("❌ Erro ao carregar áudio:", e);
        setError("Erro ao carregar o arquivo de áudio. Verifique se o arquivo está corrompido ou tente converter para MP3.");
        setSelectedFile(null);
        setAudioUrl(null);
        URL.revokeObjectURL(url);
        setIsProcessing(false);
      });
      
      // Forçar carregamento dos metadados
      audio.load();
    } catch (err) {
      console.error("Erro ao processar arquivo:", err);
      setError("Erro ao processar arquivo");
      setIsProcessing(false);
    }
  }, [validateFile]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleRemoveFile = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setSelectedFile(null);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [audioUrl]);

  const handleConfirm = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setIsProcessing(true);
      
      // 🎵 CONVERSÃO: Converter para MP3 se necessário
      const blob = new Blob([selectedFile], { type: selectedFile.type });
      const needsConversion = !selectedFile.type.includes("mp3") && !selectedFile.type.includes("mpeg");
      
      let finalBlob = blob;
      
      if (needsConversion) {
        console.log(`🔄 Convertendo ${selectedFile.type} para MP3 no cliente...`);
        setConversionStage("Convertendo para MP3...");
        setConversionProgress(0);
        
        try {
          finalBlob = await ensureMp3(blob, (progress) => {
            setConversionProgress(progress.progress);
            
            if (progress.stage === "decoding") {
              setConversionStage("Decodificando áudio...");
            } else if (progress.stage === "encoding") {
              setConversionStage(`Codificando MP3... ${progress.progress.toFixed(0)}%`);
            } else if (progress.stage === "finalizing") {
              setConversionStage("Finalizando conversão...");
            }
          });
          
          const reduction = ((blob.size - finalBlob.size) / blob.size * 100).toFixed(1);
          console.log(`✅ Conversão completa: ${(finalBlob.size / 1024 / 1024).toFixed(2)}MB (redução de ${reduction}%)`);
          toast.success(`Convertido para MP3: ${(finalBlob.size / 1024 / 1024).toFixed(1)}MB`);
        } catch (conversionError: any) {
          console.error("❌ Erro na conversão, usando áudio original:", conversionError);
          toast.warning("Usando áudio original (conversão falhou)");
          finalBlob = blob; // Fallback para original
        }
        
        setConversionProgress(0);
        setConversionStage("");
      } else {
        console.log("ℹ️ Áudio já é MP3, não precisa conversão");
      }
      
      setIsProcessing(false);
      onUploadComplete(finalBlob, duration);
    } catch (err) {
      console.error("Erro ao confirmar upload:", err);
      toast.error("Erro ao processar arquivo");
      setIsProcessing(false);
    }
  }, [selectedFile, duration, onUploadComplete]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de Arquivo de Áudio
        </CardTitle>
        <CardDescription>
          Envie um arquivo de áudio da consulta (MP3, MP4, WAV, M4A, AAC, WebM, OGG)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Área de Drop */}
        {!selectedFile && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-muted">
                <FileAudio className="h-8 w-8 text-muted-foreground" />
              </div>

              <div>
                <p className="text-lg font-medium mb-1">
                  {isDragging ? "Solte o arquivo aqui" : "Arraste um arquivo de áudio"}
                </p>
                <p className="text-sm text-muted-foreground">
                  ou clique no botão abaixo para selecionar
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Arquivo
                  </>
                )}
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept={Object.values(ACCEPTED_FORMATS).flat().join(",")}
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Formatos: MP3, MP4, WAV, M4A, AAC, WebM, OGG</p>
                <p>Tamanho máximo: 200MB • Duração máxima: 2h30min</p>
              </div>
            </div>
          </div>
        )}

        {/* Progresso de conversão */}
        {isProcessing && conversionProgress > 0 && (
          <div className="space-y-3 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {conversionStage || "Processando..."}
              </span>
              <span className="font-semibold">{conversionProgress}%</span>
            </div>
            <Progress value={conversionProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Convertendo para formato otimizado...
            </p>
          </div>
        )}

        {/* Preview do arquivo selecionado */}
        {selectedFile && !isProcessing && (
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
              <div className="p-3 rounded-lg bg-primary/10">
                <Music className="h-6 w-6 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>{formatFileSize(selectedFile.size)}</span>
                      {duration > 0 && (
                        <>
                          <span>•</span>
                          <span>{formatDuration(duration)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Player de áudio */}
                {audioUrl && (
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    controls
                    className="w-full mt-3"
                    preload="metadata"
                  />
                )}

                {/* Status */}
                {duration > 0 && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Arquivo válido e pronto para enviar</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Ações */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>

          <Button
            onClick={handleConfirm}
            disabled={!selectedFile || duration === 0 || !!error}
            size="lg"
          >
            Continuar com este Áudio
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
