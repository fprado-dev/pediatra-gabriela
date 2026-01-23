import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Stethoscope, FileText, Users, Settings } from "lucide-react";
import Link from "next/link";

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Pediatra Gabriela</h1>
              <p className="text-sm text-muted-foreground">
                Documentação Clínica Inteligente
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="hidden md:flex">
              {profile?.specialty || "Médico"}
            </Badge>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/settings"
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <Settings className="h-5 w-5 text-muted-foreground" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium">{profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    CRM: {profile?.crm}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">
              Bem-vindo, Dr(a). {profile?.full_name?.split(" ")[0] || "Doutor"}!
            </h2>
            <p className="text-muted-foreground">
              Sua plataforma de documentação clínica está pronta para uso.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
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
                  Nenhuma consulta registrada ainda
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pacientes Cadastrados
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Comece cadastrando seus pacientes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tempo Economizado
                </CardTitle>
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle>Primeiros Passos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">1. Confirme seu email</h3>
                <p className="text-sm text-muted-foreground">
                  Verifique sua caixa de entrada para confirmar seu endereço de
                  email e desbloquear todas as funcionalidades.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">2. Configure seu perfil</h3>
                <p className="text-sm text-muted-foreground">
                  Complete suas informações profissionais para personalizar sua
                  experiência.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">3. Comece a documentar</h3>
                <p className="text-sm text-muted-foreground">
                  Grave sua primeira consulta e veja a mágica da IA transformar
                  em documentação clínica completa.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
