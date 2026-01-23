import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, FileText, Clock } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function ConsultationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

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
      </div>

      {/* CTA para nova consulta */}
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

      {/* Lista de consultas (será implementada depois) */}
      <Card>
        <CardHeader>
          <CardTitle>Consultas Recentes</CardTitle>
          <CardDescription>Suas últimas consultas processadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              Nenhuma consulta ainda. Comece gravando sua primeira consulta!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
