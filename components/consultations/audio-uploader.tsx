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
import { compressAudio, shouldCompress, formatFileSize } from "@/lib/utils/audio-compressor";

interface AudioUploaderProps {
  onUploadComplete: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

const ACCEPTED_FORMATS = {
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "audio/x-wav": [".wav"],
  "audio/mp4": [".m4a"],
  "audio/x-m4a": [".m4a"],
  "audio/aac": [".aac"],
  "audio/webm": [".webm"],
  "audio/ogg": [".ogg"],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_DURATION = 30 * 60; // 30 minutos em segundos

export function AudioUploader({ onUploadComplete, onCancel }: AudioUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return `Arquivo muito grande. Tamanho máximo: 50MB`;
    }

    // Validar tipo
    const acceptedTypes = Object.keys(ACCEPTED_FORMATS);
    if (!acceptedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|aac|webm|ogg)$/i)) {
      return "Formato não suportado. Use: MP3, WAV, M4A, AAC, WebM ou OGG";
    }

    return null;
  }, []);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setIsProcessing(true);
    setOriginalSize(file.size);

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
      audio.addEventListener("loadedmetadata", async () => {
        const audioDuration = Math.floor(audio.duration);
        setDuration(audioDuration);

        // Validar duração
        if (audioDuration > MAX_DURATION) {
          setError(`Áudio muito longo. Duração máxima: 30 minutos`);
          setSelectedFile(null);
          setAudioUrl(null);
          URL.revokeObjectURL(url);
          setIsProcessing(false);
          return;
        }

        setIsProcessing(false);

        // Comprimir áudio se necessário
        if (shouldCompress(file)) {
          setIsCompressing(true);
          setCompressionProgress(0);
          
          try {
            console.log("🗜️  Iniciando compressão automática...");
            toast.info("Comprimindo áudio para acelerar o upload...");

            const result = await compressAudio(file, {
              bitrate: 96, // 96 kbps é ideal para transcrição de voz
              onProgress: (progress) => setCompressionProgress(progress),
            });

            setCompressedBlob(result.compressedBlob);
            setCompressedSize(result.compressedSize);
            setIsCompressing(false);

            toast.success(
              `Áudio comprimido! Economia de ${result.compressionRatio.toFixed(0)}%`
            );
          } catch (err) {
            console.error("Erro na compressão:", err);
            toast.warning("Não foi possível comprimir. Usando arquivo original.");
            setIsCompressing(false);
            setCompressedBlob(null);
          }
        }
      });

      audio.addEventListener("error", () => {
        setError("Erro ao carregar o arquivo de áudio. Verifique se o arquivo está corrompido.");
        setSelectedFile(null);
        setAudioUrl(null);
        URL.revokeObjectURL(url);
        setIsProcessing(false);
      });
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
    setCompressedBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setOriginalSize(0);
    setCompressedSize(0);
    setCompressionProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [audioUrl]);

  const handleConfirm = useCallback(async () => {
    if (!selectedFile) return;

    try {
      // Usar blob comprimido se disponível, senão usar original
      const blob = compressedBlob || new Blob([selectedFile], { type: selectedFile.type });
      onUploadComplete(blob, duration);
    } catch (err) {
      console.error("Erro ao confirmar upload:", err);
      toast.error("Erro ao processar arquivo");
    }
  }, [selectedFile, compressedBlob, duration, onUploadComplete]);

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
          Envie um arquivo de áudio da consulta (MP3, WAV, M4A, AAC, WebM, OGG)
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
                <p>Formatos: MP3, WAV, M4A, AAC, WebM, OGG</p>
                <p>Tamanho máximo: 50MB • Duração máxima: 30 minutos</p>
              </div>
            </div>
          </div>
        )}

        {/* Preview do arquivo selecionado */}
        {selectedFile && (
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

                {/* Compressão em andamento */}
                {isCompressing && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Comprimindo áudio...
                      </span>
                      <span className="font-medium">{compressionProgress}%</span>
                    </div>
                    <Progress value={compressionProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Reduzindo tamanho para acelerar upload
                    </p>
                  </div>
                )}

                {/* Compressão concluída */}
                {!isCompressing && compressedBlob && compressedSize > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0 text-sm">
                        <p className="font-medium text-green-900 dark:text-green-100 mb-1">
                          Áudio comprimido com sucesso!
                        </p>
                        <div className="space-y-1 text-xs text-green-700 dark:text-green-300">
                          <div className="flex items-center justify-between">
                            <span>Original:</span>
                            <span className="font-mono">{formatFileSize(originalSize)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Comprimido:</span>
                            <span className="font-mono font-semibold">{formatFileSize(compressedSize)}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-green-200 dark:border-green-800">
                            <span>Economia:</span>
                            <span className="font-semibold">
                              {((1 - compressedSize / originalSize) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status */}
                {duration > 0 && !isCompressing && (
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
