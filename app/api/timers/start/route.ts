import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { StartTimerRequest, TimerWithPatient } from "@/lib/types/timer";

export const dynamic = 'force-dynamic';

// POST /api/timers/start
// Inicia um novo timer
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body: StartTimerRequest = await request.json();
    const { patient_id, appointment_id, started_from } = body;

    if (!patient_id) {
      return NextResponse.json(
        { error: "patient_id é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se já existe timer ativo
    const { data: existingTimer } = await supabase
      .from("consultation_timers")
      .select("id, patient_id, patient:patients(full_name)")
      .eq("doctor_id", user.id)
      .in("status", ["active", "paused"])
      .single();

    if (existingTimer) {
      return NextResponse.json(
        {
          error: "Já existe uma consulta em andamento",
          existing_timer: existingTimer,
        },
        { status: 409 }
      );
    }

    // Criar novo timer
    const { data: newTimer, error: createError } = await supabase
      .from("consultation_timers")
      .insert({
        doctor_id: user.id,
        patient_id,
        appointment_id: appointment_id || null,
        started_from: started_from || "manual",
        status: "active",
      })
      .select(`
        *,
        patient:patients (
          id,
          full_name,
          date_of_birth,
          phone
        )
      `)
      .single();

    if (createError) throw createError;

    // Se veio de um agendamento, atualizar status
    if (appointment_id) {
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ status: "in_progress" })
        .eq("id", appointment_id)
        .eq("doctor_id", user.id);

      if (updateError) {
        console.error("Error updating appointment status:", updateError);
      }
    }

    return NextResponse.json(
      {
        message: "Timer iniciado com sucesso",
        timer: newTimer as TimerWithPatient,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error starting timer:", error);
    return NextResponse.json(
      { error: "Erro ao iniciar timer" },
      { status: 500 }
    );
  }
}
