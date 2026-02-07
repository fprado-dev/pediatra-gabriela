import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Queries centralizadas para Supabase
 * Seguindo o padrão de organização de queries reutilizáveis
 */

// ============================================================================
// PACIENTES
// ============================================================================

/**
 * Buscar pacientes ativos do médico
 */
export async function getActivePatients(
  supabase: SupabaseClient,
  doctorId: string
) {
  return supabase
    .from("patients")
    .select("id, full_name, date_of_birth, phone, email, cpf")
    .eq("doctor_id", doctorId)
    .eq("is_active", true)
    .order("full_name");
}

/**
 * Buscar um paciente específico
 */
export async function getPatientById(
  supabase: SupabaseClient,
  patientId: string,
  doctorId: string
) {
  return supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .eq("doctor_id", doctorId)
    .eq("is_active", true)
    .single();
}

// ============================================================================
// CONSULTAS
// ============================================================================

/**
 * Buscar consultas recentes do paciente
 */
export async function getRecentConsultationsByPatient(
  supabase: SupabaseClient,
  patientId: string,
  doctorId: string,
  limit = 10
) {
  return supabase
    .from("consultations")
    .select("id, created_at, chief_complaint, diagnosis, status, prescription_data")
    .eq("patient_id", patientId)
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: false })
    .limit(limit);
}

/**
 * Buscar uma consulta específica com dados do paciente
 */
export async function getConsultationWithPatient(
  supabase: SupabaseClient,
  consultationId: string,
  doctorId: string
) {
  return supabase
    .from("consultations")
    .select(`
      id,
      chief_complaint,
      diagnosis,
      plan,
      prescription_data,
      created_at,
      patient:patients(
        id, 
        full_name, 
        date_of_birth, 
        weight_kg, 
        height_cm,
        allergies,
        current_medications,
        responsible_name
      )
    `)
    .eq("id", consultationId)
    .eq("doctor_id", doctorId)
    .single();
}

// ============================================================================
// ATESTADOS MÉDICOS
// ============================================================================

/**
 * Criar um novo atestado médico
 */
export async function createMedicalCertificate(
  supabase: SupabaseClient,
  data: {
    patientId: string;
    doctorId: string;
    consultationId?: string | null;
    certificateType: string;
    certificateData: object;
  }
) {
  return supabase
    .from("medical_certificates")
    .insert({
      patient_id: data.patientId,
      doctor_id: data.doctorId,
      consultation_id: data.consultationId || null,
      certificate_type: data.certificateType,
      certificate_data: data.certificateData,
    })
    .select()
    .single();
}

/**
 * Buscar atestados de um paciente
 */
export async function getMedicalCertificatesByPatient(
  supabase: SupabaseClient,
  patientId: string,
  doctorId: string
) {
  return supabase
    .from("medical_certificates")
    .select("*")
    .eq("patient_id", patientId)
    .eq("doctor_id", doctorId)
    .order("generated_at", { ascending: false });
}

/**
 * Buscar atestados de uma consulta específica
 */
export async function getMedicalCertificatesByConsultation(
  supabase: SupabaseClient,
  consultationId: string,
  doctorId: string
) {
  return supabase
    .from("medical_certificates")
    .select("*")
    .eq("consultation_id", consultationId)
    .eq("doctor_id", doctorId)
    .order("generated_at", { ascending: false });
}

// ============================================================================
// PERFIL DO MÉDICO
// ============================================================================

/**
 * Buscar perfil do médico (nome e CRM)
 */
export async function getDoctorProfile(
  supabase: SupabaseClient,
  doctorId: string
) {
  return supabase
    .from("profiles")
    .select("full_name, crm, specialty")
    .eq("id", doctorId)
    .single();
}

// ============================================================================
// RECEITAS
// ============================================================================

/**
 * Salvar receita em uma consulta existente
 */
export async function savePrescriptionToConsultation(
  supabase: SupabaseClient,
  consultationId: string,
  prescriptionData: object
) {
  return supabase
    .from("consultations")
    .update({
      prescription_data: prescriptionData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", consultationId);
}

/**
 * Criar uma consulta mínima para receita standalone
 */
export async function createMinimalConsultationForPrescription(
  supabase: SupabaseClient,
  data: {
    patientId: string;
    doctorId: string;
    prescriptionData: object;
  }
) {
  return supabase
    .from("consultations")
    .insert({
      patient_id: data.patientId,
      doctor_id: data.doctorId,
      status: "completed",
      chief_complaint: "Receita avulsa",
      diagnosis: "",
      plan: "",
      prescription_data: data.prescriptionData,
      audio_duration_seconds: 0,
    })
    .select("id")
    .single();
}
