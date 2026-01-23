/**
 * API Route para download de consulta em PDF
 * GET /api/consultations/[id]/download
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export const dynamic = 'force-dynamic';

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

    // Criar PDF com pdf-lib
    console.log("📄 Criando documento PDF com pdf-lib...");
    const pdfDoc = await PDFDocument.create();
    
    // Configurar metadados
    pdfDoc.setTitle(`Consulta - ${patient?.full_name || "Paciente"}`);
    pdfDoc.setAuthor(profile?.full_name || "Médico");
    pdfDoc.setSubject("Prontuário Médico Pediátrico");
    pdfDoc.setCreationDate(new Date());

    // Adicionar página A4
    const page = pdfDoc.addPage([595, 842]); // A4 em pontos
    const { width, height } = page.getSize();

    // Carregar fontes
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);

    let yPosition = height - 50; // Começar do topo com margem
    const leftMargin = 50;
    const rightMargin = width - 50;
    const lineHeight = 14;

    // Helper para adicionar texto
    const addText = (text: string, options: {
      font?: any;
      size?: number;
      color?: any;
      bold?: boolean;
      x?: number;
      maxWidth?: number;
    } = {}) => {
      const font = options.bold ? helveticaBoldFont : (options.font || helveticaFont);
      const size = options.size || 10;
      const x = options.x || leftMargin;
      const maxWidth = options.maxWidth || (rightMargin - leftMargin);

      // Substituir quebras de linha por espaço para processamento
      // PDF não aceita \n diretamente no WinAnsi
      const cleanText = text.replace(/\n/g, ' ').replace(/\r/g, '');

      // Quebra de linha automática por palavras
      const words = cleanText.split(' ').filter(w => w.length > 0);
      let line = '';
      const lines: string[] = [];

      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        const testWidth = font.widthOfTextAtSize(testLine, size);

        if (testWidth > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      }
      if (line) lines.push(line);

      // Desenhar linhas
      for (const textLine of lines) {
        // Verificar se precisa de nova página
        if (yPosition < 50) {
          const newPage = pdfDoc.addPage([595, 842]);
          yPosition = height - 50;
          page.drawText = newPage.drawText.bind(newPage);
        }

        page.drawText(textLine, {
          x,
          y: yPosition,
          size,
          font,
          color: options.color || rgb(0, 0, 0),
        });

        yPosition -= lineHeight;
      }
    };

    const addLine = () => {
      page.drawLine({
        start: { x: leftMargin, y: yPosition },
        end: { x: rightMargin, y: yPosition },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7),
      });
      yPosition -= 20;
    };

    const addSection = (title: string, content: string | null, options: { mono?: boolean } = {}) => {
      if (!content) return;

      addText(title.toUpperCase(), { size: 12, bold: true });
      yPosition -= 5;
      addText(content, { 
        size: 10, 
        font: options.mono ? courierFont : helveticaFont 
      });
      yPosition -= 10;
    };

    // === CABEÇALHO ===
    addText("PRONTUÁRIO MÉDICO PEDIÁTRICO", { 
      size: 20, 
      bold: true,
      x: leftMargin + (rightMargin - leftMargin) / 2 - 150
    });
    yPosition -= 5;
    addText(
      `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      { 
        size: 10,
        x: leftMargin + (rightMargin - leftMargin) / 2 - 80
      }
    );
    yPosition -= 10;
    addLine();

    // === DADOS DO MÉDICO ===
    addText("DADOS DO MÉDICO", { size: 12, bold: true });
    yPosition -= 5;
    if (profile?.full_name) addText(`Nome: ${profile.full_name}`);
    if (profile?.crm) addText(`CRM: ${profile.crm}`);
    if (profile?.specialty) addText(`Especialidade: ${profile.specialty}`);
    yPosition -= 10;

    // === DADOS DO PACIENTE ===
    addText("DADOS DO PACIENTE", { size: 12, bold: true });
    yPosition -= 5;
    if (patient?.full_name) addText(`Nome: ${patient.full_name}`);
    if (patient?.cpf) addText(`CPF: ${patient.cpf}`);
    if (patientAge !== null) addText(`Idade: ${patientAge} anos`);
    if (patient?.date_of_birth)
      addText(`Data de Nascimento: ${format(new Date(patient.date_of_birth), "dd/MM/yyyy")}`);
    if (patient?.phone) addText(`Telefone: ${patient.phone}`);
    if (patient?.email) addText(`Email: ${patient.email}`);
    if (patient?.blood_type) addText(`Tipo Sanguíneo: ${patient.blood_type}`);
    if (patient?.allergies) addText(`ALERTA - Alergias: ${patient.allergies}`, { bold: true });
    yPosition -= 10;

    // === DATA DA CONSULTA ===
    addText("DATA DA CONSULTA", { size: 12, bold: true });
    yPosition -= 5;
    addText(
      format(
        new Date(consultation.created_at),
        "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
        { locale: ptBR }
      )
    );
    yPosition -= 15;
    addLine();

    // === CONTEÚDO CLÍNICO ===
    addSection("Queixa Principal", consultation.chief_complaint);
    addSection("História / Anamnese", consultation.history);
    addSection("Exame Físico", consultation.physical_exam);
    addSection("Diagnóstico", consultation.diagnosis);
    addSection("Prescrição Médica", consultation.prescription, { mono: true });
    addSection("Plano Terapêutico", consultation.plan);

    // === MEDIDAS ===
    if (
      consultation.weight_kg ||
      consultation.height_cm ||
      consultation.head_circumference_cm
    ) {
      addText("MEDIDAS ANTROPOMÉTRICAS", { size: 12, bold: true });
      yPosition -= 5;
      if (consultation.weight_kg) addText(`Peso: ${consultation.weight_kg} kg`);
      if (consultation.height_cm) addText(`Altura: ${consultation.height_cm} cm`);
      if (consultation.head_circumference_cm)
        addText(`Perímetro Cefálico: ${consultation.head_circumference_cm} cm`);
      yPosition -= 10;
    }

    addSection("Desenvolvimento", consultation.development_notes);
    addSection("Observações Adicionais", consultation.notes);

    if (patient?.medical_history) {
      addSection("Histórico Médico do Paciente", patient.medical_history);
    }

    // === RODAPÉ ===
    const footerY = 50;
    page.drawLine({
      start: { x: leftMargin, y: footerY + 15 },
      end: { x: rightMargin, y: footerY + 15 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    page.drawText(
      "Este documento foi gerado digitalmente e contém informações confidenciais protegidas por sigilo médico.",
      {
        x: leftMargin,
        y: footerY,
        size: 8,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
        maxWidth: rightMargin - leftMargin,
      }
    );

    // Gerar bytes do PDF
    console.log("📦 Gerando bytes do PDF...");
    const pdfBytes = await pdfDoc.save();
    console.log(`✅ PDF gerado: ${pdfBytes.length} bytes`);

    // Converter para Buffer
    const pdfBuffer = Buffer.from(pdfBytes);

    // Nome do arquivo
    const fileName = `Consulta_${patient?.full_name?.replace(/\s+/g, "_")}_${format(
      new Date(consultation.created_at),
      "yyyyMMdd"
    )}.pdf`;

    console.log(`📥 Enviando PDF: ${fileName}`);

    // Retornar PDF
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
