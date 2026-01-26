import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { UpdateAppointmentData } from "@/lib/types/appointment";

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
    const updates: UpdateAppointmentData = await request.json();

    // Verificar se o agendamento existe e pertence ao médico
    const { data: existing } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", id)
      .eq("doctor_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Agendamento não encontrado" },
        { status: 404 }
      );
    }

    // Se estiver alterando data/hora, validar novamente
    if (updates.appointment_date || updates.appointment_time) {
      const newDate = updates.appointment_date || existing.appointment_date;
      const newTime = updates.appointment_time || existing.appointment_time;

      // Buscar outros agendamentos (excluindo o atual)
      const { data: existingAppointments } = await supabase
        .from("appointments")
        .select(
          `
          *,
          patient:patients(id, full_name, date_of_birth, phone, email)
        `
        )
        .eq("doctor_id", user.id)
        .eq("appointment_date", newDate)
        .neq("id", id)
        .neq("status", "cancelled");

      // Verificar se novo horário está disponível
      const slotOccupied = existingAppointments?.some(
        (apt) => apt.appointment_time === newTime
      );

      if (slotOccupied) {
        return NextResponse.json(
          { error: "Novo horário já está ocupado" },
          { status: 400 }
        );
      }
    }

    // Atualizar agendamento
    const { data: appointment, error } = await supabase
      .from("appointments")
      .update(updates)
      .eq("id", id)
      .eq("doctor_id", user.id)
      .select(
        `
        *,
        patient:patients(id, full_name, date_of_birth, phone, email)
      `
      )
      .single();

    if (error) {
      console.error("Error updating appointment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error in PATCH /api/appointments/[id]:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar agendamento" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const body = await request.json().catch(() => ({}));
    const cancellationReason = body.cancellation_reason;

    // Soft delete: marcar como cancelado
    const { data: appointment, error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        cancellation_reason: cancellationReason,
      })
      .eq("id", id)
      .eq("doctor_id", user.id)
      .select(
        `
        *,
        patient:patients(id, full_name, date_of_birth, phone, email)
      `
      )
      .single();

    if (error) {
      console.error("Error cancelling appointment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!appointment) {
      return NextResponse.json(
        { error: "Agendamento não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error in DELETE /api/appointments/[id]:", error);
    return NextResponse.json(
      { error: "Erro ao cancelar agendamento" },
      { status: 500 }
    );
  }
}
