import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Calendar, Clock, User, Stethoscope, FileText, Activity, PencilLine, Download, Pill, FileCheck, Users, Trash2, ShieldAlert, Cake, UserCheck, RefreshCw, Archive } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AudioPlayer } from "@/components/consultations/audio-player";
import { MedicalCertificatesList } from "@/components/consultations/medical-certificates-list";
import { CondensableField } from "@/components/consultations/condensable-field";
import { ProcessingRetry } from "@/components/consultations/processing-retry";
import { ConsultationActionsFAB } from "@/components/consultations/consultation-actions-fab";
import { BackButton } from "@/components/consultations/back-button";

export const dynamic = 'force-dynamic';

// Função para calcular idade detalhada
export function calculateDetailedAge(birthDate: string): string {
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

export default async function ConsultationPreviewPage({
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

  // Buscar consulta com dados do paciente e responsável
  const { data: consultation, error } = await supabase
    .from("consultations")
    .select(`
      *,
      patient:patients(id, full_name, date_of_birth, responsible_name)
    `)
    .eq("id", id)
    .eq("doctor_id", user.id)
    .single();

  if (error || !consultation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/consultations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Consulta não encontrada</h1>
          </div>
        </div>
      </div>
    );
  }

  const patient = consultation.patient as any;

  // Buscar perfil do médico
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, crm, specialty")
    .eq("id", user.id)
    .single();

  // Calcular idade detalhada
  let patientAge = null;
  if (patient?.date_of_birth) {
    patientAge = calculateDetailedAge(patient.date_of_birth);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* FAB de ações */}
      <ConsultationActionsFAB
        consultationId={id}
        hasPrescription={!!consultation.prescription_data}
        patientName={patient?.full_name || ""}
        patientDateOfBirth={patient?.date_of_birth || ""}
        responsibleName={patient?.responsible_name}
        consultationDate={consultation.created_at}
        doctorName={profile?.full_name || ""}
        doctorCRM={profile?.crm || ""}
        doctorSpecialty={profile?.specialty}
      />

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
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <span>{format(new Date(consultation.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
              </div>
            </div>
          </div>
          <BackButton />
        </div>

        <Separator className="my-4" />


        {/* Sistema de Retry - Mostrar se houver erro ou processamento incompleto */}
        {(consultation.status === "error" || consultation.status === "processing") && (
          <ProcessingRetry
            consultationId={id}
            status={consultation.status}
            processingSteps={consultation.processing_steps}
            processingError={consultation.processing_error}
            rawTranscription={consultation.raw_transcription}
            cleanedTranscription={consultation.cleaned_transcription}
          />
        )}



        {/* Conteúdo Principal - Cards Limpos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">

          {/* Diagnóstico */}
          {consultation.diagnosis && (
            <div className="p-6 bg-blue-50/30">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-medium text-gray-500">
                  Diagnóstico
                </h2>
              </div>
              <span className="text-base leading-relaxed whitespace-pre-wrap text-gray-900 px-6">
                {consultation.diagnosis}
              </span>
            </div>
          )}

          {/* Histórico Gestacional/Perinatal */}
          {consultation.prenatal_perinatal_history && (
            <div className="p-6 bg-amber-50/30">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-medium text-amber-900">
                  Histórico Gestacional e Perinatal
                </h2>
                <span className="ml-auto text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded">
                  Importante
                </span>
              </div>
              <p className="text-base leading-relaxed whitespace-pre-wrap text-gray-900 px-6">
                {consultation.prenatal_perinatal_history}
              </p>
            </div>
          )}


          {/* Queixa Principal */}
          {consultation.chief_complaint && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-medium text-gray-500">
                  Queixa Principal
                </h2>
              </div>
              <p className="text-base leading-relaxed text-gray-900 px-6">
                {consultation.chief_complaint}
              </p>
            </div>
          )}


          {/* História/Anamnese */}
          {consultation.history && (
            <div className="p-6">
              <CondensableField
                title="Anamnese"
                iconName="file-text"
                originalText={consultation.history}
                consultationId={id}
                fieldName="history"
              />
            </div>
          )}



          {/* Exame Físico */}
          {consultation.physical_exam && (
            <div className="p-6">
              <CondensableField
                title="Exame Físico"
                iconName="activity"
                originalText={consultation.physical_exam}
                consultationId={id}
                fieldName="physical_exam"
              />
            </div>
          )}



          {/* Plano Terapêutico */}
          {consultation.plan && (
            <div className="p-6">
              <CondensableField
                title="Plano Terapêutico"
                iconName="pill"
                originalText={consultation.plan}
                consultationId={id}
                fieldName="plan"
              />
            </div>
          )}

          {/* Dados Pediátricos - Grid */}
          {(consultation.weight_kg || consultation.height_cm || consultation.head_circumference_cm) && (
            <div className="p-6">
              <h2 className="text-sm font-medium text-gray-500 mb-4">
                Medidas Antropométricas
              </h2>
              <div className="grid grid-cols-3 gap-6">
                {consultation.weight_kg && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Peso</p>
                    <p className="text-2xl font-semibold text-gray-900">{consultation.weight_kg}</p>
                    <p className="text-xs text-gray-500 mt-1">kg</p>
                  </div>
                )}
                {consultation.height_cm && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Altura</p>
                    <p className="text-2xl font-semibold text-gray-900">{consultation.height_cm}</p>
                    <p className="text-xs text-gray-500 mt-1">cm</p>
                  </div>
                )}
                {consultation.head_circumference_cm && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">PC</p>
                    <p className="text-2xl font-semibold text-gray-900">{consultation.head_circumference_cm}</p>
                    <p className="text-xs text-gray-500 mt-1">cm</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Desenvolvimento */}
          {consultation.development_notes && (
            <div className="p-6">
              <h2 className="text-sm font-medium text-gray-500 mb-3">
                Desenvolvimento
              </h2>
              <p className="text-base leading-relaxed whitespace-pre-wrap text-gray-900">
                {consultation.development_notes}
              </p>
            </div>
          )}

          {/* Notas Adicionais */}
          {consultation.notes && (
            <div className="p-6">
              <CondensableField
                title="Observações"
                iconName="file-text"
                originalText={consultation.notes}
                consultationId={id}
                fieldName="notes"
              />
            </div>
          )}
        </div>

        {/* Audio Player */}
        {consultation.audio_url && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <AudioPlayer consultationId={id} />
          </div>
        )}

        {/* Áudio Original (Backup) */}
        {consultation.original_audio_url && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Archive className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Áudio Original</h2>
              <Badge variant="outline" className="ml-auto">
                Backup
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Backup do áudio gravado antes do processamento. Use para reprocessar em caso de erro ou baixar o arquivo original.
            </p>
            <div className="flex gap-3">
              <form action={`/api/consultations/${id}/original-audio`} method="GET">
                <Button 
                  type="submit"
                  variant="outline" 
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar Áudio Original
                </Button>
              </form>
              
              {(consultation.status === 'error' || consultation.status === 'completed') && (
                <form action="/api/consultations/process" method="POST">
                  <input type="hidden" name="consultationId" value={id} />
                  <input type="hidden" name="useOriginal" value="true" />
                  <Button 
                    type="submit"
                    variant="default" 
                    size="sm"
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reprocessar com Áudio Original
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Atestados Gerados */}
        <MedicalCertificatesList consultationId={id} />

        {/* Debug Info - Colapsável */}
        {process.env.NODE_ENV === 'development' && (consultation.raw_transcription || consultation.cleaned_transcription) && (
          <details className="bg-white rounded-lg shadow-sm border border-gray-200">
            <summary className="p-4 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-900 transition">
              Informações de Debug
            </summary>
            <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
              {consultation.raw_transcription && (
                <div className="space-y-2 pt-4">
                  <p className="text-xs font-medium text-gray-500">Transcrição Bruta (Whisper):</p>
                  <div className="bg-gray-50 p-3 rounded-md text-xs max-h-32 overflow-y-auto font-mono text-gray-700 border border-gray-200">
                    {consultation.raw_transcription}
                  </div>
                </div>
              )}
              {consultation.cleaned_transcription && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500">Transcrição Limpa (GPT-4o-mini):</p>
                  <div className="bg-gray-50 p-3 rounded-md text-xs max-h-32 overflow-y-auto font-mono text-gray-700 border border-gray-200">
                    {consultation.cleaned_transcription}
                  </div>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
