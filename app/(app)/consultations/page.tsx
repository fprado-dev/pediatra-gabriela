import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import Link from "next/link";
import { ConsultationList } from "@/components/consultations/consultation-list";
import { ConsultationFilters } from "@/components/consultations/consultation-filters";
import { Pagination } from "@/components/consultations/pagination";
import { Separator } from "@/components/ui/separator";

export const dynamic = 'force-dynamic';

const ITEMS_PER_PAGE = 8;

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

  // Construir query base (incluindo diagnosis para busca expandida)
  let query = supabase
    .from("consultations")
    .select(`
      id,
      patient_id,
      status,
      created_at,
      audio_duration_seconds,
      chief_complaint,
      diagnosis,
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

  // Se houver busca, buscar TODOS os registros sem filtro para fazer busca client-side
  // Caso contrário, aplicar paginação normal
  let rawConsultations;
  let totalCount = 0;

  if (searchTerm) {
    // Buscar TODOS os registros SEM filtro no servidor
    const { data, error } = await query.order("created_at", { ascending: false });
    
    if (error) {
      console.error("Erro ao buscar consultas:", error);
    }

    // Transformar dados
    let allConsultations = (data || []).map((c: any) => ({
      ...c,
      patient: Array.isArray(c.patient) ? c.patient[0] : c.patient,
    }));

    // Filtrar client-side por nome do paciente, diagnóstico e queixa
    const searchLower = searchTerm.toLowerCase();
    allConsultations = allConsultations.filter((c: any) => {
      const patientName = c.patient?.full_name?.toLowerCase() || '';
      const chiefComplaint = c.chief_complaint?.toLowerCase() || '';
      const diagnosis = c.diagnosis?.toLowerCase() || '';
      
      return patientName.includes(searchLower) ||
             chiefComplaint.includes(searchLower) ||
             diagnosis.includes(searchLower);
    });

    totalCount = allConsultations.length;

    // Aplicar paginação manual
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;
    rawConsultations = allConsultations.slice(offset, offset + ITEMS_PER_PAGE);
  } else {
    // Sem busca: usar paginação normal no servidor
    const { count } = await query;
    totalCount = count || 0;

    const offset = (currentPage - 1) * ITEMS_PER_PAGE;
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + ITEMS_PER_PAGE - 1);

    if (error) {
      console.error("Erro ao buscar consultas:", error);
    }

    rawConsultations = data || [];
  }

  // Transformar para o formato correto (se ainda não foi transformado)
  const consultations = Array.isArray(rawConsultations[0]?.patient)
    ? rawConsultations.map((c: any) => ({
        ...c,
        patient: Array.isArray(c.patient) ? c.patient[0] : c.patient,
      }))
    : rawConsultations;

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="px-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Histórico de Consultas
            </h1>
            <p className="text-gray-600 mt-1">
              Acesse o histórico completo de atendimentos em um só lugar
            </p>
          </div>
          <Link href="/consultations/new-recording">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Consulta
            </Button>
          </Link>
        </div>

        <Separator className="my-4" />
       

        {/* Busca */}
        <ConsultationFilters 
          currentSearch={searchTerm || ""}
          patientId={patientId}
          totalResults={consultations.length}
        />

        {/* Lista de consultas ou Empty State */}
        <ConsultationList 
          consultations={consultations || []} 
          isSearching={!!searchTerm}
          hasAnyConsultations={!!totalCount && totalCount > 0}
        />
        
        {/* Paginação */}
        {totalPages > 1 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            buildPageUrl={buildPageUrl}
          />
        )}
      </div>
    </div>
  );
}
