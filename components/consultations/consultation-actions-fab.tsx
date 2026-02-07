"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Download,
  PencilLine,
} from "lucide-react";
import Link from "next/link";
import { DeleteConsultationButton } from "./delete-consultation-button";

interface ConsultationActionsFABProps {
  consultationId: string;
}

export function ConsultationActionsFAB({
  consultationId,
}: ConsultationActionsFABProps) {
  return (
    <div className="fixed top-32 right-2 z-50 flex flex-col gap-2">
      {/* Download */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 animate-fade-in-bounce"
            style={{ animationDelay: '0ms' }}
          >
            <a href={`/api/consultations/${consultationId}/download`} download>
              <Download className="h-5 w-5" />
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Download PDF</TooltipContent>
      </Tooltip>

      {/* Editar */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 animate-fade-in-bounce"
            style={{ animationDelay: '100ms' }}
          >
            <Link href={`/consultations/${consultationId}/edit`}>
              <PencilLine className="h-5 w-5" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Editar Consulta</TooltipContent>
      </Tooltip>

      {/* Excluir */}
      <div className="animate-fade-in-bounce" style={{ animationDelay: '200ms' }}>
        <DeleteConsultationButton consultationId={consultationId} variant="icon" />
      </div>
    </div>
  );
}
