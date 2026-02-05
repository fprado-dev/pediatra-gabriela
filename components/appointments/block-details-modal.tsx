"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Lock, Trash2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScheduleBlock } from "@/lib/types/appointment";

interface BlockDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: ScheduleBlock | null;
  onUnblock: () => void;
}

export function BlockDetailsModal({
  open,
  onOpenChange,
  block,
  onUnblock,
}: BlockDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!block) return null;

  const startDate = new Date(block.start_datetime);
  const endDate = new Date(block.end_datetime);

  const handleUnblock = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/appointments/blocks/${block.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || "Erro ao desbloquear horário");
        return;
      }

      onUnblock();
      onOpenChange(false);
      setShowDeleteDialog(false);
    } catch (err) {
      console.error("Error unblocking slot:", err);
      setError("Erro ao desbloquear horário. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-gray-600" />
              Horário Bloqueado
            </DialogTitle>
            <DialogDescription>
              Detalhes do bloqueio de horário
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Data */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Data</p>
              <p className="text-base font-semibold">
                {format(startDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>

            {/* Horário */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Horário</p>
              <p className="text-base font-semibold">
                {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
              </p>
            </div>

            {/* Motivo */}
            {block.reason && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Motivo</p>
                <p className="text-base">{block.reason}</p>
              </div>
            )}

            {/* Criado em */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Criado em</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(block.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={loading}
              >
                Fechar
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Desbloquear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desbloquear Horário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desbloquear este horário? Ele ficará disponível novamente para agendamentos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnblock}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Desbloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
