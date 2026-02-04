"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Recycle, RotateCcw, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExistingConsultation {
  id: string;
  patientId: string;
  patientName: string;
  createdAt: string;
  status: string;
  hasTranscription: boolean;
}

interface DuplicateAudioDialogProps {
  open: boolean;
  existingConsultation: ExistingConsultation;
  currentPatientId: string;
  currentPatientName: string;
  isSamePatient: boolean;
  onViewExisting: () => void;
  onReuse: () => void;
  onProcessAnyway: () => void;
  onCancel: () => void;
  isReusing?: boolean;
}

export function DuplicateAudioDialog({
  open,
  existingConsultation,
  currentPatientId,
  currentPatientName,
  isSamePatient,
  onViewExisting,
  onReuse,
  onProcessAnyway,
  onCancel,
  isReusing = false,
}: DuplicateAudioDialogProps) {
  const timeAgo = formatDistanceToNow(new Date(existingConsultation.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Recycle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-lg">
                Áudio já processado
              </AlertDialogTitle>
            </div>
          </div>
          
          <AlertDialogDescription className="space-y-3 text-sm">
            <div>
              Este áudio foi usado em uma consulta de{" "}
              <strong className="text-foreground">{existingConsultation.patientName}</strong>{" "}
              <span className="text-muted-foreground">{timeAgo}</span>.
            </div>

            {!isSamePatient && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-900">
                  Você está criando para <strong>{currentPatientName}</strong>.
                  Os dados serão copiados mas você pode editá-los depois.
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="gap-1">
                <span>⚡</span> Economiza ~2 min
              </Badge>
              <Badge variant="outline" className="gap-1">
                <span>💰</span> Economiza ~$0.10
              </Badge>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col sm:flex-col gap-2 sm:gap-2">
          {/* Ação principal: Reutilizar */}
          <Button
            onClick={onReuse}
            disabled={isReusing}
            className="w-full gap-2"
            size="lg"
          >
            <Recycle className="h-4 w-4" />
            {isReusing ? (
              "Criando consulta..."
            ) : (
              <>
                Reutilizar para {isSamePatient ? "mesmo paciente" : currentPatientName}
              </>
            )}
          </Button>

          {/* Ações secundárias */}
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button
              onClick={onViewExisting}
              variant="outline"
              disabled={isReusing}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Ver existente
            </Button>

            <Button
              onClick={onProcessAnyway}
              variant="outline"
              disabled={isReusing}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Processar de novo
            </Button>
          </div>

          {/* Cancelar */}
          <Button
            onClick={onCancel}
            variant="ghost"
            disabled={isReusing}
            className="w-full"
            size="sm"
          >
            Cancelar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
