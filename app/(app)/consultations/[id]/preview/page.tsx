import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Calendar, Clock, User, Stethoscope, FileText, Activity, PencilLine, Download, Pill, FileCheck, Users, Trash2, ShieldAlert, Cake, UserCheck, RefreshCw, Archive, Baby, Siren, ClipboardList, Heart, Brain, Scale } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AudioPlayer } from "@/components/consultations/audio-player";
import { MedicalCertificatesList } from "@/components/consultations/medical-certificates-list";
import { CondensableField } from "@/components/consultations/condensable-field";
import { ProcessingRetry } from "@/components/consultations/processing-retry";
import { ConsultationActionsFAB } from "@/components/consultations/consultation-actions-fab";
import { BackButton } from "@/components/consultations/back-button";
import { PreviousConsultationsCard } from "@/components/consultations/previous-consultations-card";
import { getConsultationTypeLabel, getConsultationTypeIcon, getConsultationTypeColor } from "@/lib/utils/consultation-type-helpers";
import { formatDate } from "@/lib/utils/date-helpers";

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

// Função helper para renderizar texto com suporte a HTML
function renderTextOrHtml(content: string | null | undefined, className: string) {
  if (!content) return null;

  const hasHtml = content.includes("<p>") || content.includes("<ul>") || content.includes("<ol>");

  if (hasHtml) {
    return (
      <div
        className={`prose prose-sm max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <p className={`whitespace-pre-wrap ${className}`}>
      {content}
    </p>
  );
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

  // Extrair consultation type
  const consultationType = consultation?.consultation_type;
  const consultationSubtype = consultation?.consultation_subtype;
  const previousConsultations = consultation?.previous_consultations_summary;

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



  // Calcular idade detalhada
  let patientAge = null;
  if (patient?.date_of_birth) {
    patientAge = calculateDetailedAge(patient.date_of_birth);
  }

  console.log(patient.date_of_birth);
  console.log(new Date(patient.date_of_birth));
  console.log(formatDate(new Date(patient.date_of_birth)));
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* FAB de ações */}
      <ConsultationActionsFAB consultationId={id} />

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
                  <span>{formatDate(new Date(patient.date_of_birth))}</span>
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
                <span>{format(new Date(consultation.created_at || new Date()), "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
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
            processingSteps={consultation.processing_steps as any}
            processingError={consultation.processing_error || undefined}
            rawTranscription={consultation.raw_transcription || undefined}
            cleanedTranscription={consultation.cleaned_transcription || undefined}
          />
        )}



        {/* Conteúdo Principal - Cards Limpos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">

          {/* 1. TIPO DE CONSULTA */}
          <div className={`p-6 ${consultationType ? 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {consultationType ? (
                  (() => {
                    const Icon = getConsultationTypeIcon(consultationType as any);
                    const colors = getConsultationTypeColor(consultationType as any);
                    return (
                      <>
                        <div className={`p-2 rounded-lg ${colors.bg}`}>
                          <Icon className={`h-5 w-5 ${colors.icon}`} />
                        </div>
                        <div>
                          <h2 className="text-sm font-medium text-gray-500 mb-1">
                            Tipo de Consulta
                          </h2>
                          <p className="text-base font-semibold text-gray-900">
                            {getConsultationTypeLabel(consultationType as any, consultationSubtype as any)}
                          </p>
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100">
                      <Stethoscope className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-medium text-gray-500 mb-1">
                        Tipo de Consulta
                      </h2>
                      <p className="text-base text-gray-400 italic">
                        Tipo não especificado
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {consultationType && (
                <Badge variant="outline" className="text-xs">
                  {consultationType.replace('_', ' ').toUpperCase()}
                </Badge>
              )}
            </div>
          </div>

          {/* 2. QUEIXA PRINCIPAL */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Stethoscope className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium text-gray-500">
                Queixa Principal
              </h2>
            </div>
            <div className="px-6">
              {consultation.chief_complaint ? (
                renderTextOrHtml(consultation.chief_complaint, "text-base leading-relaxed text-gray-900")
              ) : (
                <p className="text-base leading-relaxed text-gray-400 italic">Sem queixa principal registrada</p>
              )}
            </div>
          </div>

          {/* 3. HMA (História da Moléstia Atual) */}
          <div className="p-6">
            {consultation.hma ? (
              <CondensableField
                title="História da Moléstia Atual (HMA)"
                iconName="file-text"
                originalText={consultation.hma}
                consultationId={id}
                fieldName="hma"
              />
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                    História da Moléstia Atual (HMA)
                  </h2>
                </div>
                <p className="text-base leading-relaxed text-gray-400 italic px-6">
                  Sem história da moléstia atual registrada. Detalhe a queixa principal, início e duração dos sintomas, fatores de melhora/piora, uso ou não de medicamentos, escala de dor, etc.
                </p>
              </>
            )}
          </div>

          {/* 3.5. INFORMAÇÕES COMPLEMENTARES (HISTORY) */}
          {consultation.history && (
            <div className="p-6 border-t">
              <CondensableField
                title="Informações Complementares"
                iconName="clipboard-list"
                originalText={consultation.history}
                consultationId={id}
                fieldName="history"
              />
            </div>
          )}

          {/* 4. HISTÓRICO GESTACIONAL E PERINATAL */}
          <div className={`p-6 ${consultation.prenatal_perinatal_history ? 'bg-amber-50/30' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
              <Baby className={`h-4 w-4 ${consultation.prenatal_perinatal_history ? 'text-amber-600' : 'text-gray-400'}`} />
              <h2 className={`text-sm font-medium ${consultation.prenatal_perinatal_history ? 'text-amber-900' : 'text-gray-500'}`}>
                Histórico Gestacional e Perinatal
              </h2>
              {consultation.prenatal_perinatal_history && (
                <span className="ml-auto text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded">
                  Importante
                </span>
              )}
            </div>
            <div className="px-6">
              {consultation.prenatal_perinatal_history ? (
                renderTextOrHtml(consultation.prenatal_perinatal_history, "text-base leading-relaxed text-gray-900")
              ) : (
                <p className="text-base leading-relaxed text-gray-400 italic">Sem histórico gestacional e perinatal registrado</p>
              )}
            </div>
          </div>

          {/* 5. HISTÓRICO FAMILIAR */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className={`h-4 w-4 ${consultation.family_history ? 'text-purple-600' : 'text-gray-400'}`} />
              <h2 className="text-sm font-medium text-gray-500">
                Histórico Familiar
              </h2>
            </div>
            <div className="px-6">
              {consultation.family_history ? (
                renderTextOrHtml(consultation.family_history, "text-base leading-relaxed text-gray-900")
              ) : (
                <p className="text-base leading-relaxed text-gray-400 italic">Sem histórico familiar registrado</p>
              )}
            </div>
          </div>

          {/* 6. DESENVOLVIMENTO NEUROPSICOMOTOR */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Brain className={`h-4 w-4 ${consultation.development_notes ? 'text-green-600' : 'text-gray-400'}`} />
              <h2 className="text-sm font-medium text-gray-500">
                Desenvolvimento Neuropsicomotor
              </h2>
            </div>
            <div className="px-6">
              {consultation.development_notes ? (
                renderTextOrHtml(consultation.development_notes, "text-base leading-relaxed text-gray-900")
              ) : (
                <p className="text-base leading-relaxed text-gray-400 italic">Sem observações sobre desenvolvimento neuropsicomotor</p>
              )}
            </div>
          </div>

          {/* 7. EXAME FÍSICO + MEDIDAS ANTROPOMÉTRICAS */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium text-gray-500">
                Exame Físico e Medidas Antropométricas
              </h2>
            </div>

            {/* Medidas Antropométricas */}
            {(consultation.weight_kg || consultation.height_cm || consultation.head_circumference_cm) ? (
              <div className="mb-6">
                <div className="grid grid-cols-3 gap-4">
                  {consultation.weight_kg ? (
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Scale className="h-4 w-4 text-gray-500" />
                        <p className="text-xs text-gray-500">Peso</p>
                      </div>
                      <p className="text-2xl font-semibold text-gray-900">{consultation.weight_kg}</p>
                      <p className="text-xs text-gray-500 mt-1">kg</p>
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                      <p className="text-xs text-gray-400 mb-2">Peso</p>
                      <p className="text-sm text-gray-400 italic">Não medido</p>
                    </div>
                  )}
                  {consultation.height_cm ? (
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Altura</p>
                      <p className="text-2xl font-semibold text-gray-900">{consultation.height_cm}</p>
                      <p className="text-xs text-gray-500 mt-1">cm</p>
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                      <p className="text-xs text-gray-400 mb-2">Altura</p>
                      <p className="text-sm text-gray-400 italic">Não medido</p>
                    </div>
                  )}
                  {consultation.head_circumference_cm ? (
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">PC</p>
                      <p className="text-2xl font-semibold text-gray-900">{consultation.head_circumference_cm}</p>
                      <p className="text-xs text-gray-500 mt-1">cm</p>
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                      <p className="text-xs text-gray-400 mb-2">PC</p>
                      <p className="text-sm text-gray-400 italic">Não medido</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <p className="text-sm text-gray-400 italic">Medidas antropométricas não registradas</p>
              </div>
            )}

            {/* Exame Físico */}
            {consultation.physical_exam ? (
              <CondensableField
                title=""
                iconName=""
                originalText={consultation.physical_exam}
                consultationId={id}
                fieldName="physical_exam"
              />
            ) : (
              <p className="text-base text-gray-400 italic">Sem exame físico registrado</p>
            )}
          </div>

          {/* 8. HIPÓTESES DIAGNÓSTICAS */}
          <div className={`p-6 ${consultation.diagnosis ? 'bg-blue-50/30' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className={`h-4 w-4 ${consultation.diagnosis ? 'text-primary' : 'text-gray-400'}`} />
              <h2 className="text-sm font-medium text-gray-500">
                Hipóteses Diagnósticas
              </h2>
              {consultation.diagnosis && (consultation as any).diagnosis_is_ai_suggestion && (
                <Badge variant="outline" className="text-xs text-blue-600 ml-auto">
                  Sugestão IA
                </Badge>
              )}
            </div>
            {consultation.diagnosis && (consultation.diagnosis.includes("<p>") || consultation.diagnosis.includes("<ul>") || consultation.diagnosis.includes("<ol>")) ? (
              <div
                className="prose prose-sm max-w-none text-base leading-relaxed px-6 text-gray-900 font-medium"
                dangerouslySetInnerHTML={{ __html: consultation.diagnosis }}
              />
            ) : (
              <p className={`text-base leading-relaxed whitespace-pre-wrap px-6 ${consultation.diagnosis ? 'text-gray-900 font-medium' : 'text-gray-400 italic'}`}>
                {consultation.diagnosis || 'Sem hipóteses diagnósticas registradas'}
              </p>
            )}
          </div>

          {/* 9. CONDUTA */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className={`h-4 w-4 ${consultation.conduct ? 'text-orange-600' : 'text-gray-400'}`} />
              <h2 className="text-sm font-medium text-gray-500">
                Conduta
              </h2>
            </div>
            {consultation.conduct && (consultation.conduct.includes("<p>") || consultation.conduct.includes("<ul>") || consultation.conduct.includes("<ol>")) ? (
              <div
                className="prose prose-sm max-w-none text-base leading-relaxed px-6 text-gray-900"
                dangerouslySetInnerHTML={{ __html: consultation.conduct }}
              />
            ) : (
              <p className={`text-base leading-relaxed whitespace-pre-wrap px-6 ${consultation.conduct ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                {consultation.conduct || 'Sem conduta registrada'}
              </p>
            )}
          </div>

          {/* 10. PLANO TERAPÊUTICO */}
          <div className="p-6">
            {consultation.plan ? (
              <CondensableField
                title="Plano Terapêutico"
                iconName="pill"
                originalText={consultation.plan}
                consultationId={id}
                fieldName="plan"
              />
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <Pill className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Plano Terapêutico
                  </h2>
                </div>
                <p className="text-base leading-relaxed text-gray-400 italic px-6">
                  Sem plano terapêutico registrado
                </p>
              </>
            )}
          </div>

          {/* 11. OBSERVAÇÕES */}
          <div className="p-6">
            {consultation.notes ? (
              <CondensableField
                title="Observações"
                iconName="file-text"
                originalText={consultation.notes}
                consultationId={id}
                fieldName="notes"
              />
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Observações
                  </h2>
                </div>
                <p className="text-base leading-relaxed text-gray-400 italic px-6">
                  Sem observações adicionais
                </p>
              </>
            )}
          </div>
        </div>

        {/* 12. HISTÓRICO DE CONSULTAS ANTERIORES (antes do áudio) */}
        {previousConsultations && (
          <PreviousConsultationsCard data={previousConsultations as any} />
        )}

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
