/**
 * API Route para download de consulta em PDF
 * GET /api/consultations/[id]/download
 * 
 * Responsabilidades:
 * - Autenticar usuário
 * - Buscar dados da consulta e perfil
 * - Gerar PDF (delegado ao consultation-pdf-generator)
 * - Retornar arquivo para download
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateConsultationPDF, generatePDFFileName } from "@/lib/pdf/consultation-pdf-generator";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // === AUTENTICAÇÃO ===
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // === BUSCAR DADOS DA CONSULTA ===
    const { data: consultation, error } = await supabase
      .from("consultations")
      .select(`
        *,
        patient:patients(
          id, 
          full_name, 
          date_of_birth, 
          cpf, 
          phone, 
          email, 
          allergies, 
          blood_type, 
          medical_history,
          responsible_name,
          responsible_cpf,
          address,
          weight_kg,
          height_cm,
          current_medications,
          notes
        )
      `)
      .eq("id", id)
      .eq("doctor_id", user.id)
      .single();

    if (error || !consultation) {
      return NextResponse.json({ error: "Consulta não encontrada" }, { status: 404 });
    }

    // === BUSCAR DADOS DO MÉDICO ===
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, crm, specialty")
      .eq("id", user.id)
      .single();

    // === GERAR PDF ===
    const pdfBuffer = await generateConsultationPDF(consultation as any, profile);

    // === GERAR NOME DO ARQUIVO ===
    const patient = Array.isArray(consultation.patient)
      ? consultation.patient[0]
      : consultation.patient;
    const fileName = generatePDFFileName(
      patient?.full_name || "Paciente",
      consultation.created_at || ""
    );

    console.log(`📥 Enviando PDF: ${fileName}`);

    // === RETORNAR RESPOSTA ===
    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("❌ Erro ao gerar PDF:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao gerar PDF" },
      { status: 500 }
    );
  }
}
