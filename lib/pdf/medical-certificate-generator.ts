/**
 * Gerador de PDF de Atestados Médicos
 * Responsável por gerar os 4 tipos de atestados
 */

import { PDFDocument } from "pdf-lib";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PDFBuilder, COLORS } from "./pdf-builder";
import type {
  CertificateType,
  CertificateData,
  ComparecimentoCertificateData,
  AptidaoCertificateData,
  AfastamentoCertificateData,
  AcompanhanteCertificateData,
  CERTIFICATE_TYPE_LABELS,
} from "@/lib/types/medical-certificate";

/**
 * Adiciona cabeçalho do atestado
 */
async function addCertificateHeader(
  builder: PDFBuilder,
  title: string,
  data: CertificateData
) {
  // Logo
  const logoHeight = await builder.drawLogo();
  
  const titleStartY = builder.yPosition;
  builder.yPosition = titleStartY - (logoHeight > 0 ? 10 : 0);

  // Título principal
  builder.drawText(title.toUpperCase(), {
    size: 20,
    bold: true,
    align: 'center',
    color: COLORS.primary,
  });
  builder.moveDown(10);

  // Dados do médico
  builder.drawText(data.doctorName, {
    size: 12,
    bold: true,
    align: 'center',
    color: COLORS.textLight,
  });
  builder.moveDown(5);

  builder.drawText(
    `CRM: ${data.doctorCRM}${data.doctorSpecialty ? ` - ${data.doctorSpecialty}` : ''}`,
    {
      size: 10,
      align: 'center',
      color: COLORS.gray,
    }
  );
  builder.moveDown(25);

  // Linha divisória
  builder.drawLine();
  builder.moveDown(10);
}

/**
 * Gera atestado de comparecimento
 */
function generateComparecimentoContent(
  builder: PDFBuilder,
  data: ComparecimentoCertificateData
) {
  const consultationDate = format(
    new Date(data.consultationDate),
    "dd 'de' MMMM 'de' yyyy",
    { locale: ptBR }
  );

  let content = `Atesto para os devidos fins que ${data.patientName}, nascido(a) em ${format(
    new Date(data.patientDateOfBirth),
    "dd/MM/yyyy"
  )}, esteve sob meus cuidados médicos no dia ${consultationDate}`;

  if (data.startTime && data.endTime) {
    content += ` das ${data.startTime} às ${data.endTime}`;
  }

  content += `.`;

  builder.drawText(content, {
    size: 12,
  });
  builder.moveDown(20);

  if (data.observations) {
    builder.drawText("Observações:", {
      size: 11,
      bold: true,
    });
    builder.moveDown(8);
    builder.drawText(data.observations, {
      size: 11,
    });
    builder.moveDown(20);
  }
}

/**
 * Gera atestado de aptidão física
 */
function generateAptidaoContent(
  builder: PDFBuilder,
  data: AptidaoCertificateData
) {
  let content = `Atesto que ${data.patientName}, nascido(a) em ${format(
    new Date(data.patientDateOfBirth),
    "dd/MM/yyyy"
  )}, encontra-se APTO(A) para a prática de ${data.activityType}.`;

  builder.drawText(content, {
    size: 12,
  });
  builder.moveDown(15);

  if (data.validUntil) {
    builder.drawText(
      `Validade: ${format(new Date(data.validUntil), "dd/MM/yyyy")}`,
      {
        size: 11,
        bold: true,
      }
    );
    builder.moveDown(15);
  }

  if (data.observations) {
    builder.drawText("Observações:", {
      size: 11,
      bold: true,
    });
    builder.moveDown(8);
    builder.drawText(data.observations, {
      size: 11,
    });
    builder.moveDown(20);
  }
}

/**
 * Gera atestado médico (afastamento)
 */
function generateAfastamentoContent(
  builder: PDFBuilder,
  data: AfastamentoCertificateData
) {
  const startDate = format(new Date(data.startDate), "dd/MM/yyyy");
  const dayWord = data.days === 1 ? "dia" : "dias";

  let content = `Atesto que ${data.patientName}, nascido(a) em ${format(
    new Date(data.patientDateOfBirth),
    "dd/MM/yyyy"
  )}, necessita afastamento de suas atividades ${data.activityType} pelo período de ${data.days} ${dayWord}, a contar de ${startDate}.`;

  builder.drawText(content, {
    size: 12,
  });
  builder.moveDown(15);

  if (data.cid10) {
    builder.drawText(`CID-10: ${data.cid10}`, {
      size: 11,
      bold: true,
    });
    builder.moveDown(15);
  }

  const recommendation = data.canLeaveHome
    ? "✓ Pode sair de casa"
    : "✓ Deve permanecer em repouso domiciliar";

  builder.drawText(recommendation, {
    size: 11,
  });
  builder.moveDown(20);

  if (data.observations) {
    builder.drawText("Observações:", {
      size: 11,
      bold: true,
    });
    builder.moveDown(8);
    builder.drawText(data.observations, {
      size: 11,
    });
    builder.moveDown(20);
  }
}

/**
 * Gera atestado de acompanhante
 */
function generateAcompanhanteContent(
  builder: PDFBuilder,
  data: AcompanhanteCertificateData
) {
  const consultationDate = format(
    new Date(data.consultationDate),
    "dd 'de' MMMM 'de' yyyy",
    { locale: ptBR }
  );

  let content = `Atesto que ${data.responsibleName} acompanhou ${data.patientName} em consulta médica no dia ${consultationDate}`;

  if (data.startTime && data.endTime) {
    content += ` das ${data.startTime} às ${data.endTime}`;
  }

  content += `.`;

  builder.drawText(content, {
    size: 12,
  });
  builder.moveDown(20);

  if (data.observations) {
    builder.drawText("Observações:", {
      size: 11,
      bold: true,
    });
    builder.moveDown(8);
    builder.drawText(data.observations, {
      size: 11,
    });
    builder.moveDown(20);
  }
}

/**
 * Adiciona rodapé com local, data e assinatura
 */
function addCertificateFooter(builder: PDFBuilder, data: CertificateData) {
  // Espaçamento para assinatura
  builder.moveDown(40);

  // Local e data
  const city = data.city || "São Paulo";
  const issueDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  builder.drawText(`${city}, ${issueDate}`, {
    size: 11,
    align: 'center',
  });
  builder.moveDown(40);

  // Linha para assinatura (usando caracteres underscore)
  builder.drawText("_".repeat(50), {
    size: 10,
    align: 'center',
    color: COLORS.text,
  });
  builder.moveDown(8);

  // Dados do médico para assinatura
  builder.drawText(data.doctorName, {
    size: 10,
    align: 'center',
    bold: true,
  });
  builder.moveDown(5);

  builder.drawText(`CRM: ${data.doctorCRM}`, {
    size: 9,
    align: 'center',
    color: COLORS.gray,
  });
}

/**
 * Gera PDF do atestado médico
 */
export async function generateMedicalCertificatePDF(
  certificateType: CertificateType,
  data: CertificateData
): Promise<Buffer> {
  console.log(`📄 Gerando atestado: ${certificateType}...`);

  // Criar documento PDF
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(getTitleForType(certificateType));
  pdfDoc.setAuthor(data.doctorName);
  pdfDoc.setSubject("Atestado Médico");

  // Criar builder
  const builder = new PDFBuilder(pdfDoc);
  await builder.loadFonts();

  // === MONTAR PDF ===

  // Cabeçalho
  await addCertificateHeader(builder, getTitleForType(certificateType), data);

  // Conteúdo específico por tipo
  switch (certificateType) {
    case "comparecimento":
      generateComparecimentoContent(
        builder,
        data as ComparecimentoCertificateData
      );
      break;
    case "aptidao":
      generateAptidaoContent(builder, data as AptidaoCertificateData);
      break;
    case "afastamento":
      generateAfastamentoContent(builder, data as AfastamentoCertificateData);
      break;
    case "acompanhante":
      generateAcompanhanteContent(
        builder,
        data as AcompanhanteCertificateData
      );
      break;
  }

  // Rodapé com assinatura
  addCertificateFooter(builder, data);

  // === GERAR BYTES ===
  console.log("📦 Gerando bytes do PDF...");
  const pdfBytes = await pdfDoc.save();
  console.log(`✅ Atestado gerado: ${pdfBytes.length} bytes`);

  return Buffer.from(pdfBytes);
}

/**
 * Gera nome do arquivo PDF
 */
export function generateCertificatePDFFileName(
  certificateType: CertificateType,
  patientName: string
): string {
  const sanitizedName = patientName.replace(/\s+/g, "_");
  const formattedDate = format(new Date(), "yyyyMMdd");
  const typeSlug = certificateType.replace(/[^a-z]/g, "");
  return `Atestado_${typeSlug}_${sanitizedName}_${formattedDate}.pdf`;
}

/**
 * Helper: Get title for certificate type
 */
function getTitleForType(type: CertificateType): string {
  const titles: Record<CertificateType, string> = {
    comparecimento: "Atestado de Comparecimento",
    aptidao: "Atestado de Aptidão Física",
    afastamento: "Atestado Médico",
    acompanhante: "Atestado de Acompanhante",
  };
  return titles[type];
}
