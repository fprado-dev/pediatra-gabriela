"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  FileCheck,
  Pill,
  Download,
  PencilLine,
  FileText
} from "lucide-react";
import Link from "next/link";
import { MedicalCertificateModal } from "./medical-certificate-modal";
import { DeleteConsultationButton } from "./delete-consultation-button";

interface ConsultationActionsFABProps {
  consultationId: string;
  hasPrescription: boolean;
  patientName: string;
  patientDateOfBirth: string;
  responsibleName?: string;
  consultationDate: string;
  doctorName: string;
  doctorCRM: string;
  doctorSpecialty?: string;
}

export function ConsultationActionsFAB({
  consultationId,
  hasPrescription,
  patientName,
  patientDateOfBirth,
  responsibleName,
  consultationDate,
  doctorName,
  doctorCRM,
  doctorSpecialty,
}: ConsultationActionsFABProps) {
  return (
    <div className="fixed top-32 right-2 z-50 flex flex-col gap-2">
      {/* Receita */}
      {hasPrescription ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 animate-fade-in-bounce"
              style={{ animationDelay: '0ms' }}
            >
              <Link href={`/consultations/${consultationId}/prescription/view`}>
                <FileCheck className="h-5 w-5" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Ver Receita</TooltipContent>
        </Tooltip>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 animate-fade-in-bounce"
              style={{ animationDelay: '0ms' }}
            >
              <Link href={`/consultations/${consultationId}/prescription`}>
                <Pill className="h-5 w-5" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Criar Receita</TooltipContent>
        </Tooltip>
      )}

      {/* Atestado */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="animate-fade-in-bounce" style={{ animationDelay: '100ms' }}>
            <MedicalCertificateModal
              consultationId={consultationId}
              patientName={patientName}
              patientDateOfBirth={patientDateOfBirth}
              responsibleName={responsibleName}
              consultationDate={consultationDate}
              doctorName={doctorName}
              doctorCRM={doctorCRM}
              doctorSpecialty={doctorSpecialty}
              variant="icon"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">Gerar Atestado</TooltipContent>

      </Tooltip>
      {/* Download */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 animate-fade-in-bounce"
            style={{ animationDelay: '200ms' }}
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
            style={{ animationDelay: '300ms' }}
          >
            <Link href={`/consultations/${consultationId}/edit`}>
              <PencilLine className="h-5 w-5" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Editar Consulta</TooltipContent>
      </Tooltip>

      {/* Excluir */}
      <div className="animate-fade-in-bounce" style={{ animationDelay: '400ms' }}>
        <DeleteConsultationButton consultationId={consultationId} variant="icon" />
      </div>
    </div>
  );
}
