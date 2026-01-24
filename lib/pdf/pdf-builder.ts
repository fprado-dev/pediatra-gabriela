/**
 * PDFBuilder - Classe para construção de PDFs profissionais
 * Gerencia layout, fontes, elementos gráficos e controle de páginas
 */

import { PDFDocument, rgb, PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";

// Cores do tema
export const COLORS = {
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
export const LAYOUT = {
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

export class PDFBuilder {
  private doc: PDFDocument;
  private currentPage: PDFPage;
  public yPosition: number;
  public fonts: any = {};
  
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
      
      const logoSize = 30;
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
    const lineHeight = options.lineHeight || 13;
    const color = COLORS.text;
    
    // Usar método específico que PRESERVA \n
    const cleanText = this.cleanPreformattedText(text);
    
    // Dividir em linhas pelo \n
    const lines = cleanText.split('\n');
    
    for (const line of lines) {
      // Verificar espaço
      if (!this.checkSpace(lineHeight + 10)) {
        this.addNewPage();
      }
      
      // Se linha vazia, só pular
      if (line.trim().length === 0) {
        this.yPosition -= lineHeight / 2;
        continue;
      }
      
      // Desenhar linha preservando formatação
      this.currentPage.drawText(line, {
        x: LAYOUT.marginLeft + 10,
        y: this.yPosition,
        size,
        font,
        color,
      });
      
      this.yPosition -= lineHeight;
    }
    
    // Garantir espaço após o texto pré-formatado
    this.yPosition -= 5;
  }

  addSection(title: string, content: string | null, options: {
    bold?: boolean;
    size?: number;
    preformatted?: boolean;
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

    // Texto do alerta
    this.yPosition = boxY + boxHeight - 15;

    const alertText = "ATENÇÃO - ALERGIAS";
    this.drawText(alertText, {
      size: 11,
      bold: true,
      color: rgb(0.8, 0.6, 0),
    });

    this.drawText(allergies, {
      size: 10,
      color: COLORS.text,
    });

    this.yPosition = boxY - 15;
  }

  async addFooter() {
    // Adicionar logo no rodapé
    const footerBaseY = LAYOUT.marginBottom - 30;
    const stampHeight = 60;
    const stampY = footerBaseY + 50;

    // Carregar e desenhar full-logo.png
    try {
      const logoPath = path.join(process.cwd(), 'public/full-logo.png');
      const logoBytes = fs.readFileSync(logoPath);
      const logoImage = await this.doc.embedPng(logoBytes);
      
      const logoWidth = 180;
      const logoDims = logoImage.scale(logoWidth / logoImage.width);
      
      // Centralizar logo
      const logoX = LAYOUT.marginLeft + (LAYOUT.pageWidth - LAYOUT.marginLeft - LAYOUT.marginRight - logoDims.width) / 2;
      const logoY = stampY + (stampHeight - logoDims.height) / 2;

      this.currentPage.drawImage(logoImage, {
        x: logoX,
        y: logoY,
        width: logoDims.width,
        height: logoDims.height,
      });

      console.log("✅ Logo full-logo.png adicionada ao rodapé");
    } catch (error) {
      console.warn("⚠️  Logo full-logo.png não encontrada, usando texto:", error);
      
      // Fallback: Caixa pontilhada com texto
      const stampWidth = 200;
      const stampX = LAYOUT.marginLeft + (LAYOUT.pageWidth - LAYOUT.marginLeft - LAYOUT.marginRight - stampWidth) / 2;
      
      this.currentPage.drawRectangle({
        x: stampX,
        y: stampY,
        width: stampWidth,
        height: stampHeight,
        borderColor: COLORS.gray,
        borderWidth: 1,
        borderDashArray: [3, 3],
      });

      this.currentPage.drawText("Espaço para Carimbo e Assinatura", {
        x: stampX + 20,
        y: stampY + stampHeight / 2 - 4,
        size: 9,
        font: this.fonts.regular,
        color: COLORS.gray,
      });
    }

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
