"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface DeleteConsultationButtonProps {
  consultationId: string;
  variant?: "default" | "icon";
}

export function DeleteConsultationButton({ consultationId, variant = "default" }: DeleteConsultationButtonProps) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from("consultations")
        .delete()
        .eq("id", consultationId);

      if (error) throw error;

      toast.success("Consulta excluída com sucesso");
      router.push("/consultations");
    } catch (error) {
      console.error("Erro ao excluir consulta:", error);
      toast.error("Erro ao excluir consulta");
    } finally {
      setIsDeleting(false);
      setShowDialog(false);
    }
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant === "icon" ? "default" : "outline"}
            size="icon"
            onClick={() => setShowDialog(true)}
            className={
              variant === "icon"
                ? "h-12 w-12 rounded-full shadow-lg bg-white hover:bg-red-50 text-red-600 border border-gray-200"
                : "text-red-600 hover:text-red-700 hover:bg-red-50"
            }
          >
            <Trash2 className={variant === "icon" ? "h-5 w-5" : "h-4 w-4"} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side={variant === "icon" ? "left" : "top"}>Excluir Consulta</TooltipContent>
      </Tooltip>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Consulta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta consulta? Esta ação não pode ser desfeita.
              Todos os dados, incluindo receitas e atestados, serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
