import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  Trash2,
  Cake,
  UserCheck,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DeleteConsultationButton } from "@/components/consultations/delete-consultation-button";
import { PrescriptionActionsFAB } from "@/components/consultations/prescription-actions-fab";

export const dynamic = "force-dynamic";

// Função para calcular idade detalhada
function calculateDetailedAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const today = new Date();

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  // Formatação baseada na idade
  if (years === 0 && months === 0) {
    return `${days} ${days === 1 ? 'dia' : 'dias'}`;
  } else if (years === 0) {
    if (days === 0) {
      return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    }
    return `${months} ${months === 1 ? 'mês' : 'meses'} e ${days} ${days === 1 ? 'dia' : 'dias'}`;
  } else {
    if (months === 0) {
      return `${years} ${years === 1 ? 'ano' : 'anos'}`;
    }
    return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`;
  }
}

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
        date_of_birth,
        responsible_name
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

  // Calcular idade detalhada
  let patientAge: string | null = null;
  if (patient?.date_of_birth) {
    patientAge = calculateDetailedAge(patient.date_of_birth);
  }

  const today = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* FAB de ações */}
      <PrescriptionActionsFAB consultationId={id} />

      <div className="px-6 max-w-7xl mx-auto space-y-6">

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {patient?.full_name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-4">
              {patient?.date_of_birth && (
                <div className="flex items-center gap-1.5">
                  <Cake className="h-3.5 w-3.5 text-gray-400" />
                  <span>{format(new Date(patient.date_of_birth), "dd/MM/yyyy", { locale: ptBR })}</span>
                  {patientAge && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-700 font-medium">{patientAge}</span>
                    </>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-gray-400" />
                <span>{patient?.responsible_name}</span>
              </div>
              {consultation.consultation_date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <span>{format(new Date(consultation.consultation_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
                </div>
              )}
            </div>
          </div>
          <Link href="/consultations">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>

          </Link>
        </div>

        <Separator className="my-4" />


        {/* Medicamentos */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <Pill className="h-5 w-5 text-primary" />
              <span>Medicamentos</span>
              <span className="ml-auto text-sm font-normal text-gray-500">
                {prescriptionData.medications.length} {prescriptionData.medications.length === 1 ? 'item' : 'itens'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100">
            {prescriptionData.medications.map((med, index) => (
              <div key={index} className="py-6 first:pt-6 last:pb-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">{med.name}</h3>
                      {med.quantity && (
                        <p className="text-sm text-gray-600 mt-1">
                          Quantidade: {med.quantity}
                        </p>
                      )}
                    </div>

                    {med.dosage && (
                      <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Dosagem
                        </p>
                        <p className="text-sm text-gray-900">{med.dosage}</p>
                      </div>
                    )}

                    {med.instructions && (
                      <div className="bg-blue-50/50 rounded-md p-3 border border-blue-100">
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Instruções de Uso
                        </p>
                        <p className="text-sm text-gray-900 leading-relaxed">{med.instructions}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Orientações */}
        {prescriptionData.orientations && (
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                <Lightbulb className="h-5 w-5 text-primary" />
                <span>Orientações</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                {prescriptionData.orientations}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Sinais de Alerta */}
        {prescriptionData.alertSigns && (
          <Card className="bg-orange-50/30 shadow-sm border border-orange-200/50">
            <CardHeader className="border-b border-orange-100/50 pb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <CardTitle className="text-lg font-semibold text-orange-900">
                    Sinais de Alerta
                  </CardTitle>
                  <p className="text-sm text-orange-700 mt-1">
                    Procurar atendimento médico se apresentar
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="whitespace-pre-wrap text-sm text-gray-900 leading-relaxed">
                {prescriptionData.alertSigns}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Prevenção */}
        {prescriptionData.prevention && (
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                <Shield className="h-5 w-5 text-primary" />
                <span>Como Prevenir</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
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
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                  <StickyNote className="h-5 w-5 text-primary" />
                  <span>Anotações</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                {prescriptionData.returnDays && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">
                      <span className="font-medium">Retorno:</span> Em {prescriptionData.returnDays} dias
                    </span>
                  </div>
                )}
                {prescriptionData.bringExams && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-4 h-4 flex items-center justify-center text-gray-400">•</span>
                    <span className="text-gray-700">Levar resultados de exames no retorno</span>
                  </div>
                )}
                {prescriptionData.observeFeeding && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-4 h-4 flex items-center justify-center text-gray-400">•</span>
                    <span className="text-gray-700">Observar e anotar aceitação alimentar</span>
                  </div>
                )}
                {prescriptionData.notes && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                      {prescriptionData.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        {/* Rodapé - Assinatura Médica */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="text-center py-8">
            <div className="space-y-2">
              <div className="mx-auto w-16 h-px bg-gray-300 mb-4"></div>
              <p className="text-lg font-semibold text-gray-900">{profile?.full_name || "Médico(a)"}</p>
              {profile?.crm && (
                <p className="text-sm text-gray-600">CRM {profile.crm}</p>
              )}
              <p className="text-xs text-gray-400 pt-2">
                {today}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
