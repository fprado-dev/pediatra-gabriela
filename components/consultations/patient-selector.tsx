"use client";

import { useState } from "react";
import { Check, Search, UserPlus, AlertTriangle, Calendar, Heart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
      if (months <= 0) {
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12"
        />
      </div>

      {/* Patient List */}
      <ScrollArea className="h-[320px] pr-4">
        {filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">Nenhum paciente encontrado</p>
            <Link href="/patients/new" target="_blank">
              <Button variant="outline" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Cadastrar Novo Paciente
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPatients.map((patient) => {
              const isSelected = selectedPatientId === patient.id;
              
              return (
                <button
                  key={patient.id}
                  onClick={() => onSelectPatient(patient.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-muted/50 hover:bg-muted hover:border-muted-foreground/20"
                  )}
                >
                  {/* Avatar */}
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback 
                      className={cn(
                        "text-sm font-semibold",
                        isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      {getInitials(patient.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold truncate">{patient.full_name}</span>
                      {hasAllergies(patient) && (
                        <Badge variant="destructive" className="h-5 px-1.5 shrink-0">
                          <AlertTriangle className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {calculateAge(patient.date_of_birth)}
                      </span>
                      {patient.blood_type && (
                        <span className="flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" />
                          {patient.blood_type}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Check */}
                  <div
                    className={cn(
                      "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {isSelected && <Check className="h-4 w-4" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>

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
