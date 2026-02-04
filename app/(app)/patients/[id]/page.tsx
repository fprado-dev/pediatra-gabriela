import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
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
  Cake,
} from "lucide-react";
import Link from "next/link";
import { DeletePatientButton } from "@/components/patients/delete-patient-button";
import { ConsultationList } from "@/components/consultations/consultation-list";
import { PatientGrowthSection } from "@/components/growth";
import { VaccineCalendar } from "@/components/vaccines";
import { PatientCertificatesHistory } from "@/components/patients/patient-certificates-history";
import { BackButton } from "@/components/consultations/back-button";

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="px-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {patient.full_name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-4">
              <div className="flex items-center gap-1.5">
                <Cake className="h-3.5 w-3.5 text-gray-400" />
                <span>{formatDate(patient.date_of_birth)}</span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-700 font-medium">{calculateAge(patient.date_of_birth)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-gray-400" />
                <span>{patient.sex === "male" ? "Masculino" : patient.sex === "female" ? "Feminino" : "Não informado"}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link className="p-0 m-0" href={`/patients/${id}/edit`}>
              <Button variant="outline" className="gap-2" size="sm">
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            </Link>
            <BackButton />
          </div>
        </div>

        <Separator className="my-4" />

        {/* Conteúdo Principal - Cards Limpos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">

          {/* Contato */}
          <div className="p-6">
            <div className="flex justify-end">
              <DeletePatientButton patientId={id} patientName={patient.full_name} />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Phone className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium text-gray-500">
                Informações de Contato
              </h2>
            </div>
            <div className="space-y-2 px-6">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-base text-gray-900">{patient.phone}</span>
              </div>
              {patient.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-base text-gray-900">{patient.email}</span>
                </div>
              )}
              {patient.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span className="text-base text-gray-900">{patient.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Responsável Legal */}
          {(patient.responsible_name || patient.responsible_cpf) && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-medium text-gray-500">
                  Responsável Legal
                </h2>
              </div>
              <div className="space-y-2 px-6">
                {patient.responsible_name && (
                  <p className="text-base text-gray-900">{patient.responsible_name}</p>
                )}
                {patient.responsible_cpf && (
                  <p className="text-sm text-gray-600">
                    CPF: {patient.responsible_cpf}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Dados de Saúde */}
          {(patient.blood_type || patient.weight_kg || patient.height_cm) && (
            <div className="p-6">
              <h2 className="text-sm font-medium text-gray-500 mb-4">
                Dados de Saúde
              </h2>
              <div className="grid grid-cols-3 gap-6">
                {patient.blood_type && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Tipo Sanguíneo</p>
                    <p className="text-2xl font-semibold text-gray-900">{patient.blood_type}</p>
                  </div>
                )}
                {patient.weight_kg && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Peso</p>
                    <p className="text-2xl font-semibold text-gray-900">{patient.weight_kg}</p>
                    <p className="text-xs text-gray-500 mt-1">kg</p>
                  </div>
                )}
                {patient.height_cm && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Altura</p>
                    <p className="text-2xl font-semibold text-gray-900">{patient.height_cm}</p>
                    <p className="text-xs text-gray-500 mt-1">cm</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Alergias */}
          {hasAllergies && (
            <div className="p-6 bg-red-50/30">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <h2 className="text-sm font-medium text-red-900">
                  Alergias
                </h2>
                <span className="ml-auto text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">
                  Importante
                </span>
              </div>
              <p className="text-base leading-relaxed whitespace-pre-wrap text-gray-900 px-6">
                {patient.allergies}
              </p>
            </div>
          )}

          {/* Medicações Atuais */}
          {patient.current_medications && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Pill className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-medium text-gray-500">
                  Medicações Atuais
                </h2>
              </div>
              <p className="text-base leading-relaxed whitespace-pre-wrap text-gray-900 px-6">
                {patient.current_medications}
              </p>
            </div>
          )}

          {/* Histórico Médico */}
          {patient.medical_history && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-medium text-gray-500">
                  Histórico Médico
                </h2>
              </div>
              <p className="text-base leading-relaxed whitespace-pre-wrap text-gray-900 px-6">
                {patient.medical_history}
              </p>
            </div>
          )}

          {/* Observações */}
          {patient.notes && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-medium text-gray-500">
                  Observações
                </h2>
              </div>
              <p className="text-base leading-relaxed whitespace-pre-wrap text-gray-900 px-6">
                {patient.notes}
              </p>
            </div>
          )}
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

        {/* Histórico de Consultas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-gray-900">
                Histórico de Consultas
              </h2>
              {consultationsWithPatient.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {consultationsWithPatient.length}
                </Badge>
              )}
            </div>
            {consultationsWithPatient.length >= 10 && (
              <Link href={`/consultations?patient=${id}`}>
                <Button variant="ghost" size="sm">
                  Ver todas →
                </Button>
              </Link>
            )}
          </div>

          {consultationsWithPatient.length > 0 ? (
            <ConsultationList consultations={consultationsWithPatient} />
          ) : (
            <div className="text-center py-12">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma consulta registrada
              </h3>
              <p className="text-gray-500 mb-6">
                {patient.full_name} ainda não possui consultas gravadas.
              </p>
              <Link href={`/consultations/new-recording?patient_id=${id}`}>
                <Button size="sm" className="gap-2">
                  <Mic className="h-4 w-4" />
                  Gravar Primeira Consulta
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Histórico de Atestados */}
        <PatientCertificatesHistory patientId={id} />
      </div>
    </div>
  );
}
