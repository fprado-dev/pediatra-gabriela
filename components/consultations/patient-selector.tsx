"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, UserPlus, AlertTriangle, Calendar, Heart, ExternalLink } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
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
      if (months <= 0) {
        const days = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
        return `${days} dia${days !== 1 ? 's' : ''}`;
      }
      return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    }
    
    return `${age} ano${age !== 1 ? 's' : ''}`;
  };

  const hasAllergies = (patient: Patient) => 
    patient.allergies && patient.allergies.trim().length > 0;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold mb-1">Selecione o Paciente</h2>
        <p className="text-sm text-muted-foreground">
          Escolha o paciente para esta consulta
        </p>
      </div>

      {/* Combobox */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-14 px-4"
          >
            {selectedPatient ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                    {getInitials(selectedPatient.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{selectedPatient.full_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {calculateAge(selectedPatient.date_of_birth)}
                    {selectedPatient.blood_type && ` • ${selectedPatient.blood_type}`}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">Buscar paciente...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar por nome..." />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>
                <div className="py-6 text-center text-sm">
                  <p className="text-muted-foreground mb-3">Nenhum paciente encontrado</p>
                  <Link href="/patients/new" target="_blank">
                    <Button size="sm" variant="outline" className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Cadastrar Novo
                    </Button>
                  </Link>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {patients.map((patient) => (
                  <CommandItem
                    key={patient.id}
                    value={patient.full_name}
                    onSelect={() => {
                      onSelectPatient(patient.id);
                      setOpen(false);
                    }}
                    className="gap-3 py-3 px-3"
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {getInitials(patient.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{patient.full_name}</span>
                        {hasAllergies(patient) && (
                          <Badge variant="destructive" className="h-5 px-1.5 shrink-0">
                            <AlertTriangle className="h-3 w-3" />
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{calculateAge(patient.date_of_birth)}</span>
                        {patient.blood_type && (
                          <>
                            <span>•</span>
                            <span>{patient.blood_type}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
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

      {/* Selected Patient Card */}
      {selectedPatient && (
        <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Avatar grande */}
              <Avatar className="h-16 w-16 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                  {getInitials(selectedPatient.full_name)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg mb-1 truncate">
                  {selectedPatient.full_name}
                </h3>
                
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="secondary" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {calculateAge(selectedPatient.date_of_birth)}
                  </Badge>
                  {selectedPatient.blood_type && (
                    <Badge variant="secondary" className="gap-1">
                      <Heart className="h-3 w-3" />
                      {selectedPatient.blood_type}
                    </Badge>
                  )}
                </div>

                {/* Allergies warning */}
                {hasAllergies(selectedPatient) && (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold text-destructive">Alergias:</span>
                      <p className="text-xs text-destructive/80">{selectedPatient.allergies}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <Link href={`/patients/${selectedPatient.id}`} target="_blank">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New patient button */}
      {!selectedPatient && (
        <div className="flex justify-center pt-2">
          <Link href="/patients/new" target="_blank">
            <Button variant="outline" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Cadastrar Novo Paciente
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
