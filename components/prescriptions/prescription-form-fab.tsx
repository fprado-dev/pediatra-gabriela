"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Save,
  X,
  FileText,
  BookMarked,
  Loader2
} from "lucide-react";
import Link from "next/link";

interface PrescriptionFormFABProps {
  consultationId: string | undefined;
  isSaving: boolean;
  onSave: () => void;
  onUseTemplate: () => void;
  onSaveAsTemplate: () => void;
  existingPrescription?: boolean;
}

export function PrescriptionFormFAB({
  consultationId,
  isSaving,
  onSave,
  onUseTemplate,
  onSaveAsTemplate,
  existingPrescription = false,
}: PrescriptionFormFABProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  return (
    <>
      <div className="fixed top-32 right-2 z-50 flex flex-col gap-2">
        {/* Salvar Receita */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              onClick={onSave}
              disabled={isSaving}
              className="h-12 w-12 rounded-full shadow-lg bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 animate-fade-in-bounce"
              style={{ animationDelay: '10ms' }}
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Salvar Receita</TooltipContent>
        </Tooltip>

        {/* Usar Templates */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              onClick={onUseTemplate}
              className="h-12 w-12 rounded-full shadow-lg bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 animate-fade-in-bounce"
              style={{ animationDelay: '200ms' }}
            >
              <FileText className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Usar Templates</TooltipContent>
        </Tooltip>

        {/* Salvar como Template */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              onClick={onSaveAsTemplate}
              className="h-12 w-12 rounded-full shadow-lg bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 animate-fade-in-bounce"
              style={{ animationDelay: '300ms' }}
            >
              <BookMarked className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Salvar como Template</TooltipContent>
        </Tooltip>

        {/* Cancelar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              onClick={() => setShowCancelDialog(true)}
              className="h-12 w-12 rounded-full shadow-lg bg-white hover:bg-red-50 text-red-600 border border-gray-200 animate-fade-in-bounce"
              style={{ animationDelay: '400ms' }}
            >
              <X className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Cancelar</TooltipContent>
        </Tooltip>
      </div>

      {/* Dialog de Confirmação de Cancelamento */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Receita</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar? Todas as alterações não salvas serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-start items-start">
            <AlertDialogCancel  >Continuar Editando</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Link className="bg-transparent p-0 hover:bg-transparent" href={`/consultations/${consultationId}/preview`}>
                <Button variant="destructive">
                  Sim, Cancelar
                </Button>
              </Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
