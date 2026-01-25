import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, User, Stethoscope, FileText, Activity, PencilLine, Download, ClipboardList, Pill } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AudioPlayer } from "@/components/consultations/audio-player";

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

  // Buscar consulta
  const { data: consultation, error } = await supabase
    .from("consultations")
    .select(`
      *,
      patient:patients(id, full_name, date_of_birth)
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
            <Button asChild variant="default" size="sm">
              <Link href={`/consultations/${id}/prescription`}>
                <Pill className="h-4 w-4 mr-2" />
                Criar Receita
              </Link>
            </Button>
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
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Anamnese
              </h2>
            </div>
            <p className="text-base leading-relaxed whitespace-pre-wrap pl-6">
              {consultation.history}
            </p>
          </div>
        )}

        {/* Exame Físico */}
        {consultation.physical_exam && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Exame Físico
              </h2>
            </div>
            <p className="text-base leading-relaxed whitespace-pre-wrap pl-6">
              {consultation.physical_exam}
            </p>
          </div>
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

        {/* Prescrição */}
        {consultation.prescription && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Prescrição Médica
              </h2>
            </div>
            <div className="bg-muted/30 p-4 rounded-md border border-muted ml-6">
              <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono">
                {consultation.prescription}
              </pre>
            </div>
          </div>
        )}

        {/* Plano Terapêutico */}
        {consultation.plan && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Plano Terapêutico
            </h2>
            <p className="text-base leading-relaxed whitespace-pre-wrap pl-6">
              {consultation.plan}
            </p>
          </div>
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
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Observações
            </h2>
            <p className="text-base leading-relaxed whitespace-pre-wrap pl-6 text-muted-foreground">
              {consultation.notes}
            </p>
          </div>
        )}
      </div>

      {/* Audio Player - Minimalista */}
      {consultation.audio_url && (
        <AudioPlayer consultationId={id} />
      )}

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
