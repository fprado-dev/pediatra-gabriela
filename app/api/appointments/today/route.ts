import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { format } from "date-fns";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const today = format(new Date(), "yyyy-MM-dd");

    const { data: appointments, error } = await supabase
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
      .eq("appointment_date", today)
      .order("appointment_time", { ascending: true });

    if (error) {
      console.error("Error fetching today's appointments:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Estatísticas
    const total = appointments?.length || 0;
    const pending = appointments?.filter((a) => a.status === "pending").length || 0;
    const confirmed = appointments?.filter((a) => a.status === "confirmed").length || 0;
    const completed = appointments?.filter((a) => a.status === "completed").length || 0;
    const cancelled = appointments?.filter((a) => a.status === "cancelled").length || 0;

    // Próximo agendamento
    const now = new Date();
    const currentTime = format(now, "HH:mm");
    const nextAppointment = appointments?.find(
      (a) => a.appointment_time >= currentTime && a.status !== "cancelled"
    );

    return NextResponse.json({
      appointments: appointments || [],
      stats: {
        total,
        pending,
        confirmed,
        completed,
        cancelled,
      },
      next: nextAppointment || null,
    });
  } catch (error) {
    console.error("Error in GET /api/appointments/today:", error);
    return NextResponse.json(
      { error: "Erro ao buscar agendamentos" },
      { status: 500 }
    );
  }
}
