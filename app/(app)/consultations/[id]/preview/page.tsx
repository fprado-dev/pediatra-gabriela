import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, User, Stethoscope, FileText, Activity, PencilLine, Download, Pill, FileCheck, Users } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AudioPlayer } from "@/components/consultations/audio-player";
import { MedicalCertificateModal } from "@/components/consultations/medical-certificate-modal";
import { MedicalCertificatesList } from "@/components/consultations/medical-certificates-list";
import { CondensableField } from "@/components/consultations/condensable-field";
import { ProcessingRetry } from "@/components/consultations/processing-retry";

export const dynamic = 'force-dynamic';

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

  // Calcular idade
  let patientAge = null;
  if (patient?.date_of_birth) {
    const birthDate = new Date(patient.date_of_birth);
    const today = new Date();
    patientAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      patientAge--;
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      {/* Header Minimalista */}
      <div className="space-y-4">
        <Link href="/consultations">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-3xl font-semibold">{patient?.full_name}</h1>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {patientAge && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {patientAge} anos
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {format(new Date(consultation.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {consultation.prescription_data ? (
              <Button asChild variant="default" size="sm">
                <Link href={`/consultations/${id}/prescription/view`}>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Ver Receita
                </Link>
              </Button>
            ) : (
              <Button asChild variant="default" size="sm">
                <Link href={`/consultations/${id}/prescription`}>
                  <Pill className="h-4 w-4 mr-2" />
                  Criar Receita
                </Link>
              </Button>
            )}
            <MedicalCertificateModal
              consultationId={id}
              patientName={patient?.full_name || ""}
              patientDateOfBirth={patient?.date_of_birth || ""}
              responsibleName={patient?.responsible_name}
              consultationDate={consultation.created_at}
              doctorName={profile?.full_name || ""}
              doctorCRM={profile?.crm || ""}
              doctorSpecialty={profile?.specialty}
            />
            <Button asChild variant="outline" size="sm">
              <a href={`/api/consultations/${id}/download`} download>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/consultations/${id}/edit`}>
                <PencilLine className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Separator />

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

      {/* Transcrição com Identificação de Falantes - Novo! */}
      {consultation.raw_transcription?.includes("[Speaker") && (
        <div className="space-y-4 bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-500 text-white rounded-full p-2">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-blue-900 dark:text-blue-100">
                Transcrição com Identificação de Falantes
              </h2>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Conversação completa com identificação automática de participantes
              </p>
            </div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {consultation.raw_transcription
              .split("\n\n")
              .filter((line: string) => line.trim().length > 0)
              .map((line: string, idx: number) => {
                const match = line.match(/^\[([^\]]+)\]:\s*(.+)$/s);
                if (!match) return null;
                
                const [, speaker, text] = match;
                const speakerNum = speaker.match(/Speaker (\d+)/)?.[1];
                const isDoctor = speakerNum === "1"; // Speaker 1 = médica
                
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 transition-all hover:shadow-sm ${
                      isDoctor
                        ? "bg-blue-50 dark:bg-blue-950/30 border-blue-500"
                        : "bg-green-50 dark:bg-green-950/30 border-green-500"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant={isDoctor ? "default" : "secondary"} 
                        className={`text-xs ${isDoctor ? "bg-blue-600" : "bg-green-600 text-white"}`}
                      >
                        {speaker}
                      </Badge>
                      {isDoctor && (
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          (Médica)
                        </span>
                      )}
                      {!isDoctor && speakerNum === "2" && (
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          (Mãe/Responsável)
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {text}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Conteúdo Principal - Minimalista */}
      <div className="space-y-8">
        {/* Queixa Principal */}
        {consultation.chief_complaint && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Queixa Principal
              </h2>
            </div>
            <p className="text-base leading-relaxed pl-6">
              {consultation.chief_complaint}
            </p>
          </div>
        )}

        {/* História/Anamnese */}
        {consultation.history && (
          <CondensableField
            title="Anamnese"
            iconName="file-text"
            originalText={consultation.history}
            consultationId={id}
            fieldName="history"
          />
        )}

        {/* Histórico Gestacional/Perinatal - DESTAQUE ESPECIAL */}
        {consultation.prenatal_perinatal_history && (
          <div className="space-y-3 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-4 rounded-r-lg">
            <div className="flex items-center gap-2">
              <div className="bg-amber-500 text-white rounded-full p-1.5">
                <Activity className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-100">
                Histórico Gestacional e Perinatal
              </h2>
              <Badge variant="destructive" className="ml-2 text-xs">
                CRÍTICO
              </Badge>
            </div>
            <p className="text-base leading-relaxed whitespace-pre-wrap pl-9 text-amber-950 dark:text-amber-50">
              {consultation.prenatal_perinatal_history}
            </p>
          </div>
        )}

        {/* Exame Físico */}
        {consultation.physical_exam && (
          <CondensableField
            title="Exame Físico"
            iconName="activity"
            originalText={consultation.physical_exam}
            consultationId={id}
            fieldName="physical_exam"
          />
        )}

        {/* Diagnóstico */}
        {consultation.diagnosis && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground pl-0">
              Diagnóstico
            </h2>
            <div className="pl-0">
              <Badge variant="secondary" className="text-sm font-normal px-3 py-1.5">
                {consultation.diagnosis}
              </Badge>
            </div>
          </div>
        )}

        {/* Plano Terapêutico */}
        {consultation.plan && (
          <CondensableField
            title="Plano Terapêutico"
            iconName="pill"
            originalText={consultation.plan}
            consultationId={id}
            fieldName="plan"
          />
        )}

        {/* Dados Pediátricos - Grid Compacto */}
        {(consultation.weight_kg || consultation.height_cm || consultation.head_circumference_cm) && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Medidas
            </h2>
            <div className="grid grid-cols-3 gap-6 pl-6">
              {consultation.weight_kg && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Peso</p>
                  <p className="text-2xl font-semibold">{consultation.weight_kg}</p>
                  <p className="text-xs text-muted-foreground">kg</p>
                </div>
              )}
              {consultation.height_cm && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Altura</p>
                  <p className="text-2xl font-semibold">{consultation.height_cm}</p>
                  <p className="text-xs text-muted-foreground">cm</p>
                </div>
              )}
              {consultation.head_circumference_cm && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">PC</p>
                  <p className="text-2xl font-semibold">{consultation.head_circumference_cm}</p>
                  <p className="text-xs text-muted-foreground">cm</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Desenvolvimento */}
        {consultation.development_notes && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Desenvolvimento
            </h2>
            <p className="text-base leading-relaxed whitespace-pre-wrap pl-6">
              {consultation.development_notes}
            </p>
          </div>
        )}

        {/* Notas Adicionais */}
        {consultation.notes && (
          <CondensableField
            title="Observações"
            iconName="file-text"
            originalText={consultation.notes}
            consultationId={id}
            fieldName="notes"
          />
        )}
      </div>

      {/* Audio Player - Minimalista */}
      {consultation.audio_url && (
        <AudioPlayer consultationId={id} />
      )}

      {/* Atestados Gerados */}
      <MedicalCertificatesList consultationId={id} />

      {/* Debug Info - Colapsável */}
      {process.env.NODE_ENV === 'development' && (consultation.raw_transcription || consultation.cleaned_transcription) && (
        <details className="pt-8 border-t">
          <summary className="text-sm font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer hover:text-foreground transition">
            Informações de Debug
          </summary>
          <div className="mt-4 space-y-4 pl-4">
            {consultation.raw_transcription && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Transcrição Bruta (Whisper):</p>
                <div className="bg-muted/50 p-3 rounded-md text-xs max-h-32 overflow-y-auto font-mono">
                  {consultation.raw_transcription}
                </div>
              </div>
            )}
            {consultation.cleaned_transcription && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Transcrição Limpa (GPT-4o-mini):</p>
                <div className="bg-muted/50 p-3 rounded-md text-xs max-h-32 overflow-y-auto font-mono">
                  {consultation.cleaned_transcription}
                </div>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
