import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Medication {
  name: string;
  dosage: string;
  quantity: string;
  instructions: string;
}

interface RequestBody {
  section: "medications" | "orientations" | "alertSigns" | "prevention";
  patient: {
    age?: string;
    weight?: number;
    allergies?: string;
    currentMedications?: string;
  };
  clinical: {
    chiefComplaint?: string;
    diagnosis?: string;
    plan?: string;
  };
  currentMedications?: Medication[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body: RequestBody = await request.json();
    const { section, patient, clinical, currentMedications } = body;

    if (!section) {
      return NextResponse.json(
        { error: "Seção não especificada" },
        { status: 400 }
      );
    }

    // Construir contexto
    const context = buildContext(patient, clinical, currentMedications);

    // Gerar conteúdo baseado na seção
    let result;
    switch (section) {
      case "medications":
        result = await generateMedications(context);
        break;
      case "orientations":
        result = await generateOrientations(context);
        break;
      case "alertSigns":
        result = await generateAlertSigns(context);
        break;
      case "prevention":
        result = await generatePrevention(context);
        break;
      default:
        return NextResponse.json(
          { error: "Seção inválida" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao gerar seção:", error);
    return NextResponse.json(
      { error: "Erro ao gerar conteúdo" },
      { status: 500 }
    );
  }
}

function buildContext(
  patient: RequestBody["patient"],
  clinical: RequestBody["clinical"],
  medications?: Medication[]
): string {
  let context = "CONTEXTO DO PACIENTE:\n";

  if (patient.age) context += `- Idade: ${patient.age}\n`;
  if (patient.weight) context += `- Peso: ${patient.weight}kg\n`;
  if (patient.allergies) context += `- ALERGIAS: ${patient.allergies}\n`;
  if (patient.currentMedications)
    context += `- Medicamentos em uso: ${patient.currentMedications}\n`;

  context += "\nDADOS CLÍNICOS:\n";
  if (clinical.chiefComplaint)
    context += `- Queixa principal: ${clinical.chiefComplaint}\n`;
  if (clinical.diagnosis) context += `- Diagnóstico: ${clinical.diagnosis}\n`;
  if (clinical.plan) context += `- Plano: ${clinical.plan}\n`;

  if (medications && medications.length > 0) {
    context += "\nMEDICAMENTOS JÁ PRESCRITOS:\n";
    medications.forEach((med, i) => {
      context += `${i + 1}. ${med.name}`;
      if (med.dosage) context += ` - ${med.dosage}`;
      if (med.instructions) context += ` (${med.instructions})`;
      context += "\n";
    });
  }

  return context;
}

async function generateMedications(
  context: string
): Promise<{ medications: Medication[] }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `Você é um pediatra experiente gerando prescrições médicas.
        
REGRAS IMPORTANTES:
- SEMPRE verificar alergias antes de prescrever
- Usar doses pediátricas adequadas para idade e peso
- Retornar APENAS JSON válido, sem markdown
- Usar medicamentos comuns e disponíveis no Brasil
- Máximo de 5 medicamentos

Formato de resposta (JSON puro):
{
  "medications": [
    {
      "name": "Nome comercial + concentração",
      "dosage": "Dose por administração",
      "quantity": "Quantidade total",
      "instructions": "Frequência e duração"
    }
  ]
}`,
      },
      {
        role: "user",
        content: `${context}\n\nCom base no diagnóstico e quadro clínico, gere uma prescrição médica apropriada para esta criança.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content || "";

  try {
    // Limpar possíveis marcadores de código
    const cleanContent = content
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();

    const parsed = JSON.parse(cleanContent);
    return { medications: parsed.medications || [] };
  } catch {
    console.error("Erro ao parsear medicamentos:", content);
    return { medications: [] };
  }
}

async function generateOrientations(
  context: string
): Promise<{ content: string }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: `Você é um pediatra experiente gerando orientações para os pais.
        
REGRAS:
- Orientações claras e objetivas
- Linguagem simples, acessível aos pais
- Foco em cuidados práticos em casa
- Incluir orientações sobre alimentação, hidratação e repouso
- Usar formato de lista com bullets (•)
- NÃO usar markdown, apenas texto simples
- Máximo 8 itens`,
      },
      {
        role: "user",
        content: `${context}\n\nGere orientações de cuidados para os pais desta criança.`,
      },
    ],
  });

  return { content: response.choices[0]?.message?.content || "" };
}

async function generateAlertSigns(
  context: string
): Promise<{ content: string }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `Você é um pediatra experiente gerando sinais de alerta para os pais.
        
REGRAS:
- Sinais que indicam piora ou complicação
- Quando procurar atendimento médico URGENTE
- Linguagem clara e objetiva
- Usar formato de lista com bullets (•)
- NÃO usar markdown, apenas texto simples
- Máximo 8 itens
- Começar cada item com "Se..." ou ação direta`,
      },
      {
        role: "user",
        content: `${context}\n\nGere os sinais de alerta para os pais desta criança.`,
      },
    ],
  });

  return { content: response.choices[0]?.message?.content || "" };
}

async function generatePrevention(
  context: string
): Promise<{ content: string }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: `Você é um pediatra experiente gerando orientações preventivas.
        
REGRAS:
- Orientações para prevenir novos episódios
- Medidas de higiene e cuidados gerais
- Linguagem simples e acessível
- Usar formato de lista com bullets (•)
- NÃO usar markdown, apenas texto simples
- Máximo 6 itens`,
      },
      {
        role: "user",
        content: `${context}\n\nGere orientações preventivas para evitar novos episódios.`,
      },
    ],
  });

  return { content: response.choices[0]?.message?.content || "" };
}
