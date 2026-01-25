import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, FileText, X } from "lucide-react";
import Link from "next/link";
import { ConsultationList } from "@/components/consultations/consultation-list";
import { ConsultationFilters } from "@/components/consultations/consultation-filters";
import { Pagination } from "@/components/consultations/pagination";

export const dynamic = 'force-dynamic';

const ITEMS_PER_PAGE = 6;

export default async function ConsultationsPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    patient?: string;
    status?: string;
    period?: string;
    search?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const { 
    patient: patientId, 
    status: statusFilter,
    period: periodFilter,
    search: searchTerm,
    page: pageParam 
  } = params;
  
  const currentPage = Math.max(1, parseInt(pageParam || "1", 10));
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Buscar dados do paciente se houver filtro
  let filteredPatient = null;
  if (patientId) {
    const { data: patientData } = await supabase
      .from("patients")
      .select("id, full_name")
      .eq("id", patientId)
      .eq("doctor_id", user.id)
      .single();
    
    filteredPatient = patientData;
  }

  // Construir query base
  let query = supabase
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
    `, { count: 'exact' })
    .eq("doctor_id", user.id);

  // Aplicar filtro de paciente
  if (patientId) {
    query = query.eq("patient_id", patientId);
  }

  // Aplicar filtro de status
  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  // Aplicar filtro de período
  if (periodFilter && periodFilter !== "all") {
    const now = new Date();
    let startDate: Date;
    
    switch (periodFilter) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "3months":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "6months":
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }
    
    query = query.gte("created_at", startDate.toISOString());
  }

  // Aplicar busca por nome do paciente ou queixa
  if (searchTerm) {
    query = query.or(`chief_complaint.ilike.%${searchTerm}%`);
  }

  // Contar total antes de paginar
  const { count: totalCount } = await query;

  // Aplicar paginação
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const { data: rawConsultations, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  if (error) {
    console.error("Erro ao buscar consultas:", error);
  }

  // Transformar para o formato correto (patient de array para objeto)
  const consultations = rawConsultations?.map((c: any) => ({
    ...c,
    patient: Array.isArray(c.patient) ? c.patient[0] : c.patient,
  })) || [];

  const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);

  // Construir URL base para paginação (mantendo filtros)
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (patientId) params.set("patient", patientId);
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (periodFilter && periodFilter !== "all") params.set("period", periodFilter);
    if (searchTerm) params.set("search", searchTerm);
    params.set("page", page.toString());
    return `/consultations?${params.toString()}`;
  };

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
        <Link href="/consultations/new-recording">
          <Button size="lg" className="gap-2">
            <Mic className="h-5 w-5" />
            Nova Consulta
          </Button>
        </Link>
      </div>

      {/* Filtro de paciente ativo */}
      {filteredPatient && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtrando por:</span>
          <Badge variant="secondary" className="gap-2">
            {filteredPatient.full_name}
            <Link href="/consultations">
              <X className="h-3 w-3 hover:text-destructive cursor-pointer" />
            </Link>
          </Badge>
        </div>
      )}

      {/* Filtros */}
      <ConsultationFilters 
        currentStatus={statusFilter || "all"}
        currentPeriod={periodFilter || "all"}
        currentSearch={searchTerm || ""}
        patientId={patientId}
      />

      {/* CTA para nova consulta (apenas se não houver consultas) */}
      {(!consultations || consultations.length === 0) && !statusFilter && !periodFilter && !searchTerm && (
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
            <Link href="/consultations/new-recording">
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
          <CardTitle>
            {filteredPatient ? `Consultas de ${filteredPatient.full_name}` : "Consultas"}
          </CardTitle>
          <CardDescription>
            {totalCount && totalCount > 0
              ? `${totalCount} consulta${totalCount > 1 ? 's' : ''} encontrada${totalCount > 1 ? 's' : ''}`
              : "Nenhuma consulta encontrada"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConsultationList consultations={consultations || []} />
          
          {/* Paginação */}
          {totalPages > 1 && (
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              buildPageUrl={buildPageUrl}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
