import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { TimerPause, FinishTimerRequest } from "@/lib/types/timer";

export const dynamic = 'force-dynamic';

// PATCH /api/timers/[id]?action=pause
// PATCH /api/timers/[id]?action=resume
// PATCH /api/timers/[id]?action=finish
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const action = request.nextUrl.searchParams.get("action");

    if (!action || !["pause", "resume", "finish"].includes(action)) {
      return NextResponse.json(
        { error: "action inválida. Use: pause, resume ou finish" },
        { status: 400 }
      );
    }

    // Buscar timer
    const { data: timer, error: fetchError } = await supabase
      .from("consultation_timers")
      .select("*")
      .eq("id", id)
      .eq("doctor_id", user.id)
      .single();

    if (fetchError || !timer) {
      return NextResponse.json({ error: "Timer não encontrado" }, { status: 404 });
    }

    // Executar ação
    switch (action) {
      case "pause":
        return await pauseTimer(supabase, timer);
      case "resume":
        return await resumeTimer(supabase, timer);
      case "finish":
        const body: FinishTimerRequest = await request.json();
        return await finishTimer(supabase, timer, body.notes, user.id);
      default:
        return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error controlling timer:", error);
    return NextResponse.json(
      { error: "Erro ao controlar timer" },
      { status: 500 }
    );
  }
}

// Pausar timer
async function pauseTimer(supabase: any, timer: any) {
  if (timer.status !== "active") {
    return NextResponse.json(
      { error: "Timer deve estar ativo para pausar" },
      { status: 400 }
    );
  }

  const pauses = Array.isArray(timer.pauses) ? timer.pauses : [];
  const newPause: TimerPause = {
    started_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("consultation_timers")
    .update({
      status: "paused",
      pauses: [...pauses, newPause],
    })
    .eq("id", timer.id)
    .select()
    .single();

  if (error) throw error;

  return NextResponse.json({
    message: "Timer pausado",
    timer: data,
  });
}

// Retomar timer
async function resumeTimer(supabase: any, timer: any) {
  if (timer.status !== "paused") {
    return NextResponse.json(
      { error: "Timer deve estar pausado para retomar" },
      { status: 400 }
    );
  }

  const pauses = Array.isArray(timer.pauses) ? timer.pauses : [];
  if (pauses.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma pausa encontrada" },
      { status: 400 }
    );
  }

  // Atualizar última pausa com resumed_at
  const updatedPauses = [...pauses];
  updatedPauses[updatedPauses.length - 1] = {
    ...updatedPauses[updatedPauses.length - 1],
    resumed_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("consultation_timers")
    .update({
      status: "active",
      pauses: updatedPauses,
    })
    .eq("id", timer.id)
    .select()
    .single();

  if (error) throw error;

  return NextResponse.json({
    message: "Timer retomado",
    timer: data,
  });
}

// Finalizar timer
async function finishTimer(
  supabase: any,
  timer: any,
  notes: string | undefined,
  doctorId: string
) {
  if (timer.status === "completed") {
    return NextResponse.json(
      { error: "Timer já foi finalizado" },
      { status: 400 }
    );
  }

  const now = new Date();
  const startedAt = new Date(timer.started_at);
  
  // Se estiver pausado, fechar a última pausa
  let pauses = Array.isArray(timer.pauses) ? timer.pauses : [];
  if (timer.status === "paused" && pauses.length > 0) {
    const lastPause = pauses[pauses.length - 1];
    if (!lastPause.resumed_at) {
      pauses = [...pauses];
      pauses[pauses.length - 1] = {
        ...lastPause,
        resumed_at: now.toISOString(),
      };
    }
  }

  // Calcular durações
  const totalDurationMs = now.getTime() - startedAt.getTime();
  const totalDurationSeconds = Math.floor(totalDurationMs / 1000);

  // Calcular tempo de pausas
  const pauseDurationMs = pauses.reduce((total: number, pause: TimerPause) => {
    const pauseStart = new Date(pause.started_at).getTime();
    const pauseEnd = pause.resumed_at
      ? new Date(pause.resumed_at).getTime()
      : now.getTime();
    return total + (pauseEnd - pauseStart);
  }, 0);

  const activeDurationSeconds = Math.floor((totalDurationMs - pauseDurationMs) / 1000);

  // Atualizar timer
  const { data, error } = await supabase
    .from("consultation_timers")
    .update({
      status: "completed",
      ended_at: now.toISOString(),
      pauses,
      total_duration_seconds: totalDurationSeconds,
      active_duration_seconds: activeDurationSeconds,
      notes: notes || timer.notes,
    })
    .eq("id", timer.id)
    .select()
    .single();

  if (error) throw error;

  // Se veio de agendamento, atualizar status
  if (timer.appointment_id) {
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "completed" })
      .eq("id", timer.appointment_id)
      .eq("doctor_id", doctorId);

    if (updateError) {
      console.error("Error updating appointment status:", updateError);
    }
  }

  return NextResponse.json({
    message: "Timer finalizado",
    timer: data,
    summary: {
      total_duration: totalDurationSeconds,
      active_duration: activeDurationSeconds,
      pause_duration: Math.floor(pauseDurationMs / 1000),
    },
  });
}
