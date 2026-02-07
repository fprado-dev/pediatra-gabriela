import { 
  ConsultationType, 
  PuericulturaSubtype, 
  ConsultationTypeOption 
} from '@/lib/types/consultation';
import { 
  Baby, 
  Siren, 
  Stethoscope,
  LucideIcon
} from 'lucide-react';

/**
 * Retorna o label em português para um tipo de consulta
 */
export function getConsultationTypeLabel(
  type: ConsultationType, 
  subtype?: PuericulturaSubtype | null
): string {
  const typeLabels: Record<ConsultationType, string> = {
    puericultura: 'Puericultura',
    urgencia_emergencia: 'Urgência/Emergência',
    consulta_rotina: 'Consulta de Rotina'
  };

  const baseLabel = typeLabels[type];

  if (type === 'puericultura' && subtype) {
    const subtypeLabels: Record<PuericulturaSubtype, string> = {
      prenatal: 'Consulta Pré-Natal',
      primeira_rn: 'Primeira Consulta do RN (7-10 dias)',
      mensal_1: '1º Mês de Vida',
      mensal_2: '2º Mês de Vida',
      mensal_3: '3º Mês de Vida',
      mensal_4: '4º Mês de Vida',
      mensal_5: '5º Mês de Vida',
      mensal_6: '6º Mês de Vida',
      rotina_7_12: 'Rotina 7-12 Meses'
    };
    return `${baseLabel} - ${subtypeLabels[subtype]}`;
  }

  return baseLabel;
}

/**
 * Retorna o ícone Lucide para um tipo de consulta
 */
export function getConsultationTypeIcon(type: ConsultationType): LucideIcon {
  const icons: Record<ConsultationType, LucideIcon> = {
    puericultura: Baby,
    urgencia_emergencia: Siren,
    consulta_rotina: Stethoscope
  };

  return icons[type];
}

/**
 * Retorna a descrição para um tipo de consulta
 */
export function getConsultationTypeDescription(
  type: ConsultationType,
  subtype?: PuericulturaSubtype | null
): string {
  if (type === 'puericultura' && subtype) {
    const subtypeDescriptions: Record<PuericulturaSubtype, string> = {
      prenatal: 'Avaliação pré-natal do bebê, orientações aos pais',
      primeira_rn: 'Primeira avaliação completa do recém-nascido',
      mensal_1: 'Acompanhamento mensal: aleitamento, sono, desenvolvimento',
      mensal_2: 'Acompanhamento mensal: crescimento, vacinas, marcos',
      mensal_3: 'Acompanhamento mensal: interação social, alimentação',
      mensal_4: 'Acompanhamento mensal: sustentação cefálica, comunicação',
      mensal_5: 'Acompanhamento mensal: introdução alimentar, dentição',
      mensal_6: 'Acompanhamento mensal: sentar sem apoio, alimentação complementar',
      rotina_7_12: 'Consultas de acompanhamento entre 7-12 meses'
    };
    return subtypeDescriptions[subtype];
  }

  const typeDescriptions: Record<ConsultationType, string> = {
    puericultura: 'Acompanhamento do crescimento e desenvolvimento da criança',
    urgencia_emergencia: 'Atendimento de quadros agudos que requerem avaliação imediata',
    consulta_rotina: 'Consulta de rotina para avaliação geral e orientações'
  };

  return typeDescriptions[type];
}

/**
 * Retorna o label curto para um subtipo de puericultura
 */
export function getPuericulturaSubtypeLabel(subtype: PuericulturaSubtype): string {
  const labels: Record<PuericulturaSubtype, string> = {
    prenatal: 'Pré-Natal',
    primeira_rn: 'Primeira RN',
    mensal_1: '1º Mês',
    mensal_2: '2º Mês',
    mensal_3: '3º Mês',
    mensal_4: '4º Mês',
    mensal_5: '5º Mês',
    mensal_6: '6º Mês',
    rotina_7_12: '7-12 Meses'
  };

  return labels[subtype];
}

/**
 * Todas as opções de consulta disponíveis
 */
export const CONSULTATION_TYPE_OPTIONS: ConsultationTypeOption[] = [
  {
    type: 'puericultura',
    label: 'Puericultura',
    description: 'Acompanhamento do crescimento e desenvolvimento',
    icon: 'Baby'
  },
  {
    type: 'urgencia_emergencia',
    label: 'Urgência/Emergência',
    description: 'Atendimento de quadros agudos',
    icon: 'Siren'
  },
  {
    type: 'consulta_rotina',
    label: 'Consulta de Rotina',
    description: 'Avaliação geral e orientações',
    icon: 'Stethoscope'
  }
];

/**
 * Opções de subtipos de Puericultura
 */
export const PUERICULTURA_SUBTYPE_OPTIONS: Array<{
  value: PuericulturaSubtype;
  label: string;
  description: string;
}> = [
  {
    value: 'prenatal',
    label: 'Consulta Pré-Natal',
    description: 'Avaliação antes do nascimento'
  },
  {
    value: 'primeira_rn',
    label: 'Primeira Consulta RN',
    description: '7-10 dias de vida'
  },
  {
    value: 'mensal_1',
    label: '1º Mês',
    description: 'Primeira consulta mensal'
  },
  {
    value: 'mensal_2',
    label: '2º Mês',
    description: 'Segunda consulta mensal'
  },
  {
    value: 'mensal_3',
    label: '3º Mês',
    description: 'Terceira consulta mensal'
  },
  {
    value: 'mensal_4',
    label: '4º Mês',
    description: 'Quarta consulta mensal'
  },
  {
    value: 'mensal_5',
    label: '5º Mês',
    description: 'Quinta consulta mensal'
  },
  {
    value: 'mensal_6',
    label: '6º Mês',
    description: 'Sexta consulta mensal'
  },
  {
    value: 'rotina_7_12',
    label: 'Rotina 7-12 Meses',
    description: 'Consultas entre 7-12 meses'
  }
];

/**
 * Valida se uma combinação tipo + subtipo é válida
 */
export function isValidConsultationTypeCombo(
  type: ConsultationType,
  subtype?: PuericulturaSubtype | null
): boolean {
  // Puericultura DEVE ter subtipo
  if (type === 'puericultura') {
    return !!subtype;
  }
  
  // Outros tipos NÃO devem ter subtipo
  return !subtype;
}

/**
 * Retorna a cor do tema para um tipo de consulta
 */
export function getConsultationTypeColor(type: ConsultationType): {
  bg: string;
  border: string;
  text: string;
  icon: string;
} {
  const colors = {
    puericultura: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-900',
      icon: 'text-blue-600'
    },
    urgencia_emergencia: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      text: 'text-red-900',
      icon: 'text-red-600'
    },
    consulta_rotina: {
      bg: 'bg-green-50',
      border: 'border-green-300',
      text: 'text-green-900',
      icon: 'text-green-600'
    }
  };

  return colors[type];
}
