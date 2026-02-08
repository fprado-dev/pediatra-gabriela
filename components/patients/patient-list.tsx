"use client";

import { useState, useMemo } from "react";
import { PatientCard } from "./patient-card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Search, Users } from "lucide-react";

const ITEMS_PER_PAGE = 8;

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
  patients: Patient[] | any[];
}

export function PatientList({ patients }: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredPatients = useMemo(() => {
    let filtered = patients;

    // Busca por nome
    if (searchTerm) {
      filtered = filtered.filter((patient) =>
        patient.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenação padrão por nome
    return [...filtered].sort((a, b) =>
      a.full_name.localeCompare(b.full_name)
    );
  }, [patients, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPatients = filteredPatients.slice(startIndex, endIndex);

  // Handler com reset de página
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Empty State - Nenhum paciente cadastrado
  if (patients.length === 0 && !searchTerm) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <Users className="h-16 w-16 text-gray-300 mb-6" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum paciente cadastrado
        </h3>
        <p className="text-gray-500 mb-8 max-w-md">
          Comece adicionando seu primeiro paciente para gerenciar consultas e histórico médico
        </p>
      </div>
    );
  }

  // Busca Sem Resultados
  if (filteredPatients.length === 0 && searchTerm) {
    return (
      <div className="space-y-4">
        {/* Busca */}
        <InputGroup className="max-w-md bg-white">
          <InputGroupInput
            placeholder="Buscar por nome do paciente..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <InputGroupAddon>
            <Search className="h-4 w-4" />
          </InputGroupAddon>
        </InputGroup>

        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white border border-gray-200 rounded-lg">
          <Search className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-base font-medium text-gray-700 mb-1">
            Nenhum paciente encontrado
          </h3>
          <p className="text-sm text-gray-500">
            Tente buscar por outro nome
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Busca */}
      <InputGroup className="max-w-md bg-white">
        <InputGroupInput
          placeholder="Buscar por nome do paciente..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <InputGroupAddon>
          <Search className="h-4 w-4" />
        </InputGroupAddon>
        {searchTerm && (
          <InputGroupAddon align="inline-end" className="text-sm text-gray-600">
            {filteredPatients.length} {filteredPatients.length === 1 ? 'paciente' : 'pacientes'}
          </InputGroupAddon>
        )}
      </InputGroup>

      {/* Lista de Pacientes */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {paginatedPatients.map((patient) => (
          <PatientCard key={patient.id} patient={patient} />
        ))}
      </div>

      {/* Paginação - similar à de consultas */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
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
          </Button>
        </div>
      )}
    </div>
  );
}
