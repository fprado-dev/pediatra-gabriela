import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "../auth/get-current-user";
import { startOfMonth, subMonths, endOfMonth } from "date-fns";

interface StatusData {
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

interface TimeData {
  completedCountData: {
    completedCount: number;
    minutesSaved: number;
  };
}

export interface EfficiencyData {
  statusData: StatusData;
  timeData: TimeData;
}

// Tempo médio economizado por consulta (em minutos)
const MINUTES_SAVED_PER_APPOINTMENT = 15;

export async function getAppointmentsByStatus(): Promise<EfficiencyData> {
  const user = await getCurrentUser();
  const supabase = await createClient();

  if (!user) {
    throw new Error("User not found");
  }



  // Buscar todas as consultas (todos os status)
  const { data: allAppointments, error: allError } = await supabase
    .from("appointments")
    .select("id, status, appointment_date")
    .eq("doctor_id", user.id);

  if (allError) {
    throw new Error(`Error fetching appointments: ${allError.message}`);
  }

  // Agrupar por status
  const statusData: StatusData = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0
  };

  if (allAppointments) {
    allAppointments.forEach(appointment => {
      const status = appointment.status as keyof StatusData;
      if (status in statusData) {
        statusData[status]++;
      }
    });
  }



  // Calcular tempo economizado (apenas consultas completadas)
  const completedCount = statusData.completed || 0;

  const timeData: TimeData = {
    completedCountData: {
      completedCount: completedCount,
      minutesSaved: completedCount * MINUTES_SAVED_PER_APPOINTMENT
    },

  };

  return {
    statusData,
    timeData
  };
}