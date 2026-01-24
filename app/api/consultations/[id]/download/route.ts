/**
 * API Route para download de consulta em PDF
 * GET /api/consultations/[id]/download
 * 
 * Layout profissional com:
 * - Fonte Unicode (suporte a emojis)
 * - Logo no cabeçalho
 * - Caixa de destaque para alergias
 * - Espaço para carimbo e assinatura
 * - Controle automático de páginas
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PDFDocument, rgb, PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Cores do tema
const COLORS = {
  primary: rgb(0.66, 0.79, 0.96), // #A8C9F5
  text: rgb(0.13, 0.13, 0.13), // #343434
  textLight: rgb(0.15, 0.14, 0.14), // #272424
  gray: rgb(0.5, 0.5, 0.5),
  lightGray: rgb(0.9, 0.9, 0.9),
  warning: rgb(1, 1, 1), // Branco (background da caixa de alerta)
  warningBorder: rgb(1, 0.9, 0.4), // Amarelo mais claro e suave
  white: rgb(1, 1, 1),
};

// Configurações de layout
const LAYOUT = {
  pageWidth: 595,
  pageHeight: 842,
  marginLeft: 50,
  marginRight: 50,
  marginTop: 50,
  marginBottom: 70,
  lineHeight: 14,
  sectionSpacing: 20,
  paragraphSpacing: 8,
};

class PDFBuilder {
  private doc: PDFDocument;
  private currentPage: PDFPage;
  public yPosition: number; // Público para permitir ajustes externos
  public fonts: any = {}; // Público para permitir acesso externo
  
  constructor(doc: PDFDocument) {
    this.doc = doc;
    this.currentPage = doc.addPage([LAYOUT.pageWidth, LAYOUT.pageHeight]);
    this.yPosition = LAYOUT.pageHeight - LAYOUT.marginTop;
  }

  async loadFonts() {
    try {
      this.doc.registerFontkit(fontkit);
      
      // Tentar carregar fontes customizadas (Inter OTF)
      const regularFontPath = path.join(process.cwd(), 'public/fonts/Inter-Regular.otf');
      const boldFontPath = path.join(process.cwd(), 'public/fonts/Inter-Bold.otf');
      
      if (fs.existsSync(regularFontPath) && fs.existsSync(boldFontPath)) {
        try {
          const regularFontBytes = fs.readFileSync(regularFontPath);
          const boldFontBytes = fs.readFileSync(boldFontPath);
          
          // Verificar se são arquivos válidos (não HTML)
          const regularHeader = regularFontBytes.slice(0, 4).toString();
          if (regularHeader.includes('<') || regularHeader.includes('html')) {
            throw new Error('Arquivo de fonte inválido (HTML)');
          }
          
          this.fonts.regular = await this.doc.embedFont(regularFontBytes);
          this.fonts.bold = await this.doc.embedFont(boldFontBytes);
          this.fonts.useCustom = true;
          
          console.log("✅ Fontes customizadas Unicode carregadas");
          return;
        } catch (fontError: any) {
          console.warn("⚠️ Erro ao carregar fontes customizadas:", fontError?.message || fontError);
        }
      }
      
      // Fallback: usar fontes padrão do PDF
      const { StandardFonts } = await import('pdf-lib');
      this.fonts.regular = await this.doc.embedFont(StandardFonts.Helvetica);
      this.fonts.bold = await this.doc.embedFont(StandardFonts.HelveticaBold);
      this.fonts.useCustom = false;
      
      console.log("✅ Usando fontes padrão (Helvetica) - emojis serão removidos");
      
    } catch (error) {
      console.error("❌ Erro crítico ao carregar fontes:", error);
      // Último fallback
      const { StandardFonts } = await import('pdf-lib');
      this.fonts.regular = await this.doc.embedFont(StandardFonts.Helvetica);
      this.fonts.bold = await this.doc.embedFont(StandardFonts.Helvetica);
      this.fonts.useCustom = false;
    }
  }
  
  cleanText(text: string): string {
    if (this.fonts.useCustom) {
      // Com fontes customizadas, manter emojis (preservar Unicode)
      return text
        .replace(/[\r\t]/g, ' ')
        .replace(/  +/g, ' '); // Múltiplos espaços -> 1 espaço (NÃO TOCA em \n)
    } else {
      // Com fontes padrão, remover emojis e caracteres não-ASCII
      return text
        .replace(/[\r\t]/g, ' ')
        .replace(/[^\x00-\xFF]/g, '') // Remove Unicode (emojis)
        .replace(/\s+/g, ' ')
        .trim();
    }
  }

  // Método específico para texto pré-formatado (preserva \n)
  cleanPreformattedText(text: string): string {
    if (this.fonts.useCustom) {
      // Preservar emojis E quebras de linha
      return text
        .replace(/\r\n/g, '\n') // Windows line endings -> Unix
        .replace(/\r/g, '\n')   // Mac line endings -> Unix
        .replace(/\t/g, '  ');  // Tab -> 2 espaços
    } else {
      // Remover emojis MAS preservar quebras de linha
      return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, '  ')
        .replace(/[^\x00-\xFF\n]/g, ''); // Remove Unicode mas MANTÉM \n
    }
  }

  checkSpace(requiredSpace: number): boolean {
    return this.yPosition - requiredSpace > LAYOUT.marginBottom;
  }

  addNewPage() {
    this.currentPage = this.doc.addPage([LAYOUT.pageWidth, LAYOUT.pageHeight]);
    this.yPosition = LAYOUT.pageHeight - LAYOUT.marginTop;
    console.log("📄 Nova página adicionada");
  }

  moveDown(space: number) {
    this.yPosition -= space;
    if (this.yPosition < LAYOUT.marginBottom) {
      this.addNewPage();
    }
  }

  drawText(text: string, options: {
    x?: number;
    size?: number;
    bold?: boolean;
    color?: any;
    align?: 'left' | 'center' | 'right';
    maxWidth?: number;
  } = {}) {
    const font = options.bold ? this.fonts.bold : this.fonts.regular;
    const size = options.size || 10;
    const color = options.color || COLORS.text;
    const maxWidth = options.maxWidth || (LAYOUT.pageWidth - LAYOUT.marginLeft - LAYOUT.marginRight);
    
    // Limpar texto (remover emojis se usar fontes padrão)
    const cleanText = this.cleanText(text);
    
    // Calcular X baseado no alinhamento
    let x = options.x !== undefined ? options.x : LAYOUT.marginLeft;
    
    if (options.align === 'center') {
      const textWidth = font.widthOfTextAtSize(cleanText, size);
      x = LAYOUT.marginLeft + (maxWidth - textWidth) / 2;
    } else if (options.align === 'right') {
      const textWidth = font.widthOfTextAtSize(cleanText, size);
      x = LAYOUT.pageWidth - LAYOUT.marginRight - textWidth;
    }

    // Quebrar texto em linhas se necessário
    const words = cleanText.split(' ').filter(w => w.length > 0);
    let currentLine = '';
    const lines: string[] = [];

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = font.widthOfTextAtSize(testLine, size);

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Desenhar cada linha
    for (const line of lines) {
      // Verificar espaço
      if (!this.checkSpace(LAYOUT.lineHeight + 10)) {
        this.addNewPage();
      }

      // Recalcular X se for centralizado ou direita
      let lineX = x;
      if (options.align === 'center') {
        const lineWidth = font.widthOfTextAtSize(line, size);
        lineX = LAYOUT.marginLeft + (maxWidth - lineWidth) / 2;
      } else if (options.align === 'right') {
        const lineWidth = font.widthOfTextAtSize(line, size);
        lineX = LAYOUT.pageWidth - LAYOUT.marginRight - lineWidth;
      }

      this.currentPage.drawText(line, {
        x: lineX,
        y: this.yPosition,
        size,
        font,
        color,
      });

      this.yPosition -= LAYOUT.lineHeight;
    }
  }

  drawLine(color: any = COLORS.lightGray, thickness: number = 1) {
    if (!this.checkSpace(20)) {
      this.addNewPage();
    }

    this.currentPage.drawLine({
      start: { x: LAYOUT.marginLeft, y: this.yPosition },
      end: { x: LAYOUT.pageWidth - LAYOUT.marginRight, y: this.yPosition },
      thickness,
      color,
    });

    this.moveDown(15);
  }

  drawRectangle(x: number, y: number, width: number, height: number, options: {
    borderColor?: any;
    fillColor?: any;
    borderWidth?: number;
  } = {}) {
    // Fundo
    if (options.fillColor) {
      this.currentPage.drawRectangle({
        x,
        y,
        width,
        height,
        color: options.fillColor,
      });
    }

    // Borda
    if (options.borderColor) {
      const borderWidth = options.borderWidth || 1;
      this.currentPage.drawRectangle({
        x,
        y,
        width,
        height,
        borderColor: options.borderColor,
        borderWidth,
      });
    }
  }

  async drawLogo() {
    try {
      const logoPath = path.join(process.cwd(), 'public/small-logo.png');
      const logoBytes = fs.readFileSync(logoPath);
      const logoImage = await this.doc.embedPng(logoBytes);
      
      const logoSize = 30; // Tamanho médio conforme solicitado
      const logoDims = logoImage.scale(logoSize / logoImage.width);

      this.currentPage.drawImage(logoImage, {
        x: LAYOUT.marginLeft,
        y: this.yPosition - logoSize,
        width: logoDims.width,
        height: logoDims.height,
      });

      console.log("✅ Logo adicionada ao PDF");
      return logoSize;
    } catch (error) {
      console.warn("⚠️  Logo não encontrada, continuando sem ela:", error);
      return 0;
    }
  }

  drawPreformattedText(text: string, options: {
    size?: number;
    lineHeight?: number;
  } = {}) {
    const font = this.fonts.regular;
    const size = options.size || 9;
    const lineHeight = options.lineHeight || 13; // Ajustado para melhor legibilidade
    const color = COLORS.text;
    
    // FIX: Usar método específico que PRESERVA \n
    const cleanText = this.cleanPreformattedText(text);
    
    // Dividir em linhas pelo \n (não quebrar por palavras!)
    const lines = cleanText.split('\n');
    
    for (const line of lines) {
      // Verificar espaço
      if (!this.checkSpace(lineHeight + 10)) {
        this.addNewPage();
      }
      
      // Se linha vazia, só pular (espaço menor)
      if (line.trim().length === 0) {
        this.yPosition -= lineHeight / 2; // Meia linha para espaços
        continue;
      }
      
      // Desenhar linha preservando formatação
      this.currentPage.drawText(line, {
        x: LAYOUT.marginLeft + 10, // Pequena indentação
        y: this.yPosition,
        size,
        font,
        color,
      });
      
      this.yPosition -= lineHeight; // FIX: Move sempre para baixo
    }
    
    // FIX: Garantir espaço após o texto pré-formatado
    this.yPosition -= 5;
  }

  addSection(title: string, content: string | null, options: {
    bold?: boolean;
    size?: number;
    preformatted?: boolean; // NOVO: flag para texto pré-formatado
  } = {}) {
    if (!content || content.trim().length === 0) return;

    // Verificar espaço mínimo para título + 2 linhas
    if (!this.checkSpace(60)) {
      this.addNewPage();
    }

    // Título da seção
    this.drawText(title.toUpperCase(), {
      size: 13,
      bold: true,
      color: COLORS.textLight,
    });
    this.moveDown(LAYOUT.paragraphSpacing);

    // Conteúdo - usar método apropriado
    if (options.preformatted) {
      this.drawPreformattedText(content, {
        size: options.size || 9,
        lineHeight: 13,
      });
    } else {
      this.drawText(content, {
        size: options.size || 10,
        bold: options.bold,
      });
    }
    this.moveDown(LAYOUT.sectionSpacing);
  }

  addAllergyWarning(allergies: string) {
    if (!allergies || allergies.trim().length === 0) return;

    // Verificar espaço
    if (!this.checkSpace(80)) {
      this.addNewPage();
    }

    const boxHeight = 50;
    const boxY = this.yPosition - boxHeight;

    // Desenhar caixa de alerta (NOVA: borda amarela, fundo branco)
    this.drawRectangle(
      LAYOUT.marginLeft,
      boxY,
      LAYOUT.pageWidth - LAYOUT.marginLeft - LAYOUT.marginRight,
      boxHeight,
      {
        fillColor: COLORS.warning, // Branco
        borderColor: COLORS.warningBorder, // Amarelo claro
        borderWidth: 2,
      }
    );

    // Texto do alerta
    const savedY = this.yPosition;
    this.yPosition = boxY + boxHeight - 15;

    const alertText = this.fonts.useCustom ? "⚠️  ATENÇÃO - ALERGIAS" : "ATENÇÃO - ALERGIAS";
    this.drawText(alertText, {
      size: 11,
      bold: true,
      color: rgb(0.8, 0.6, 0), // Cor mais escura para contraste com fundo branco
    });

    this.drawText(allergies, {
      size: 10,
      color: COLORS.text,
    });

    this.yPosition = boxY - 15;
  }

  addFooter() {
    // NOVO: Adicionar carimbo no rodapé
    const footerBaseY = LAYOUT.marginBottom - 30;
    const stampHeight = 60;
    const stampWidth = 200;
    const stampY = footerBaseY + 50; // Acima do texto do rodapé
    const stampX = LAYOUT.marginLeft + (LAYOUT.pageWidth - LAYOUT.marginLeft - LAYOUT.marginRight - stampWidth) / 2;

    // Caixa pontilhada para carimbo
    this.currentPage.drawRectangle({
      x: stampX,
      y: stampY,
      width: stampWidth,
      height: stampHeight,
      borderColor: COLORS.gray,
      borderWidth: 1,
      borderDashArray: [3, 3],
    });

    // Texto do carimbo centralizado
    this.currentPage.drawText("Espaço para Carimbo e Assinatura", {
      x: LAYOUT.marginLeft,
      y: stampY + stampHeight / 2 - 4,
      size: 9,
      font: this.fonts.regular,
      color: COLORS.gray,
      maxWidth: LAYOUT.pageWidth - LAYOUT.marginLeft - LAYOUT.marginRight,
    });

    // Linha divisória
    this.currentPage.drawLine({
      start: { x: LAYOUT.marginLeft, y: footerBaseY + 15 },
      end: { x: LAYOUT.pageWidth - LAYOUT.marginRight, y: footerBaseY + 15 },
      thickness: 1,
      color: COLORS.lightGray,
    });

    // Texto do rodapé CENTRALIZADO
    const footerText = "Este documento foi gerado digitalmente e contém informações confidenciais protegidas por sigilo médico.";
    const textWidth = this.fonts.regular.widthOfTextAtSize(footerText, 8);
    const textX = LAYOUT.marginLeft + (LAYOUT.pageWidth - LAYOUT.marginLeft - LAYOUT.marginRight - textWidth) / 2;
    
    this.currentPage.drawText(footerText, {
      x: textX,
      y: footerBaseY,
      size: 8,
      font: this.fonts.regular,
      color: COLORS.gray,
    });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("📄 Iniciando geração de PDF profissional...");
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Buscar dados
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
      return NextResponse.json({ error: "Consulta não encontrada" }, { status: 404 });
    }

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
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        patientAge--;
      }
    }

    // Criar PDF
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(`Consulta - ${patient?.full_name || "Paciente"}`);
    pdfDoc.setAuthor(profile?.full_name || "Médico");
    pdfDoc.setSubject("Prontuário Médico Pediátrico");

    const builder = new PDFBuilder(pdfDoc);
    await builder.loadFonts();

    // === CABEÇALHO ===
    const logoHeight = await builder.drawLogo();
    
    // Ajustar posição Y para alinhar com a logo
    const titleStartY = builder.yPosition;
    builder.yPosition = titleStartY - (logoHeight > 0 ? 10 : 0);

    // Título principal (centralizado)
    builder.drawText("PRONTUÁRIO MÉDICO PEDIÁTRICO", {
      size: 18,
      bold: true,
      align: 'center',
      color: COLORS.primary,
    });
    builder.moveDown(8);

    // Dados do médico (centralizado)
    if (profile?.full_name) {
      builder.drawText(
        `${profile.full_name} - CRM: ${profile.crm || 'N/A'}`,
        {
          size: 11,
          align: 'center',
          color: COLORS.textLight,
        }
      );
      builder.moveDown(5);
    }

    // Data da consulta (centralizado)
    builder.drawText(
      `Consulta realizada em: ${format(new Date(consultation.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
      {
        size: 10,
        align: 'center',
        color: COLORS.gray,
      }
    );
    builder.moveDown(15);

    // Linha divisória
    builder.drawLine();

    // === DADOS DO PACIENTE ===
    let patientInfo = `Nome: ${patient?.full_name || 'N/A'}\n`;
    if (patientAge !== null) patientInfo += `Idade: ${patientAge} anos\n`;
    if (patient?.date_of_birth)
      patientInfo += `Data de Nascimento: ${format(new Date(patient.date_of_birth), "dd/MM/yyyy", { locale: ptBR })}\n`;
    if (patient?.cpf) patientInfo += `CPF: ${patient.cpf}\n`;
    if (patient?.phone) patientInfo += `Telefone: ${patient.phone}\n`;
    if (patient?.blood_type) patientInfo += `Tipo Sanguíneo: ${patient.blood_type}`;
    builder.moveDown(8);

    builder.addSection("Dados do Paciente", patientInfo);

    // === ALERGIAS (MOVIDO: após dados do paciente) ===
    if (patient?.allergies) {
      builder.addAllergyWarning(patient.allergies);
      builder.moveDown(10);
    }

    // === CONTEÚDO CLÍNICO ===
    builder.addSection("Queixa Principal", consultation.chief_complaint);
    builder.addSection("História / Anamnese", consultation.history);
    builder.addSection("Diagnóstico", consultation.diagnosis);
    builder.addSection("Plano Terapêutico", consultation.plan);

    // === MEDIDAS ===
    if (consultation.weight_kg || consultation.height_cm || consultation.head_circumference_cm) {
      let measures = "";
      if (consultation.weight_kg) measures += `Peso: ${consultation.weight_kg} kg | Altura: ${consultation.height_cm} cm | `;
      if (consultation.head_circumference_cm)
        measures += `Perímetro Cefálico: ${consultation.head_circumference_cm} cm`;
      
      builder.addSection("Medidas Antropométricas", measures);
    }

    // === PRESCRIÇÃO MÉDICA (com emojis se disponível) ===
    const prescriptionTitle =  "Prescrição Médica";
    builder.addSection(prescriptionTitle, consultation.prescription, { 
      preformatted: true, // Preservar formatação da IA
      size: 9, // Fonte menor para caber mais conteúdo
    });

    // === OBSERVAÇÕES ADICIONAIS ===
    let observations = "";
    if (consultation.physical_exam) observations += `Exame Físico:\n${consultation.physical_exam}\n\n`;
    if (consultation.development_notes) observations += `Desenvolvimento:\n${consultation.development_notes}\n\n`;
    if (consultation.notes) observations += `Outras Observações:\n${consultation.notes}`;
    
    if (observations.trim()) {
      builder.addSection("Observações Adicionais", observations.trim());
    }

    // === HISTÓRICO MÉDICO ===
    if (patient?.medical_history) {
      builder.addSection("Histórico Médico do Paciente", patient.medical_history);
    }

    // === RODAPÉ (inclui carimbo) ===
    builder.addFooter();

    // Gerar PDF
    console.log("📦 Gerando bytes do PDF...");
    const pdfBytes = await pdfDoc.save();
    console.log(`✅ PDF gerado: ${pdfBytes.length} bytes`);

    const pdfBuffer = Buffer.from(pdfBytes);
    const fileName = `Consulta_${patient?.full_name?.replace(/\s+/g, "_")}_${format(
      new Date(consultation.created_at),
      "yyyyMMdd"
    )}.pdf`;

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
