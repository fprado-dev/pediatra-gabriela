/**
 * API Route: Gerar Prescrição Médica com IA
 * POST /api/consultations/generate-prescription
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateValidatedPrescription } from "@/lib/ai/generate-prescription";

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Duas chamadas de IA podem demorar

interface RequestBody {
  patientId: string;
  clinical: {
    chief_complaint?: string;
    history?: string;
    physical_exam?: string;
    diagnosis: string;
    plan?: string;
  };
  measurements: {
    weight_kg?: number;
    height_cm?: number;
    head_circumference_cm?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body: RequestBody = await request.json();
    const { patientId, clinical, measurements } = body;

    // Validação dos campos obrigatórios
    if (!clinical.diagnosis) {
      return NextResponse.json(
        { error: "Diagnóstico é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar dados COMPLETOS do paciente (incluindo peso, altura)
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("full_name, date_of_birth, weight_kg, height_cm, allergies, current_medications, medical_history")
      .eq("id", patientId)
      .eq("doctor_id", user.id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      );
    }

    // Calcular idade
    let age: number | undefined;
    if (patient.date_of_birth) {
      const birthDate = new Date(patient.date_of_birth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Usar peso do formulário OU do cadastro do paciente
    const weight = measurements.weight_kg || patient.weight_kg;
    const height = measurements.height_cm || patient.height_cm;

    // Validação: peso e idade são necessários para dosagens corretas
    if (!weight) {
      return NextResponse.json(
        { error: "Peso do paciente é obrigatório para calcular dosagens. Atualize o cadastro do paciente ou informe o peso na consulta." },
        { status: 400 }
      );
    }

    if (!age) {
      return NextResponse.json(
        { error: "Data de nascimento do paciente é obrigatória" },
        { status: 400 }
      );
    }

    console.log(`🤖 Gerando prescrição para ${patient.full_name} (${age} anos, ${weight}kg)`);
    console.log(`   Peso: ${measurements.weight_kg ? 'formulário' : 'cadastro'}, Altura: ${measurements.height_cm ? 'formulário' : (patient.height_cm ? 'cadastro' : 'n/a')}`);

    // Preparar contexto para IA (usar dados do formulário OU do cadastro)
    const context = {
      patient: {
        age,
        weight_kg: weight,
        height_cm: height,
        head_circumference_cm: measurements.head_circumference_cm,
        allergies: patient.allergies || undefined,
        current_medications: patient.current_medications || undefined,
        medical_history: patient.medical_history || undefined,
      },
      clinical: {
        chief_complaint: clinical.chief_complaint,
        history: clinical.history,
        physical_exam: clinical.physical_exam,
        diagnosis: clinical.diagnosis,
        plan: clinical.plan,
      },
    };

    // Gerar e validar prescrição (dupla passada de IA)
    const prescription = await generateValidatedPrescription(context);

    return NextResponse.json({
      success: true,
      prescription,
      metadata: {
        patient_age: age,
        patient_weight: weight,
        weight_source: measurements.weight_kg ? 'consultation' : 'profile',
        diagnosis: clinical.diagnosis,
      },
    });

  } catch (error: any) {
    console.error("❌ Erro ao gerar prescrição:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao gerar prescrição" },
      { status: 500 }
    );
  }
}
