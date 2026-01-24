/**
 * API Route para download de consulta em PDF
 * GET /api/consultations/[id]/download
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PDFDocument } from "pdf-lib";
import { PDFBuilder, COLORS } from "@/lib/pdf/pdf-builder";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


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

    // Buscar dados COMPLETOS do paciente
    const { data: consultation, error } = await supabase
      .from("consultations")
      .select(`
        *,
        patient:patients(
          id, 
          full_name, 
          date_of_birth, 
          cpf, 
          phone, 
          email, 
          allergies, 
          blood_type, 
          medical_history,
          responsible_name,
          responsible_cpf,
          address,
          weight_kg,
          height_cm,
          current_medications,
          notes
        )
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

    // === DADOS DO PACIENTE (Texto Descritivo) ===
    let patientDescription = `Olá, meu nome é ${patient?.full_name || 'N/A'}`;
    
    // Idade
    if (patientAge !== null) {
      patientDescription += ` e tenho ${patientAge} anos de idade`;
    }
    patientDescription += `.`;
    
    // Data de Nascimento
    if (patient?.date_of_birth) {
      patientDescription += ` Nasci em ${format(new Date(patient.date_of_birth), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
    }
    
    // Tipo Sanguíneo
    if (patient?.blood_type) {
      patientDescription += ` e meu tipo sanguíneo é ${patient.blood_type}`;
    }
    patientDescription += `.`;
    
    // Responsável
    if (patient?.responsible_name) {
      patientDescription += ` Meu responsável é ${patient.responsible_name}`;
      if (patient?.responsible_cpf) {
        patientDescription += ` (CPF: ${patient.responsible_cpf})`;
      }
      patientDescription += `.`;
    }
    
    // Contato
    if (patient?.phone) {
      patientDescription += ` Para contato, o telefone é ${patient.phone}`;
      if (patient?.email) {
        patientDescription += ` e o e-mail é ${patient.email}`;
      }
      patientDescription += `.`;
    } else if (patient?.email) {
      patientDescription += ` Para contato, o e-mail é ${patient.email}.`;
    }
    
    // Endereço
    if (patient?.address) {
      patientDescription += ` Resido em: ${patient.address}.`;
    }
    
    // Medidas atuais do cadastro do paciente (se disponíveis)
    if (patient?.weight_kg || patient?.height_cm) {
      patientDescription += ` Minhas medidas cadastradas são:`;
      if (patient?.weight_kg) {
        patientDescription += ` peso de ${patient.weight_kg}kg`;
      }
      if (patient?.height_cm) {
        patientDescription += ` e altura de ${patient.height_cm}cm`;
      }
      patientDescription += `.`;
    }
    
    // Medicações atuais
    if (patient?.current_medications) {
      patientDescription += ` Atualmente faço uso de: ${patient.current_medications}.`;
    }

    builder.addSection("Dados do Paciente", patientDescription);

    // === ALERGIAS (se houver) ===
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
    if (consultation.notes) observations += `${consultation.notes}`;
    
    if (observations.trim()) {
      builder.addSection("Observações Adicionais", observations.trim());
    }
      builder.moveDown(10);

    // === HISTÓRICO MÉDICO ===
    if (patient?.medical_history) {
      builder.addSection("Histórico Médico do Paciente", patient.medical_history);
    }

    // === RODAPÉ (inclui logo) ===
    await builder.addFooter();

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
