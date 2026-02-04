"use client";

import { useEffect, useState } from "react";
import { Loader2, Volume2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AudioPlayerProps {
  consultationId: string;
}

export function AudioPlayer({ consultationId }: AudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAudioUrl() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/consultations/${consultationId}/audio`);

        if (!response.ok) {
          throw new Error("Erro ao carregar áudio");
        }

        const data = await response.json();
        setAudioUrl(data.signedUrl);
      } catch (err: any) {
        console.error("Erro ao carregar áudio:", err);
        setError(err.message || "Erro ao carregar áudio");
      } finally {
        setIsLoading(false);
      }
    }

    loadAudioUrl();
  }, [consultationId]);

  if (isLoading) {
    return (
      <div className="pt-8 border-t">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Áudio da Consulta
          </h2>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Carregando áudio...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-8 border-t">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Áudio da Consulta
          </h2>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!audioUrl) {
    return null;
  }

  return (
    <div className="p-6 bg-gray-50/30">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Áudio da Consulta
          </h2>
        </div>
        <audio
          controls
          src={audioUrl}
          className="w-full h-10"
          style={{ filter: "grayscale(20%)" }}
          preload="metadata"
        >
          Seu navegador não suporta o elemento de áudio.
        </audio>
        <p className="text-xs text-muted-foreground">
          Link válido por 1 hora • Recarregue a página se expirar
        </p>
      </div>
    </div>
  );
}
