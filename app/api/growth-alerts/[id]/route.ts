import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * PATCH: Atualizar status de um alerta
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: alertId } = await params;
    const body = await request.json();
    const { status, resolution_note } = body;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Preparar dados de atualização
    const updateData: any = { status };

    if (status === "seen") {
      updateData.seen_at = new Date().toISOString();
    } else if (status === "dismissed") {
      updateData.dismissed_at = new Date().toISOString();
    } else if (status === "resolved") {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = user.id;
      updateData.resolution_note = resolution_note || null;
    }

    const { data, error } = await supabase
      .from("growth_alerts")
      .update(updateData)
      .eq("id", alertId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ alert: data });
  } catch (error: any) {
    console.error("Erro ao atualizar alerta:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar alerta: " + error.message },
      { status: 500 }
    );
  }
}
