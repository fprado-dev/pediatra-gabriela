import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/openai/transcribe";
import { cleanTranscription } from "@/lib/openai/clean-text";
import { extractConsultationFields } from "@/lib/openai/extract-fields";
import { downloadAudio, extractKeyFromUrl } from "@/lib/cloudflare/r2-client";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export const maxDuration = 600; // 10 minutos para processamento de áudios grandes
export const dynamic = 'force-dynamic';

type RetryStep = 'transcription' | 'cleaning' | 'extraction';

/**
 * Endpoint para retry de etapas específicas do processamento
 * POST /api/consultations/[id]/retry
 * Body: { step: 'transcription' | 'cleaning' | 'extraction' }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: consultationId } = await params;
  let tempFilePath = join(tmpdir(), `audio-retry-${Date.now()}.tmp`); // Temporário, será renomeado

  try {
    console.log(`\n=== RETRY DE ETAPA - Consultation ID: ${consultationId} ===`);

    const supabase = await createClient();

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Parse do body
    const { step } = await request.json() as { step: RetryStep };

    if (!step || !['transcription', 'cleaning', 'extraction'].includes(step)) {
      return NextResponse.json(
        { error: "Etapa inválida. Use: transcription, cleaning ou extraction" },
        { status: 400 }
      );
    }

    console.log(`🔄 Retentativa da etapa: ${step}`);

    // Buscar consulta
    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .select("*, patient:patients(full_name, date_of_birth, weight_kg, height_cm, head_circumference_cm, allergies, blood_type, medical_history, current_medications)")
      .eq("id", consultationId)
      .eq("doctor_id", user.id)
      .single();

    if (consultationError || !consultation) {
      return NextResponse.json({ error: "Consulta não encontrada" }, { status: 404 });
    }

    const patient = Array.isArray(consultation.patient)
      ? consultation.patient[0]
      : consultation.patient;

    // Calcular idade do paciente
    let patientAge: number | null = null;
    if (patient?.date_of_birth) {
      const birthDate = new Date(patient.date_of_birth);
      const today = new Date();
      patientAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        patientAge--;
      }
    }

    // Executar retry baseado na etapa
    switch (step) {
      case 'transcription': {
        console.log("\n🎤 Retry: Transcrevendo áudio...");
        await updateProcessingStep(supabase, consultationId, "transcription", "in_progress");

        // Baixar áudio
        if (!consultation.audio_url) {
          throw new Error("URL do áudio não encontrada");
        }

        const audioKey = extractKeyFromUrl(consultation.audio_url);
        const { buffer: audioBuffer, contentType } = await downloadAudio(audioKey);

        // Determinar extensão correta baseada no Content-Type
        function getExtension(ct: string): string {
          if (ct.includes("webm")) return "webm";
          if (ct.includes("mp4") || ct.includes("m4a")) return "mp4";
          if (ct.includes("wav")) return "wav";
          if (ct.includes("ogg")) return "ogg";
          if (ct.includes("aac")) return "aac";
          return "mp3";
        }
        const extension = getExtension(contentType);
        tempFilePath = join(tmpdir(), `audio-retry-${Date.now()}.${extension}`);
        console.log(`📝 Retry - Extensão detectada: .${extension}`);

        await writeFile(tempFilePath, audioBuffer);

        // Transcrever
        const rawTranscription = await transcribeAudio({
          audioPath: tempFilePath,
          language: "pt",
        });

        // Salvar
        await supabase
          .from("consultations")
          .update({
            raw_transcription: rawTranscription,
            status: "processing" // Voltar para processing
          })
          .eq("id", consultationId);

        await updateProcessingStep(supabase, consultationId, "transcription", "completed");

        console.log("✅ Transcrição refeita com sucesso");
        return NextResponse.json({
          success: true,
          message: "Transcrição concluída com sucesso",
          step: "transcription",
          nextStep: "cleaning"
        });
      }

      case 'cleaning': {
        console.log("\n🧹 Retry: Limpando texto...");

        if (!consultation.raw_transcription) {
          return NextResponse.json({
            error: "Transcrição não encontrada. Execute primeiro o retry de 'transcription'"
          }, { status: 400 });
        }

        await updateProcessingStep(supabase, consultationId, "cleaning", "in_progress");

        const cleanedText = await cleanTranscription(consultation.raw_transcription, {
          patientName: patient?.full_name,
          patientAge,
        });

        await supabase
          .from("consultations")
          .update({
            cleaned_transcription: cleanedText,
            status: "processing"
          })
          .eq("id", consultationId);

        await updateProcessingStep(supabase, consultationId, "cleaning", "completed");

        console.log("✅ Limpeza refeita com sucesso");
        return NextResponse.json({
          success: true,
          message: "Limpeza de texto concluída com sucesso",
          step: "cleaning",
          nextStep: "extraction"
        });
      }

      case 'extraction': {
        console.log("\n🤖 Retry: Extraindo campos estruturados...");

        if (!consultation.cleaned_transcription) {
          return NextResponse.json({
            error: "Texto limpo não encontrado. Execute primeiro o retry de 'cleaning'"
          }, { status: 400 });
        }

        await updateProcessingStep(supabase, consultationId, "extraction", "in_progress");

        const extractedFields = await extractConsultationFields(
          consultation.cleaned_transcription,
          {
            patientName: patient?.full_name,
            patientAge,
            weight: patient?.weight_kg,
            height: patient?.height_cm,
            headCircumference: patient?.head_circumference_cm,
            allergies: patient?.allergies,
            bloodType: patient?.blood_type,
            medicalHistory: patient?.medical_history,
            currentMedications: patient?.current_medications,
          }
        );

        // Salvar campos extraídos
        await supabase
          .from("consultations")
          .update({
            chief_complaint: extractedFields.chief_complaint,
            history: extractedFields.history,
            physical_exam: extractedFields.physical_exam,
            diagnosis: extractedFields.diagnosis,
            plan: extractedFields.plan,
            notes: extractedFields.notes,
            weight_kg: extractedFields.weight_kg,
            height_cm: extractedFields.height_cm,
            head_circumference_cm: extractedFields.head_circumference_cm,
            development_notes: extractedFields.development_notes,
            prenatal_perinatal_history: extractedFields.prenatal_perinatal_history,
            original_ai_version: extractedFields,
            status: "completed",
            processing_completed_at: new Date().toISOString(),
          })
          .eq("id", consultationId);

        await updateProcessingStep(supabase, consultationId, "extraction", "completed");

        console.log("✅ Extração refeita com sucesso");
        return NextResponse.json({
          success: true,
          message: "Extração concluída com sucesso. Consulta processada!",
          step: "extraction",
          nextStep: null,
          extractedFields
        });
      }

      default:
        return NextResponse.json({ error: "Etapa não implementada" }, { status: 400 });
    }

  } catch (error: any) {
    console.error(`❌ Erro no retry:`, error);

    // Salvar erro no banco
    try {
      const supabase = await createClient();
      await supabase
        .from("consultations")
        .update({
          status: "error",
          processing_error: error.message,
        })
        .eq("id", consultationId);
    } catch (dbError) {
      console.error("❌ Erro ao salvar erro no banco:", dbError);
    }

    return NextResponse.json(
      {
        error: error.message || "Erro no retry",
        step: request.body ? JSON.parse(await request.text()).step : null
      },
      { status: 500 }
    );
  } finally {
    // Limpar arquivo temporário
    try {
      await unlink(tempFilePath);
    } catch { }
  }
}

// Função auxiliar para atualizar steps de processamento
async function updateProcessingStep(
  supabase: any,
  consultationId: string,
  step: string,
  status: "in_progress" | "completed" | "error"
) {
  const { data: current } = await supabase
    .from("consultations")
    .select("processing_steps")
    .eq("id", consultationId)
    .single();

  const steps = current?.processing_steps || [];
  const existingStepIndex = steps.findIndex((s: any) => s.step === step);

  if (existingStepIndex >= 0) {
    steps[existingStepIndex] = {
      step,
      status,
      timestamp: new Date().toISOString(),
    };
  } else {
    steps.push({
      step,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  await supabase
    .from("consultations")
    .update({ processing_steps: steps })
    .eq("id", consultationId);
}
