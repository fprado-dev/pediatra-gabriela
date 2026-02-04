
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
 import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Search } from "lucide-react"

interface ConsultationFiltersProps {
  currentSearch: string;
  patientId?: string;
  totalResults?: number;
}

export function ConsultationFilters({
  currentSearch,
  patientId,
  totalResults = 0,
}: ConsultationFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(currentSearch);

  // Debounce e busca automática
  useEffect(() => {
    // Só busca se tiver 3+ caracteres ou se for string vazia (limpar busca)
    if (searchValue.length >= 3 || searchValue.length === 0) {
      const timeoutId = setTimeout(() => {
        const params = new URLSearchParams();
        
        // Manter filtro de paciente se existir
        if (patientId) params.set("patient", patientId);
        
        // Adicionar busca se houver
        if (searchValue.length >= 3) {
          params.set("search", searchValue);
        }
        
        // Resetar para página 1 ao buscar
        params.set("page", "1");
        
        startTransition(() => {
          router.push(`/consultations?${params.toString()}`);
        });
      }, 300); // Debounce de 300ms

      return () => clearTimeout(timeoutId);
    }
  }, [searchValue, patientId, router]);



  // Formatar texto de resultados
  const resultsText = totalResults === 0 
    ? "Nenhum resultado" 
    : totalResults === 1 
      ? "1 consulta" 
      : `${totalResults} consultas`;

  return (
    <div className="flex items-center gap-4">
      <InputGroup className="max-w-md bg-white">
        <InputGroupInput 
          placeholder="Buscar por paciente, diagnóstico ou queixa..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
        <InputGroupAddon>
          <Search className="h-4 w-4" />
        </InputGroupAddon>
        {searchValue.length >= 3 && (
          <InputGroupAddon align="inline-end" className="text-sm text-gray-600">
            {isPending ? "Buscando..." : resultsText}
          </InputGroupAddon>
        )}
      </InputGroup>
    </div>
  );
}