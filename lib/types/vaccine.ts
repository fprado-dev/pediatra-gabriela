// Tipos para o Calendário Vacinal

export interface VaccineReference {
  id: string;
  code: string;
  name: string;
  dose_label: string;
  age_group: string;
  age_months_min: number;
  age_months_max: number | null;
  type: 'sus' | 'particular';
  category: string;
  notes: string | null;
  display_order: number;
}

export interface PatientVaccine {
  id: string;
  patient_id: string;
  vaccine_code: string;
  status: 'pending' | 'applied' | 'skipped';
  applied_at: string | null;
  batch_number: string | null;
  notes: string | null;
}

export interface VaccineWithStatus extends VaccineReference {
  patientVaccine?: PatientVaccine;
  isOverdue: boolean;
  isPending: boolean;
  isApplied: boolean;
  isSkipped: boolean;
  isApplicable: boolean; // se a vacina se aplica para a idade atual
}

export interface VaccinesByAgeGroup {
  ageGroup: string;
  vaccines: VaccineWithStatus[];
}

export type VaccineStatus = 'pending' | 'applied' | 'skipped' | 'overdue' | 'not_applicable';

// Helper para calcular idade em meses
export function calculateAgeInMonths(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  const years = today.getFullYear() - birth.getFullYear();
  const months = today.getMonth() - birth.getMonth();
  const days = today.getDate() - birth.getDate();
  
  let totalMonths = years * 12 + months;
  if (days < 0) totalMonths--;
  
  return totalMonths;
}

// Helper para verificar se vacina está atrasada
export function isVaccineOverdue(
  vaccine: VaccineReference, 
  ageMonths: number, 
  patientVaccine?: PatientVaccine
): boolean {
  // Se já foi aplicada ou pulada, não está atrasada
  if (patientVaccine?.status === 'applied' || patientVaccine?.status === 'skipped') {
    return false;
  }
  
  // Se a idade atual passou do limite máximo da vacina
  if (vaccine.age_months_max && ageMonths > vaccine.age_months_max) {
    return true;
  }
  
  return false;
}

// Helper para verificar se vacina é aplicável para a idade
export function isVaccineApplicable(vaccine: VaccineReference, ageMonths: number): boolean {
  // Se a idade mínima ainda não foi atingida, não é aplicável
  if (ageMonths < vaccine.age_months_min) {
    return false;
  }
  
  return true;
}

// Helper para agrupar vacinas por faixa etária
export function groupVaccinesByAge(vaccines: VaccineWithStatus[]): VaccinesByAgeGroup[] {
  const grouped = new Map<string, VaccineWithStatus[]>();
  
  // Ordem das faixas etárias
  const ageOrder = [
    'Ao nascer',
    '0 a 8 meses',
    '2 meses',
    '3 meses',
    '4 meses',
    '5 meses',
    '6 meses',
    '7 meses',
    '9 meses',
    '12 meses',
    '15 meses',
    '18 meses',
    '4 anos',
    '4 a 14 anos',
    '7+ anos',
    '9 a 11 anos',
    '9 a 14 anos',
    '9 a 45 anos',
    '11 a 14 anos',
  ];
  
  vaccines.forEach((vaccine) => {
    const group = grouped.get(vaccine.age_group) || [];
    group.push(vaccine);
    grouped.set(vaccine.age_group, group);
  });
  
  // Ordenar por ordem definida
  const result: VaccinesByAgeGroup[] = [];
  ageOrder.forEach((ageGroup) => {
    const vaccines = grouped.get(ageGroup);
    if (vaccines && vaccines.length > 0) {
      result.push({
        ageGroup,
        vaccines: vaccines.sort((a, b) => a.display_order - b.display_order),
      });
    }
  });
  
  // Adicionar qualquer grupo não listado
  grouped.forEach((vaccines, ageGroup) => {
    if (!ageOrder.includes(ageGroup)) {
      result.push({
        ageGroup,
        vaccines: vaccines.sort((a, b) => a.display_order - b.display_order),
      });
    }
  });
  
  return result;
}
