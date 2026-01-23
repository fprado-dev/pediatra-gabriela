import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Clock } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Buscar perfil do usuário
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Buscar estatísticas
  const { count: patientsCount } = await supabase
    .from("patients")
    .select("*", { count: "exact", head: true })
    .eq("doctor_id", user.id)
    .eq("is_active", true);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">
          Bem-vindo, Dr(a). {profile?.full_name?.split(" ")[0] || "Doutor"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Sua plataforma de documentação clínica está pronta para uso.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pacientes Cadastrados
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patientsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {patientsCount === 0
                ? "Comece cadastrando seus pacientes"
                : "Pacientes ativos"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Consultas
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Em breve disponível
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tempo Economizado
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 min</div>
            <p className="text-xs text-muted-foreground mt-1">
              Média de 15 min por consulta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">1. Cadastre seus pacientes</h3>
            <p className="text-sm text-muted-foreground">
              Vá para a seção "Pacientes" no menu lateral e comece cadastrando os
              dados dos seus pacientes.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">2. Organize as informações</h3>
            <p className="text-sm text-muted-foreground">
              Adicione histórico médico, alergias e medicações atuais para ter
              tudo centralizado.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">3. Em breve: Consultas automáticas</h3>
            <p className="text-sm text-muted-foreground">
              Em breve você poderá gravar consultas e gerar documentação
              automática com IA.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
