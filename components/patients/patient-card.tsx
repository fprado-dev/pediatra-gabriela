"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Calendar, Phone, Heart, AlertTriangle, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PatientCardProps {
  patient: {
    id: string;
    full_name: string;
    date_of_birth: string;
    phone: string;
    blood_type?: string;
    allergies?: string;
    created_at: string;
  };
}

export function PatientCard({ patient }: PatientCardProps) {
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

  const hasAllergies = patient.allergies && patient.allergies.trim().length > 0;

  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col">
      <CardContent className="p-4 flex flex-col flex-1">
        {/* Header: Badges */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {patient.blood_type && (
              <Badge variant="outline" className="text-xs">
                <Heart className="h-3 w-3 mr-1" />
                {patient.blood_type}
              </Badge>
            )}
            {hasAllergies && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Alergias
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(patient.created_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
        </div>

        {/* Nome do paciente */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
            {getInitials(patient.full_name)}
          </div>
          <span className="font-semibold text-sm truncate">
            {patient.full_name}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 mb-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {calculateAge(patient.date_of_birth)}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {patient.phone}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-xs text-muted-foreground">
            Ver perfil
          </span>
          <Link href={`/patients/${patient.id}`}>
            <Button size="sm" variant="default">
              Abrir
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
