"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Upload } from "lucide-react";

interface ModeSelectorProps {
  onSelectMode: (mode: "record" | "upload") => void;
}

export function ModeSelector({ onSelectMode }: ModeSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Como você deseja adicionar a consulta?</CardTitle>
        <CardDescription>
          Escolha entre gravar uma nova consulta ou fazer upload de um arquivo de áudio existente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Opção: Gravar */}
          <button
            onClick={() => onSelectMode("record")}
            className="group relative flex flex-col items-center justify-center p-8 rounded-lg border-2 border-muted hover:border-primary hover:bg-primary/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <div className="mb-4 p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Mic className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Gravar Agora</h3>
            <p className="text-sm text-muted-foreground text-center">
              Grave a consulta diretamente pelo navegador
            </p>
            <div className="mt-4 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-medium">
              Recomendado
            </div>
          </button>

          {/* Opção: Upload */}
          <button
            onClick={() => onSelectMode("upload")}
            className="group relative flex flex-col items-center justify-center p-8 rounded-lg border-2 border-muted hover:border-primary hover:bg-primary/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <div className="mb-4 p-4 rounded-full bg-muted group-hover:bg-primary/20 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload de Arquivo</h3>
            <p className="text-sm text-muted-foreground text-center">
              Envie um áudio já gravado (MP3, WAV, M4A, etc.)
            </p>
            <div className="mt-4 text-xs text-muted-foreground">
              Até 50MB • 30min máx
            </div>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
