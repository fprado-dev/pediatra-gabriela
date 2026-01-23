/**
 * API Route para obter URL assinada do áudio
 * GET /api/consultations/[id]/audio
 * Retorna uma URL assinada válida por 1 hora
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Buscar consulta para verificar ownership
    const { data: consultation, error } = await supabase
      .from("consultations")
      .select("audio_url, doctor_id")
      .eq("id", id)
      .eq("doctor_id", user.id)
      .single();

    if (error || !consultation) {
      return NextResponse.json(
        { error: "Consulta não encontrada" },
        { status: 404 }
      );
    }

    if (!consultation.audio_url) {
      return NextResponse.json(
        { error: "Áudio não disponível" },
        { status: 404 }
      );
    }

    // Extrair o path do áudio da URL
    const pathMatch = consultation.audio_url.match(/consultation-audios\/(.+)$/);
    if (!pathMatch) {
      return NextResponse.json(
        { error: "URL do áudio inválida" },
        { status: 500 }
      );
    }

    const audioPath = pathMatch[1];

    // Criar URL assinada válida por 1 hora
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("consultation-audios")
      .createSignedUrl(audioPath, 3600); // 1 hora = 3600 segundos

    if (signedUrlError || !signedUrlData) {
      console.error("Erro ao criar URL assinada:", signedUrlError);
      return NextResponse.json(
        { error: "Erro ao gerar URL do áudio" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: signedUrlData.signedUrl,
      expiresIn: 3600,
    });
  } catch (error: any) {
    console.error("❌ Erro ao obter áudio:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao obter áudio" },
      { status: 500 }
    );
  }
}
