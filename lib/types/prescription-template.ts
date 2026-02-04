/**
 * Tipos para Templates de Prescrição
 */

export interface Medication {
  name: string;                    // Nome do medicamento
  dosage: string;                  // Ex: "15mg/kg/dose"
  frequency: string;               // Ex: "6/6h", "3x/dia"
  route?: string;                  // Ex: "VO", "IM", "Tópico"
  condition?: string;              // Ex: "se febre > 37.8°C"
  duration?: string;               // Ex: "por 7 dias", "enquanto febre"
  notes?: string;                  // Observações adicionais
}

export interface PrescriptionTemplate {
  id: string;
  doctor_id: string;
  name: string;
  category: string;
  medications: Medication[];
  instructions?: string;           // Orientações gerais (legado)
  warnings?: string;               // Alertas importantes (legado)
  orientations?: string;           // Orientações de cuidado, alimentação, repouso
  alert_signs?: string;            // Sinais de alerta
  prevention?: string;             // Como prevenir
  notes?: string;                  // Anotações adicionais
  is_favorite: boolean;
  is_open_template: boolean;       // Se true, template da comunidade; se false, apenas do criador
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface PrescriptionTemplateCreate {
  name: string;
  category: string;
  medications: Medication[];
  instructions?: string;
  warnings?: string;
}

export interface PrescriptionTemplateUpdate {
  name?: string;
  category?: string;
  medications?: Medication[];
  instructions?: string;
  warnings?: string;
  is_favorite?: boolean;
}

// Categorias padrão
export const TEMPLATE_CATEGORIES = [
  "Sintomas Comuns",
  "Antibióticos",
  "Doenças Crônicas",
  "Preventivos",
  "Orientações Gerais",
] as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];

// Helper para formatar medicação
export function formatMedication(med: Medication, patientWeight?: number): string {
  let result = med.name;

  // Calcular dosagem se tiver peso do paciente
  if (patientWeight && med.dosage.includes("mg/kg")) {
    const dosagePerKg = parseFloat(med.dosage.match(/[\d.]+/)?.[0] || "0");
    const calculatedDosage = dosagePerKg * patientWeight;
    result += ` ${calculatedDosage.toFixed(1)}mg/dose`;
  } else {
    result += ` ${med.dosage}`;
  }

  if (med.frequency) {
    result += `, ${med.frequency}`;
  }

  if (med.route) {
    result += ` (${med.route})`;
  }

  if (med.condition) {
    result += `, ${med.condition}`;
  }

  if (med.duration) {
    result += `, ${med.duration}`;
  }

  return result;
}

// Helper para formatar template completo
export function formatTemplate(
  template: PrescriptionTemplate,
  patientWeight?: number
): string {
  let result = "";

  // Medicações
  if (template.medications.length > 0) {
    result += "PRESCRIÇÃO:\n";
    template.medications.forEach((med, index) => {
      result += `${index + 1}. ${formatMedication(med, patientWeight)}\n`;
    });
    result += "\n";
  }

  // Orientações (usar novo campo ou legado)
  const orientations = template.orientations || template.instructions;
  if (orientations) {
    result += "ORIENTAÇÕES:\n";
    result += orientations + "\n\n";
  }

  // Sinais de Alerta (usar novo campo ou legado)
  const alertSigns = template.alert_signs || template.warnings;
  if (alertSigns) {
    result += "⚠️ SINAIS DE ALERTA:\n";
    result += alertSigns + "\n\n";
  }

  // Prevenção
  if (template.prevention) {
    result += "COMO PREVENIR:\n";
    result += template.prevention + "\n\n";
  }

  // Notas
  if (template.notes) {
    result += "OBSERVAÇÕES:\n";
    result += template.notes + "\n";
  }

  return result.trim();
}
