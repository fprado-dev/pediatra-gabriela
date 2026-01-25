import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Download,
  PencilLine,
  Pill,
  Lightbulb,
  AlertTriangle,
  Shield,
  StickyNote,
  Calendar,
  User,
} from "lucide-react";

export const dynamic = "force-dynamic";

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

export default async function PrescriptionViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Buscar consulta com dados do paciente
  const { data: consultation, error } = await supabase
    .from("consultations")
    .select(`
      id,
      consultation_date,
      diagnosis,
      prescription_data,
      patient:patients(
        id, 
        full_name, 
        date_of_birth
      )
    `)
    .eq("id", id)
    .eq("doctor_id", user.id)
    .single();

  if (error || !consultation) {
    notFound();
  }

  // Buscar perfil do médico
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, crm")
    .eq("id", user.id)
    .single();

  const patient = Array.isArray(consultation.patient)
    ? consultation.patient[0]
    : consultation.patient;

  const prescriptionData = consultation.prescription_data as PrescriptionData | null;

  // Se não tem receita, redirecionar para criar
  if (!prescriptionData || !prescriptionData.medications?.length) {
    redirect(`/consultations/${id}/prescription`);
  }

  // Calcular idade do paciente
  let patientAge: string | null = null;
  if (patient?.date_of_birth) {
    const birth = new Date(patient.date_of_birth);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      years--;
    }

    if (years === 0) {
      const months = monthDiff + (today.getDate() >= birth.getDate() ? 0 : -1) + 12;
      patientAge = `${months % 12} ${months % 12 === 1 ? "mês" : "meses"}`;
    } else {
      patientAge = `${years} ${years === 1 ? "ano" : "anos"}`;
    }
  }

  const today = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/consultations/${id}/preview`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Receita Médica</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>{patient?.full_name}</span>
              {patientAge && (
                <>
                  <span>•</span>
                  <span>{patientAge}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/consultations/${id}/prescription`}>
              <PencilLine className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
          <Button asChild size="sm">
            <a href={`/api/prescriptions/${id}/download`} download>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </a>
          </Button>
        </div>
      </div>

      {/* Data */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>{today}</span>
      </div>

      <Separator />

      {/* Diagnóstico */}
      {consultation.diagnosis && (
        <div className="bg-muted/30 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Diagnóstico:</p>
          <p className="font-medium">{consultation.diagnosis}</p>
        </div>
      )}

      {/* Medicamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Pill className="h-5 w-5 text-primary" />
            Uso Oral
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {prescriptionData.medications.map((med, index) => (
            <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-semibold">{med.name}</p>
                    {med.quantity && (
                      <p className="text-sm text-muted-foreground">
                        Quantidade: {med.quantity}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {med.dosage && (
                <p className="text-sm mt-2 ml-9">
                  <span className="text-muted-foreground">Dosagem:</span>{" "}
                  {med.dosage}
                </p>
              )}
              {med.instructions && (
                <p className="text-sm mt-1 ml-9 bg-muted/50 p-2 rounded">
                  {med.instructions}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Orientações */}
      {prescriptionData.orientations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Orientações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">
              {prescriptionData.orientations}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sinais de Alerta */}
      {prescriptionData.alertSigns && (
        <Card className="border-orange-200 dark:border-orange-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-orange-600 dark:text-orange-400">
              <AlertTriangle className="h-5 w-5" />
              Sinais de Alerta - Procurar Atendimento Se
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">
              {prescriptionData.alertSigns}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Prevenção */}
      {prescriptionData.prevention && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-green-500" />
              Como Prevenir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">
              {prescriptionData.prevention}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Anotações */}
      {(prescriptionData.notes ||
        prescriptionData.returnDays ||
        prescriptionData.bringExams ||
        prescriptionData.observeFeeding) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <StickyNote className="h-5 w-5 text-blue-500" />
              Anotações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {prescriptionData.returnDays && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Retorno</Badge>
                <span className="text-sm">
                  Em {prescriptionData.returnDays} dias
                </span>
              </div>
            )}
            {prescriptionData.bringExams && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Exames</Badge>
                <span className="text-sm">Levar resultados de exames</span>
              </div>
            )}
            {prescriptionData.observeFeeding && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Alimentação</Badge>
                <span className="text-sm">Observar aceitação alimentar</span>
              </div>
            )}
            {prescriptionData.notes && (
              <p className="whitespace-pre-wrap text-sm pt-2 border-t mt-3">
                {prescriptionData.notes}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rodapé */}
      <div className="text-center pt-6 border-t space-y-1">
        <p className="font-semibold">{profile?.full_name || "Médico(a)"}</p>
        {profile?.crm && (
          <p className="text-sm text-muted-foreground">CRM {profile.crm}</p>
        )}
      </div>
    </div>
  );
}
