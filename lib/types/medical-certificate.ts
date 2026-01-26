export type CertificateType = 'comparecimento' | 'aptidao' | 'afastamento' | 'acompanhante';

// Base interface for all certificates
export interface MedicalCertificateBase {
  patientName: string;
  patientDateOfBirth: string;
  consultationDate: string;
  doctorName: string;
  doctorCRM: string;
  doctorSpecialty?: string;
  city?: string;
  observations?: string;
}

// Atestado de Comparecimento
export interface ComparecimentoCertificateData extends MedicalCertificateBase {
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
}

// Atestado de Aptidão Física
export interface AptidaoCertificateData extends MedicalCertificateBase {
  activityType: string; // ex: "atividades escolares", "prática de natação"
  validUntil?: string; // data de validade (ISO)
}

// Atestado Médico (Afastamento)
export interface AfastamentoCertificateData extends MedicalCertificateBase {
  activityType: string; // "escolares", "esportivas", "outras"
  days: number; // dias de afastamento
  startDate: string; // data de início (ISO)
  cid10?: string; // opcional
  canLeaveHome: boolean; // padrão: true
}

// Atestado de Acompanhante
export interface AcompanhanteCertificateData extends MedicalCertificateBase {
  responsibleName: string;
  startTime?: string;
  endTime?: string;
}

// Union type for certificate data
export type CertificateData =
  | ComparecimentoCertificateData
  | AptidaoCertificateData
  | AfastamentoCertificateData
  | AcompanhanteCertificateData;

// Database record
export interface MedicalCertificate {
  id: string;
  consultation_id: string;
  patient_id: string;
  doctor_id: string;
  certificate_type: CertificateType;
  certificate_data: CertificateData;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

// Form data for creating certificates
export interface CreateCertificateRequest {
  consultationId: string;
  certificateType: CertificateType;
  certificateData: CertificateData;
}

// Labels for certificate types
export const CERTIFICATE_TYPE_LABELS: Record<CertificateType, string> = {
  comparecimento: 'Atestado de Comparecimento',
  aptidao: 'Atestado de Aptidão Física',
  afastamento: 'Atestado Médico',
  acompanhante: 'Atestado de Acompanhante',
};

// Icons for certificate types
export const CERTIFICATE_TYPE_ICONS: Record<CertificateType, string> = {
  comparecimento: '📝',
  aptidao: '🏃',
  afastamento: '🏥',
  acompanhante: '👥',
};

// Descriptions for certificate types
export const CERTIFICATE_TYPE_DESCRIPTIONS: Record<CertificateType, string> = {
  comparecimento: 'Confirma presença em consulta médica',
  aptidao: 'Certifica aptidão para atividades físicas',
  afastamento: 'Justifica afastamento por motivo de saúde',
  acompanhante: 'Comprova acompanhamento de paciente',
};
