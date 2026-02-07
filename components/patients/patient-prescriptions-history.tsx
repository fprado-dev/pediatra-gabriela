"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill, Download, Loader2, Calendar, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { useState } from "react";

interface Medication {
  name: string;
  dosage: string;
  quantity: string;
  instructions: string;
}

interface PrescriptionData {
  medications: Medication[];
  orientations?: string;
  alertSigns?: string;
  prevention?: string;
  notes?: string;
  returnDays?: number;
  bringExams?: boolean;
  observeFeeding?: boolean;
}

interface Consultation {
  id: string;
  consultation_date?: string;
  created_at: string;
  prescription_data: PrescriptionData | null;
  diagnosis?: string;
}

interface PatientPrescriptionsHistoryProps {
  consultations: Consultation[];
}

export function PatientPrescriptionsHistory({
  consultations,
}: PatientPrescriptionsHistoryProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Filtrar apenas consultas com receitas
  const prescriptions = consultations.filter(
    (consultation) =>
      consultation.prescription_data &&
      consultation.prescription_data.medications &&
      consultation.prescription_data.medications.length > 0
  );

  const handleDownload = async (consultationId: string) => {
    setDownloadingId(consultationId);
    try {
      const response = await fetch(`/api/prescriptions/${consultationId}/download`);

      if (!response.ok) {
        throw new Error("Erro ao baixar receita");
      }

      // Download PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Receita_${format(new Date(), "yyyyMMdd")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Receita baixada com sucesso!");
    } catch (error: any) {
      console.error("Erro ao baixar receita:", error);
      toast.error("Erro ao baixar receita");
    } finally {
      setDownloadingId(null);
    }
  };

  if (prescriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Últimas Receitas
          </CardTitle>
          <CardDescription>
            Nenhuma receita emitida ainda para este paciente
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5" />
          Últimas Receitas
        </CardTitle>
        <CardDescription>
          {prescriptions.length} receita(s) emitida(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {prescriptions.map((prescription) => {
            const medications = prescription.prescription_data?.medications || [];
            const displayMedications = medications.slice(0, 3);
            const remainingCount = medications.length - 3;

            return (
              <div
                key={prescription.id}
                className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Pill className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-base">
                        {medications.length} {medications.length === 1 ? "medicamento" : "medicamentos"}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(
                            new Date(prescription.consultation_date || prescription.created_at),
                            "dd 'de' MMMM, yyyy",
                            { locale: ptBR }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lista de medicamentos */}
                  <div className="pl-[52px] space-y-1">
                    {displayMedications.map((med, idx) => (
                      <p key={idx} className="text-sm text-gray-700">
                        • {med.name}
                        {med.dosage && <span className="text-muted-foreground"> - {med.dosage}</span>}
                      </p>
                    ))}
                    {remainingCount > 0 && (
                      <p className="text-sm text-muted-foreground italic">
                        ... e mais {remainingCount} {remainingCount === 1 ? "medicamento" : "medicamentos"}
                      </p>
                    )}
                  </div>

                  {/* Diagnóstico se existir */}
                  {prescription.diagnosis && (
                    <div className="pl-[52px]">
                      <p className="text-xs text-muted-foreground">
                        Diagnóstico: <span className="text-gray-700">{prescription.diagnosis}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex flex-col gap-2 ml-4">
                  <Link href={`/consultations/${prescription.id}/prescription/view`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(prescription.id)}
                    disabled={downloadingId === prescription.id}
                  >
                    {downloadingId === prescription.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Baixando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
