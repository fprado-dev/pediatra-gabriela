import { createClient } from "@/lib/supabase/server";
import { ConsultationType } from "@/lib/types/consultation";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * POST /api/consultations/reuse
 * 
 * Cria uma nova consulta reaproveitando dados de uma consulta existente.
 * Não faz upload de áudio nem processamento de IA - resultado instantâneo.
 * 
 * Body:
 *   - sourceConsultationId: UUID da consulta original a copiar
 *   - patientId: UUID do paciente para a nova consulta
 *   - timerId?: UUID do timer (opcional, para link)
 * 
 * Response:
 *   - consultationId: UUID da nova consulta criada
 *   - reused: true
 *   - message: string
 */
export async function POST(request: NextRequest) {
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

    // Obter dados do body
    const body = await request.json();
    const { sourceConsultationId, patientId } = body;

    // Validar parâmetros
    if (!sourceConsultationId || !patientId) {
      return NextResponse.json(
        { error: "sourceConsultationId e patientId são obrigatórios" },
        { status: 400 }
      );
    }

    console.log(`♻️ Iniciando reuso da consulta ${sourceConsultationId} para paciente ${patientId}`);

    // 1. Buscar consulta original e validar ownership
    const { data: sourceConsultation, error: sourceError } = await supabase
      .from("consultations")
      .select("*")
      .eq("id", sourceConsultationId)
      .eq("doctor_id", user.id) // Garante que pertence ao médico autenticado
      .single();

    if (sourceError || !sourceConsultation) {
      console.error("❌ Consulta original não encontrada:", sourceError);
      return NextResponse.json(
        { error: "Consulta original não encontrada ou não pertence a você" },
        { status: 404 }
      );
    }

    // 2. Validar que o paciente existe e pertence ao médico
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id, full_name")
      .eq("id", patientId)
      .eq("doctor_id", user.id)
      .single();

    if (patientError || !patient) {
      console.error("❌ Paciente não encontrado:", patientError);
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      );
    }

    console.log(`✅ Consulta original encontrada: ${sourceConsultation.id}`);
    console.log(`✅ Paciente validado: ${patient.full_name}`);

    // 3. Criar nova consulta copiando todos os dados relevantes
    const { data: newConsultation, error: insertError } = await supabase
      .from("consultations")
      .insert({
        consultation_type: sourceConsultation.consultation_type as ConsultationType,
        // IDs e metadata
        doctor_id: user.id,
        patient_id: patientId, // Pode ser diferente do original!

        // Áudio (reutilizar o mesmo arquivo no R2)
        audio_url: sourceConsultation.audio_url,
        audio_hash: sourceConsultation.audio_hash,
        audio_duration_seconds: sourceConsultation.audio_duration_seconds,
        audio_size_bytes: sourceConsultation.audio_size_bytes,
        audio_format: sourceConsultation.audio_format,

        // Transcrições (copiar)
        raw_transcription: sourceConsultation.raw_transcription,
        cleaned_transcription: sourceConsultation.cleaned_transcription,

        // Campos extraídos (copiar - usuário pode editar depois)
        chief_complaint: sourceConsultation.chief_complaint,
        history: sourceConsultation.history,
        physical_exam: sourceConsultation.physical_exam,
        diagnosis: sourceConsultation.diagnosis,
        plan: sourceConsultation.plan,
        notes: sourceConsultation.notes,

        // Dados antropométricos (copiar)
        weight_kg: sourceConsultation.weight_kg,
        height_cm: sourceConsultation.height_cm,
        head_circumference_cm: sourceConsultation.head_circumference_cm,
        development_notes: sourceConsultation.development_notes,

        // Versão original da IA (copiar para referência)
        original_ai_version: sourceConsultation.original_ai_version,

        // Status: já completo (não precisa processar!)
        status: "completed",
        processing_completed_at: new Date().toISOString(),

        // Rastreabilidade
        reused_from_consultation_id: sourceConsultationId,

        // Steps de processamento (indicar que foi reusado)
        processing_steps: [
          {
            step: "reused",
            status: "completed",
            timestamp: new Date().toISOString(),
            message: `Dados reutilizados da consulta ${sourceConsultationId}`,
          },
        ],
      })
      .select()
      .single();

    if (insertError || !newConsultation) {
      console.error("❌ Erro ao criar nova consulta:", insertError);
      return NextResponse.json(
        { error: "Erro ao criar nova consulta" },
        { status: 500 }
      );
    }

    console.log(`✅ Nova consulta criada: ${newConsultation.id}`);

    // 4. Link com timer se fornecido

    console.log(`🎉 Consulta reutilizada com sucesso! ID: ${newConsultation.id}`);

    return NextResponse.json({
      consultationId: newConsultation.id,
      reused: true,
      message: "Consulta criada instantaneamente usando dados existentes",
      savedTime: "~2 minutos",
      savedCost: "~$0.10",
    });
  } catch (error: any) {
    console.error("❌ Erro no reuse:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
