import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  generateMedicalCertificatePDF,
  generateCertificatePDFFileName,
} from "@/lib/pdf/medical-certificate-generator";
import { createMedicalCertificate } from "@/lib/supabase/queries";
import type {
  CertificateType,
  CreateCertificateRequest,
} from "@/lib/types/medical-certificate";

/**
 * POST /api/medical-certificates
 * Generate a medical certificate PDF (standalone - with or without consultation)
 */
export async function POST(request: NextRequest) {
  try {
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
    const body: CreateCertificateRequest & {
      patientId: string;
      consultationId?: string | null;
    } = await request.json();
    const { patientId, consultationId, certificateType, certificateData } =
      body;

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

    // Validar patientId
    if (!patientId) {
      return NextResponse.json(
        { error: "ID do paciente é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar dados do paciente
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id, full_name, date_of_birth")
      .eq("id", patientId)
      .eq("doctor_id", user.id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      );
    }

    // Se tem consultationId, validar que pertence ao médico
    if (consultationId) {
      const { data: consultation, error: consultationError } = await supabase
        .from("consultations")
        .select("id, patient_id, doctor_id")
        .eq("id", consultationId)
        .eq("doctor_id", user.id)
        .single();

      if (consultationError || !consultation) {
        return NextResponse.json(
          { error: "Consulta não encontrada" },
          { status: 404 }
        );
      }

      // Verificar se a consulta é do paciente correto
      if (consultation.patient_id !== patientId) {
        return NextResponse.json(
          { error: "Consulta não pertence ao paciente informado" },
          { status: 400 }
        );
      }
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

    // Gerar PDF
    const pdfBuffer = await generateMedicalCertificatePDF(
      certificateType,
      certificateData
    );

    // Salvar registro no banco usando a query function
    const { data: certificate, error: insertError } =
      await createMedicalCertificate(supabase, {
        patientId,
        doctorId: user.id,
        consultationId: consultationId || null,
        certificateType,
        certificateData,
      });

    if (insertError || !certificate) {
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
