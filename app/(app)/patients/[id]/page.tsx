import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  User,
  Phone,
  Mail,
  MapPin,
  Heart,
  Pill,
  FileText,
  UserCheck,
  Mic,
  Stethoscope,
  AlertTriangle,
  Droplets,
  Ruler,
  Scale,
} from "lucide-react";
import Link from "next/link";
import { DeletePatientButton } from "@/components/patients/delete-patient-button";
import { ConsultationList } from "@/components/consultations/consultation-list";
import { PatientGrowthSection } from "@/components/growth";
import { VaccineCalendar } from "@/components/vaccines";

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

  const hasAllergies = patient.allergies && patient.allergies.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/patients">
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
                {patient.sex === "male" ? "Masculino" : patient.sex === "female" ? "Feminino" : "Não informado"} •{" "}
                {formatDate(patient.date_of_birth)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/consultations/new-recording?patientId=${id}`}>
            <Button className="gap-2" size="lg">
              <Mic className="h-4 w-4" />
              Nova Consulta
            </Button>
          </Link>
          <Link href={`/patients/${id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          <DeletePatientButton patientId={id} patientName={patient.full_name} />
        </div>
      </div>

      {/* Cards de Resumo - Contato/Responsável e Saúde/Alergias */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Contato & Responsável */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5" />
              Contato & Responsável
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Contato */}
            <div className="space-y-2">
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
            </div>

            {/* Separador */}
            {(patient.responsible_name || patient.responsible_cpf) && (
              <>
                <Separator />
                {/* Responsável */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <UserCheck className="h-3.5 w-3.5" />
                    Responsável Legal
                  </div>
                  {patient.responsible_name && (
                    <p className="text-sm font-medium">{patient.responsible_name}</p>
                  )}
                  {patient.responsible_cpf && (
                    <p className="text-sm text-muted-foreground">
                      CPF: {patient.responsible_cpf}
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Saúde & Alergias */}
        <Card className={hasAllergies ? "border-red-200" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="h-5 w-5" />
              Saúde & Alergias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dados de Saúde */}
            <div className="flex flex-wrap gap-3">
              {patient.blood_type && (
                <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-lg">
                  <Droplets className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">{patient.blood_type}</span>
                </div>
              )}
              {patient.weight_kg && (
                <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-lg">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{patient.weight_kg} kg</span>
                </div>
              )}
              {patient.height_cm && (
                <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-lg">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{patient.height_cm} cm</span>
                </div>
              )}
              {!patient.blood_type && !patient.weight_kg && !patient.height_cm && (
                <p className="text-sm text-muted-foreground">
                  Nenhum dado registrado
                </p>
              )}
            </div>

            {/* Separador e Alergias */}
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <AlertTriangle className={`h-3.5 w-3.5 ${hasAllergies ? "text-red-500" : ""}`} />
                Alergias
              </div>
              {hasAllergies ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 whitespace-pre-wrap">
                    {patient.allergies}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-green-600">Nenhuma alergia registrada ✓</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Crescimento */}
      <PatientGrowthSection 
        patientId={id}
        patientName={patient.full_name}
        dateOfBirth={patient.date_of_birth}
        medicalHistory={patient.medical_history}
      />

      {/* Calendário Vacinal */}
      <VaccineCalendar 
        patientId={id}
        patientName={patient.full_name}
      />

      {/* Medicações e Histórico */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Medicações */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              Histórico Médico
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient.medical_history ? (
              <p className="text-sm whitespace-pre-wrap line-clamp-6">
                {patient.medical_history}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum histórico registrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Observações */}
      {patient.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{patient.notes}</p>
          </CardContent>
        </Card>
      )}

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
              <Link href={`/consultations?patient=${id}`}>
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
              <Link href={`/consultations/new-recording?patientId=${id}`}>
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
