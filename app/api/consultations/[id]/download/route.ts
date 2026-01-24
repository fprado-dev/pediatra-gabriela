/**
 * API Route para download de consulta em PDF
 * GET /api/consultations/[id]/download
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    let page = pdfDoc.addPage([595, 842]); // A4 em pontos
    const { width, height } = page.getSize();

    // Carregar fontes
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);

    // Carregar logo
    let logoImage = null;
    let logoWidth = 0;
    let logoHeight = 0;
    try {
      const logoPath = join(process.cwd(), "public", "small-logo.png");
      const logoBytes = readFileSync(logoPath);
      logoImage = await pdfDoc.embedPng(logoBytes);
      const logoDims = logoImage.scale(0.15); // Escala para tamanho adequado
      logoWidth = logoDims.width;
      logoHeight = logoDims.height;
      console.log("✅ Logo carregada com sucesso");
    } catch (error) {
      console.warn("⚠️ Não foi possível carregar o logo:", error);
    }

    let yPosition = height - 50; // Começar do topo com margem
    const leftMargin = 50;
    const rightMargin = width - 50;
    const centerX = width / 2;
    const lineHeight = 14;

    // Função para remover emojis e caracteres especiais
    const removeEmojis = (text: string): string => {
      return text
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Emojis diversos
        .replace(/[\u{2600}-\u{26FF}]/gu, '') // Símbolos diversos
        .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
        .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Emojis suplementares
        .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
        .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transporte e símbolos
        .replace(/[\u{2190}-\u{21FF}]/gu, '') // Setas
        .replace(/[\u{FE00}-\u{FE0F}]/gu, '') // Variações de emojis
        .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Bandeiras
        .replace(/[^\x20-\x7E\xA0-\xFF]/g, '') // Remove tudo que não é ASCII/Latin-1
        .trim();
    };

    // Helper para adicionar texto
    const addText = (text: string, options: {
      font?: any;
      size?: number;
      color?: any;
      bold?: boolean;
      x?: number;
      centered?: boolean;
      maxWidth?: number;
    } = {}) => {
      const font = options.bold ? helveticaBoldFont : (options.font || helveticaFont);
      const size = options.size || 10;
      const color = options.color || rgb(0, 0, 0);

      // Limpar emojis e caracteres especiais
      const cleanText = removeEmojis(text);

      const words = cleanText.split(' ').filter(w => w.length > 0);
      let line = '';
      const maxWidth = options.maxWidth || (rightMargin - leftMargin);
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

      // Verificar se precisa de nova página
      const totalHeight = lines.length * size * 1.2;
      if (yPosition - totalHeight < 100) { // Margem de segurança no rodapé
        page = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
      }

      for (const textLine of lines) {
        let x = options.x || leftMargin;
        
        if (options.centered) {
          const textWidth = font.widthOfTextAtSize(textLine, size);
          x = centerX - textWidth / 2;
        }

        page.drawText(textLine, {
          x,
          y: yPosition,
          size,
          font,
          color,
        });

        yPosition -= size * 1.2;
      }
    };

    const addMainDivider = () => {
      page.drawLine({
        start: { x: leftMargin, y: yPosition },
        end: { x: rightMargin, y: yPosition },
        thickness: 1.5,
        color: rgb(0.3, 0.3, 0.3),
      });
      yPosition -= 20;
    };

    const addSection = (title: string, content: string | null, options: { 
      mono?: boolean;
      removeEmojis?: boolean;
    } = {}) => {
      if (!content || content.trim().length === 0) return;

      addText(title.toUpperCase(), { size: 13, bold: true, color: rgb(0.2, 0.2, 0.2) });
      yPosition -= 8;
      
      const processedContent = options.removeEmojis ? removeEmojis(content) : content;
      addText(processedContent, { 
        size: 10, 
        font: options.mono ? courierFont : helveticaFont 
      });
      yPosition -= 15;
    };

    const addAllergyWarning = (allergies: string) => {
      // Caixa de alerta para alergias
      const boxHeight = 40;
      const boxPadding = 10;
      
      // Fundo vermelho claro
      page.drawRectangle({
        x: leftMargin,
        y: yPosition - boxHeight + 10,
        width: rightMargin - leftMargin,
        height: boxHeight,
        color: rgb(1, 0.95, 0.95),
        borderColor: rgb(0.8, 0.2, 0.2),
        borderWidth: 2,
      });

      yPosition -= 15;
      addText("ALERTA - ALERGIAS", { 
        size: 11, 
        bold: true, 
        color: rgb(0.8, 0, 0),
        x: leftMargin + boxPadding 
      });
      yPosition -= 5;
      addText(removeEmojis(allergies), { 
        size: 10, 
        color: rgb(0.6, 0, 0),
        x: leftMargin + boxPadding,
        maxWidth: rightMargin - leftMargin - 2 * boxPadding
      });
      yPosition -= 20;
    };

    // === CABEÇALHO ===
    
    // Logo (se disponível)
    if (logoImage) {
      page.drawImage(logoImage, {
        x: centerX - logoWidth / 2,
        y: yPosition - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
      yPosition -= logoHeight + 10;
    }

    // Título principal
    addText("PRONTUÁRIO MÉDICO PEDIÁTRICO", { 
      size: 24, 
      bold: true,
      centered: true,
      color: rgb(0.1, 0.1, 0.1)
    });
    yPosition -= 5;

    // Dados do médico
    if (profile?.full_name && profile?.crm) {
      addText(`Dr(a). ${profile.full_name} - CRM: ${profile.crm}`, { 
        size: 11,
        centered: true,
        color: rgb(0.3, 0.3, 0.3)
      });
    }
    yPosition -= 3;

    // Data da consulta
    if (consultation.created_at) {
      addText(
        `Consulta realizada em: ${format(new Date(consultation.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
        { 
          size: 10,
          centered: true,
          color: rgb(0.4, 0.4, 0.4)
        }
      );
    }
    
    yPosition -= 10;
    addMainDivider();



    // === DADOS DO PACIENTE ===
    addText("DADOS DO PACIENTE", { size: 13, bold: true, color: rgb(0.2, 0.2, 0.2) });
    yPosition -= 8;
    if (patient?.full_name) addText(`Nome: ${patient.full_name}`, { size: 10 });
    if (patientAge !== null) addText(`Idade: ${patientAge} anos`, { size: 10 });
    if (patient?.date_of_birth)
      addText(`Data de Nascimento: ${format(new Date(patient.date_of_birth), "dd/MM/yyyy")}`, { size: 10 });
    if (patient?.phone) addText(`Telefone: ${patient.phone}`, { size: 10 });
    if (patient?.blood_type) addText(`Tipo Sanguíneo: ${patient.blood_type}`, { size: 10 });
    
    yPosition -= 15;

    // Alergias com destaque especial
    if (patient?.allergies && patient.allergies.trim().length > 0) {
      addAllergyWarning(patient.allergies);
    }

    // === CONTEÚDO CLÍNICO ===
    addSection("Queixa Principal", consultation.chief_complaint);
    addSection("História / Anamnese", consultation.history);
    addSection("Diagnóstico", consultation.diagnosis);
    addSection("Plano Terapêutico", consultation.plan);

    // === MEDIDAS ===
    if (
      consultation.weight_kg ||
      consultation.height_cm ||
      consultation.head_circumference_cm
    ) {
      addText("MEDIDAS ANTROPOMÉTRICAS", { size: 13, bold: true, color: rgb(0.2, 0.2, 0.2) });
      yPosition -= 8;
      const measures = [];
      if (consultation.weight_kg) measures.push(`Peso: ${consultation.weight_kg}kg`);
      if (consultation.height_cm) measures.push(`Altura: ${consultation.height_cm}cm`);
      if (consultation.head_circumference_cm) measures.push(`PC: ${consultation.head_circumference_cm}cm`);
      addText(measures.join(' | '), { size: 10 });
      yPosition -= 15;
    }

    // === PRESCRIÇÃO (com remoção de emojis) ===
    if (consultation.prescription && consultation.prescription.trim().length > 0) {
      addText("PRESCRIÇÃO MÉDICA", { size: 13, bold: true, color: rgb(0.2, 0.2, 0.2) });
      yPosition -= 8;
      addText(removeEmojis(consultation.prescription), { size: 10, font: helveticaFont });
      yPosition -= 15;
    }

    // === OBSERVAÇÕES (incluindo Exame Físico e Desenvolvimento) ===
    const observationsContent = [
      consultation.physical_exam ? `Exame Físico:\n${consultation.physical_exam}` : null,
      consultation.development_notes ? `Desenvolvimento:\n${consultation.development_notes}` : null,
      consultation.notes ? `Observações Adicionais:\n${consultation.notes}` : null,
    ].filter(Boolean).join('\n\n');

    if (observationsContent.length > 0) {
      addSection("Observações", observationsContent);
    }

    // === HISTÓRICO (se aplicável) ===
    if (patient?.medical_history && patient.medical_history.trim().length > 0) {
      addSection("Histórico Médico do Paciente", patient.medical_history);
    }

    yPosition -= 10;
    addMainDivider();


    // === RODAPÉ ===
    // Voltar para a última página para adicionar rodapé
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    
    const footerY = 70;
    
    // Linha superior do rodapé
    lastPage.drawLine({
      start: { x: leftMargin, y: footerY + 40 },
      end: { x: rightMargin, y: footerY + 40 },
      thickness: 1.5,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Espaço para carimbo/assinatura (à direita)
    const stampBoxWidth = 180;
    const stampBoxHeight = 60;
    const stampX = rightMargin - stampBoxWidth;
    
    lastPage.drawRectangle({
      x: stampX,
      y: footerY - 15,
      width: stampBoxWidth,
      height: stampBoxHeight,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
    });

    lastPage.drawText("Carimbo e Assinatura", {
      x: stampX + 10,
      y: footerY + 35,
      size: 8,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Informações à esquerda
    lastPage.drawText(
      "Este documento contém informações confidenciais",
      {
        x: leftMargin,
        y: footerY + 25,
        size: 8,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      }
    );

    lastPage.drawText(
      "protegidas por sigilo médico (Art. 73 do CEM).",
      {
        x: leftMargin,
        y: footerY + 15,
        size: 8,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      }
    );

    lastPage.drawText(
      `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      {
        x: leftMargin,
        y: footerY,
        size: 7,
        font: helveticaFont,
        color: rgb(0.6, 0.6, 0.6),
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
