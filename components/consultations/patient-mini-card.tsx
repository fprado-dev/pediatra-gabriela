"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string;
  allergies?: string;
  blood_type?: string;
}

interface PatientMiniCardProps {
  patient: Patient;
  onClear?: () => void;
  showClear?: boolean;
}

export function PatientMiniCard({ patient, onClear, showClear = true }: PatientMiniCardProps) {
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
        return `${days} dia${days !== 1 ? "s" : ""}`;
      }
      return `${months} ${months === 1 ? "mês" : "meses"}`;
    }

    return `${age} ano${age !== 1 ? "s" : ""}`;
  };

  const hasAllergies = patient.allergies && patient.allergies.trim().length > 0;

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
          {getInitials(patient.full_name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate">{patient.full_name}</span>
          {hasAllergies && (
            <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
              <AlertTriangle className="h-3 w-3 mr-0.5" />
              Alergia
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

      {showClear && onClear && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
