"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Calendar, Phone, Heart } from "lucide-react";
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
    <Link href={`/dashboard/patients/${patient.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(patient.full_name)}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate">
                    {patient.full_name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
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

                {/* Badges */}
                <div className="flex flex-col items-end gap-1">
                  {patient.blood_type && (
                    <Badge variant="outline" className="text-xs">
                      <Heart className="h-3 w-3 mr-1" />
                      {patient.blood_type}
                    </Badge>
                  )}
                  {hasAllergies && (
                    <Badge variant="destructive" className="text-xs">
                      Alergias
                    </Badge>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-2 text-xs text-muted-foreground">
                Cadastrado{" "}
                {formatDistanceToNow(new Date(patient.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
