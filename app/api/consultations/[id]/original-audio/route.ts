/**
 * API Route para obter URL assinada do áudio ORIGINAL (backup)
 * GET /api/consultations/[id]/original-audio
 * Retorna uma URL assinada válida por 1 hora para o áudio original
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSignedUrl, extractKeyFromUrl } from "@/lib/cloudflare/r2-client";

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

    // Buscar consulta para verificar ownership e obter original_audio_url
    const { data: consultation, error } = await supabase
      .from("consultations")
      .select("original_audio_url, doctor_id")
      .eq("id", id)
      .eq("doctor_id", user.id)
      .single();

    if (error || !consultation) {
      return NextResponse.json(
        { error: "Consulta não encontrada" },
        { status: 404 }
      );
    }

    if (!consultation.original_audio_url) {
      return NextResponse.json(
        { error: "Áudio original não disponível para esta consulta" },
        { status: 404 }
      );
    }

    // Extrair o key do áudio original da URL
    let audioKey: string;
    try {
      audioKey = extractKeyFromUrl(consultation.original_audio_url);
    } catch (error: any) {
      console.error("Erro ao extrair key do áudio original:", error);
      return NextResponse.json(
        { error: "URL do áudio original inválida" },
        { status: 500 }
      );
    }

    // Criar URL assinada válida por 1 hora usando Cloudflare R2
    let signedUrl: string;
    try {
      signedUrl = await getSignedUrl(audioKey, 3600); // 1 hora = 3600 segundos
    } catch (error: any) {
      console.error("Erro ao criar URL assinada do áudio original:", error);
      return NextResponse.json(
        { error: "Erro ao gerar URL do áudio original" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: signedUrl,
      expiresIn: 3600,
    });
  } catch (error: any) {
    console.error("❌ Erro ao obter áudio original:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao obter áudio original" },
      { status: 500 }
    );
  }
}
