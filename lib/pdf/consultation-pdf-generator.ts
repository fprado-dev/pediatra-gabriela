/**
 * Gerador de PDF de Consultas
 * Responsável por toda a lógica de montagem e formatação do PDF
 */

import { PDFDocument, rgb } from "pdf-lib";
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
  hma?: string;
  history?: string;
  family_history?: string;
  physical_exam?: string;
  diagnosis?: string;
  conduct?: string;
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
 * Calcula idade detalhada a partir da data de nascimento
 */
function calculateDetailedAge(dateOfBirth: string): string | null {
  try {
    const birth = new Date(dateOfBirth);
    const today = new Date();

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    // Formatação baseada na idade
    if (years === 0 && months === 0) {
      return `${days} ${days === 1 ? 'dia' : 'dias'}`;
    } else if (years === 0) {
      if (days === 0) {
        return `${months} ${months === 1 ? 'mes' : 'meses'}`;
      }
      return `${months} ${months === 1 ? 'mes' : 'meses'} e ${days} ${days === 1 ? 'dia' : 'dias'}`;
    } else {
      if (months === 0) {
        return `${years} ${years === 1 ? 'ano' : 'anos'}`;
      }
      return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
  } catch {
    return null;
  }
}

/**
 * Adiciona dados complementares do paciente
 */
function addPatientDetails(builder: PDFBuilder, patient: PatientData) {
  let hasDetails = false;

  // Tipo Sanguíneo e Alergias em destaque
  if (patient.blood_type || patient.allergies) {
    builder.drawText("INFORMACOES IMPORTANTES", {
      size: 11,
      bold: true,
      color: COLORS.textLight,
    });
    builder.moveDown(5);

    if (patient.blood_type) {
      builder.drawText(`Tipo Sanguineo: ${patient.blood_type}`, {
        size: 9,
        color: COLORS.text,
      });
      builder.moveDown(3);
      hasDetails = true;
    }

    if (patient.allergies) {
      builder.drawText(`Alergias: ${patient.allergies}`, {
        size: 9,
        color: rgb(0.8, 0.2, 0.2), // Vermelho para alergias
        bold: true,
      });
      builder.moveDown(3);
      hasDetails = true;
    }
  }

  // Contato e Endereço
  if (patient.phone || patient.address) {
    if (hasDetails) builder.moveDown(5);

    builder.drawText("CONTATO", {
      size: 11,
      bold: true,
      color: COLORS.textLight,
    });
    builder.moveDown(5);

    if (patient.phone) {
      builder.drawText(`Telefone: ${patient.phone}`, {
        size: 9,
        color: COLORS.text,
      });
      builder.moveDown(3);
    }

    if (patient.address) {
      builder.drawText(`Endereco: ${patient.address}`, {
        size: 9,
        color: COLORS.text,
      });
      builder.moveDown(3);
    }
    hasDetails = true;
  }

  if (hasDetails) {
    builder.moveDown(10);
    builder.drawLine();
  }
}

/**
 * Adiciona cabeçalho do PDF
 */
async function addPDFHeader(
  builder: PDFBuilder,
  profile: ProfileData | null,
  consultationDate: string,
  patient: PatientData,
  patientAge: string | null
) {
  // Logo
  const logoHeight = await builder.drawLogo();

  // Ajustar posição Y para alinhar com a logo
  const titleStartY = builder.yPosition;
  builder.yPosition = titleStartY - (logoHeight > 0 ? 10 : 0);

  // Título principal
  builder.drawText("PRONTUÁRIO MÉDICO PEDIÁTRICO", {
    size: 16,
    bold: true,
    align: 'center',
    color: COLORS.primary,
  });
  builder.moveDown(5);

  // Dados do médico
  if (profile?.full_name) {
    builder.drawText(
      `${profile.full_name} - CRM: ${profile.crm || 'N/A'}`,
      {
        size: 9,
        align: 'center',
        color: COLORS.gray,
      }
    );
    builder.moveDown(10);
  }

  // Linha divisória
  builder.drawLine();
  builder.moveDown(5);

  // Nome do Paciente (destaque)
  builder.drawText(patient.full_name, {
    size: 18,
    bold: true,
    color: COLORS.text,
  });
  builder.moveDown(8);

  // Informações do paciente em linha
  let patientInfo = "";

  if (patient.date_of_birth) {
    patientInfo += `Nascimento: ${format(new Date(patient.date_of_birth), "dd/MM/yyyy", { locale: ptBR })}`;
    if (patientAge) {
      patientInfo += ` (${patientAge})`;
    }
  }

  if (patient.responsible_name) {
    if (patientInfo) patientInfo += " | ";
    patientInfo += `Responsavel: ${patient.responsible_name}`;
  }

  if (patientInfo) {
    builder.drawText(patientInfo, {
      size: 9,
      color: COLORS.gray,
    });
    builder.moveDown(5);
  }

  // Data da consulta
  builder.drawText(
    `Data da Consulta: ${format(new Date(consultationDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
    {
      size: 9,
      color: COLORS.gray,
    }
  );
  builder.moveDown(15);

  // Linha divisória
  builder.drawLine();
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
 * Adiciona queixa principal
 */
function addChiefComplaintSection(builder: PDFBuilder, consultation: ConsultationData) {
  if (consultation.chief_complaint) {
    builder.addSection("Queixa Principal", consultation.chief_complaint);
  }
}

/**
 * Adiciona HMA (História da Moléstia Atual)
 */
function addHMASection(builder: PDFBuilder, consultation: ConsultationData) {
  if (consultation.hma) {
    builder.addSection("História da Moléstia Atual (HMA)", consultation.hma);
  }
}

/**
 * Adiciona informações complementares (history)
 */
function addHistorySection(builder: PDFBuilder, consultation: ConsultationData) {
  if (consultation.history) {
    builder.addSection("Informações Complementares", consultation.history);
  }
}

/**
 * Adiciona histórico gestacional e perinatal
 */
function addPrenatalHistorySection(builder: PDFBuilder, consultation: ConsultationData) {
  if (consultation.prenatal_perinatal_history) {
    builder.addSection("HISTORICO GESTACIONAL E PERINATAL (IMPORTANTE)", consultation.prenatal_perinatal_history);
  }
}

/**
 * Adiciona histórico familiar
 */
function addFamilyHistorySection(builder: PDFBuilder, consultation: ConsultationData) {
  if (consultation.family_history) {
    builder.addSection("Histórico Familiar", consultation.family_history);
  }
}

/**
 * Adiciona desenvolvimento neuropsicomotor
 */
function addDevelopmentSection(builder: PDFBuilder, consultation: ConsultationData) {
  if (consultation.development_notes) {
    builder.addSection("Desenvolvimento Neuropsicomotor", consultation.development_notes);
  }
}

/**
 * Adiciona exame físico e medidas antropométricas
 */
function addPhysicalExamSection(builder: PDFBuilder, consultation: ConsultationData) {
  // Medidas antropométricas
  if (consultation.weight_kg || consultation.height_cm || consultation.head_circumference_cm) {
    let measures = "";

    if (consultation.weight_kg) {
      measures += `Peso: ${consultation.weight_kg} kg`;
    }
    if (consultation.height_cm) {
      measures += ` | Altura: ${consultation.height_cm} cm`;
    }
    if (consultation.head_circumference_cm) {
      measures += ` | Perímetro Cefálico: ${consultation.head_circumference_cm} cm`;
    }

    builder.addSection("Medidas Antropométricas", measures.trim());
  }

  // Exame físico
  if (consultation.physical_exam) {
    builder.addSection("Exame Físico", consultation.physical_exam);
  }
}

/**
 * Adiciona diagnóstico
 */
function addDiagnosisSection(builder: PDFBuilder, consultation: ConsultationData) {
  if (consultation.diagnosis) {
    builder.addSection("Hipóteses Diagnósticas", consultation.diagnosis);
  }
}

/**
 * Adiciona conduta
 */
function addConductSection(builder: PDFBuilder, consultation: ConsultationData) {
  if (consultation.conduct) {
    builder.addSection("Conduta", consultation.conduct);
  }
}

/**
 * Adiciona plano terapêutico
 */
function addPlanSection(builder: PDFBuilder, consultation: ConsultationData) {
  if (consultation.plan) {
    builder.addSection("Plano Terapêutico", consultation.plan);
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
 * Adiciona observações adicionais
 */
function addNotesSection(builder: PDFBuilder, consultation: ConsultationData) {
  if (consultation.notes) {
    builder.addSection("Observações Adicionais", consultation.notes);
  }
}

/**
 * Adiciona seção de transcrição com identificação de falantes (se disponível)
 */
function addSpeakerTranscriptionSection(builder: PDFBuilder, consultation: ConsultationData) {
  // Verificar se tem diarização
  if (consultation.raw_transcription?.includes("[Speaker")) {
    // Formatar conteúdo da transcrição
    const lines = consultation.raw_transcription.split("\n\n");
    const formattedContent = lines
      .map((line: string) => {
        const match = line.match(/^\[([^\]]+)\]:\s*(.+)$/);
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

          return `${speaker}${roleLabel}:\n${text}`;
        }
        return null;
      })
      .filter(Boolean)
      .join("\n\n");

    if (formattedContent) {
      builder.addSection(
        "Transcrição com Identificação de Falantes",
        formattedContent,
        { preformatted: true, size: 9 }
      );
    }
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
    ? calculateDetailedAge(patient.date_of_birth)
    : null;

  // Criar documento PDF
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Consulta - ${patient?.full_name || "Paciente"}`);
  pdfDoc.setAuthor(profile?.full_name || "Médico(a)");
  pdfDoc.setSubject("PRONTUÁRIO MÉDICO PEDIÁTRICO");

  // Criar builder
  const builder = new PDFBuilder(pdfDoc);
  await builder.loadFonts();

  // === MONTAR PDF (seguindo ordem da preview) ===

  // Cabeçalho com dados do paciente
  await addPDFHeader(builder, profile, consultation.created_at, patient, patientAge);

  // Dados complementares do paciente (tipo sanguíneo, alergias, contato)
  addPatientDetails(builder, patient);

  // Medicações Atuais (se houver)
  addCurrentMedicationsSection(builder, patient);

  // 1. Queixa Principal
  addChiefComplaintSection(builder, consultation);

  // 2. HMA (História da Moléstia Atual)
  addHMASection(builder, consultation);

  // 3. Informações Complementares
  addHistorySection(builder, consultation);

  // 4. Histórico Gestacional e Perinatal
  addPrenatalHistorySection(builder, consultation);

  // 5. Histórico Familiar
  addFamilyHistorySection(builder, consultation);

  // 6. Desenvolvimento Neuropsicomotor
  addDevelopmentSection(builder, consultation);

  // 7. Exame Físico + Medidas Antropométricas
  addPhysicalExamSection(builder, consultation);

  // 8. Hipóteses Diagnósticas
  addDiagnosisSection(builder, consultation);

  // 9. Conduta
  addConductSection(builder, consultation);

  // 10. Plano Terapêutico
  addPlanSection(builder, consultation);

  // 11. Prescrição Médica (se houver)
  addPrescriptionSection(builder, consultation);

  // 12. Observações Adicionais
  addNotesSection(builder, consultation);

  // 13. Transcrição com Falantes (se disponível)
  addSpeakerTranscriptionSection(builder, consultation);

  // 14. Histórico Médico
  addMedicalHistorySection(builder, patient);

  // Rodapé com Instagram
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
