"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Calendar, Phone, Heart, AlertTriangle, Eye, Cake } from "lucide-react";
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
    <div className="bg-white border border-gray-200 rounded-lg flex flex-col">
      {/* Header: Badges + Tempo */}
      <div className="p-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          {patient.blood_type && (
            <Badge variant="outline" className="flex items-center gap-1.5">
              <Heart className="h-3 w-3 text-red-500" />
              <span className="text-xs font-medium text-gray-700">
                {patient.blood_type}
              </span>
            </Badge>
          )}
          {hasAllergies && (
            <Badge variant="outline" className="flex items-center gap-1.5 border-red-200 bg-red-50">
              <AlertTriangle className="h-3 w-3 text-red-600" />
              <span className="text-xs font-medium text-red-700">
                Alergias
              </span>
            </Badge>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(patient.created_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        </span>
      </div>

      {/* Body: Informações */}
      <div className="p-4 flex-1 space-y-3">
        {/* Nome do Paciente */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="font-semibold text-gray-900 truncate">
            {patient.full_name}
          </span>
        </div>

        {/* Idade */}
        <div className="flex items-center gap-2">
          <Cake className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-600">
            {calculateAge(patient.date_of_birth)}
          </span>
        </div>

        {/* Telefone */}
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-600">
            {patient.phone}
          </span>
        </div>
      </div>

      {/* Footer: Ação */}
      <div className="p-4 flex justify-end border-t border-gray-100">
        <Link href={`/patients/${patient.id}`} className="block">
          <Button className="gap-2 cursor-pointer" size="xs">
            <Eye className="h-3 w-3" />
            Ver Paciente
          </Button>
        </Link>
      </div>
    </div>
  );
}
