import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Edit,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  Pill,
  FileText,
  Trash2,
  UserCheck,
  Mic,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { DeletePatientButton } from "@/components/patients/delete-patient-button";
import { ConsultationList } from "@/components/consultations/consultation-list";

export const dynamic = 'force-dynamic';

export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Buscar paciente
  const { data: patient, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .eq("doctor_id", user.id)
    .eq("is_active", true)
    .single();

  if (error || !patient) {
    notFound();
  }

  // Buscar últimas 10 consultas do paciente
  const { data: consultations, error: consultationsError } = await supabase
    .from("consultations")
    .select("id, patient_id, status, created_at, audio_duration_seconds, chief_complaint")
    .eq("patient_id", id)
    .eq("doctor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (consultationsError) {
    console.error("Error fetching consultations:", consultationsError);
  }

  // Adicionar dados do paciente a cada consulta (para o ConsultationList)
  const consultationsWithPatient = consultations?.map((consultation) => ({
    id: consultation.id,
    patient_id: consultation.patient_id || id,
    status: consultation.status,
    created_at: consultation.created_at,
    audio_duration_seconds: consultation.audio_duration_seconds,
    chief_complaint: consultation.chief_complaint,
    patient: {
      id: patient.id,
      full_name: patient.full_name,
      date_of_birth: patient.date_of_birth,
    },
  })) || [];

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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/patients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {getInitials(patient.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{patient.full_name}</h1>
              <p className="text-muted-foreground">
                {calculateAge(patient.date_of_birth)} •{" "}
                {formatDate(patient.date_of_birth)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/consultations/new-recording">
            <Button className="gap-2" size="lg">
              <Mic className="h-4 w-4" />
              Nova Consulta
            </Button>
          </Link>
          <Link href={`/dashboard/patients/${id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          <DeletePatientButton patientId={id} patientName={patient.full_name} />
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações de Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{patient.phone}</span>
            </div>
            {patient.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{patient.email}</span>
              </div>
            )}
            {patient.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{patient.address}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Responsável */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Responsável Legal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {patient.responsible_name && (
              <div className="text-sm">
                <span className="text-muted-foreground">Nome: </span>
                <span className="font-medium">{patient.responsible_name}</span>
              </div>
            )}
            <div className="text-sm">
              <span className="text-muted-foreground">CPF: </span>
              <span className="font-medium">{patient.responsible_cpf}</span>
            </div>
          </CardContent>
        </Card>

        {/* Informações Médicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Informações Médicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {patient.blood_type && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tipo Sanguíneo:</span>
                <Badge variant="outline">{patient.blood_type}</Badge>
              </div>
            )}
            {patient.weight_kg && (
              <div className="text-sm">
                <span className="text-muted-foreground">Peso: </span>
                <span>{patient.weight_kg} kg</span>
              </div>
            )}
            {patient.height_cm && (
              <div className="text-sm">
                <span className="text-muted-foreground">Altura: </span>
                <span>{patient.height_cm} cm</span>
              </div>
            )}
            {!patient.blood_type && !patient.weight_kg && !patient.height_cm && (
              <p className="text-sm text-muted-foreground">
                Nenhuma informação médica adicional
              </p>
            )}
          </CardContent>
        </Card>

        {/* Alergias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Alergias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient.allergies ? (
              <p className="text-sm whitespace-pre-wrap">{patient.allergies}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma alergia registrada
              </p>
            )}
          </CardContent>
        </Card>

        {/* Medicações */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Medicações Atuais
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient.current_medications ? (
              <p className="text-sm whitespace-pre-wrap">
                {patient.current_medications}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma medicação em uso
              </p>
            )}
          </CardContent>
        </Card>

        {/* Histórico Médico */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Histórico Médico
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient.medical_history ? (
              <p className="text-sm whitespace-pre-wrap">
                {patient.medical_history}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum histórico médico registrado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Observações */}
        {patient.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{patient.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Histórico de Consultas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Histórico de Consultas
              {consultationsWithPatient.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {consultationsWithPatient.length}
                </Badge>
              )}
            </CardTitle>
            {consultationsWithPatient.length >= 10 && (
              <Link href={`/dashboard/consultations?patient=${id}`}>
                <Button variant="ghost" size="sm">
                  Ver todas →
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {consultationsWithPatient.length > 0 ? (
            <ConsultationList consultations={consultationsWithPatient} />
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma consulta registrada
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {patient.full_name} ainda não possui consultas gravadas.
              </p>
              <Link href="/dashboard/consultations/new-recording">
                <Button>
                  <Mic className="h-4 w-4 mr-2" />
                  Gravar Primeira Consulta
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
