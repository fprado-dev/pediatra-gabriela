export type AgeGroup = 'newborn' | 'infant' | 'preschool' | 'school' | 'adolescent';
export type Sex = 'male' | 'female' | 'both';

export type SystemName =
  | 'estado_geral'
  | 'coong'
  | 'cardiovascular'
  | 'respiratorio'
  | 'digestivo'
  | 'abdominal'
  | 'genitourinario'
  | 'neurologico'
  | 'pele_anexo'
  | 'locomotor';

export interface PhysicalExamTemplate {
  id: string;
  system_name: SystemName;
  system_label: string;
  age_group: AgeGroup;
  sex: Sex;
  template_text: string;
  is_default: boolean;
  doctor_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplatesBySystem {
  system_name: SystemName;
  system_label: string;
  templates: PhysicalExamTemplate[];
}

export interface CompleteExamTemplate {
  templates: PhysicalExamTemplate[];
  full_text: string;
}

/**
 * Calculate age group based on date of birth
 */
export function getAgeGroup(dateOfBirth: string): AgeGroup {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  const ageInDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
  const ageInMonths = Math.floor(ageInDays / 30.44);
  const ageInYears = Math.floor(ageInMonths / 12);

  if (ageInDays <= 28) {
    return 'newborn';
  } else if (ageInMonths <= 12) {
    return 'infant';
  } else if (ageInYears <= 5) {
    return 'preschool';
  } else if (ageInYears <= 12) {
    return 'school';
  } else {
    return 'adolescent';
  }
}

/**
 * Get age group label in Portuguese
 */
export function getAgeGroupLabel(ageGroup: AgeGroup): string {
  const labels: Record<AgeGroup, string> = {
    newborn: 'Recém-nascido (0-28 dias)',
    infant: 'Lactente (1-12 meses)',
    preschool: 'Pré-escolar (1-5 anos)',
    school: 'Escolar (6-12 anos)',
    adolescent: 'Adolescente (13-18 anos)',
  };
  return labels[ageGroup];
}

/**
 * System names and labels
 */
export const PHYSICAL_EXAM_SYSTEMS: Array<{ name: SystemName; label: string }> = [
  { name: 'estado_geral', label: 'Estado Geral' },
  { name: 'coong', label: 'COONG (Cabeça, Olhos, Ouvidos, Nariz, Garganta)' },
  { name: 'cardiovascular', label: 'Aparelho Cardiovascular' },
  { name: 'respiratorio', label: 'Aparelho Respiratório' },
  { name: 'digestivo', label: 'Aparelho Digestivo' },
  { name: 'abdominal', label: 'Aparelho Abdominal' },
  { name: 'genitourinario', label: 'Aparelho Genitourinário' },
  { name: 'neurologico', label: 'Aparelho Neurológico' },
  { name: 'pele_anexo', label: 'Pele e Anexos' },
  { name: 'locomotor', label: 'Aparelho Locomotor' },
];
