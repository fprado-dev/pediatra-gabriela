/**
 * Gerador de PDF de Consultas
 * Responsável por toda a lógica de montagem e formatação do PDF
 */

import { PDFDocument } from "pdf-lib";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PDFBuilder, COLORS } from "./pdf-builder";

interface PatientData {
  id: string;
  full_name: string;
  date_of_birth?: string;
  cpf?: string;
  phone?: string;
  email?: string;
  allergies?: string;
  blood_type?: string;
  medical_history?: string;
  responsible_name?: string;
  responsible_cpf?: string;
  address?: string;
  weight_kg?: number;
  height_cm?: number;
  current_medications?: string;
  notes?: string;
}

interface ConsultationData {
  id: string;
  created_at: string;
  chief_complaint?: string;
  history?: string;
  physical_exam?: string;
  diagnosis?: string;
  plan?: string;
  prescription?: string;
  weight_kg?: number;
  height_cm?: number;
  head_circumference_cm?: number;
  development_notes?: string;
  prenatal_perinatal_history?: string;
  notes?: string;
  raw_transcription?: string;
  patient: PatientData[];
}

interface ProfileData {
  full_name?: string;
  crm?: string;
  specialty?: string;
}

/**
 * Calcula idade a partir da data de nascimento
 */
function calculateAge(dateOfBirth: string): number | null {
  try {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  } catch {
    return null;
  }
}

/**
 * Formata texto descritivo dos dados do paciente
 */
function formatPatientDescription(patient: PatientData, patientAge: number | null): string {
  let description = `Olá, meu nome é ${patient?.full_name || 'N/A'}`;

  // Idade
  if (patientAge !== null) {
    description += ` e tenho ${patientAge} anos de idade`;
  }
  description += `.`;

  // Data de Nascimento
  if (patient?.date_of_birth) {
    description += ` Nasci em ${format(new Date(patient.date_of_birth), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
  }

  // Tipo Sanguíneo
  if (patient?.blood_type) {
    description += ` e meu tipo sanguíneo é ${patient.blood_type}`;
  }
  description += `.`;

  // Responsável
  if (patient?.responsible_name) {
    description += ` Meu responsável é ${patient.responsible_name}`;
    if (patient?.responsible_cpf) {
      description += ` (CPF: ${patient.responsible_cpf})`;
    }
    description += `.`;
  }

  // Contato
  if (patient?.phone) {
    description += ` Para contato, o telefone é ${patient.phone}`;
    description += `.`;
  }

  // Endereço
  if (patient?.address) {
    description += ` Resido em: ${patient.address}.`;
  }

  return description;
}

/**
 * Adiciona cabeçalho do PDF
 */
async function addPDFHeader(
  builder: PDFBuilder,
  profile: ProfileData | null,
  consultationDate: string
) {
  // Logo
  const logoHeight = await builder.drawLogo();

  // Ajustar posição Y para alinhar com a logo
  const titleStartY = builder.yPosition;
  builder.yPosition = titleStartY - (logoHeight > 0 ? 10 : 0);

  // Título principal
  builder.drawText("PRONTUÁRIO MÉDICO PEDIÁTRICO", {
    size: 18,
    bold: true,
    align: 'center',
    color: COLORS.primary,
  });
  builder.moveDown(8);

  // Dados do médico
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

  // Data da consulta
  builder.drawText(
    `Consulta realizada em: ${format(new Date(consultationDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
    {
      size: 10,
      align: 'center',
      color: COLORS.gray,
    }
  );
  builder.moveDown(15);

  // Linha divisória
  builder.drawLine();
}

/**
 * Adiciona seção de dados do paciente
 */
function addPatientSection(
  builder: PDFBuilder,
  patient: PatientData,
  patientAge: number | null
) {
  const patientDescription = formatPatientDescription(patient, patientAge);
  builder.addSection("Dados do Paciente", patientDescription);
}

/**
 * Adiciona alerta de alergias
 */
function addAllergiesWarning(builder: PDFBuilder, patient: PatientData) {
  if (patient?.allergies) {
    builder.addAllergyWarning(patient.allergies);
    builder.moveDown(10);
  }
}

/**
 * Adiciona seção de medicações atuais
 */
function addCurrentMedicationsSection(builder: PDFBuilder, patient: PatientData) {
  if (patient?.current_medications) {
    builder.addSection("Medicações Atuais", patient.current_medications);
    builder.moveDown(10);
  }
}

/**
 * Adiciona seções clínicas da consulta
 */
function addClinicalSections(builder: PDFBuilder, consultation: ConsultationData) {
  builder.addSection("Queixa Principal", consultation.chief_complaint || null);
  builder.addSection("História / Anamnese", consultation.history || null);
  builder.addSection("Diagnóstico", consultation.diagnosis || null);
  builder.addSection("Plano Terapêutico", consultation.plan || null);
}

/**
 * Adiciona seção de medidas antropométricas
 */
function addMeasurementsSection(builder: PDFBuilder, consultation: ConsultationData) {
  if (consultation.weight_kg || consultation.height_cm || consultation.head_circumference_cm) {
    let measures = "";

    if (consultation.weight_kg) {
      measures += `Peso: ${consultation.weight_kg} kg | Altura: ${consultation.height_cm} cm | `;
    }

    if (consultation.head_circumference_cm) {
      measures += `Perímetro Cefálico: ${consultation.head_circumference_cm} cm`;
    }

    builder.addSection("Medidas Antropométricas", measures);
  }
}

/**
 * Adiciona seção de prescrição médica
 */
function addPrescriptionSection(builder: PDFBuilder, consultation: ConsultationData) {
  if (consultation.prescription) {
    builder.addSection("Prescrição Médica", consultation.prescription || null, {
      preformatted: true,
      size: 9,
    });
  }
}

/**
 * Adiciona seção de observações adicionais
 */
function addObservationsSection(builder: PDFBuilder, consultation: ConsultationData) {
  let observations = "";

  if (consultation.physical_exam) {
    observations += `Exame Físico:\n${consultation.physical_exam}\n\n`;
  }

  if (consultation.prenatal_perinatal_history) {
    observations += `⚠️ HISTÓRICO GESTACIONAL E PERINATAL (CRÍTICO):\n${consultation.prenatal_perinatal_history}\n\n`;
  }

  if (consultation.development_notes) {
    observations += `Desenvolvimento:\n${consultation.development_notes}\n\n`;
  }

  if (consultation.notes) {
    observations += `${consultation.notes}`;
  }

  if (observations.trim()) {
    builder.addSection("Observações Adicionais", observations.trim());
  }

  builder.moveDown(10);
}

/**
 * Adiciona seção de transcrição com identificação de falantes (se disponível)
 */
function addSpeakerTranscriptionSection(builder: PDFBuilder, consultation: ConsultationData) {
  // Verificar se tem diarização
  if (consultation.raw_transcription?.includes("[Speaker")) {
    builder.addTitle("Transcrição com Identificação de Falantes", 14);
    builder.moveDown(0.3);
    builder.addText("Conversação completa com identificação automática de participantes:", 9);
    builder.moveDown(0.3);

    const lines = consultation.raw_transcription.split("\n\n");
    lines.forEach((line: string) => {
      const match = line.match(/^\[([^\]]+)\]:\s*(.+)$/s);
      if (match) {
        const [, speaker, text] = match;
        const speakerNum = speaker.match(/Speaker (\d+)/)?.[1];

        // Identificar o papel do speaker
        let roleLabel = "";
        if (speakerNum === "1") {
          roleLabel = " (Médica)";
        } else if (speakerNum === "2") {
          roleLabel = " (Mãe/Responsável)";
        }

        builder.addText(`${speaker}${roleLabel}:`, 9, COLORS.primary);
        builder.moveDown(0.1);
        builder.addText(text, 9);
        builder.moveDown(0.25);
      }
    });

    builder.moveDown(0.5);
  }
}

/**
 * Adiciona seção de histórico médico do paciente
 */
function addMedicalHistorySection(builder: PDFBuilder, patient: PatientData) {
  if (patient?.medical_history) {
    builder.addSection("Histórico Médico do Paciente", patient.medical_history);
  }
}

/**
 * Gera PDF completo da consulta
 */
export async function generateConsultationPDF(
  consultation: ConsultationData,
  profile: ProfileData | null
): Promise<Buffer> {
  console.log("📄 Iniciando geração de PDF profissional...");

  // Extrair dados do paciente (sempre vem como array do Supabase)
  const patient = Array.isArray(consultation.patient)
    ? consultation.patient[0]
    : consultation.patient;

  // Calcular idade do paciente
  const patientAge = patient?.date_of_birth
    ? calculateAge(patient.date_of_birth)
    : null;

  // Criar documento PDF
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Consulta - ${patient?.full_name || "Paciente"}`);
  pdfDoc.setAuthor(profile?.full_name || "Médico");
  pdfDoc.setSubject("Prontuário Médico Pediátrico");

  // Criar builder
  const builder = new PDFBuilder(pdfDoc);
  await builder.loadFonts();

  // === MONTAR PDF ===

  // Cabeçalho
  await addPDFHeader(builder, profile, consultation.created_at);

  // Dados do Paciente
  addPatientSection(builder, patient, patientAge);

  // Alergias (se houver)
  addAllergiesWarning(builder, patient);

  // Medicações Atuais (se houver)
  addCurrentMedicationsSection(builder, patient);

  // Seções Clínicas
  addClinicalSections(builder, consultation);

  // Medidas Antropométricas
  addMeasurementsSection(builder, consultation);

  // Prescrição Médica
  addPrescriptionSection(builder, consultation);

  // Observações Adicionais
  addObservationsSection(builder, consultation);

  // Transcrição com Falantes (se disponível)
  addSpeakerTranscriptionSection(builder, consultation);

  // Histórico Médico
  addMedicalHistorySection(builder, patient);

  // Rodapé
  await builder.addFooter();

  // === GERAR BYTES ===
  console.log("📦 Gerando bytes do PDF...");
  const pdfBytes = await pdfDoc.save();
  console.log(`✅ PDF gerado: ${pdfBytes.length} bytes`);

  return Buffer.from(pdfBytes);
}

/**
 * Gera nome do arquivo PDF
 */
export function generatePDFFileName(
  patientName: string,
  consultationDate: string
): string {
  const sanitizedName = patientName.replace(/\s+/g, "_");
  const formattedDate = format(new Date(consultationDate), "yyyyMMdd");
  return `Consulta_${sanitizedName}_${formattedDate}.pdf`;
}
