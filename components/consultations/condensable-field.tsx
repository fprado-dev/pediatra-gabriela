"use client";

import { useState, useEffect, useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { TextDisplayControls } from "./text-display-controls";
import { useCondensedText, CondenseMode } from "@/hooks/use-condensed-text";
import { AlertCircle, FileText, Activity, Pill, ClipboardList } from "lucide-react";

interface CondensableFieldProps {
  title?: string; // Opcional - se vazio, não renderiza header
  iconName?: 'file-text' | 'activity' | 'pill' | 'clipboard-list' | ''; // Opcional - permite string vazia
  originalText: string;
  consultationId: string;
  fieldName: string;
}

const ICON_MAP = {
  'file-text': FileText,
  'activity': Activity,
  'pill': Pill,
  'clipboard-list': ClipboardList,
};

const MIN_WORDS_FOR_CONDENSING = 50; // ~1-2 parágrafos
const AUTO_CONDENSE_THRESHOLD = 500; // Auto-condensar textos muito longos

function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

export function CondensableField({
  title,
  iconName,
  originalText,
  consultationId,
  fieldName,
}: CondensableFieldProps) {
  const Icon = iconName && ICON_MAP[iconName] ? ICON_MAP[iconName] : null;
  const wordCount = useMemo(() => countWords(originalText), [originalText]);
  const shouldShowHeader = title && Icon;
  const shouldShowControls = wordCount >= MIN_WORDS_FOR_CONDENSING;
  
  // Determinar modo inicial baseado no tamanho
  const initialMode: CondenseMode = useMemo(() => {
    if (wordCount > AUTO_CONDENSE_THRESHOLD) {
      return 'summary'; // Iniciar condensado para textos muito longos
    }
    return 'full';
  }, [wordCount]);

  const [showAutoCondenseAlert, setShowAutoCondenseAlert] = useState(
    wordCount > AUTO_CONDENSE_THRESHOLD
  );

  const {
    displayText,
    mode,
    isLoading,
    error,
    compressionRatio,
    setMode,
    wordCount: counts,
  } = useCondensedText({
    consultationId,
    field: fieldName,
    originalText,
    initialMode,
  });

  // Salvar preferência do usuário
  useEffect(() => {
    if (mode !== initialMode && shouldShowControls) {
      try {
        localStorage.setItem(`condense_pref_${fieldName}`, mode);
      } catch (error) {
        console.warn('Erro ao salvar preferência:', error);
      }
    }
  }, [mode, initialMode, fieldName, shouldShowControls]);

  // Restaurar preferência do usuário
  useEffect(() => {
    if (shouldShowControls) {
      try {
        const saved = localStorage.getItem(`condense_pref_${fieldName}`);
        if (saved && ['full', 'summary', 'bullets', 'key_info'].includes(saved)) {
          setMode(saved as CondenseMode);
        }
      } catch (error) {
        console.warn('Erro ao carregar preferência:', error);
      }
    }
  }, [fieldName, shouldShowControls, setMode]);

  return (
    <div className="space-y-3">
      {/* Header - Só renderizar se title e Icon existirem */}
      {shouldShowHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {title}
            </h2>
          </div>
          
          {/* Controles de condensação */}
          {shouldShowControls && (
            <div className="flex-shrink-0">
              <TextDisplayControls
                mode={mode}
                onModeChange={setMode}
                isLoading={isLoading}
                wordCount={counts}
                compressionRatio={compressionRatio}
              />
            </div>
          )}
        </div>
      )}
      
      {/* Controles sem header (quando header oculto mas texto é condensável) */}
      {!shouldShowHeader && shouldShowControls && (
        <div className="flex justify-end">
          <TextDisplayControls
            mode={mode}
            onModeChange={setMode}
            isLoading={isLoading}
            wordCount={counts}
            compressionRatio={compressionRatio}
          />
        </div>
      )}

      {/* Alerta de auto-condensação */}
      {showAutoCondenseAlert && mode === 'summary' && (
        <Alert>
          <AlertDescription className="text-sm">
            Texto longo detectado ({wordCount} palavras). Mostrando versão resumida.
            <button
              onClick={() => setShowAutoCondenseAlert(false)}
              className="ml-2 underline hover:no-underline"
            >
              Entendi
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Conteúdo */}
      <div className="px-6">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <p className="text-base leading-relaxed whitespace-pre-wrap">
            {displayText}
          </p>
        )}
      </div>
    </div>
  );
}
