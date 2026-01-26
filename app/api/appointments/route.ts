import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  CreateAppointmentData,
  AppointmentWithPatient,
  DoctorSchedule,
  ScheduleBlock,
} from "@/lib/types/appointment";
import { validateAppointmentTime, findAvailableSlots } from "@/lib/utils/appointment-helpers";

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
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const status = searchParams.get("status");
  const patientId = searchParams.get("patient_id");

  let query = supabase
    .from("appointments")
    .select(
      `
      *,
      patient:patients(
        id,
        full_name,
        date_of_birth,
        phone,
        email
      )
    `
    )
    .eq("doctor_id", user.id)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });

  // Filtros
  if (date) {
    query = query.eq("appointment_date", date);
  }
  if (startDate && endDate) {
    query = query.gte("appointment_date", startDate).lte("appointment_date", endDate);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (patientId) {
    query = query.eq("patient_id", patientId);
  }

  const { data: appointments, error } = await query;

  if (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(appointments);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const data: CreateAppointmentData = await request.json();

    // Buscar agendamentos existentes para validação
    const { data: existingAppointments } = await supabase
      .from("appointments")
      .select(
        `
        *,
        patient:patients(id, full_name, date_of_birth, phone, email)
      `
      )
      .eq("doctor_id", user.id)
      .eq("appointment_date", data.appointment_date)
      .neq("status", "cancelled");

    // Buscar schedule do médico
    const dayOfWeek = new Date(data.appointment_date).getDay();
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
      .lte("start_datetime", `${data.appointment_date}T23:59:59`)
      .gte("end_datetime", `${data.appointment_date}T00:00:00`);

    // Validar horário
    const validation = validateAppointmentTime(
      data.appointment_date,
      data.appointment_time,
      data.patient_id,
      (existingAppointments || []) as AppointmentWithPatient[],
      scheduleData as DoctorSchedule | undefined,
      (blocks || []) as ScheduleBlock[]
    );

    if (!validation.valid) {
      // Sugerir horários alternativos
      const suggestions = findAvailableSlots(
        new Date(data.appointment_date),
        3,
        (existingAppointments || []) as AppointmentWithPatient[],
        scheduleData as DoctorSchedule | undefined,
        (blocks || []) as ScheduleBlock[]
      );

      return NextResponse.json(
        {
          error: "Horário indisponível",
          validation_errors: validation.errors,
          suggested_slots: suggestions,
        },
        { status: 400 }
      );
    }

    // Criar agendamento
    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        ...data,
        doctor_id: user.id,
        duration_minutes: data.duration_minutes || 30,
      })
      .select(
        `
        *,
        patient:patients(id, full_name, date_of_birth, phone, email)
      `
      )
      .single();

    if (error) {
      console.error("Error creating appointment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/appointments:", error);
    return NextResponse.json(
      { error: "Erro ao criar agendamento" },
      { status: 500 }
    );
  }
}
