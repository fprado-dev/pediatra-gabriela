import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { TimerWithPatient } from "@/lib/types/timer";

export const dynamic = 'force-dynamic';

// GET /api/timers/active
// Retorna o timer ativo do médico (se existir)
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    // Buscar timer ativo ou pausado
    const { data: timer, error } = await supabase
      .from("consultation_timers")
      .select(`
        *,
        patient:patients (
          id,
          full_name,
          date_of_birth,
          phone
        )
      `)
      .eq("doctor_id", user.id)
      .in("status", ["active", "paused"])
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // Não há timer ativo, retornar null
      if (error.code === "PGRST116") {
        return NextResponse.json({ timer: null });
      }
      throw error;
    }

    return NextResponse.json({ timer: timer as TimerWithPatient });
  } catch (error) {
    console.error("Error fetching active timer:", error);
    return NextResponse.json(
      { error: "Erro ao buscar timer ativo" },
      { status: 500 }
    );
  }
}
