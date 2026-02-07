"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Sparkles, 
  Loader2, 
  Undo2,
  BarChart3,
  Scissors,
  FileText,
  Briefcase,
  MessageCircle
} from "lucide-react";
import { toast } from "sonner";

type ImproveMode = 'condensar' | 'encurtar' | 'alongar' | 'profissional' | 'informal';

interface TextImproverProps {
  value: string;
  onChange: (newValue: string) => void;
  fieldName?: string;
}

const IMPROVE_OPTIONS: Array<{
  mode: ImproveMode;
  label: string;
  icon: React.ElementType;
  description: string;
}> = [
  {
    mode: 'condensar',
    label: 'Condensar',
    icon: BarChart3,
    description: 'Reduz tamanho mantendo informações essenciais'
  },
  {
    mode: 'encurtar',
    label: 'Encurtar',
    icon: Scissors,
    description: 'Versão ultra-resumida, apenas o crítico'
  },
  {
    mode: 'alongar',
    label: 'Alongar',
    icon: FileText,
    description: 'Expande com mais detalhes clínicos'
  },
  {
    mode: 'profissional',
    label: 'Mais Profissional',
    icon: Briefcase,
    description: 'Linguagem técnica e formal'
  },
  {
    mode: 'informal',
    label: 'Mais Informal',
    icon: MessageCircle,
    description: 'Linguagem acessível e coloquial'
  },
];

export function TextImprover({ value, onChange, fieldName }: TextImproverProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalText, setOriginalText] = useState<string | null>(null);

  const hasChanges = originalText !== null;

  const handleImprove = async (mode: ImproveMode) => {
    if (!value || value.trim().length < 50) {
      toast.error("Texto muito curto para aprimorar (mínimo 50 caracteres)");
      return;
    }

    setIsProcessing(true);

    // Salvar texto original apenas na primeira modificação
    if (!hasChanges) {
      setOriginalText(value);
    }

    try {
      const response = await fetch('/api/consultations/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode,
          text: value,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao aprimorar texto');
      }

      const data = await response.json();

      if (data.skipped) {
        toast.info(data.reason);
        return;
      }

      // Atualizar o valor do campo via callback
      onChange(data.improvedText);

      const option = IMPROVE_OPTIONS.find(opt => opt.mode === mode);
      toast.success(`Texto aprimorado: ${option?.label}`);

      console.log(`✨ Texto aprimorado [${fieldName || 'campo'}]:`, {
        mode,
        originalLength: data.originalLength,
        improvedLength: data.improvedLength,
        diff: data.improvedLength - data.originalLength,
      });
    } catch (error: any) {
      console.error('Erro ao aprimorar texto:', error);
      toast.error(error.message || 'Erro ao aprimorar texto');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevert = () => {
    if (originalText) {
      onChange(originalText);
      setOriginalText(null);
      toast.success('Texto revertido para a versão original');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isProcessing}
            className="gap-2 text-xs"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Aprimorar
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {IMPROVE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <DropdownMenuItem
                key={option.mode}
                onClick={() => handleImprove(option.mode)}
                className="gap-2 cursor-pointer"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {hasChanges && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRevert}
          className="gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Undo2 className="h-3.5 w-3.5" />
          Reverter
        </Button>
      )}
    </div>
  );
}
