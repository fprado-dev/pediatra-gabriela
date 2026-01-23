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
import { Search, SlidersHorizontal } from "lucide-react";

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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtro de Idade */}
        <Select value={ageFilter} onValueChange={setAgeFilter}>
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
        <Select value={sortBy} onValueChange={setSortBy}>
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
            {filteredAndSortedPatients.length} paciente
            {filteredAndSortedPatients.length !== 1 ? "s" : ""} encontrado
            {filteredAndSortedPatients.length !== 1 ? "s" : ""}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredAndSortedPatients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
