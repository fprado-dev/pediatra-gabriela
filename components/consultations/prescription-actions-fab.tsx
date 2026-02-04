"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Download,
  PencilLine
} from "lucide-react";
import Link from "next/link";

interface PrescriptionActionsFABProps {
  consultationId: string;
}

export function PrescriptionActionsFAB({
  consultationId,
}: PrescriptionActionsFABProps) {
  return (
    <div className="fixed top-32 right-2 z-50 flex flex-col gap-2">
      {/* Editar */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 animate-fade-in-bounce"
            style={{ animationDelay: '0ms' }}
          >
            <Link href={`/consultations/${consultationId}/prescription`}>
              <PencilLine className="h-5 w-5" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Editar Receita</TooltipContent>
      </Tooltip>

      {/* Download */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 animate-fade-in-bounce"
            style={{ animationDelay: '100ms' }}
          >
            <a href={`/api/prescriptions/${consultationId}/download`} download>
              <Download className="h-5 w-5" />
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Download PDF</TooltipContent>
      </Tooltip>

      {/* Excluir */}
      <div className="animate-fade-in-bounce" style={{ animationDelay: '200ms' }}>
      </div>
    </div>
  );
}
