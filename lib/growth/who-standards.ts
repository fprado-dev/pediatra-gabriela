/**
 * WHO Child Growth Standards - Simplified LMS data
 * Based on WHO Multicentre Growth Reference Study
 * 
 * Format: age_months -> { L, M, S } for each measurement
 * L = power in Box-Cox transformation
 * M = median
 * S = coefficient of variation
 */

// Weight-for-age (0-60 months) - Boys
export const WEIGHT_FOR_AGE_BOYS: Record<number, { L: number; M: number; S: number }> = {
  0: { L: 0.3487, M: 3.3464, S: 0.14602 },
  1: { L: 0.2297, M: 4.4709, S: 0.13395 },
  2: { L: 0.197, M: 5.5675, S: 0.12385 },
  3: { L: 0.1738, M: 6.3762, S: 0.11727 },
  6: { L: 0.1631, M: 7.934, S: 0.10949 },
  9: { L: 0.1009, M: 9.0346, S: 0.10596 },
  12: { L: 0.0551, M: 9.8711, S: 0.10508 },
  18: { L: -0.0291, M: 11.0986, S: 0.1054 },
  24: { L: -0.0841, M: 12.1515, S: 0.10665 },
  36: { L: -0.1425, M: 14.3103, S: 0.10882 },
  48: { L: -0.2145, M: 16.3493, S: 0.11269 },
  60: { L: -0.2649, M: 18.3925, S: 0.11604 },
};

// Weight-for-age (0-60 months) - Girls
export const WEIGHT_FOR_AGE_GIRLS: Record<number, { L: number; M: number; S: number }> = {
  0: { L: 0.3809, M: 3.2322, S: 0.14171 },
  1: { L: 0.17, M: 4.1873, S: 0.13724 },
  2: { L: 0.101, M: 5.1282, S: 0.12858 },
  3: { L: 0.0723, M: 5.8458, S: 0.12242 },
  6: { L: 0.0395, M: 7.297, S: 0.11353 },
  9: { L: -0.0202, M: 8.285, S: 0.10983 },
  12: { L: -0.0648, M: 9.0789, S: 0.10857 },
  18: { L: -0.1277, M: 10.4062, S: 0.10873 },
  24: { L: -0.1685, M: 11.5369, S: 0.10995 },
  36: { L: -0.2278, M: 13.8671, S: 0.11243 },
  48: { L: -0.2939, M: 16.0649, S: 0.11614 },
  60: { L: -0.335, M: 18.2655, S: 0.11972 },
};

// Height-for-age (0-60 months) - Boys
export const HEIGHT_FOR_AGE_BOYS: Record<number, { L: number; M: number; S: number }> = {
  0: { L: 1, M: 49.8842, S: 0.03795 },
  1: { L: 1, M: 54.7244, S: 0.03557 },
  2: { L: 1, M: 58.4249, S: 0.03424 },
  3: { L: 1, M: 61.4292, S: 0.03328 },
  6: { L: 1, M: 67.6236, S: 0.03169 },
  9: { L: 1, M: 72.0888, S: 0.03105 },
  12: { L: 1, M: 75.7488, S: 0.03068 },
  18: { L: 1, M: 82.2991, S: 0.03028 },
  24: { L: 1, M: 87.1161, S: 0.03011 },
  36: { L: 1, M: 96.1039, S: 0.03006 },
  48: { L: 1, M: 103.7037, S: 0.03013 },
  60: { L: 1, M: 110.6119, S: 0.03022 },
};

// Height-for-age (0-60 months) - Girls
export const HEIGHT_FOR_AGE_GIRLS: Record<number, { L: number; M: number; S: number }> = {
  0: { L: 1, M: 49.1477, S: 0.0379 },
  1: { L: 1, M: 53.6872, S: 0.0364 },
  2: { L: 1, M: 57.0673, S: 0.03568 },
  3: { L: 1, M: 59.8029, S: 0.03518 },
  6: { L: 1, M: 65.7311, S: 0.03449 },
  9: { L: 1, M: 70.1435, S: 0.03426 },
  12: { L: 1, M: 74.0015, S: 0.03418 },
  18: { L: 1, M: 80.7991, S: 0.03429 },
  24: { L: 1, M: 86.4233, S: 0.03453 },
  36: { L: 1, M: 95.0934, S: 0.03505 },
  48: { L: 1, M: 102.7065, S: 0.03563 },
  60: { L: 1, M: 109.4375, S: 0.03619 },
};

// Head Circumference for age (0-60 months) - Boys
export const HC_FOR_AGE_BOYS: Record<number, { L: number; M: number; S: number }> = {
  0: { L: 1, M: 34.4618, S: 0.03686 },
  1: { L: 1, M: 37.2759, S: 0.03133 },
  2: { L: 1, M: 39.1285, S: 0.02997 },
  3: { L: 1, M: 40.5135, S: 0.02918 },
  6: { L: 1, M: 43.2953, S: 0.02813 },
  9: { L: 1, M: 45.1855, S: 0.02768 },
  12: { L: 1, M: 46.4986, S: 0.02738 },
  18: { L: 1, M: 47.9679, S: 0.02718 },
  24: { L: 1, M: 48.9440, S: 0.02706 },
  36: { L: 1, M: 50.0066, S: 0.02694 },
  48: { L: 1, M: 50.7228, S: 0.02693 },
  60: { L: 1, M: 51.2455, S: 0.02695 },
};

// Head Circumference for age (0-60 months) - Girls
export const HC_FOR_AGE_GIRLS: Record<number, { L: number; M: number; S: number }> = {
  0: { L: 1, M: 33.8787, S: 0.03496 },
  1: { L: 1, M: 36.5463, S: 0.03081 },
  2: { L: 1, M: 38.2521, S: 0.02958 },
  3: { L: 1, M: 39.5328, S: 0.02893 },
  6: { L: 1, M: 42.1175, S: 0.02809 },
  9: { L: 1, M: 43.8096, S: 0.02785 },
  12: { L: 1, M: 44.9955, S: 0.02771 },
  18: { L: 1, M: 46.3118, S: 0.02765 },
  24: { L: 1, M: 47.1886, S: 0.02763 },
  36: { L: 1, M: 48.1131, S: 0.02763 },
  48: { L: 1, M: 48.7379, S: 0.02767 },
  60: { L: 1, M: 49.2046, S: 0.02770 },
};

/**
 * Get LMS values for a given age, interpolating between available data points
 */
function getLMSForAge(
  ageMonths: number,
  data: Record<number, { L: number; M: number; S: number }>
): { L: number; M: number; S: number } {
  const ages = Object.keys(data).map(Number).sort((a, b) => a - b);
  
  // If exact age exists
  if (data[ageMonths]) {
    return data[ageMonths];
  }
  
  // Find surrounding ages for interpolation
  let lowerAge = ages[0];
  let upperAge = ages[ages.length - 1];
  
  for (let i = 0; i < ages.length - 1; i++) {
    if (ages[i] <= ageMonths && ages[i + 1] >= ageMonths) {
      lowerAge = ages[i];
      upperAge = ages[i + 1];
      break;
    }
  }
  
  // Clamp to available range
  if (ageMonths < ages[0]) return data[ages[0]];
  if (ageMonths > ages[ages.length - 1]) return data[ages[ages.length - 1]];
  
  // Linear interpolation
  const lowerData = data[lowerAge];
  const upperData = data[upperAge];
  const fraction = (ageMonths - lowerAge) / (upperAge - lowerAge);
  
  return {
    L: lowerData.L + fraction * (upperData.L - lowerData.L),
    M: lowerData.M + fraction * (upperData.M - lowerData.M),
    S: lowerData.S + fraction * (upperData.S - lowerData.S),
  };
}

/**
 * Calculate Z-score using LMS method
 * Z = ((value/M)^L - 1) / (L * S)  when L ≠ 0
 * Z = ln(value/M) / S              when L = 0
 */
function calculateZScore(value: number, L: number, M: number, S: number): number {
  if (L === 0) {
    return Math.log(value / M) / S;
  }
  return (Math.pow(value / M, L) - 1) / (L * S);
}

/**
 * Convert Z-score to percentile
 */
function zScoreToPercentile(z: number): number {
  // Using approximation of standard normal CDF
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);
  
  const t = 1 / (1 + p * z);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
  
  return Math.round((0.5 * (1 + sign * y)) * 100);
}

export type Sex = 'male' | 'female';
export type MeasurementType = 'weight' | 'height' | 'head_circumference';

export interface PercentileResult {
  percentile: number;
  zScore: number;
  interpretation: 'very_low' | 'low' | 'normal' | 'high' | 'very_high';
}

/**
 * Calculate percentile for a given measurement
 */
export function calculatePercentile(
  value: number,
  ageMonths: number,
  sex: Sex,
  measurementType: MeasurementType
): PercentileResult {
  let data: Record<number, { L: number; M: number; S: number }>;
  
  switch (measurementType) {
    case 'weight':
      data = sex === 'male' ? WEIGHT_FOR_AGE_BOYS : WEIGHT_FOR_AGE_GIRLS;
      break;
    case 'height':
      data = sex === 'male' ? HEIGHT_FOR_AGE_BOYS : HEIGHT_FOR_AGE_GIRLS;
      break;
    case 'head_circumference':
      data = sex === 'male' ? HC_FOR_AGE_BOYS : HC_FOR_AGE_GIRLS;
      break;
  }
  
  const { L, M, S } = getLMSForAge(ageMonths, data);
  const zScore = calculateZScore(value, L, M, S);
  const percentile = zScoreToPercentile(zScore);
  
  let interpretation: PercentileResult['interpretation'];
  if (percentile < 3) interpretation = 'very_low';
  else if (percentile < 15) interpretation = 'low';
  else if (percentile <= 85) interpretation = 'normal';
  else if (percentile <= 97) interpretation = 'high';
  else interpretation = 'very_high';
  
  return {
    percentile: Math.max(1, Math.min(99, percentile)),
    zScore: Math.round(zScore * 100) / 100,
    interpretation,
  };
}

/**
 * Calculate age in months from date of birth
 */
export function calculateAgeInMonths(dateOfBirth: Date, referenceDate: Date = new Date()): number {
  const years = referenceDate.getFullYear() - dateOfBirth.getFullYear();
  const months = referenceDate.getMonth() - dateOfBirth.getMonth();
  const days = referenceDate.getDate() - dateOfBirth.getDate();
  
  let totalMonths = years * 12 + months;
  if (days < 0) totalMonths--;
  
  return Math.max(0, totalMonths);
}
