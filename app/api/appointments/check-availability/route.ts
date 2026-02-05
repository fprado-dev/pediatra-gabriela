import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { AppointmentWithPatient, DoctorSchedule, ScheduleBlock } from "@/lib/types/appointment";
import { validateAppointmentTime } from "@/lib/utils/appointment-helpers";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { date, time, duration, exclude_id } = await request.json();

    if (!date || !time || !duration) {
      return NextResponse.json(
        { error: "Data, horário e duração são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar agendamentos existentes
    let query = supabase
      .from("appointments")
      .select(`
        *,
        patient:patients(id, full_name, date_of_birth, phone, email)
      `)
      .eq("doctor_id", user.id)
      .eq("appointment_date", date)
      .neq("status", "cancelled");

    // Excluir agendamento específico (útil para edição)
    if (exclude_id) {
      query = query.neq("id", exclude_id);
    }

    const { data: existingAppointments } = await query;

    // Buscar schedule do médico
    const dayOfWeek = new Date(date).getDay();
    const { data: scheduleData } = await supabase
      .from("doctor_schedule")
      .select("*")
      .eq("doctor_id", user.id)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true)
      .single();

    // Buscar bloqueios
    const { data: blocks } = await supabase
      .from("schedule_blocks")
      .select("*")
      .eq("doctor_id", user.id)
      .lte("start_datetime", `${date}T23:59:59`)
      .gte("end_datetime", `${date}T00:00:00`);

    // Validar
    const validation = validateAppointmentTime(
      date,
      time,
      "", // patient_id não é necessário para validação básica
      (existingAppointments || []) as AppointmentWithPatient[],
      scheduleData as DoctorSchedule | undefined,
      (blocks || []) as ScheduleBlock[],
      duration
    );

    return NextResponse.json({
      available: validation.valid,
      errors: validation.errors,
    });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { error: "Erro ao verificar disponibilidade" },
      { status: 500 }
    );
  }
}
