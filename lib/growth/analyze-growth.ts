import { calculatePercentile, calculateAgeInMonths, Sex, PercentileResult } from './who-standards';

export interface Measurement {
  date: Date;
  weight_kg: number | null;
  height_cm: number | null;
  head_circumference_cm: number | null;
}

export interface GrowthAnalysis {
  current: {
    weight?: PercentileResult;
    height?: PercentileResult;
    headCircumference?: PercentileResult;
  };
  previous?: {
    weight?: PercentileResult;
    height?: PercentileResult;
    headCircumference?: PercentileResult;
    date: Date;
  };
  alerts: GrowthAlert[];
}

export interface GrowthAlert {
  type: 
    | 'weight_drop'
    | 'weight_drop_severe'
    | 'height_stagnation'
    | 'weight_excess'
    | 'weight_height_disprop'
    | 'head_circ_abnormal'
    | 'general_concern';
  severity: 'low' | 'moderate' | 'high';
  title: string;
  description: string;
  percentileChange?: number;
  suggestedActions: string[];
}

// Thresholds for alerts
const THRESHOLDS = {
  PERCENTILE_DROP_MODERATE: 15,
  PERCENTILE_DROP_SEVERE: 25,
  PERCENTILE_GAIN_EXCESS: 20,
  HEIGHT_STAGNATION_MONTHS: 3,
  HC_LOW_PERCENTILE: 3,
  HC_HIGH_PERCENTILE: 97,
};

/**
 * Analyze growth measurements and generate alerts
 */
export function analyzeGrowth(
  dateOfBirth: Date,
  sex: Sex,
  currentMeasurement: Measurement,
  previousMeasurements: Measurement[] = []
): GrowthAnalysis {
  const ageMonths = calculateAgeInMonths(dateOfBirth, currentMeasurement.date);
  const alerts: GrowthAlert[] = [];
  
  // Calculate current percentiles
  const current: GrowthAnalysis['current'] = {};
  
  if (currentMeasurement.weight_kg) {
    current.weight = calculatePercentile(currentMeasurement.weight_kg, ageMonths, sex, 'weight');
  }
  
  if (currentMeasurement.height_cm) {
    current.height = calculatePercentile(currentMeasurement.height_cm, ageMonths, sex, 'height');
  }
  
  if (currentMeasurement.head_circumference_cm && ageMonths <= 36) {
    current.headCircumference = calculatePercentile(
      currentMeasurement.head_circumference_cm, 
      ageMonths, 
      sex, 
      'head_circumference'
    );
  }
  
  // Find previous measurement with weight/height data
  const previousWithData = previousMeasurements.find(
    m => m.weight_kg || m.height_cm
  );
  
  let previous: GrowthAnalysis['previous'];
  
  if (previousWithData) {
    const prevAgeMonths = calculateAgeInMonths(dateOfBirth, previousWithData.date);
    previous = { date: previousWithData.date };
    
    if (previousWithData.weight_kg) {
      previous.weight = calculatePercentile(previousWithData.weight_kg, prevAgeMonths, sex, 'weight');
    }
    
    if (previousWithData.height_cm) {
      previous.height = calculatePercentile(previousWithData.height_cm, prevAgeMonths, sex, 'height');
    }
    
    if (previousWithData.head_circumference_cm && prevAgeMonths <= 36) {
      previous.headCircumference = calculatePercentile(
        previousWithData.head_circumference_cm, 
        prevAgeMonths, 
        sex, 
        'head_circumference'
      );
    }
    
    // Compare and generate alerts
    
    // Weight drop
    if (current.weight && previous.weight) {
      const percentileChange = current.weight.percentile - previous.weight.percentile;
      
      if (percentileChange <= -THRESHOLDS.PERCENTILE_DROP_SEVERE) {
        alerts.push({
          type: 'weight_drop_severe',
          severity: 'high',
          title: 'Queda severa de peso',
          description: `O percentil de peso caiu de ${previous.weight.percentile} para ${current.weight.percentile} (${Math.abs(percentileChange)} pontos)`,
          percentileChange,
          suggestedActions: [
            'Investigar causas de perda de peso',
            'Avaliar alimentação e ingesta hídrica',
            'Considerar hemograma, glicemia e TSH',
            'Avaliar situação familiar/estresse',
          ],
        });
      } else if (percentileChange <= -THRESHOLDS.PERCENTILE_DROP_MODERATE) {
        alerts.push({
          type: 'weight_drop',
          severity: 'moderate',
          title: 'Queda de peso',
          description: `O percentil de peso caiu de ${previous.weight.percentile} para ${current.weight.percentile} (${Math.abs(percentileChange)} pontos)`,
          percentileChange,
          suggestedActions: [
            'Avaliar mudanças na alimentação',
            'Verificar infecções recorrentes',
            'Acompanhar na próxima consulta',
          ],
        });
      }
      
      // Weight excess
      if (percentileChange >= THRESHOLDS.PERCENTILE_GAIN_EXCESS) {
        alerts.push({
          type: 'weight_excess',
          severity: 'moderate',
          title: 'Ganho excessivo de peso',
          description: `O percentil de peso subiu de ${previous.weight.percentile} para ${current.weight.percentile} (+${percentileChange} pontos)`,
          percentileChange,
          suggestedActions: [
            'Avaliar hábitos alimentares',
            'Verificar atividade física',
            'Orientar sobre alimentação saudável',
          ],
        });
      }
    }
    
    // Height stagnation
    if (current.height && previous.height) {
      const monthsBetween = calculateAgeInMonths(previousWithData.date, currentMeasurement.date);
      
      if (
        monthsBetween >= THRESHOLDS.HEIGHT_STAGNATION_MONTHS &&
        currentMeasurement.height_cm === previousWithData.height_cm
      ) {
        alerts.push({
          type: 'height_stagnation',
          severity: 'moderate',
          title: 'Estagnação de crescimento',
          description: `A altura não apresentou crescimento nos últimos ${monthsBetween} meses`,
          suggestedActions: [
            'Avaliar velocidade de crescimento',
            'Considerar avaliação endocrinológica',
            'Investigar deficiências nutricionais',
          ],
        });
      }
    }
  }
  
  // Head circumference alerts (regardless of previous)
  if (current.headCircumference) {
    if (current.headCircumference.percentile <= THRESHOLDS.HC_LOW_PERCENTILE) {
      alerts.push({
        type: 'head_circ_abnormal',
        severity: 'high',
        title: 'Perímetro cefálico abaixo do esperado',
        description: `O perímetro cefálico está no percentil ${current.headCircumference.percentile} (< P3)`,
        suggestedActions: [
          'Avaliar desenvolvimento neurológico',
          'Considerar encaminhamento para neuropediatria',
          'Verificar histórico familiar',
        ],
      });
    } else if (current.headCircumference.percentile >= THRESHOLDS.HC_HIGH_PERCENTILE) {
      alerts.push({
        type: 'head_circ_abnormal',
        severity: 'high',
        title: 'Perímetro cefálico acima do esperado',
        description: `O perímetro cefálico está no percentil ${current.headCircumference.percentile} (> P97)`,
        suggestedActions: [
          'Avaliar sinais de hipertensão intracraniana',
          'Considerar ultrassom transfontanela',
          'Encaminhar para avaliação especializada',
        ],
      });
    }
  }
  
  // Weight/Height disproportion
  if (current.weight && current.height) {
    const difference = Math.abs(current.weight.percentile - current.height.percentile);
    if (difference > 30) {
      alerts.push({
        type: 'weight_height_disprop',
        severity: 'moderate',
        title: 'Desproporção peso/altura',
        description: `Peso no P${current.weight.percentile} e altura no P${current.height.percentile} (diferença de ${difference} pontos)`,
        suggestedActions: [
          'Calcular IMC para idade',
          'Avaliar padrão de crescimento',
          'Orientar sobre nutrição adequada',
        ],
      });
    }
  }
  
  return {
    current,
    previous,
    alerts,
  };
}

/**
 * Generate AI insights prompt for growth analysis
 */
export function generateInsightsPrompt(
  patientName: string,
  ageMonths: number,
  analysis: GrowthAnalysis,
  medicalHistory?: string
): string {
  const ageYears = Math.floor(ageMonths / 12);
  const remainingMonths = ageMonths % 12;
  const ageText = ageYears > 0 
    ? `${ageYears} ano${ageYears > 1 ? 's' : ''} e ${remainingMonths} meses`
    : `${ageMonths} meses`;

  let prompt = `Analise os dados de crescimento do paciente pediátrico:

**Paciente:** ${patientName}, ${ageText}

**Medições Atuais:**
`;

  if (analysis.current.weight) {
    prompt += `- Peso: Percentil ${analysis.current.weight.percentile} (Z-score: ${analysis.current.weight.zScore})\n`;
  }
  if (analysis.current.height) {
    prompt += `- Altura: Percentil ${analysis.current.height.percentile} (Z-score: ${analysis.current.height.zScore})\n`;
  }
  if (analysis.current.headCircumference) {
    prompt += `- P. Cefálico: Percentil ${analysis.current.headCircumference.percentile}\n`;
  }

  if (analysis.previous) {
    prompt += `\n**Medições Anteriores (${analysis.previous.date.toLocaleDateString('pt-BR')}):**\n`;
    if (analysis.previous.weight) {
      prompt += `- Peso: Percentil ${analysis.previous.weight.percentile}\n`;
    }
    if (analysis.previous.height) {
      prompt += `- Altura: Percentil ${analysis.previous.height.percentile}\n`;
    }
  }

  if (analysis.alerts.length > 0) {
    prompt += `\n**Alertas Detectados:**\n`;
    analysis.alerts.forEach(alert => {
      prompt += `- ${alert.title}: ${alert.description}\n`;
    });
  }

  if (medicalHistory) {
    prompt += `\n**Histórico Médico:**\n${medicalHistory}\n`;
  }

  prompt += `
Baseado nesses dados, forneça:
1. Uma análise resumida do padrão de crescimento
2. Possíveis causas a investigar (se houver alertas)
3. Perguntas sugeridas para fazer aos pais
4. Recomendações de acompanhamento

Seja objetivo e focado na prática clínica pediátrica.`;

  return prompt;
}
