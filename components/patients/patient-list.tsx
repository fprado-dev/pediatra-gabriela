"use client";

import { useState, useMemo } from "react";
import { PatientCard } from "./patient-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 6;

interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string;
  phone: string;
  blood_type?: string;
  allergies?: string;
  created_at: string;
  updated_at: string;
}

interface PatientListProps {
  patients: Patient[];
}

export function PatientList({ patients }: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [ageFilter, setAgeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [currentPage, setCurrentPage] = useState(1);

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const filteredAndSortedPatients = useMemo(() => {
    let filtered = patients;

    // Busca por nome
    if (searchTerm) {
      filtered = filtered.filter((patient) =>
        patient.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por idade
    if (ageFilter !== "all") {
      filtered = filtered.filter((patient) => {
        const age = calculateAge(patient.date_of_birth);
        
        switch (ageFilter) {
          case "0-2":
            return age >= 0 && age <= 2;
          case "3-5":
            return age >= 3 && age <= 5;
          case "6-12":
            return age >= 6 && age <= 12;
          case "13+":
            return age >= 13;
          default:
            return true;
        }
      });
    }

    // Ordenação
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.full_name.localeCompare(b.full_name);
        case "age":
          return calculateAge(a.date_of_birth) - calculateAge(b.date_of_birth);
        case "recent":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "updated":
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  }, [patients, searchTerm, ageFilter, sortBy]);

  // Reset para página 1 quando filtros mudam
  const resetToFirstPage = () => setCurrentPage(1);

  // Paginação
  const totalPages = Math.ceil(filteredAndSortedPatients.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPatients = filteredAndSortedPatients.slice(startIndex, endIndex);

  // Handlers com reset de página
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    resetToFirstPage();
  };

  const handleAgeFilterChange = (value: string) => {
    setAgeFilter(value);
    resetToFirstPage();
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    resetToFirstPage();
  };

  return (
    <div className="space-y-4">
      {/* Busca e Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtro de Idade */}
        <Select value={ageFilter} onValueChange={handleAgeFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Idade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as idades</SelectItem>
            <SelectItem value="0-2">0-2 anos</SelectItem>
            <SelectItem value="3-5">3-5 anos</SelectItem>
            <SelectItem value="6-12">6-12 anos</SelectItem>
            <SelectItem value="13+">13+ anos</SelectItem>
          </SelectContent>
        </Select>

        {/* Ordenação */}
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nome (A-Z)</SelectItem>
            <SelectItem value="age">Idade</SelectItem>
            <SelectItem value="recent">Cadastro recente</SelectItem>
            <SelectItem value="updated">Atualização</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resultados */}
      {filteredAndSortedPatients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm || ageFilter !== "all"
              ? "Nenhum paciente encontrado com os filtros aplicados"
              : "Nenhum paciente cadastrado ainda"}
          </p>
        </div>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1}-{Math.min(endIndex, filteredAndSortedPatients.length)} de{" "}
            {filteredAndSortedPatients.length} paciente
            {filteredAndSortedPatients.length !== 1 ? "s" : ""}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedPatients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
