import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, FileText } from "lucide-react";
import Link from "next/link";
import { ConsultationList } from "@/components/consultations/consultation-list";

export const dynamic = 'force-dynamic';

export default async function ConsultationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Buscar consultas do médico com dados do paciente
  const { data: rawConsultations, error } = await supabase
    .from("consultations")
    .select(`
      id,
      patient_id,
      status,
      created_at,
      audio_duration_seconds,
      chief_complaint,
      patient:patients (
        id,
        full_name,
        date_of_birth
      )
    `)
    .eq("doctor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Erro ao buscar consultas:", error);
  }

  // Transformar para o formato correto (patient de array para objeto)
  const consultations = rawConsultations?.map((c: any) => ({
    ...c,
    patient: Array.isArray(c.patient) ? c.patient[0] : c.patient,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Consultas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas consultas gravadas e processadas por IA
          </p>
        </div>
        <Link href="/dashboard/consultations/new-recording">
          <Button size="lg" className="gap-2">
            <Mic className="h-5 w-5" />
            Nova Consulta
          </Button>
        </Link>
      </div>

      {/* CTA para nova consulta (apenas se não houver consultas) */}
      {(!consultations || consultations.length === 0) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Pronto para começar?
            </CardTitle>
            <CardDescription>
              Grave uma consulta e deixe a IA gerar automaticamente toda a documentação clínica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/consultations/new-recording">
              <Button size="lg" className="gap-2">
                <Mic className="h-5 w-5" />
                Nova Consulta com Gravação
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Lista de consultas */}
      <Card>
        <CardHeader>
          <CardTitle>Consultas Recentes</CardTitle>
          <CardDescription>
            {consultations && consultations.length > 0
              ? `${consultations.length} consulta${consultations.length > 1 ? 's' : ''} encontrada${consultations.length > 1 ? 's' : ''}`
              : "Suas últimas consultas processadas"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConsultationList consultations={consultations || []} />
        </CardContent>
      </Card>
    </div>
  );
}
