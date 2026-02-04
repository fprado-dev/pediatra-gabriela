"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, List, Zap, Loader2 } from "lucide-react";
import { CondenseMode } from "@/hooks/use-condensed-text";
import { cn } from "@/lib/utils";

interface TextDisplayControlsProps {
  mode: CondenseMode;
  onModeChange: (mode: CondenseMode) => void;
  isLoading: boolean;
  wordCount?: {
    original: number;
    current: number;
  };
  compressionRatio?: number | null;
}

const MODES = [
  {
    id: 'full' as CondenseMode,
    label: 'Completo',
    icon: FileText,
    description: 'Texto original completo',
  },
  {
    id: 'summary' as CondenseMode,
    label: 'Resumido',
    icon: FileText,
    description: 'Resumo mantendo informações essenciais',
  },
  {
    id: 'bullets' as CondenseMode,
    label: 'Tópicos',
    icon: List,
    description: 'Lista organizada por categoria',
  },
  {
    id: 'key_info' as CondenseMode,
    label: 'Essencial',
    icon: Zap,
    description: 'Apenas informações críticas',
  },
];

export function TextDisplayControls({
  mode,
  onModeChange,
  isLoading,
  wordCount,
  compressionRatio,
}: TextDisplayControlsProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {MODES.map((modeOption) => {
          const Icon = modeOption.icon;
          const isActive = mode === modeOption.id;
          
          return (
            <Button
              key={modeOption.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onModeChange(modeOption.id)}
              disabled={isLoading}
              className={cn(
                "gap-2 transition-all",
                isActive && "shadow-sm"
              )}
              title={modeOption.description}
            >
              {isLoading && mode === modeOption.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              {modeOption.label}
            </Button>
          );
        })}
      </div>
      
      {/* Indicadores */}
      {wordCount && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {mode !== 'full' && (
            <>
              <span>
                {wordCount.current} de {wordCount.original} palavras
              </span>
              {compressionRatio !== null && compressionRatio > 0 && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {compressionRatio}% menor
                </Badge>
              )}
            </>
          )}
          {mode === 'full' && (
            <span>{wordCount.original} palavras</span>
          )}
        </div>
      )}
    </div>
  );
}
