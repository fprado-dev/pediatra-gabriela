import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeGrowth, generateInsightsPrompt, Sex, Measurement } from "@/lib/growth";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

// GET - Analyze patient growth and return alerts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Fetch patient data
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id, full_name, date_of_birth, weight_kg, height_cm, medical_history")
      .eq("id", patientId)
      .eq("doctor_id", user.id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    // Fetch consultations with measurements
    const { data: consultations } = await supabase
      .from("consultations")
      .select("id, consultation_date, weight_kg, height_cm, head_circumference_cm")
      .eq("patient_id", patientId)
      .eq("status", "completed")
      .order("consultation_date", { ascending: false })
      .limit(10);

    // Prepare measurements for analysis
    const measurements: Measurement[] = (consultations || [])
      .filter((c) => c.weight_kg || c.height_cm)
      .map((c) => ({
        date: new Date(c.consultation_date),
        weight_kg: c.weight_kg,
        height_cm: c.height_cm,
        head_circumference_cm: c.head_circumference_cm,
      }));

    // If no consultation measurements, use patient profile
    if (measurements.length === 0 && (patient.weight_kg || patient.height_cm)) {
      measurements.push({
        date: new Date(),
        weight_kg: patient.weight_kg,
        height_cm: patient.height_cm,
        head_circumference_cm: null,
      });
    }

    if (measurements.length === 0) {
      return NextResponse.json({
        analysis: null,
        message: "Sem dados de crescimento disponíveis",
      });
    }

    // Determine sex (default to female if not specified - can be added to patient profile later)
    // For now, we'll use a simple heuristic or default
    const sex: Sex = "female"; // TODO: Add sex field to patient profile

    const dateOfBirth = new Date(patient.date_of_birth);
    const currentMeasurement = measurements[0];
    const previousMeasurements = measurements.slice(1);

    // Analyze growth
    const analysis = analyzeGrowth(
      dateOfBirth,
      sex,
      currentMeasurement,
      previousMeasurements
    );

    // Prepare measurements for charts
    const chartMeasurements = {
      weight: measurements
        .filter((m) => m.weight_kg)
        .map((m) => {
          const ageInMonths = Math.floor((m.date.getTime() - dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
          return {
            date: m.date.toISOString(),
            value: m.weight_kg!,
            percentile: analysis.current.weight?.percentile || 50,
          };
        }),
      height: measurements
        .filter((m) => m.height_cm)
        .map((m) => ({
          date: m.date.toISOString(),
          value: m.height_cm!,
          percentile: analysis.current.height?.percentile || 50,
        })),
      hc: measurements
        .filter((m) => m.head_circumference_cm)
        .map((m) => ({
          date: m.date.toISOString(),
          value: m.head_circumference_cm!,
          percentile: analysis.current.headCircumference?.percentile || 50,
        })),
    };

    return NextResponse.json({
      analysis,
      measurements: chartMeasurements,
      patient: {
        name: patient.full_name,
        dateOfBirth: patient.date_of_birth,
      },
      measurementsCount: measurements.length,
    });
  } catch (error: any) {
    console.error("Erro ao analisar crescimento:", error);
    return NextResponse.json(
      { error: "Erro ao analisar crescimento" },
      { status: 500 }
    );
  }
}

// POST - Generate AI insights for growth analysis
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { analysis, patientName, ageMonths, medicalHistory } = body;

    if (!analysis) {
      return NextResponse.json(
        { error: "Dados de análise são obrigatórios" },
        { status: 400 }
      );
    }

    // Generate prompt
    const prompt = generateInsightsPrompt(
      patientName,
      ageMonths,
      analysis,
      medicalHistory
    );

    // Call OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é um pediatra experiente analisando dados de crescimento de uma criança. 
Forneça uma análise objetiva, focada na prática clínica. 
Seja direto e evite jargões desnecessários.
Responda em português brasileiro.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const insights = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ insights });
  } catch (error: any) {
    console.error("Erro ao gerar insights:", error);
    return NextResponse.json(
      { error: "Erro ao gerar insights" },
      { status: 500 }
    );
  }
}
