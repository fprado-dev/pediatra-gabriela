"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { calculateAge } from "@/lib/utils/date-helpers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string;
  phone: string;
  email?: string;
  cpf?: string;
}

interface PatientSelectorProps {
  patients: Patient[];
  baseUrl: string;
}

export function PatientSelector({ patients, baseUrl }: PatientSelectorProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients;

    const term = searchTerm.toLowerCase();
    return patients.filter(
      (patient) =>
        patient.full_name.toLowerCase().includes(term) ||
        patient.phone.includes(term) ||
        patient.cpf?.includes(term) ||
        patient.email?.toLowerCase().includes(term)
    );
  }, [patients, searchTerm]);

  const handlePatientClick = (patientId: string) => {
    router.push(`${baseUrl}/${patientId}`);
  };

  return (
    <div className="space-y-6">
      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar por nome, CPF, telefone ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de pacientes */}
      {filteredPatients.length === 0 ? (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {searchTerm ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => {
            const age = calculateAge(patient.date_of_birth);
            const formattedBirthDate = format(
              new Date(patient.date_of_birth),
              "dd/MM/yyyy",
              { locale: ptBR }
            );

            return (
              <Card
                key={patient.id}
                className="p-4 hover:border-primary transition-colors cursor-pointer"
                onClick={() => handlePatientClick(patient.id)}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 text-primary" />
                  </div>

                  {/* Dados do paciente */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {patient.full_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {age} • {formattedBirthDate}
                    </p>
                    {patient.phone && (
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {patient.phone}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
