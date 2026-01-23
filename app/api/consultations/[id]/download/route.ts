/**
 * API Route para download de consulta em PDF
 * GET /api/consultations/[id]/download
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import PDFDocument from "pdfkit";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // PDFKit precisa do Node.js runtime

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("📄 Iniciando geração de PDF...");
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

    // Criar PDF
    console.log("📄 Criando documento PDF...");
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `Consulta - ${patient?.full_name || "Paciente"}`,
        Author: profile?.full_name || "Médico",
        Subject: "Prontuário Médico Pediátrico",
        CreationDate: new Date(),
      },
    });
    console.log("✅ PDFDocument criado com sucesso");

    // Buffer para armazenar o PDF
    const chunks: Uint8Array[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    // Criar o PDF
    await new Promise<void>((resolve, reject) => {
      doc.on("end", () => resolve());
      doc.on("error", reject);

      // === CABEÇALHO ===
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("PRONTUÁRIO MÉDICO PEDIÁTRICO", { align: "center" })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(
          `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
          { align: "center" }
        )
        .moveDown(1.5);

      // Linha separadora
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke()
        .moveDown(1);

      // === DADOS DO MÉDICO ===
      doc.fontSize(12).font("Helvetica-Bold").text("DADOS DO MÉDICO");
      doc.moveDown(0.3);
      
      doc.fontSize(10).font("Helvetica");
      if (profile?.full_name) doc.text(`Nome: ${profile.full_name}`);
      if (profile?.crm) doc.text(`CRM: ${profile.crm}`);
      if (profile?.specialty) doc.text(`Especialidade: ${profile.specialty}`);
      doc.moveDown(1);

      // === DADOS DO PACIENTE ===
      doc.fontSize(12).font("Helvetica-Bold").text("DADOS DO PACIENTE");
      doc.moveDown(0.3);

      doc.fontSize(10).font("Helvetica");
      if (patient?.full_name) doc.text(`Nome: ${patient.full_name}`);
      if (patient?.cpf) doc.text(`CPF: ${patient.cpf}`);
      if (patientAge !== null) doc.text(`Idade: ${patientAge} anos`);
      if (patient?.date_of_birth)
        doc.text(`Data de Nascimento: ${format(new Date(patient.date_of_birth), "dd/MM/yyyy")}`);
      if (patient?.phone) doc.text(`Telefone: ${patient.phone}`);
      if (patient?.email) doc.text(`Email: ${patient.email}`);
      if (patient?.blood_type) doc.text(`Tipo Sanguíneo: ${patient.blood_type}`);
      if (patient?.allergies) {
        doc.font("Helvetica-Bold").text("⚠️  Alergias: ", { continued: true });
        doc.font("Helvetica").text(patient.allergies);
      }
      doc.moveDown(1);

      // === DATA DA CONSULTA ===
      doc.fontSize(12).font("Helvetica-Bold").text("DATA DA CONSULTA");
      doc.moveDown(0.3);
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(
          format(
            new Date(consultation.created_at),
            "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
            { locale: ptBR }
          )
        );
      doc.moveDown(1.5);

      // Linha separadora
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke()
        .moveDown(1);

      // Função auxiliar para adicionar seção
      const addSection = (title: string, content: string | null, options: { bold?: boolean } = {}) => {
        if (!content) return;

        // Verificar se precisa de nova página
        if (doc.y > 700) {
          doc.addPage();
        }

        doc.fontSize(12).font("Helvetica-Bold").text(title.toUpperCase());
        doc.moveDown(0.3);
        
        if (options.bold) {
          doc.fontSize(10).font("Helvetica-Bold").text(content, { align: "left" });
        } else {
          doc.fontSize(10).font("Helvetica").text(content, { align: "left" });
        }
        doc.moveDown(1);
      };

      // === CONTEÚDO CLÍNICO ===
      addSection("Queixa Principal", consultation.chief_complaint);
      addSection("História / Anamnese", consultation.history);
      addSection("Exame Físico", consultation.physical_exam);
      addSection("Diagnóstico", consultation.diagnosis, { bold: true });
      
      // Prescrição com destaque
      if (consultation.prescription) {
        if (doc.y > 700) doc.addPage();
        
        doc.fontSize(12).font("Helvetica-Bold").text("PRESCRIÇÃO MÉDICA");
        doc.moveDown(0.3);
        
        // Box para prescrição
        const prescriptionY = doc.y;
        doc.fontSize(10).font("Courier").text(consultation.prescription, {
          align: "left",
        });
        doc.moveDown(1);
      }
      
      addSection("Plano Terapêutico", consultation.plan);

      // === MEDIDAS ANTROPOMÉTRICAS ===
      if (
        consultation.weight_kg ||
        consultation.height_cm ||
        consultation.head_circumference_cm
      ) {
        if (doc.y > 700) doc.addPage();
        
        doc.fontSize(12).font("Helvetica-Bold").text("MEDIDAS ANTROPOMÉTRICAS");
        doc.moveDown(0.3);
        doc.fontSize(10).font("Helvetica");
        
        if (consultation.weight_kg) doc.text(`Peso: ${consultation.weight_kg} kg`);
        if (consultation.height_cm) doc.text(`Altura: ${consultation.height_cm} cm`);
        if (consultation.head_circumference_cm)
          doc.text(`Perímetro Cefálico: ${consultation.head_circumference_cm} cm`);
        doc.moveDown(1);
      }

      addSection("Desenvolvimento", consultation.development_notes);
      addSection("Observações Adicionais", consultation.notes);

      // === HISTÓRICO MÉDICO ===
      if (patient?.medical_history) {
        if (doc.y > 700) doc.addPage();
        
        doc.fontSize(12).font("Helvetica-Bold").text("HISTÓRICO MÉDICO DO PACIENTE");
        doc.moveDown(0.3);
        doc.fontSize(10).font("Helvetica").text(patient.medical_history);
        doc.moveDown(1);
      }

      // === RODAPÉ ===
      const bottomY = 750;
      doc
        .moveTo(50, bottomY)
        .lineTo(545, bottomY)
        .stroke();

      doc
        .fontSize(8)
        .font("Helvetica")
        .text(
          "Este documento foi gerado digitalmente e contém informações confidenciais protegidas por sigilo médico.",
          50,
          bottomY + 10,
          { align: "center", width: 495 }
        );

      // Finalizar PDF
      doc.end();
    });

    // Combinar chunks em Buffer
    console.log(`📦 PDF gerado: ${chunks.length} chunks, total: ${chunks.reduce((acc, c) => acc + c.length, 0)} bytes`);
    const pdfBuffer = Buffer.concat(chunks);
    console.log(`✅ Buffer final: ${pdfBuffer.length} bytes`);

    // Nome do arquivo
    const fileName = `Consulta_${patient?.full_name?.replace(/\s+/g, "_")}_${format(
      new Date(consultation.created_at),
      "yyyyMMdd"
    )}.pdf`;

    // Retornar PDF
    console.log(`📥 Enviando PDF: ${fileName}`);
    return new NextResponse(pdfBuffer, {
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
