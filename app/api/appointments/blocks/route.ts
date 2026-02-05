import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { start_datetime, end_datetime, reason } = await request.json();

    if (!start_datetime || !end_datetime) {
      return NextResponse.json(
        { error: "Data/hora de início e término são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar que o término é depois do início
    if (new Date(start_datetime) >= new Date(end_datetime)) {
      return NextResponse.json(
        { error: "Data/hora de término deve ser posterior ao início" },
        { status: 400 }
      );
    }

    // Criar bloqueio
    const { data: block, error } = await supabase
      .from("schedule_blocks")
      .insert({
        doctor_id: user.id,
        start_datetime,
        end_datetime,
        reason: reason || "Horário reservado",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating block:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(block, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/appointments/blocks:", error);
    return NextResponse.json(
      { error: "Erro ao criar bloqueio" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  let query = supabase
    .from("schedule_blocks")
    .select("*")
    .eq("doctor_id", user.id)
    .order("start_datetime", { ascending: true });

  if (startDate && endDate) {
    query = query
      .gte("start_datetime", `${startDate}T00:00:00`)
      .lte("end_datetime", `${endDate}T23:59:59`);
  }

  const { data: blocks, error } = await query;

  if (error) {
    console.error("Error fetching blocks:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(blocks);
}
