import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

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
          <Link href="/dashboard/consultations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Consulta não encontrada</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/consultations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Preview da Consulta</h1>
          <p className="text-muted-foreground mt-1">
            Paciente: {(consultation.patient as any)?.full_name}
          </p>
        </div>
      </div>

      {/* Status de Conclusão */}
      {consultation.status === "completed" && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Processamento Concluído!</p>
                <p className="text-sm text-green-700">
                  A consulta foi processada com sucesso pela IA
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dados Processados */}
      <div className="grid gap-6">
        {/* Queixa Principal */}
        {consultation.chief_complaint && (
          <Card>
            <CardHeader>
              <CardTitle>Queixa Principal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{consultation.chief_complaint}</p>
            </CardContent>
          </Card>
        )}

        {/* História/Anamnese */}
        {consultation.history && (
          <Card>
            <CardHeader>
              <CardTitle>História / Anamnese</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{consultation.history}</p>
            </CardContent>
          </Card>
        )}

        {/* Exame Físico */}
        {consultation.physical_exam && (
          <Card>
            <CardHeader>
              <CardTitle>Exame Físico</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{consultation.physical_exam}</p>
            </CardContent>
          </Card>
        )}

        {/* Diagnóstico */}
        {consultation.diagnosis && (
          <Card>
            <CardHeader>
              <CardTitle>Diagnóstico</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{consultation.diagnosis}</p>
            </CardContent>
          </Card>
        )}

        {/* Plano */}
        {consultation.plan && (
          <Card>
            <CardHeader>
              <CardTitle>Plano Terapêutico</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{consultation.plan}</p>
            </CardContent>
          </Card>
        )}

        {/* Dados Pediátricos */}
        {(consultation.weight_kg || consultation.height_cm || consultation.head_circumference_cm || consultation.development_notes) && (
          <Card>
            <CardHeader>
              <CardTitle>Dados Pediátricos</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {consultation.weight_kg && (
                <div>
                  <p className="text-sm font-medium">Peso</p>
                  <p className="text-sm text-muted-foreground">{consultation.weight_kg} kg</p>
                </div>
              )}
              {consultation.height_cm && (
                <div>
                  <p className="text-sm font-medium">Altura</p>
                  <p className="text-sm text-muted-foreground">{consultation.height_cm} cm</p>
                </div>
              )}
              {consultation.head_circumference_cm && (
                <div>
                  <p className="text-sm font-medium">Perímetro Cefálico</p>
                  <p className="text-sm text-muted-foreground">{consultation.head_circumference_cm} cm</p>
                </div>
              )}
              {consultation.development_notes && (
                <div>
                  <p className="text-sm font-medium">Desenvolvimento</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{consultation.development_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Transcrições (para debug) */}
        {(consultation.raw_transcription || consultation.cleaned_transcription) && (
          <Card>
            <CardHeader>
              <CardTitle>Transcrições (Debug)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {consultation.raw_transcription && (
                <div>
                  <p className="text-sm font-medium mb-2">Transcrição Bruta:</p>
                  <div className="bg-muted p-3 rounded text-xs max-h-40 overflow-y-auto">
                    {consultation.raw_transcription}
                  </div>
                </div>
              )}
              {consultation.cleaned_transcription && (
                <div>
                  <p className="text-sm font-medium mb-2">Transcrição Limpa:</p>
                  <div className="bg-muted p-3 rounded text-xs max-h-40 overflow-y-auto">
                    {consultation.cleaned_transcription}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button asChild>
          <Link href={`/dashboard/consultations/${id}/edit`}>
            Editar Consulta
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/consultations">
            Voltar para Consultas
          </Link>
        </Button>
      </div>
    </div>
  );
}
