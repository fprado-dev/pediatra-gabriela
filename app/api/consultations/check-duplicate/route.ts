import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { isValidSHA256Hash } from "@/lib/utils/calculate-audio-hash";

export const dynamic = 'force-dynamic';

/**
 * GET /api/consultations/check-duplicate
 * 
 * Verifica se já existe uma consulta processada com o mesmo hash de áudio
 * para o médico autenticado.
 * 
 * Query Parameters:
 *   - hash (required): SHA-256 hash do arquivo de áudio
 *   - patientId (optional): ID do paciente para contexto adicional
 * 
 * Response:
 *   - duplicate: boolean - Se encontrou duplicata
 *   - existingConsultation?: Informações da consulta existente
 *   - isSamePatient?: boolean - Se o patientId é o mesmo da consulta existente
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Obter parâmetros da query
    const searchParams = request.nextUrl.searchParams;
    const hash = searchParams.get("hash");
    const patientId = searchParams.get("patientId");

    // Validar hash
    if (!hash) {
      return NextResponse.json(
        { error: "Hash não fornecido" },
        { status: 400 }
      );
    }

    if (!isValidSHA256Hash(hash)) {
      return NextResponse.json(
        { error: "Hash inválido (deve ser SHA-256 em hex)" },
        { status: 400 }
      );
    }

    console.log(`🔍 Verificando duplicata para hash: ${hash.substring(0, 16)}...`);

    // Buscar consulta existente com o mesmo hash do mesmo médico
    // Ordenar por created_at DESC para pegar a mais recente se houver múltiplas
    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .select(`
        id,
        patient_id,
        created_at,
        audio_url,
        status,
        raw_transcription,
        cleaned_transcription,
        patient:patients(full_name)
      `)
      .eq("doctor_id", user.id)
      .eq("audio_hash", hash)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (consultationError) {
      console.error("❌ Erro ao buscar consulta:", consultationError);
      return NextResponse.json(
        { error: "Erro ao verificar duplicatas" },
        { status: 500 }
      );
    }

    // Se não encontrou, retornar que não é duplicata
    if (!consultation) {
      console.log("✅ Nenhuma duplicata encontrada");
      return NextResponse.json({
        duplicate: false,
      });
    }

    // Duplicata encontrada!
    console.log(`♻️ Duplicata encontrada: consulta ${consultation.id}`);

    const isSamePatient = patientId ? consultation.patient_id === patientId : false;

    return NextResponse.json({
      duplicate: true,
      existingConsultation: {
        id: consultation.id,
        patientId: consultation.patient_id,
        patientName: consultation.patient?.full_name || "Paciente",
        createdAt: consultation.created_at,
        audioUrl: consultation.audio_url,
        status: consultation.status,
        hasTranscription: !!consultation.raw_transcription,
      },
      isSamePatient,
    });
  } catch (error: any) {
    console.error("❌ Erro no check-duplicate:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
