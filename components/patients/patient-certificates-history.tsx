"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { MedicalCertificate } from "@/lib/types/medical-certificate";
import {
  CERTIFICATE_TYPE_LABELS,
  CERTIFICATE_TYPE_ICONS,
} from "@/lib/types/medical-certificate";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

interface PatientCertificatesHistoryProps {
  patientId: string;
}

export function PatientCertificatesHistory({
  patientId,
}: PatientCertificatesHistoryProps) {
  const [certificates, setCertificates] = useState<(MedicalCertificate & { consultation_date?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCertificates();
  }, [patientId]);

  const fetchCertificates = async () => {
    try {
      // Buscar todos os atestados do paciente
      const response = await fetch(`/api/patients/${patientId}/certificates`);
      if (!response.ok) {
        throw new Error("Erro ao buscar atestados");
      }
      const data = await response.json();
      setCertificates(data);
    } catch (error) {
      console.error("Erro ao buscar atestados:", error);
      // Silenciosamente falhar se a API não existir ainda
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (certificate: MedicalCertificate) => {
    setDownloadingId(certificate.id);
    try {
      const response = await fetch(
        `/api/consultations/${certificate.consultation_id}/medical-certificate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            consultationId: certificate.consultation_id,
            certificateType: certificate.certificate_type,
            certificateData: certificate.certificate_data,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao gerar atestado");
      }

      // Download PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Atestado_${certificate.certificate_type}_${format(
        new Date(),
        "yyyyMMdd"
      )}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Atestado baixado novamente!");
    } catch (error: any) {
      console.error("Erro ao baixar atestado:", error);
      toast.error("Erro ao baixar atestado");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico de Atestados
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (certificates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico de Atestados
          </CardTitle>
          <CardDescription>
            Nenhum atestado gerado ainda para este paciente
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Histórico de Atestados
        </CardTitle>
        <CardDescription>
          {certificates.length} atestado(s) gerado(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {certificates.map((certificate) => (
            <div
              key={certificate.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xl">
                    {CERTIFICATE_TYPE_ICONS[certificate.certificate_type]}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">
                      {CERTIFICATE_TYPE_LABELS[certificate.certificate_type]}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Gerado em{" "}
                        {format(
                          new Date(certificate.generated_at),
                          "dd/MM/yyyy",
                          { locale: ptBR }
                        )}
                      </span>
                      {certificate.consultation_date && (
                        <>
                          <span>•</span>
                          <Link
                            href={`/consultations/${certificate.consultation_id}/preview`}
                            className="hover:underline"
                          >
                            Ver consulta
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRegenerate(certificate)}
                disabled={downloadingId === certificate.id}
              >
                {downloadingId === certificate.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Baixando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
