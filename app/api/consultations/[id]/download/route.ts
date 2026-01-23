/**
 * API Route para download de consulta em PDF
 * GET /api/consultations/[id]/download
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

    // Buscar consulta com dados do paciente
    const { data: consultation, error } = await supabase
      .from("consultations")
      .select(`
        *,
        patient:patients(id, full_name, date_of_birth, cpf, phone, email, allergies, blood_type, medical_history)
      `)
      .eq("id", id)
      .eq("doctor_id", user.id)
      .single();

    if (error || !consultation) {
      return NextResponse.json(
        { error: "Consulta não encontrada" },
        { status: 404 }
      );
    }

    // Buscar dados do médico
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, crm, specialty")
      .eq("id", user.id)
      .single();

    const patient = consultation.patient as any;

    // Calcular idade
    let patientAge = null;
    if (patient?.date_of_birth) {
      const birthDate = new Date(patient.date_of_birth);
      const today = new Date();
      patientAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        patientAge--;
      }
    }

    // Gerar texto formatado para "impressão"
    const consultationDate = format(
      new Date(consultation.created_at),
      "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
      { locale: ptBR }
    );

    let textContent = `
═══════════════════════════════════════════════════════════════
                    PRONTUÁRIO MÉDICO PEDIÁTRICO
═══════════════════════════════════════════════════════════════

DADOS DO MÉDICO
${profile?.full_name || ""}
CRM: ${profile?.crm || ""}
Especialidade: ${profile?.specialty || "Pediatria"}

DADOS DO PACIENTE
Nome: ${patient?.full_name || ""}
${patient?.cpf ? `CPF: ${patient.cpf}` : ""}
${patientAge !== null ? `Idade: ${patientAge} anos` : ""}
${patient?.date_of_birth ? `Data de Nascimento: ${format(new Date(patient.date_of_birth), "dd/MM/yyyy")}` : ""}
${patient?.phone ? `Telefone: ${patient.phone}` : ""}
${patient?.email ? `Email: ${patient.email}` : ""}
${patient?.blood_type ? `Tipo Sanguíneo: ${patient.blood_type}` : ""}
${patient?.allergies ? `⚠️  Alergias: ${patient.allergies}` : ""}

DATA DA CONSULTA
${consultationDate}

───────────────────────────────────────────────────────────────

`;

    if (consultation.chief_complaint) {
      textContent += `QUEIXA PRINCIPAL
${consultation.chief_complaint}

`;
    }

    if (consultation.history) {
      textContent += `HISTÓRIA / ANAMNESE
${consultation.history}

`;
    }

    if (consultation.physical_exam) {
      textContent += `EXAME FÍSICO
${consultation.physical_exam}

`;
    }

    if (consultation.diagnosis) {
      textContent += `DIAGNÓSTICO
${consultation.diagnosis}

`;
    }

    if (consultation.prescription) {
      textContent += `PRESCRIÇÃO MÉDICA
${consultation.prescription}

`;
    }

    if (consultation.plan) {
      textContent += `PLANO TERAPÊUTICO
${consultation.plan}

`;
    }

    if (
      consultation.weight_kg ||
      consultation.height_cm ||
      consultation.head_circumference_cm
    ) {
      textContent += `MEDIDAS ANTROPOMÉTRICAS\n`;
      if (consultation.weight_kg) textContent += `Peso: ${consultation.weight_kg} kg\n`;
      if (consultation.height_cm) textContent += `Altura: ${consultation.height_cm} cm\n`;
      if (consultation.head_circumference_cm)
        textContent += `Perímetro Cefálico: ${consultation.head_circumference_cm} cm\n`;
      textContent += `\n`;
    }

    if (consultation.development_notes) {
      textContent += `DESENVOLVIMENTO
${consultation.development_notes}

`;
    }

    if (consultation.notes) {
      textContent += `OBSERVAÇÕES ADICIONAIS
${consultation.notes}

`;
    }

    if (patient?.medical_history) {
      textContent += `HISTÓRICO MÉDICO
${patient.medical_history}

`;
    }

    textContent += `───────────────────────────────────────────────────────────────

Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}

═══════════════════════════════════════════════════════════════
`;

    // Retornar como download (TXT por enquanto, pode ser PDF no futuro)
    const fileName = `Consulta_${patient?.full_name?.replace(/\s+/g, "_")}_${format(
      new Date(consultation.created_at),
      "yyyyMMdd"
    )}.txt`;

    return new NextResponse(textContent, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error("❌ Erro ao gerar download:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao gerar download" },
      { status: 500 }
    );
  }
}
