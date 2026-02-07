import { createClient } from "@/lib/supabase/server";
import { User } from "@supabase/supabase-js";
import { format } from "date-fns";
import { TodayAppointment } from "./types";
import { getCurrentUser } from "../auth/get-current-user";
import { todayStr } from "@/lib/helpers";

interface TodayAppointmentsResponse {
  todayAppointments: TodayAppointment[];
  totalAppointments: number;
  nextAppointment: TodayAppointment | null;
  nextAppointmentTime: string | null;
}


export async function getTodayAppointments(): Promise<TodayAppointmentsResponse> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("User not found");
  }

  const supabase = await createClient();


  const { data: todayAppointmentsData, error } = await supabase
    .from("appointments")
    .select(`
      id,
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      duration_minutes,
      status,
      appointment_type,
      notes,
      cancellation_reason,
      reminder_sent,
      checked_in_at,
      created_at,
      updated_at,
      patient:patients!inner(id, full_name, date_of_birth, phone, email)
    `)
    .eq("doctor_id", user.id)
    .eq("appointment_date", todayStr)
    .neq("status", "cancelled")
    .order("appointment_time", { ascending: true });

  if (error) {
    console.error("Error fetching today's appointments:", error);
    throw error;
  }

  const todayAppointments = (todayAppointmentsData || []).map(apt => ({
    ...apt,
    patient: Array.isArray(apt.patient) ? apt.patient[0] : apt.patient
  })) as TodayAppointment[];

  // Transforma patient de array para objeto único (Supabase retorna array para relacionamentos)
  return {
    todayAppointments,
    totalAppointments: todayAppointments.length,
    nextAppointment: todayAppointments[0],
    nextAppointmentTime: todayAppointments[0]?.appointment_time || null,
  }
}
