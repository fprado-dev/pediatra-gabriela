import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "pdf-lib";
import fs from "fs";
import path from "path";
import { htmlToPdfElements, stripHtml, type PdfElement, type TextSegment } from "@/lib/pdf/html-to-pdf-elements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Layout constants (mesmo padrão do PDF de consulta)
const LAYOUT = {
  pageWidth: 595,
  pageHeight: 842,
  margin: 50,
  lineHeight: 16,
  sectionSpacing: 20,
  footerHeight: 80,
};

const COLORS = {
  primary: rgb(0.15, 0.23, 0.38),
  text: rgb(0.1, 0.1, 0.1),
  muted: rgb(0.4, 0.4, 0.4),
  accent: rgb(0.23, 0.51, 0.77),
  warning: rgb(0.85, 0.55, 0.15),
  lightGray: rgb(0.85, 0.85, 0.85),
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

// Classe para gerenciar o PDF com múltiplas páginas
class PrescriptionPDFBuilder {
  private doc: PDFDocument;
  private currentPage: PDFPage;
  private font: PDFFont;
  private fontBold: PDFFont;
  private y: number;
  private logoImage: any;

  constructor(
    doc: PDFDocument,
    font: PDFFont,
    fontBold: PDFFont,
    logoImage: any
  ) {
    this.doc = doc;
    this.font = font;
    this.fontBold = fontBold;
    this.logoImage = logoImage;
    this.currentPage = doc.addPage([LAYOUT.pageWidth, LAYOUT.pageHeight]);
    this.y = LAYOUT.pageHeight - LAYOUT.margin;
  }

  private cleanText(text: string | null | undefined): string {
    if (!text) return "";
    // Remove emojis e caracteres especiais, mas preserva caracteres acentuados
    return text
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
      .replace(/[^\x20-\x7E\xA0-\xFF]/g, "")
      .trim();
  }

  private checkNewPage(requiredSpace: number = 100) {
    if (this.y < LAYOUT.footerHeight + requiredSpace) {
      this.currentPage = this.doc.addPage([LAYOUT.pageWidth, LAYOUT.pageHeight]);
      this.y = LAYOUT.pageHeight - LAYOUT.margin;
    }
  }

  private drawText(
    text: string,
    x: number,
    fontSize: number,
    color = COLORS.text,
    bold = false
  ) {
    const textFont = bold ? this.fontBold : this.font;
    const cleanedText = this.cleanText(text);
    const maxWidth = LAYOUT.pageWidth - LAYOUT.margin * 2 - (x - LAYOUT.margin);
    const words = cleanedText.split(" ");
    let line = "";

    for (const word of words) {
      const testLine = line + (line ? " " : "") + word;
      const testWidth = textFont.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > maxWidth && line) {
        this.checkNewPage();
        this.currentPage.drawText(line, {
          x,
          y: this.y,
          size: fontSize,
          font: textFont,
          color,
        });
        this.y -= LAYOUT.lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) {
      this.checkNewPage();
      this.currentPage.drawText(line, {
        x,
        y: this.y,
        size: fontSize,
        font: textFont,
        color,
      });
      this.y -= LAYOUT.lineHeight;
    }
  }

  /**
   * Renderiza segmentos de texto com formatação inline (negrito, itálico)
   */
  private drawTextSegments(
    segments: TextSegment[],
    x: number,
    fontSize: number,
    color = COLORS.text
  ) {
    const maxWidth = LAYOUT.pageWidth - LAYOUT.margin * 2 - (x - LAYOUT.margin);
    let currentX = x;
    let line: { text: string; font: PDFFont; width: number }[] = [];
    let lineWidth = 0;

    for (const segment of segments) {
      const cleanedText = this.cleanText(segment.text);
      const font = segment.bold ? this.fontBold : this.font;
      const words = cleanedText.split(" ");

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const wordText = i < words.length - 1 ? word + " " : word;
        const wordWidth = font.widthOfTextAtSize(wordText, fontSize);

        // Verificar se precisa quebrar linha
        if (lineWidth + wordWidth > maxWidth && line.length > 0) {
          // Renderizar linha atual
          this.checkNewPage();
          currentX = x;
          for (const part of line) {
            this.currentPage.drawText(part.text, {
              x: currentX,
              y: this.y,
              size: fontSize,
              font: part.font,
              color,
            });
            currentX += part.width;
          }
          this.y -= LAYOUT.lineHeight;
          
          // Resetar linha
          line = [];
          lineWidth = 0;
        }

        line.push({ text: wordText, font, width: wordWidth });
        lineWidth += wordWidth;
      }
    }

    // Renderizar última linha
    if (line.length > 0) {
      this.checkNewPage();
      currentX = x;
      for (const part of line) {
        this.currentPage.drawText(part.text, {
          x: currentX,
          y: this.y,
          size: fontSize,
          font: part.font,
          color,
        });
        currentX += part.width;
      }
      this.y -= LAYOUT.lineHeight;
    }
  }

  /**
   * Renderiza HTML estruturado (parágrafos, listas, etc.)
   */
  private drawHtmlContent(
    html: string,
    x: number,
    fontSize: number,
    color = COLORS.text
  ) {
    const elements = htmlToPdfElements(html);

    for (const element of elements) {
      if (element.type === "line-break") {
        this.y -= LAYOUT.lineHeight / 2;
        continue;
      }

      if (element.type === "paragraph" && element.content) {
        this.drawTextSegments(element.content, x, fontSize, color);
        this.y -= 4; // Espaçamento entre parágrafos
        continue;
      }

      if (element.type === "bullet-list" && element.items) {
        for (const item of element.items) {
          this.checkNewPage();
          // Desenhar bullet
          this.currentPage.drawText("•", {
            x,
            y: this.y,
            size: fontSize,
            font: this.font,
            color,
          });
          // Desenhar conteúdo do item
          this.drawTextSegments(item, x + 15, fontSize, color);
        }
        this.y -= 4;
        continue;
      }

      if (element.type === "ordered-list" && element.items) {
        for (let i = 0; i < element.items.length; i++) {
          this.checkNewPage();
          // Desenhar número
          this.currentPage.drawText(`${i + 1}.`, {
            x,
            y: this.y,
            size: fontSize,
            font: this.font,
            color,
          });
          // Desenhar conteúdo do item
          this.drawTextSegments(element.items[i], x + 20, fontSize, color);
        }
        this.y -= 4;
        continue;
      }
    }
  }

  drawHeader(patientName: string, patientAge: string) {
    // Logo (pequeno, igual ao PDF de consulta)
    if (this.logoImage) {
      const targetHeight = 30;
      const scale = targetHeight / this.logoImage.height;
      const logoWidth = this.logoImage.width * scale;
      const logoHeight = targetHeight;

      this.currentPage.drawImage(this.logoImage, {
        x: LAYOUT.margin,
        y: this.y - logoHeight + 10,
        width: logoWidth,
        height: logoHeight,
      });
    }

    // Título centralizado
    const title = "RECEITA MEDICA";
    const titleWidth = this.fontBold.widthOfTextAtSize(title, 16);
    this.currentPage.drawText(title, {
      x: (LAYOUT.pageWidth - titleWidth) / 2,
      y: this.y - 5,
      size: 16,
      font: this.fontBold,
      color: COLORS.primary,
    });
    this.y -= 25;

    // Data
    const today = new Date().toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const dateText = this.cleanText(today);
    const dateWidth = this.font.widthOfTextAtSize(dateText, 9);
    this.currentPage.drawText(dateText, {
      x: (LAYOUT.pageWidth - dateWidth) / 2,
      y: this.y,
      size: 9,
      font: this.font,
      color: COLORS.muted,
    });
    this.y -= 20;

    // Linha separadora
    this.currentPage.drawLine({
      start: { x: LAYOUT.margin, y: this.y },
      end: { x: LAYOUT.pageWidth - LAYOUT.margin, y: this.y },
      thickness: 0.5,
      color: COLORS.lightGray,
    });
    this.y -= 20;

    // Paciente
    this.currentPage.drawText("PACIENTE:", {
      x: LAYOUT.margin,
      y: this.y,
      size: 9,
      font: this.fontBold,
      color: COLORS.muted,
    });
    this.y -= LAYOUT.lineHeight;

    const patientText = `${this.cleanText(patientName)}${patientAge ? ` - ${patientAge}` : ""}`;
    this.currentPage.drawText(patientText, {
      x: LAYOUT.margin,
      y: this.y,
      size: 11,
      font: this.fontBold,
      color: COLORS.text,
    });
    this.y -= LAYOUT.sectionSpacing + 5;
  }

  drawSectionTitle(title: string, color = COLORS.primary) {
    this.checkNewPage(60);
    this.currentPage.drawText(title, {
      x: LAYOUT.margin,
      y: this.y,
      size: 10,
      font: this.fontBold,
      color,
    });
    this.y -= LAYOUT.lineHeight + 3;
  }

  drawMedications(medications: Medication[]) {
    this.drawSectionTitle("USO ORAL:");

    medications.forEach((med, index) => {
      this.checkNewPage(80);

      // Número + Nome
      const medName = this.cleanText(med.name);
      this.currentPage.drawText(`${index + 1})`, {
        x: LAYOUT.margin,
        y: this.y,
        size: 10,
        font: this.fontBold,
        color: COLORS.accent,
      });

      this.currentPage.drawText(medName, {
        x: LAYOUT.margin + 20,
        y: this.y,
        size: 10,
        font: this.fontBold,
        color: COLORS.text,
      });

      // Quantidade
      if (med.quantity) {
        const qtyText = this.cleanText(`--- ${med.quantity}`);
        const nameWidth = this.fontBold.widthOfTextAtSize(medName, 10);
        this.currentPage.drawText(qtyText, {
          x: LAYOUT.margin + 25 + nameWidth,
          y: this.y,
          size: 10,
          font: this.font,
          color: COLORS.muted,
        });
      }
      this.y -= LAYOUT.lineHeight;

      // Dosagem
      if (med.dosage) {
        this.currentPage.drawText(`Dosagem: ${this.cleanText(med.dosage)}`, {
          x: LAYOUT.margin + 20,
          y: this.y,
          size: 9,
          font: this.font,
          color: COLORS.muted,
        });
        this.y -= LAYOUT.lineHeight;
      }

      // Instruções
      if (med.instructions) {
        this.drawText(med.instructions, LAYOUT.margin + 20, 9, COLORS.text);
      }

      this.y -= 8;
    });

    this.y -= 10;
  }

  drawTextSection(title: string, content: string, color = COLORS.primary) {
    if (!content) return;

    this.drawSectionTitle(title, color);

    // Verificar se o conteúdo é HTML
    if (content.includes("<p>") || content.includes("<ul>") || content.includes("<ol>")) {
      this.drawHtmlContent(content, LAYOUT.margin, 9, COLORS.text);
    } else {
      // Fallback para texto simples
      const lines = content.split("\n");
      for (const line of lines) {
        if (line.trim()) {
          this.drawText(line, LAYOUT.margin, 9, COLORS.text);
        }
      }
    }
    this.y -= 10;
  }

  drawNotes(data: PrescriptionData) {
    const hasNotes =
      data.notes || data.returnDays || data.bringExams || data.observeFeeding;

    if (!hasNotes) return;

    this.drawSectionTitle("ANOTACOES:");

    if (data.returnDays) {
      this.checkNewPage();
      this.currentPage.drawText(`- Retornar em ${data.returnDays} dias`, {
        x: LAYOUT.margin,
        y: this.y,
        size: 9,
        font: this.font,
        color: COLORS.text,
      });
      this.y -= LAYOUT.lineHeight;
    }

    if (data.bringExams) {
      this.checkNewPage();
      this.currentPage.drawText("- Levar resultados de exames", {
        x: LAYOUT.margin,
        y: this.y,
        size: 9,
        font: this.font,
        color: COLORS.text,
      });
      this.y -= LAYOUT.lineHeight;
    }

    if (data.observeFeeding) {
      this.checkNewPage();
      this.currentPage.drawText("- Observar aceitacao alimentar", {
        x: LAYOUT.margin,
        y: this.y,
        size: 9,
        font: this.font,
        color: COLORS.text,
      });
      this.y -= LAYOUT.lineHeight;
    }

    if (data.notes) {
      // Verificar se é HTML
      if (data.notes.includes("<p>") || data.notes.includes("<ul>") || data.notes.includes("<ol>")) {
        this.drawHtmlContent(data.notes, LAYOUT.margin, 9, COLORS.text);
      } else {
        // Fallback para texto simples
        const lines = data.notes.split("\n");
        for (const line of lines) {
          if (line.trim()) {
            this.drawText(line, LAYOUT.margin, 9, COLORS.text);
          }
        }
      }
    }
  }

  drawFooter(doctorName: string, crm: string) {
    // Desenhar rodapé na última página
    const pages = this.doc.getPages();
    const lastPage = pages[pages.length - 1];

    // Linha separadora
    lastPage.drawLine({
      start: { x: LAYOUT.margin, y: LAYOUT.footerHeight + 15 },
      end: { x: LAYOUT.pageWidth - LAYOUT.margin, y: LAYOUT.footerHeight + 15 },
      thickness: 0.5,
      color: COLORS.lightGray,
    });

    // Nome do médico
    const cleanDoctorName = this.cleanText(doctorName);
    const doctorWidth = this.fontBold.widthOfTextAtSize(cleanDoctorName, 10);
    lastPage.drawText(cleanDoctorName, {
      x: (LAYOUT.pageWidth - doctorWidth) / 2,
      y: LAYOUT.footerHeight - 5,
      size: 10,
      font: this.fontBold,
      color: COLORS.text,
    });

    // CRM
    if (crm) {
      const crmText = `CRM ${this.cleanText(crm)}`;
      const crmWidth = this.font.widthOfTextAtSize(crmText, 9);
      lastPage.drawText(crmText, {
        x: (LAYOUT.pageWidth - crmWidth) / 2,
        y: LAYOUT.footerHeight - 20,
        size: 9,
        font: this.font,
        color: COLORS.muted,
      });
    }
  }

  async save(): Promise<Uint8Array> {
    return await this.doc.save();
  }
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

    // Criar builder
    const builder = new PrescriptionPDFBuilder(pdfDoc, font, fontBold, logoImage);

    // Construir PDF
    builder.drawHeader(patient?.full_name || "Paciente", patientAge);
    builder.drawMedications(prescriptionData.medications);
    builder.drawTextSection("ORIENTACOES:", prescriptionData.orientations || "");
    builder.drawTextSection(
      "SINAIS DE ALERTA - PROCURAR ATENDIMENTO SE:",
      prescriptionData.alertSigns || "",
      COLORS.warning
    );
    builder.drawTextSection("COMO PREVENIR:", prescriptionData.prevention || "");
    builder.drawNotes(prescriptionData);
    builder.drawFooter(
      profile?.full_name || "Médico(a)",
      profile?.crm || ""
    );

    // Gerar PDF
    const pdfBytes = await builder.save();
    const patientName = (patient?.full_name || "paciente")
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
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
