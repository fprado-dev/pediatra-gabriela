import { useState, useEffect, useCallback } from "react";

export type CondenseMode = 'full' | 'summary' | 'bullets' | 'key_info';

interface UseCondensedTextOptions {
  consultationId: string;
  field: string;
  originalText: string;
  initialMode?: CondenseMode;
}

interface CondensedTextCache {
  text: string;
  timestamp: number;
  compressionRatio: number;
}

interface UseCondensedTextReturn {
  displayText: string;
  mode: CondenseMode;
  isLoading: boolean;
  error: string | null;
  compressionRatio: number | null;
  setMode: (mode: CondenseMode) => void;
  wordCount: {
    original: number;
    current: number;
  };
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas em ms
const CACHE_PREFIX = 'condense_';

// Limpar cache antigo
function cleanExpiredCache() {
  const now = Date.now();
  const keys = Object.keys(localStorage);

  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      try {
        const cached = JSON.parse(localStorage.getItem(key) || '{}');
        if (cached.timestamp && (now - cached.timestamp > CACHE_TTL)) {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
  });
}

function getCacheKey(consultationId: string, field: string, mode: CondenseMode): string {
  return `${CACHE_PREFIX}${consultationId}_${field}_${mode}`;
}

function getFromCache(consultationId: string, field: string, mode: CondenseMode): CondensedTextCache | null {
  try {
    const key = getCacheKey(consultationId, field, mode);
    const cached = localStorage.getItem(key);

    if (!cached) return null;

    const data: CondensedTextCache = JSON.parse(cached);
    const now = Date.now();

    // Verificar se expirou
    if (now - data.timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function saveToCache(consultationId: string, field: string, mode: CondenseMode, text: string, compressionRatio: number) {
  try {
    const key = getCacheKey(consultationId, field, mode);
    const data: CondensedTextCache = {
      text,
      timestamp: Date.now(),
      compressionRatio,
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Erro ao salvar cache:', error);
  }
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

export function useCondensedText({
  consultationId,
  field,
  originalText,
  initialMode = 'full',
}: UseCondensedTextOptions): UseCondensedTextReturn {
  const [mode, setMode] = useState<CondenseMode>(initialMode);
  const [condensedTexts, setCondensedTexts] = useState<Record<CondenseMode, string>>({
    full: originalText,
    summary: '',
    bullets: '',
    key_info: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compressionRatios, setCompressionRatios] = useState<Record<CondenseMode, number | null>>({
    full: null,
    summary: null,
    bullets: null,
    key_info: null,
  });

  // Limpar cache expirado ao montar
  useEffect(() => {
    cleanExpiredCache();
  }, []);

  // Função para condensar texto
  const condenseText = useCallback(async (targetMode: CondenseMode) => {
    if (targetMode === 'full') {
      return; // Modo full não precisa condensar
    }

    // Verificar cache primeiro
    const cached = getFromCache(consultationId, field, targetMode);
    if (cached) {
      console.log(`📦 Usando texto condensado do cache (${targetMode})`);
      setCondensedTexts(prev => ({ ...prev, [targetMode]: cached.text }));
      setCompressionRatios(prev => ({ ...prev, [targetMode]: cached.compressionRatio }));
      return;
    }

    // Se não tem em cache, buscar da API
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/consultations/${consultationId}/condense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field,
          mode: targetMode,
          originalText,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao condensar texto');
      }

      const data = await response.json();

      if (data.skipped) {
        // Texto muito curto, usar original
        setCondensedTexts(prev => ({ ...prev, [targetMode]: originalText }));
        setCompressionRatios(prev => ({ ...prev, [targetMode]: 0 }));
      } else {
        // Salvar resultado
        setCondensedTexts(prev => ({ ...prev, [targetMode]: data.condensedText }));
        setCompressionRatios(prev => ({ ...prev, [targetMode]: data.compressionRatio }));

        // Salvar no cache
        saveToCache(consultationId, field, targetMode, data.condensedText, data.compressionRatio);
      }
    } catch (err: any) {
      console.error('Erro ao condensar texto:', err);
      setError(err.message || 'Erro ao condensar texto');
      // Em caso de erro, voltar para modo full
      setMode('full');
    } finally {
      setIsLoading(false);
    }
  }, [consultationId, field, originalText]);

  // Condensar quando modo mudar
  useEffect(() => {
    if (mode !== 'full' && !condensedTexts[mode]) {
      condenseText(mode);
    }
  }, [mode, condensedTexts, condenseText]);

  // Determinar texto a exibir
  const displayText = condensedTexts[mode] || originalText;

  // Calcular word counts
  const wordCount = {
    original: countWords(originalText),
    current: countWords(displayText),
  };

  return {
    displayText,
    mode,
    isLoading,
    error,
    compressionRatio: compressionRatios[mode],
    setMode,
    wordCount,
  };
}
