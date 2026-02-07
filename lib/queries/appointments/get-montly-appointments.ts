
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "../auth/get-current-user";
import { formatDate, monthStart } from "@/lib/helpers";
import { MonthlyAppointmentsResponse, MonthlyAppointmentItem } from "./types";


export async function getMonthlyAppointments(): Promise<MonthlyAppointmentsResponse> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("User not found");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(`
      id,
      patient_id,
      appointment_date,
      appointment_time,
      status,
      patient:patients!inner(id, full_name, date_of_birth, phone, email)
    `)
    .eq("doctor_id", user.id)
    .gte("appointment_date", monthStart)
    .order("appointment_date", { ascending: true });

  if (error) {
    console.error("Error fetching monthly appointments:", error);
    throw error;
  }

  // Transforma patient de array para objeto único
  const appointments: MonthlyAppointmentItem[] = (data || []).map(apt => ({
    id: apt.id,
    patient_id: apt.patient_id,
    appointment_date: formatDate(apt.appointment_date),
    appointment_time: apt.appointment_time,
    status: apt.status,
    patient: Array.isArray(apt.patient) ? apt.patient[0] : apt.patient
  }));

  return {
    totalMonthlyAppointments: appointments.length,
    appointments
  };
}