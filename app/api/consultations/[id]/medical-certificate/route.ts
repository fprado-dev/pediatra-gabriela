import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  generateMedicalCertificatePDF,
  generateCertificatePDFFileName,
} from "@/lib/pdf/medical-certificate-generator";
import type {
  CertificateType,
  CreateCertificateRequest,
} from "@/lib/types/medical-certificate";

/**
 * POST /api/consultations/[id]/medical-certificate
 * Generate a medical certificate PDF
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: consultationId } = await params;
    const supabase = await createClient();

    // Autenticar usuário
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Parse body
    const body: CreateCertificateRequest = await request.json();
    const { certificateType, certificateData } = body;

    // Validar tipo
    const validTypes: CertificateType[] = [
      "comparecimento",
      "aptidao",
      "afastamento",
      "acompanhante",
    ];
    if (!validTypes.includes(certificateType)) {
      return NextResponse.json(
        { error: "Tipo de atestado inválido" },
        { status: 400 }
      );
    }

    // Buscar consulta e verificar permissão
    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .select(
        `
        id,
        patient_id,
        created_at,
        patient:patients(
          id,
          full_name,
          date_of_birth
        )
      `
      )
      .eq("id", consultationId)
      .single();

    if (consultationError || !consultation) {
      return NextResponse.json(
        { error: "Consulta não encontrada" },
        { status: 404 }
      );
    }

    // Buscar perfil do médico
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, crm, specialty")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil do médico não encontrado" },
        { status: 404 }
      );
    }

    // Extrair dados do paciente
    const patient = Array.isArray(consultation.patient)
      ? consultation.patient[0]
      : consultation.patient;

    // Gerar PDF
    const pdfBuffer = await generateMedicalCertificatePDF(
      certificateType,
      certificateData
    );

    // Salvar registro no banco
    const { data: certificate, error: insertError } = await supabase
      .from("medical_certificates")
      .insert({
        consultation_id: consultationId,
        patient_id: consultation.patient_id,
        doctor_id: user.id,
        certificate_type: certificateType,
        certificate_data: certificateData,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Erro ao salvar atestado:", insertError);
      return NextResponse.json(
        { error: "Erro ao salvar atestado" },
        { status: 500 }
      );
    }

    // Retornar PDF
    const fileName = generateCertificatePDFFileName(
      certificateType,
      patient.full_name
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "X-Certificate-Id": certificate.id,
      },
    });
  } catch (error: any) {
    console.error("Erro ao gerar atestado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/consultations/[id]/medical-certificate
 * List all certificates for a consultation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: consultationId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar atestados da consulta
    const { data: certificates, error } = await supabase
      .from("medical_certificates")
      .select("*")
      .eq("consultation_id", consultationId)
      .order("generated_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar atestados:", error);
      return NextResponse.json(
        { error: "Erro ao buscar atestados" },
        { status: 500 }
      );
    }

    return NextResponse.json(certificates);
  } catch (error: any) {
    console.error("Erro ao listar atestados:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
