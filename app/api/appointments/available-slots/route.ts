import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  generateTimeSlots,
  findAvailableSlots,
} from "@/lib/utils/appointment-helpers";
import {
  AppointmentWithPatient,
  DoctorSchedule,
  ScheduleBlock,
} from "@/lib/types/appointment";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date");
  const count = parseInt(searchParams.get("count") || "5");

  if (!date) {
    return NextResponse.json(
      { error: "Parâmetro 'date' é obrigatório" },
      { status: 400 }
    );
  }

  try {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Buscar schedule do médico
    const { data: scheduleData } = await supabase
      .from("doctor_schedule")
      .select("*")
      .eq("doctor_id", user.id)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true)
      .single();

    // Buscar agendamentos existentes
    const { data: appointments } = await supabase
      .from("appointments")
      .select(
        `
        *,
        patient:patients(id, full_name, date_of_birth, phone, email)
      `
      )
      .eq("doctor_id", user.id)
      .gte("appointment_date", date)
      .neq("status", "cancelled");

    // Buscar bloqueios
    const { data: blocks } = await supabase
      .from("schedule_blocks")
      .select("*")
      .eq("doctor_id", user.id)
      .lte("start_datetime", `${date}T23:59:59`)
      .gte("end_datetime", `${date}T00:00:00`);

    // Gerar slots para o dia específico
    const daySlots = generateTimeSlots(
      targetDate,
      scheduleData as DoctorSchedule | undefined,
      ((appointments || []) as AppointmentWithPatient[]).filter(
        (apt) => apt.appointment_date === date
      ),
      (blocks || []) as ScheduleBlock[]
    );

    // Encontrar próximos slots disponíveis
    const suggestedSlots = findAvailableSlots(
      targetDate,
      count,
      (appointments || []) as AppointmentWithPatient[],
      scheduleData as DoctorSchedule | undefined,
      (blocks || []) as ScheduleBlock[]
    );

    return NextResponse.json({
      date,
      slots: daySlots,
      suggested_slots: suggestedSlots,
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: "Erro ao buscar horários disponíveis" },
      { status: 500 }
    );
  }
}
