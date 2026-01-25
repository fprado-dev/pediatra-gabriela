import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Layout constants
const LAYOUT = {
  margin: 50,
  headerHeight: 120,
  lineHeight: 18,
  sectionSpacing: 25,
};

const COLORS = {
  primary: rgb(0.15, 0.23, 0.38), // Azul escuro
  text: rgb(0.1, 0.1, 0.1),
  muted: rgb(0.4, 0.4, 0.4),
  accent: rgb(0.23, 0.51, 0.77), // Azul médio
  warning: rgb(0.85, 0.55, 0.15), // Laranja
};

interface Medication {
  name: string;
  dosage: string;
  quantity: string;
  instructions: string;
}

interface PrescriptionData {
  medications: Medication[];
  orientations?: string;
  alertSigns?: string;
  prevention?: string;
  notes?: string;
  returnDays?: number;
  bringExams?: boolean;
  observeFeeding?: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: consultationId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar consulta com dados
    const { data: consultation, error } = await supabase
      .from("consultations")
      .select(`
        id,
        consultation_date,
        diagnosis,
        prescription_data,
        patient:patients(
          id, 
          full_name, 
          date_of_birth
        )
      `)
      .eq("id", consultationId)
      .eq("doctor_id", user.id)
      .single();

    if (error || !consultation) {
      return NextResponse.json(
        { error: "Consulta não encontrada" },
        { status: 404 }
      );
    }

    // Buscar perfil do médico
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, crm")
      .eq("id", user.id)
      .single();

    const patient = Array.isArray(consultation.patient)
      ? consultation.patient[0]
      : consultation.patient;

    const prescriptionData = consultation.prescription_data as PrescriptionData | null;

    if (!prescriptionData || !prescriptionData.medications?.length) {
      return NextResponse.json(
        { error: "Receita não encontrada" },
        { status: 404 }
      );
    }

    // Calcular idade
    let patientAge = "";
    if (patient?.date_of_birth) {
      const birth = new Date(patient.date_of_birth);
      const today = new Date();
      let years = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        years--;
      }

      if (years === 0) {
        const months = monthDiff + (today.getDate() >= birth.getDate() ? 0 : -1) + 12;
        patientAge = `${months % 12} ${months % 12 === 1 ? "mês" : "meses"}`;
      } else {
        patientAge = `${years} ${years === 1 ? "ano" : "anos"}`;
      }
    }

    // Criar PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Carregar logo
    let logoImage = null;
    try {
      const logoPath = path.join(process.cwd(), "public", "small-logo.png");
      if (fs.existsSync(logoPath)) {
        const logoBytes = fs.readFileSync(logoPath);
        logoImage = await pdfDoc.embedPng(logoBytes);
      }
    } catch (e) {
      console.warn("Logo não encontrada");
    }

    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    let y = height - LAYOUT.margin;

    // Função auxiliar para limpar texto
    const cleanText = (text: string | null | undefined): string => {
      if (!text) return "";
      // Remover caracteres não suportados pelo WinAnsi
      return text
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, "") // Remover emojis
        .replace(/[^\x00-\x7F\xA0-\xFF]/g, "") // Manter apenas Latin-1
        .replace(/\s+/g, " ")
        .trim();
    };

    // Função para desenhar texto com wrap
    const drawText = (
      text: string,
      x: number,
      fontSize: number,
      color = COLORS.text,
      bold = false
    ) => {
      const textFont = bold ? fontBold : font;
      const cleanedText = cleanText(text);
      const maxWidth = width - LAYOUT.margin * 2 - (x - LAYOUT.margin);
      const words = cleanedText.split(" ");
      let line = "";

      for (const word of words) {
        const testLine = line + (line ? " " : "") + word;
        const testWidth = textFont.widthOfTextAtSize(testLine, fontSize);

        if (testWidth > maxWidth && line) {
          page.drawText(line, { x, y, size: fontSize, font: textFont, color });
          y -= LAYOUT.lineHeight;
          line = word;
        } else {
          line = testLine;
        }
      }

      if (line) {
        page.drawText(line, { x, y, size: fontSize, font: textFont, color });
        y -= LAYOUT.lineHeight;
      }
    };

    // === HEADER ===
    // Logo
    if (logoImage) {
      const logoScale = 0.5;
      const logoWidth = logoImage.width * logoScale;
      const logoHeight = logoImage.height * logoScale;
      page.drawImage(logoImage, {
        x: LAYOUT.margin,
        y: height - LAYOUT.margin - logoHeight + 20,
        width: logoWidth,
        height: logoHeight,
      });
    }

    // Título
    const title = "RECEITA MEDICA";
    const titleWidth = fontBold.widthOfTextAtSize(title, 18);
    page.drawText(title, {
      x: (width - titleWidth) / 2,
      y: y - 10,
      size: 18,
      font: fontBold,
      color: COLORS.primary,
    });
    y -= 35;

    // Data
    const today = new Date().toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const dateText = cleanText(today);
    const dateWidth = font.widthOfTextAtSize(dateText, 10);
    page.drawText(dateText, {
      x: (width - dateWidth) / 2,
      y,
      size: 10,
      font,
      color: COLORS.muted,
    });
    y -= 30;

    // Linha separadora
    page.drawLine({
      start: { x: LAYOUT.margin, y },
      end: { x: width - LAYOUT.margin, y },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.85),
    });
    y -= 25;

    // === PACIENTE ===
    page.drawText("PACIENTE:", {
      x: LAYOUT.margin,
      y,
      size: 10,
      font: fontBold,
      color: COLORS.muted,
    });
    y -= LAYOUT.lineHeight;

    const patientText = `${cleanText(patient?.full_name || "Paciente")}${patientAge ? ` - ${patientAge}` : ""}`;
    page.drawText(patientText, {
      x: LAYOUT.margin,
      y,
      size: 12,
      font: fontBold,
      color: COLORS.text,
    });
    y -= LAYOUT.sectionSpacing + 10;

    // === MEDICAMENTOS ===
    page.drawText("USO ORAL:", {
      x: LAYOUT.margin,
      y,
      size: 11,
      font: fontBold,
      color: COLORS.primary,
    });
    y -= LAYOUT.lineHeight + 5;

    prescriptionData.medications.forEach((med, index) => {
      // Verificar se precisa de nova página
      if (y < 150) {
        // Nova página
        const newPage = pdfDoc.addPage([595.28, 841.89]);
        y = height - LAYOUT.margin;
      }

      // Número + Nome
      const medName = cleanText(med.name);
      page.drawText(`${index + 1})`, {
        x: LAYOUT.margin,
        y,
        size: 11,
        font: fontBold,
        color: COLORS.accent,
      });

      page.drawText(`${medName}`, {
        x: LAYOUT.margin + 25,
        y,
        size: 11,
        font: fontBold,
        color: COLORS.text,
      });

      // Quantidade
      if (med.quantity) {
        const qtyText = cleanText(`--- ${med.quantity}`);
        const nameWidth = fontBold.widthOfTextAtSize(medName, 11);
        page.drawText(qtyText, {
          x: LAYOUT.margin + 30 + nameWidth,
          y,
          size: 11,
          font,
          color: COLORS.muted,
        });
      }
      y -= LAYOUT.lineHeight;

      // Dosagem
      if (med.dosage) {
        const dosageText = cleanText(`Dosagem: ${med.dosage}`);
        page.drawText(dosageText, {
          x: LAYOUT.margin + 25,
          y,
          size: 10,
          font,
          color: COLORS.muted,
        });
        y -= LAYOUT.lineHeight;
      }

      // Instruções
      if (med.instructions) {
        drawText(cleanText(med.instructions), LAYOUT.margin + 25, 10, COLORS.text);
      }

      y -= 10;
    });

    y -= LAYOUT.sectionSpacing;

    // === ORIENTAÇÕES ===
    if (prescriptionData.orientations) {
      page.drawText("ORIENTACOES:", {
        x: LAYOUT.margin,
        y,
        size: 11,
        font: fontBold,
        color: COLORS.primary,
      });
      y -= LAYOUT.lineHeight + 5;

      // Processar linhas
      const lines = prescriptionData.orientations.split("\n");
      for (const line of lines) {
        if (line.trim()) {
          drawText(cleanText(line), LAYOUT.margin, 10, COLORS.text);
        }
      }
      y -= LAYOUT.sectionSpacing;
    }

    // === SINAIS DE ALERTA ===
    if (prescriptionData.alertSigns) {
      page.drawText("SINAIS DE ALERTA - PROCURAR ATENDIMENTO SE:", {
        x: LAYOUT.margin,
        y,
        size: 11,
        font: fontBold,
        color: COLORS.warning,
      });
      y -= LAYOUT.lineHeight + 5;

      const lines = prescriptionData.alertSigns.split("\n");
      for (const line of lines) {
        if (line.trim()) {
          drawText(cleanText(line), LAYOUT.margin, 10, COLORS.text);
        }
      }
      y -= LAYOUT.sectionSpacing;
    }

    // === PREVENÇÃO ===
    if (prescriptionData.prevention) {
      page.drawText("COMO PREVENIR:", {
        x: LAYOUT.margin,
        y,
        size: 11,
        font: fontBold,
        color: COLORS.primary,
      });
      y -= LAYOUT.lineHeight + 5;

      const lines = prescriptionData.prevention.split("\n");
      for (const line of lines) {
        if (line.trim()) {
          drawText(cleanText(line), LAYOUT.margin, 10, COLORS.text);
        }
      }
      y -= LAYOUT.sectionSpacing;
    }

    // === ANOTAÇÕES ===
    const hasNotes =
      prescriptionData.notes ||
      prescriptionData.returnDays ||
      prescriptionData.bringExams ||
      prescriptionData.observeFeeding;

    if (hasNotes) {
      page.drawText("ANOTACOES:", {
        x: LAYOUT.margin,
        y,
        size: 11,
        font: fontBold,
        color: COLORS.primary,
      });
      y -= LAYOUT.lineHeight + 5;

      if (prescriptionData.returnDays) {
        page.drawText(`- Retornar em ${prescriptionData.returnDays} dias`, {
          x: LAYOUT.margin,
          y,
          size: 10,
          font,
          color: COLORS.text,
        });
        y -= LAYOUT.lineHeight;
      }

      if (prescriptionData.bringExams) {
        page.drawText("- Levar resultados de exames", {
          x: LAYOUT.margin,
          y,
          size: 10,
          font,
          color: COLORS.text,
        });
        y -= LAYOUT.lineHeight;
      }

      if (prescriptionData.observeFeeding) {
        page.drawText("- Observar aceitacao alimentar", {
          x: LAYOUT.margin,
          y,
          size: 10,
          font,
          color: COLORS.text,
        });
        y -= LAYOUT.lineHeight;
      }

      if (prescriptionData.notes) {
        const lines = prescriptionData.notes.split("\n");
        for (const line of lines) {
          if (line.trim()) {
            drawText(cleanText(line), LAYOUT.margin, 10, COLORS.text);
          }
        }
      }
    }

    // === RODAPÉ ===
    const footerY = 80;

    // Linha separadora
    page.drawLine({
      start: { x: LAYOUT.margin, y: footerY + 20 },
      end: { x: width - LAYOUT.margin, y: footerY + 20 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });

    // Nome do médico
    const doctorName = cleanText(profile?.full_name || "Medico(a)");
    const doctorWidth = fontBold.widthOfTextAtSize(doctorName, 11);
    page.drawText(doctorName, {
      x: (width - doctorWidth) / 2,
      y: footerY,
      size: 11,
      font: fontBold,
      color: COLORS.text,
    });

    // CRM
    if (profile?.crm) {
      const crmText = `CRM ${cleanText(profile.crm)}`;
      const crmWidth = font.widthOfTextAtSize(crmText, 10);
      page.drawText(crmText, {
        x: (width - crmWidth) / 2,
        y: footerY - 15,
        size: 10,
        font,
        color: COLORS.muted,
      });
    }

    // Gerar PDF
    const pdfBytes = await pdfDoc.save();
    const patientName = cleanText(patient?.full_name || "paciente")
      .toLowerCase()
      .replace(/\s+/g, "-");
    const fileName = `receita-${patientName}-${new Date().toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(pdfBytes as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF da receita:", error);
    return NextResponse.json(
      { error: "Erro ao gerar PDF" },
      { status: 500 }
    );
  }
}
