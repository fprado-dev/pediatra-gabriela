import { differenceInYears, differenceInMonths, differenceInDays } from "date-fns";

/**
 * Calcula a idade de forma legível (anos, meses ou dias)
 */
export function calculateAge(dateOfBirth: string): string {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  const years = differenceInYears(today, birthDate);
  if (years > 0) {
    return `${years} ${years === 1 ? "ano" : "anos"}`;
  }

  const months = differenceInMonths(today, birthDate);
  if (months > 0) {
    return `${months} ${months === 1 ? "mês" : "meses"}`;
  }

  const days = differenceInDays(today, birthDate);
  return `${days} ${days === 1 ? "dia" : "dias"}`;
}

/**
 * Calcula idade em meses (útil para crescimento)
 */
export function calculateAgeInMonths(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  return differenceInMonths(today, birthDate);
}

/**
 * Formata data para exibição no padrão brasileiro
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR");
}

/**
 * Formata data e hora para exibição
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("pt-BR");
}
