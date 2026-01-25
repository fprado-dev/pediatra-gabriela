"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";

interface ConsultationFiltersProps {
  currentStatus: string;
  currentPeriod: string;
  currentSearch: string;
  patientId?: string;
}

export function ConsultationFilters({
  currentStatus,
  currentPeriod,
  currentSearch,
  patientId,
}: ConsultationFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(currentSearch);

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams();
    
    // Manter filtros existentes
    if (patientId) params.set("patient", patientId);
    
    // Status
    const newStatus = updates.status ?? currentStatus;
    if (newStatus && newStatus !== "all") params.set("status", newStatus);
    
    // Período
    const newPeriod = updates.period ?? currentPeriod;
    if (newPeriod && newPeriod !== "all") params.set("period", newPeriod);
    
    // Busca
    const newSearch = updates.search ?? currentSearch;
    if (newSearch) params.set("search", newSearch);
    
    // Resetar para página 1 ao filtrar
    params.set("page", "1");
    
    startTransition(() => {
      router.push(`/consultations?${params.toString()}`);
    });
  };

  const handleSearch = () => {
    updateFilters({ search: searchValue });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setSearchValue("");
    const params = new URLSearchParams();
    if (patientId) params.set("patient", patientId);
    startTransition(() => {
      router.push(`/consultations?${params.toString()}`);
    });
  };

  const hasActiveFilters = currentStatus !== "all" || currentPeriod !== "all" || currentSearch;

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Busca */}
      <div className="relative flex-1 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por queixa..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
        </Button>
      </div>

      {/* Filtro de Status */}
      <Select 
        value={currentStatus} 
        onValueChange={(value) => updateFilters({ status: value })}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="completed">Completo</SelectItem>
          <SelectItem value="processing">Processando</SelectItem>
          <SelectItem value="error">Erro</SelectItem>
        </SelectContent>
      </Select>

      {/* Filtro de Período */}
      <Select 
        value={currentPeriod} 
        onValueChange={(value) => updateFilters({ period: value })}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todo período</SelectItem>
          <SelectItem value="week">Última semana</SelectItem>
          <SelectItem value="month">Último mês</SelectItem>
          <SelectItem value="3months">3 meses</SelectItem>
          <SelectItem value="6months">6 meses</SelectItem>
        </SelectContent>
      </Select>

      {/* Limpar filtros */}
      {hasActiveFilters && (
        <Button variant="ghost" onClick={clearFilters} disabled={isPending}>
          Limpar
        </Button>
      )}
    </div>
  );
}
