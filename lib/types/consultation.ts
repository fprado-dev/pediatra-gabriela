/**
 * Tipos de consulta pediátrica
 * Baseado nas diretrizes da SBP (Sociedade Brasileira de Pediatria)
 */
export type ConsultationType = 
  | 'puericultura'
  | 'urgencia_emergencia'
  | 'consulta_rotina';

/**
 * Subtipos de consultas de Puericultura
 * Seguindo calendário recomendado pelo Ministério da Saúde e SBP
 */
export type PuericulturaSubtype =
  | 'prenatal'           // Consulta Pré-Natal
  | 'primeira_rn'        // Primeira consulta do RN (idealmente 7-10 dias)
  | 'mensal_1'           // 1º mês de vida
  | 'mensal_2'           // 2º mês de vida
  | 'mensal_3'           // 3º mês de vida
  | 'mensal_4'           // 4º mês de vida
  | 'mensal_5'           // 5º mês de vida
  | 'mensal_6'           // 6º mês de vida
  | 'rotina_7_12';       // Consultas de rotina entre 7-12 meses (MS recomenda mínimo 3)

/**
 * Opção de tipo de consulta com metadados para UI
 */
export interface ConsultationTypeOption {
  type: ConsultationType;
  subtype?: PuericulturaSubtype;
  label: string;
  description: string;
  icon: string; // nome do ícone Lucide
}

/**
 * Resumo de uma consulta anterior
 * Gerado automaticamente pela IA ou editado pelo médico
 */
export interface PreviousConsultationSummary {
  consultation_id: string;
  date: string; // ISO date string
  key_points: string[]; // 3-5 pontos principais da consulta
  diagnosis: string;
  auto_generated: boolean; // true se gerado pela IA
  edited_by_doctor: boolean; // true se médico editou após geração
}

/**
 * Estrutura do campo previous_consultations_summary (JSONB)
 */
export interface PreviousConsultationsData {
  consultations: PreviousConsultationSummary[];
  last_updated: string | null; // ISO datetime string
}

/**
 * Interface completa de consulta (campos do banco de dados)
 */
export interface Consultation {
  id: string;
  doctor_id: string;
  patient_id: string;
  consultation_date: string;
  status: 'processing' | 'completed' | 'error' | 'archived';
  
  // Tipo de consulta (NOVO)
  consultation_type: ConsultationType;
  consultation_subtype?: PuericulturaSubtype | null;
  
  // Campos clínicos - APS (Atenção Primária à Saúde)
  // DADOS SUBJETIVOS
  chief_complaint?: string | null;
  hma?: string | null; // História da Moléstia Atual (foco na queixa atual)
  history?: string | null; // Informações complementares de contexto
  family_history?: string | null;
  prenatal_perinatal_history?: string | null;
  
  // DADOS OBJETIVOS
  physical_exam?: string | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  head_circumference_cm?: number | null;
  development_notes?: string | null;
  
  // AVALIAÇÃO
  diagnosis?: string | null;
  
  // PLANO DE CUIDADO
  conduct?: string | null; // NOVO - Ações imediatas, exames, encaminhamentos
  plan?: string | null; // Plano terapêutico (medicações, orientações, seguimento)
  notes?: string | null;
  
  // Áudio
  audio_url?: string | null;
  original_audio_url?: string | null;
  audio_duration_seconds?: number | null;
  audio_size_bytes?: number | null;
  audio_format?: string | null;
  audio_hash?: string | null;
  
  // Transcrição e processamento
  raw_transcription?: string | null;
  cleaned_transcription?: string | null;
  processing_steps?: any;
  processing_started_at?: string | null;
  processing_completed_at?: string | null;
  processing_error?: string | null;
  
  // Prescrição
  prescription?: string | null;
  prescription_data?: any;
  
  // Histórico de consultas anteriores (NOVO)
  previous_consultations_summary?: PreviousConsultationsData | null;
  
  // Versionamento e edição
  original_ai_version?: any;
  edited_by_doctor?: boolean;
  edit_history?: any;
  
  // Reutilização de áudio
  reused_from_consultation_id?: string | null;
  
  // Timestamps
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}
