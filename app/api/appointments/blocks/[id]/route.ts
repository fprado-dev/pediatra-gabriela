import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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

    // Verificar se o bloqueio existe e pertence ao médico
    const { data: existing } = await supabase
      .from("schedule_blocks")
      .select("*")
      .eq("id", id)
      .eq("doctor_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Bloqueio não encontrado" },
        { status: 404 }
      );
    }

    // Deletar bloqueio
    const { error } = await supabase
      .from("schedule_blocks")
      .delete()
      .eq("id", id)
      .eq("doctor_id", user.id);

    if (error) {
      console.error("Error deleting block:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/appointments/blocks/[id]:", error);
    return NextResponse.json(
      { error: "Erro ao remover bloqueio" },
      { status: 500 }
    );
  }
}
