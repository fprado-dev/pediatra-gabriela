"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, ExternalLink, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string;
  allergies?: string;
  blood_type?: string;
}

interface PatientSelectorProps {
  patients: Patient[];
  selectedPatientId: string | null;
  onSelectPatient: (patientId: string) => void;
}

export function PatientSelector({
  patients,
  selectedPatientId,
  onSelectPatient,
}: PatientSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    if (age === 0) {
      const months = monthDiff + (today.getDate() >= birth.getDate() ? 0 : -1);
      if (months === 0) {
        const days = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
        return `${days} dia${days !== 1 ? 's' : ''}`;
      }
      return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    }
    
    return `${age} ano${age !== 1 ? 's' : ''}`;
  };

  const filteredPatients = patients.filter((patient) =>
    patient.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selecione o Paciente</CardTitle>
        <CardDescription>
          Escolha o paciente para esta consulta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Combobox */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-auto py-3"
            >
              {selectedPatient ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(selectedPatient.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{selectedPatient.full_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {calculateAge(selectedPatient.date_of_birth)}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground">Buscar paciente...</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Buscar por nome..." 
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>
                  <div className="py-6 text-center text-sm">
                    <p className="text-muted-foreground mb-2">Nenhum paciente encontrado</p>
                    <Link href="/dashboard/patients/new">
                      <Button size="sm" variant="outline" className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Cadastrar Novo Paciente
                      </Button>
                    </Link>
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {filteredPatients.map((patient) => (
                    <CommandItem
                      key={patient.id}
                      value={patient.full_name}
                      onSelect={() => {
                        onSelectPatient(patient.id);
                        setOpen(false);
                      }}
                      className="gap-3 py-3"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(patient.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{patient.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {calculateAge(patient.date_of_birth)}
                          {patient.blood_type && ` • ${patient.blood_type}`}
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          selectedPatientId === patient.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Informações do paciente selecionado */}
        {selectedPatient && (
          <div className="space-y-3">
            {/* Alergias importantes */}
            {selectedPatient.allergies && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Alergias:</strong> {selectedPatient.allergies}
                </AlertDescription>
              </Alert>
            )}

            {/* Badges de informações */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {calculateAge(selectedPatient.date_of_birth)}
              </Badge>
              {selectedPatient.blood_type && (
                <Badge variant="outline">{selectedPatient.blood_type}</Badge>
              )}
            </div>

            {/* Link para perfil */}
            <Link href={`/dashboard/patients/${selectedPatient.id}`} target="_blank">
              <Button variant="ghost" size="sm" className="gap-2 h-8">
                <ExternalLink className="h-3 w-3" />
                Ver perfil completo
              </Button>
            </Link>
          </div>
        )}

        {/* Botão para criar novo paciente */}
        {!selectedPatient && (
          <div className="pt-2">
            <Link href="/dashboard/patients/new" target="_blank">
              <Button variant="outline" className="w-full gap-2">
                <UserPlus className="h-4 w-4" />
                Cadastrar Novo Paciente
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
