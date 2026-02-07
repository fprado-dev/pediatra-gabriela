import { format, startOfMonth, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// Usa Date diretamente, sem conversão para ISO (evita problemas de timezone)
export const today = new Date();
export const todayStr = format(today, "dd/MM/yyyy");

// Formata para yyyy-MM-dd sem conversão de timezone (para queries no banco)
export const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
export const previousMonthStart = format(startOfMonth(subDays(startOfMonth(today), 1)), "yyyy-MM-dd");
export const previousMonthEnd = format(subDays(startOfMonth(today), 1), "yyyy-MM-dd");

/**
 * Formata uma data para exibição no formato brasileiro (dd/MM/yyyy)
 * Usa parseISO para strings ISO como "2026-02-09" (evita problemas de timezone)
 */
export const formatDate = (date: string | Date) => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, "dd/MM/yyyy", { locale: ptBR });
};