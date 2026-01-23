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
  instructions?: string;           // Orientações gerais
  warnings?: string;               // Alertas importantes
  is_favorite: boolean;
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
  
  // Instruções
  if (template.instructions) {
    result += "ORIENTAÇÕES:\n";
    result += template.instructions + "\n\n";
  }
  
  // Alertas
  if (template.warnings) {
    result += "⚠️  ATENÇÃO:\n";
    result += template.warnings + "\n";
  }
  
  return result.trim();
}
