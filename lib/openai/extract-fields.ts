import { openai } from "./client";
import { ConsultationType, PuericulturaSubtype, PreviousConsultationSummary } from "@/lib/types/consultation";

interface PatientContext {
  patientName?: string;
  patientAge?: number | null;
  weight?: number | null;
  height?: number | null;
  headCircumference?: number | null;
  allergies?: string | null;
  bloodType?: string | null;
  medicalHistory?: string | null;
  currentMedications?: string | null;
}

export interface ConsultationFields {
  // Estrutura APS (Atenção Primária à Saúde)
  
  // DADOS SUBJETIVOS
  chief_complaint: string | null;
  hma: string | null; // História da Moléstia Atual (foco na queixa atual)
  history: string | null; // Informações complementares de contexto
  family_history: string | null;
  prenatal_perinatal_history: string | null;
  
  // DADOS OBJETIVOS
  physical_exam: string | null;
  weight_kg: number | null;
  weight_source?: "audio" | "profile" | null;
  height_cm: number | null;
  height_source?: "audio" | "profile" | null;
  head_circumference_cm: number | null;
  head_circumference_source?: "audio" | "profile" | null;
  development_notes: string | null;
  
  // AVALIAÇÃO
  diagnosis: string | null;
  diagnosis_is_ai_suggestion?: boolean;
  
  // PLANO DE CUIDADO
  conduct: string | null; // Ações imediatas, exames, encaminhamentos
  plan: string | null; // Plano terapêutico
  notes: string | null;
  medication_alerts?: string | null;

  // ATUALIZAÇÕES DO CADASTRO DO PACIENTE (se mencionadas no áudio)
  patient_updates?: {
    allergies?: string | null;
    current_medications?: string | null;
    blood_type?: string | null;
    medical_history?: string | null;
  };

  // Metadata de análise
  speaker_analysis?: {
    mother_statements: string[];
    doctor_statements: string[];
  };
  quality_score?: number;
}

const MIN_WORDS_FOR_EXTRACTION = 10; // Reduzido de 20 para aceitar consultas mais curtas

/**
 * Extrai campos estruturados de uma consulta médica seguindo metodologia APS
 * @param cleanedText - Texto limpo e processado
 * @param context - Contexto do paciente para melhorar a análise
 * @param consultationType - Tipo de consulta (puericultura, urgencia_emergencia, consulta_rotina)
 * @param consultationSubtype - Subtipo de puericultura (se aplicável)
 * @param previousConsultations - Histórico das últimas consultas do paciente
 * @returns Campos estruturados da consulta seguindo metodologia APS
 */
export async function extractConsultationFields(
  cleanedText: string,
  context?: PatientContext,
  consultationType?: ConsultationType,
  consultationSubtype?: PuericulturaSubtype | null,
  previousConsultations?: PreviousConsultationSummary[]
): Promise<ConsultationFields> {
  if (!cleanedText || cleanedText.trim().length === 0) {
    throw new Error("Texto para extração está vazio");
  }

  // Validar quantidade mínima de palavras
  const wordCount = cleanedText.trim().split(/\s+/).length;
  if (wordCount < MIN_WORDS_FOR_EXTRACTION) {
    throw new Error(
      `DADOS_INSUFICIENTES: O áudio não contém informações médicas suficientes para processar a consulta. ` +
      `Foram detectadas apenas ${wordCount} palavras. Por favor, grave novamente com mais detalhes sobre a consulta.`
    );
  }

  try {
    console.log("🤖 Iniciando extração de campos estruturados...");
    console.log(`📊 Input: ${cleanedText.length} caracteres, ${wordCount} palavras`);

    // Criar contexto rico do paciente
    let patientContextText = "";
    if (context) {
      patientContextText = "\n\n=== DADOS DO PACIENTE (do cadastro) ===\n";

      if (context.patientName) {
        patientContextText += `- Nome: ${context.patientName}\n`;
      }
      if (context.patientAge !== null && context.patientAge !== undefined) {
        patientContextText += `- Idade: ${context.patientAge} anos\n`;
      }
      if (context.weight) {
        patientContextText += `- Peso cadastrado: ${context.weight} kg\n`;
      }
      if (context.height) {
        patientContextText += `- Altura cadastrada: ${context.height} cm\n`;
      }
      if (context.headCircumference) {
        patientContextText += `- Perímetro cefálico cadastrado: ${context.headCircumference} cm\n`;
      }
      if (context.bloodType) {
        patientContextText += `- Tipo sanguíneo: ${context.bloodType}\n`;
      }
      if (context.allergies) {
        patientContextText += `- ⚠️ ALERGIAS: ${context.allergies}\n`;
      }
      if (context.medicalHistory) {
        patientContextText += `- Histórico médico prévio: ${context.medicalHistory}\n`;
      }
      if (context.currentMedications) {
        patientContextText += `- Medicações em uso contínuo: ${context.currentMedications}\n`;
      }
    }

    // Criar contexto de histórico de consultas anteriores
    let previousConsultationsText = "";
    if (previousConsultations && previousConsultations.length > 0) {
      previousConsultationsText = "\n\n=== HISTÓRICO DE CONSULTAS ANTERIORES ===\n";
      previousConsultationsText += "IMPORTANTE: Use essas informações para contextualizar a consulta atual.\n\n";
      
      previousConsultations.forEach((prevConsult, index) => {
        const isLastConsult = index === 0; // Primeira é a mais recente
        previousConsultationsText += `${isLastConsult ? '🔴 ÚLTIMA CONSULTA' : `Consulta ${index + 1}`} (${prevConsult.date}):\n`;
        prevConsult.key_points.forEach(point => {
          previousConsultationsText += `  • ${point}\n`;
        });
        previousConsultationsText += `  Diagnóstico: ${prevConsult.diagnosis}\n\n`;
      });
      
      previousConsultationsText += "💡 Relacione queixas atuais com orientações/diagnósticos anteriores quando relevante.\n";
    }
    
    // Criar contexto específico por tipo de consulta
    let consultationTypeContext = "";
    if (consultationType) {
      consultationTypeContext = `\n\n=== TIPO DE CONSULTA ===\n`;
      consultationTypeContext += `Tipo: ${consultationType.toUpperCase()}`;
      if (consultationSubtype) {
        consultationTypeContext += ` - ${consultationSubtype}`;
      }
      consultationTypeContext += "\n\n";
      
      // Adaptar foco baseado no tipo
      if (consultationType === 'puericultura') {
        consultationTypeContext += `FOCO PUERICULTURA:
- Desenvolvimento neuropsicomotor e marcos esperados
- Curvas de crescimento (peso, altura, PC - sempre incluir percentis se possível)
- Alimentação (aleitamento materno, introdução alimentar, aceitação)
- Sono e rotina
- Orientações preventivas
- Calendário vacinal
- HMA deve incluir: rotina alimentar, sono, evacuações, comportamento\n`;
        
        if (consultationSubtype === 'primeira_rn') {
          consultationTypeContext += `\n⚠️ PRIMEIRA CONSULTA RN (7-10 dias):
- OBRIGATÓRIO verificar histórico gestacional/perinatal
- Avaliar aleitamento materno (pega, frequência, produção)
- Icterícia neonatal
- Perda de peso fisiológica
- Coto umbilical
- Triagem neonatal (teste do pezinho, orelhinha, olhinho)\n`;
        }
      } else if (consultationType === 'urgencia_emergencia') {
        consultationTypeContext += `FOCO URGÊNCIA/EMERGÊNCIA:
- Cronologia PRECISA dos sintomas (hora de início exata)
- Sinais de gravidade e alerta
- Evolução aguda do quadro
- Fatores desencadeantes
- Conduta deve enfatizar urgência e critérios de retorno imediato
- HMA deve ter: início exato, progressão hora a hora se possível, fatores agravantes\n`;
      } else if (consultationType === 'consulta_rotina') {
        consultationTypeContext += `FOCO CONSULTA DE ROTINA:
- Revisão de sistemas completa
- Atualização de histórico médico
- Rastreamento de problemas comuns
- Orientações preventivas
- HMA pode ser mais breve se sem queixas agudas específicas\n`;
      }
    }

    const prompt = `=== ROLE ===
Você é uma médica pediatra especialista em APS (Atenção Primária à Saúde) com 20+ anos de experiência em:
- Documentação clínica pediátrica segundo padrões da SBP (Sociedade Brasileira de Pediatria)
- Metodologia APS adaptada para pediatria
- Processamento de consultas gravadas ao vivo
- Extração estruturada de dados clínicos com alta precisão
${patientContextText}
${consultationTypeContext}
${previousConsultationsText}

=== CONTEXTO DA TAREFA ===
Você receberá a transcrição de uma consulta pediátrica gravada AO VIVO durante o atendimento.
A gravação contém um DIÁLOGO entre a mãe/responsável e a médica pediatra.

Seu objetivo é extrair campos clínicos estruturados seguindo metodologia APS (Atenção Primária à Saúde).

=== INSTRUÇÕES PASSO A PASSO (Chain-of-Thought) ===

**ETAPA 1: EXTRAIR DADOS DO CADASTRO E ATUALIZAÇÕES**
⚠️ REGRA PRIORITÁRIA PARA TODOS OS CAMPOS: SEMPRE usar dados do CADASTRO como base inicial.

**Para MEDIDAS ANTROPOMÉTRICAS (peso, altura, PC):**
- PRIORIDADE 1: Use SEMPRE os valores do CADASTRO se disponíveis (marque source como "profile")
- PRIORIDADE 2: Se o ÁUDIO mencionar valores DIFERENTES do cadastro → use o novo valor e marque source como "audio" (isso indica atualização)
- Se não há dados no cadastro NEM no áudio → retorne null
- IMPORTANTE: Não invente valores. Se o áudio diz "peso igual" ou "mantém o peso", use o valor do cadastro.

**Para CAMPOS CLÍNICOS (alergias, histórico familiar, medicações, etc):**
- Use SEMPRE os dados do CADASTRO como base
- Se o ÁUDIO mencionar NOVAS informações ou ATUALIZAÇÕES → extraia e combine com os dados existentes
- Indique mudanças através de marcadores especiais no texto:
  * "[NOVA]" no início para informações totalmente novas
  * "[ATUALIZAÇÃO]" para modificações/adições às informações existentes
  * Sem marcador se apenas confirma o que já estava no cadastro

**ETAPA 2: ESTRUTURAR SEGUNDO APS**

**DADOS SUBJETIVOS (O que foi relatado):**
- chief_complaint: Queixa principal clara e objetiva (mínimo 30 caracteres)
  * Ex: "Febre há 3 dias associada a tosse produtiva"
  
- hma: História da Moléstia Atual FOCADA NA QUEIXA ATUAL
  * ⚠️ FOCO: Sintomas da consulta atual apenas
  * Início dos sintomas (quando começou, como começou)
  * Evolução temporal (progressão, intensidade)
  * Fatores de melhora/piora
  * Sintomas associados
  * Cronologia específica do quadro atual
  * Uso de medicamentos para sintomas atuais
  * Escala de dor se aplicável
  
- history: Informações COMPLEMENTARES de contexto (não relacionadas à queixa atual)
  * ⚠️ FOCO: Contexto geral, não os sintomas atuais
  * Rotina alimentar (se não relacionado à queixa)
  * Padrão de sono e comportamento habitual
  * Hábitos intestinais de base
  * Informações de desenvolvimento não relacionadas à queixa
  * Histórico médico do cadastro se relevante
  * SOMENTE preencher se houver informações complementares distintas da HMA
  
- family_history: Histórico familiar relevante
  * Doenças hereditárias, alergias familiares
  * Condições crônicas em pais/irmãos
  * Só preencher se mencionado
  
- prenatal_perinatal_history: 🔴 CRÍTICO se mencionado
  * Gestação (intercorrências, diabetes gestacional, hipertensão, infecções)
  * Parto (tipo, complicações, sofrimento fetal)
  * Perinatal (peso ao nascer, prematuridade, UTI neonatal, icterícia)

**DADOS OBJETIVOS (O que foi observado/medido):**
- physical_exam: Exame físico ESTRUTURADO por sistemas com terminologia médica
  * Estado geral
  * Sinais vitais (se mencionados)
  * Exame por sistemas: COONG, cardiovascular, respiratório, digestivo, pele
  * Se exame não explícito mas consulta ocorreu, inferir achados normais relevantes
  
- weight_kg, height_cm, head_circumference_cm: Medidas com source
- development_notes: Desenvolvimento neuropsicomotor observado

**AVALIAÇÃO:**
- diagnosis: Hipótese diagnóstica ESPECÍFICA (nunca vaga)
  * PROIBIDO: "virose", "possível infecção", termos genéricos
  * OBRIGATÓRIO: Nomenclatura médica precisa
  * Ex: "Rinofaringite viral aguda", "Bronquiolite viral", "Dermatite atópica leve"
  
- diagnosis_is_ai_suggestion: true se inferiu; false se médica disse explicitamente

**PLANO DE CUIDADO:**
- conduct: Ações imediatas, exames solicitados, encaminhamentos
  * Ex: "Solicitados hemograma e PCR. Encaminhamento para avaliação otorrinolaringológica"
  
- plan: Plano terapêutico DETALHADO
  * Medicações (nome comercial/genérico, dose mg/kg, frequência, duração)
  * Medidas não-farmacológicas
  * Orientações aos pais
  * Sinais de alerta para retorno
  * Seguimento/retorno agendado
  
- notes: Observações adicionais relevantes
- medication_alerts: ⚠️ Verificar alergias e interações

**ATUALIZAÇÕES DO CADASTRO DO PACIENTE:**
⚠️ IMPORTANTE: Se o áudio mencionar NOVAS informações que devem atualizar o cadastro do paciente, preencha o objeto patient_updates:
- patient_updates.allergies: Se descoberta NOVA alergia ou confirmação de ausência ("sem alergias conhecidas")
- patient_updates.current_medications: Se iniciou/parou medicação de USO CONTÍNUO (não inclua prescrições temporárias desta consulta)
- patient_updates.blood_type: Se mencionado tipo sanguíneo não registrado
- patient_updates.medical_history: Se descoberto histórico médico relevante não registrado (cirurgias prévias, doenças crônicas, hospitalizações)
  * Combine com dados existentes do cadastro quando aplicável
  * Marque claramente novas informações

**ETAPA 3: ADAPTAR POR TIPO DE CONSULTA**
${consultationType ? `✅ Aplicar foco específico para ${consultationType}` : ''}

**ETAPA 4: VALIDAR QUALIDADE**
Antes de retornar JSON, verificar checklist:
□ chief_complaint ≥ 30 caracteres e específico?
□ hma descreve evolução narrativa detalhada?
□ physical_exam usa terminologia médica adequada?
□ diagnosis é específico (não genérico/vago)?
□ conduct e plan contêm ações concretas?
□ Verifiquei alergias do paciente?
□ Se gestação/parto mencionado, documentei em prenatal_perinatal_history?

**ETAPA 5: ATRIBUIR QUALITY SCORE**
Avalie qualidade da extração (1-10):
- 10: Todos campos completos, específicos, terminologia adequada
- 7-9: Maioria bem preenchidos, alguns genéricos
- 4-6: Campos básicos mas superficiais
- 1-3: Informações insuficientes

=== EXEMPLOS (Few-Shot Learning) ===

EXEMPLO 1 - Urgência (Febre):
Input: "Doutora, ele tá com febre desde anteontem, começou com 38°C e ontem chegou a 39,5°C. Tá tossindo também, uma tosse seca que incomoda. Ele come bem normalmente, mas hoje tá com menos apetite. Vou examinar. Garganta bem hiperemiada, amígdalas aumentadas com pontos de exsudato. Pulmões limpos. Abdome normal."

Output esperado:
{
  "chief_complaint": "Febre há 3 dias (até 39,5°C) associada a tosse seca",
  "hma": "Paciente com quadro febril iniciado há 3 dias, com temperatura inicial de 38°C evoluindo para 39,5°C no segundo dia. Apresenta tosse seca concomitante que causa desconforto. Hoje apresenta redução do apetite. Sem outros sintomas respiratórios associados. Sem vômitos, diarreia ou outros sintomas sistêmicos relatados.",
  "history": "Paciente habitualmente se alimenta bem, com padrão alimentar preservado fora do quadro agudo atual.",
  "family_history": null,
  "prenatal_perinatal_history": null,
  "physical_exam": "Orofaringe: hiperemia importante de orofaringe, amígdalas palatinas aumentadas de volume (grau 3+/4+) com presença de exsudato purulento. Aparelho respiratório: murmúrio vesicular preservado bilateralmente, sem ruídos adventícios. Abdome: plano, flácido, indolor à palpação superficial e profunda, sem visceromegalias. Linfonodos cervicais: palpáveis, móveis, dolorosos.",
  "diagnosis": "Faringoamigdalite bacteriana aguda",
  "diagnosis_is_ai_suggestion": false,
  "conduct": "Solicitado teste rápido para Streptococcus pyogenes (resultado positivo).",
  "plan": "Prescrito antibioticoterapia com Amoxicilina 50mg/kg/dia dividido em 3 doses por 10 dias. Antitérmico: Dipirona 15mg/kg/dose a cada 6 horas se febre acima de 37,8°C. Orientações: hidratação oral abundante, repouso, dieta leve pastosa. Sinais de alerta: dificuldade respiratória, recusa alimentar completa, prostração importante. Retornar em 3 dias para reavaliação ou antes se piora clínica ou persistência de febre após 48h de antibiótico.",
  "weight_kg": null,
  "height_cm": null,
  "development_notes": null,
  "quality_score": 9,
  "patient_updates": null
}

EXEMPLO 2 - Puericultura (Primeira RN):
Input: "Vim para a primeira consulta dele, ele tem 10 dias de vida. Ele tá mamando bem, faz bastante xixi e cocô. Ele dorme bem, mama de 3 em 3 horas. Na gestação eu tive diabetes gestacional controlado com dieta. Foi cesárea programada com 38 semanas porque ele tava grande, nasceu com 4kg. Não precisou de UTI. Vou examinar. Bebê ativo, corado, hidratado. Pesando 3,9kg, perdeu 100g do peso de nascimento mas já ganhou de volta. Coto umbilical caindo. Exame físico sem alterações."

Output esperado:
{
  "chief_complaint": "Primeira consulta do recém-nascido (10 dias de vida)",
  "hma": "Recém-nascido de 10 dias de vida em primeira consulta pós-alta hospitalar. Mãe relata que aleitamento materno está estabelecido, com boa aceitação e sucção vigorosa. Apresenta múltiplas micções diárias (>6/dia) e evacuações frequentes, sinais de adequada ingesta. Sem icterícia visível atualmente. Comportamento ativo e responsivo.",
  "history": "Rotina de amamentação estabelecida a cada 3 horas. Padrão de sono adequado para idade.",
  "family_history": null,
  "prenatal_perinatal_history": "Histórico gestacional: Mãe desenvolveu diabetes mellitus gestacional durante a gravidez, mantido sob controle dietético sem necessidade de insulinoterapia. Parto: Cesariana eletiva programada para 38 semanas de idade gestacional devido a macrossomia fetal. Nascimento: Peso ao nascer 4000g (percentil >97), RN a termo. Período neonatal imediato sem intercorrências, não necessitou de cuidados intensivos ou fototerapia. Alta hospitalar no 3° dia de vida.",
  "physical_exam": "RN ativo, responsivo a estímulos, bom padrão de sucção. Estado geral: corado, hidratado, acianótico, anictérico. Peso: 3900g (perda ponderal recuperada, peso atual 97,5% do peso de nascimento). Cabeça: fontanela anterior normotensa, suturas pérvias. Olhos: pupilas isocóricas e fotorreagentes, sem secreção. Orofaringe: sem alterações. Coto umbilical em fase final de mumificação, sem sinais flogísticos. Ausculta cardíaca: bulhas rítmicas normofonéticas em 2 tempos, sem sopros. Ausculta pulmonar: murmúrio vesicular presente bilateralmente. Abdome: globoso, flácido, sem massas ou visceromegalias. Genitália: tópica. Membros: simétricos, tônus adequado. Pele: sem lesões.",
  "diagnosis": "Recém-nascido hígido em acompanhamento de puericultura, filho de mãe diabética",
  "diagnosis_is_ai_suggestion": true,
  "conduct": null,
  "plan": "Manter aleitamento materno exclusivo em livre demanda. Orientações sobre posicionamento e pega. Triagem neonatal: Teste do pezinho já realizado (aguardar resultado), agendar teste da orelhinha e olhinho. Vitamina D 400UI/dia via oral (iniciar hoje). Calendário vacinal: BCG e Hepatite B realizadas na maternidade. Próxima vacina: 2 meses. Orientações sobre sinais de alerta: icterícia progressiva, recusa alimentar, hipotonia, febre. Retorno em 20 dias para segunda consulta de puericultura.",
  "weight_kg": 3.9,
  "weight_source": "audio",
  "development_notes": "Desenvolvimento neuropsicomotor adequado para idade. Reflexos primitivos presentes (sucção, Moro). Bom tônus muscular e atividade espontânea.",
  "quality_score": 10,
  "patient_updates": null
}

EXEMPLO 3 - Consulta de Rotina (com contexto):
Input: "Trouxe ele pra consulta porque ele tá com essa tosse chata há uns 5 dias, principalmente de noite. Não tem febre. Ele tá comendo e brincando normal durante o dia. Na família tem bastante gente com rinite e asma. Vou examinar. Criança em bom estado geral. Ausculta pulmonar com sibilos expiratórios difusos bilateralmente. Orofaringe normal. 18kg, 110cm."

Output esperado:
{
  "chief_complaint": "Tosse persistente há 5 dias, predominantemente noturna",
  "hma": "Criança apresenta tosse seca persistente iniciada há 5 dias, com piora característica no período noturno. Sem febre associada. Sem dispneia ou cianose relatadas. Sem história de engasgo ou aspiração de corpo estranho. Sem coriza, obstrução nasal ou outros sintomas respiratórios altos. Padrão de tosse com predomínio noturno sugere componente de hiperreatividade brônquica.",
  "history": "Mantém alimentação e atividades lúdicas preservadas durante o dia, sem comprometimento do estado geral fora dos episódios de tosse noturna.",
  "family_history": "História familiar positiva para atopia: múltiplos familiares com rinite alérgica e asma brônquica.",
  "prenatal_perinatal_history": null,
  "physical_exam": "Criança em bom estado geral, corada, hidratada, acianótica, eupneica em repouso. Peso: 18kg (percentil 50-75). Altura: 110cm (percentil 50-75). Relação peso/altura adequada. Ausculta pulmonar: murmúrio vesicular presente bilateralmente, com presença de sibilos expiratórios difusos em ambos hemitórax. Frequência respiratória: 22irpm. Ausculta cardíaca: bulhas rítmicas normofonéticas sem sopros. Orofaringe: sem hiperemia ou exsudato. Otoscopia: membranas timpânicas íntegras e translúcidas bilateralmente.",
  "diagnosis": "Síndrome de hiperreatividade brônquica / Asma leve (investigação)",
  "diagnosis_is_ai_suggestion": true,
  "conduct": "Solicitado espirometria para avaliação funcional pulmonar e confirmação diagnóstica (criança >6 anos pode colaborar). Orientações sobre evitar exposição a aeroalérgenos.",
  "plan": "Prescrito broncodilatador: Salbutamol spray 100mcg + espaçador, 2 puffs a cada 6 horas por 5 dias, depois SOS se tosse/sibilância. Corticoide inalatório: Budesonida 200mcg 1 puff 12/12h por 30 dias. Medidas ambientais: evitar poeira, ácaros, mofo; manter ambiente arejado; evitar cheiros fortes. Hidratação oral adequada. Retornar em 15 dias com resultado da espirometria para reavaliação e ajuste terapêutico. Sinais de alerta: dispneia importante, cianose, dificuldade para falar/comer.",
  "weight_kg": 18,
  "weight_source": "audio",
  "height_cm": 110,
  "height_source": "audio",
  "development_notes": null,
  "medication_alerts": "Paciente com história familiar importante de atopia - risco aumentado para desenvolvimento de asma. Monitorar resposta ao tratamento e considerar seguimento com pneumologia pediátrica se sintomas persistentes.",
  "quality_score": 9,
  "patient_updates": null
}

EXEMPLO 4 - Descoberta de Alergias e Atualizações do Cadastro:
Input CADASTRO: Paciente sem alergias registradas, sem medicações contínuas.
Input ÁUDIO: "Mãe: Ele começou a tomar Ritalina mês passado com o neuro. Descobrimos que ele é alérgico a dipirona, teve uma reação na última vez. Ah, e o tipo sanguíneo dele é O+, fizeram o exame semana passada."

Output esperado:
{
  "chief_complaint": "Consulta de acompanhamento - uso de metilfenidato",
  "hma": "Paciente em acompanhamento após início de metilfenidato há 1 mês prescrito por neurologista. Sem queixas agudas nesta consulta.",
  "history": null,
  "family_history": null,
  "diagnosis": "Transtorno de déficit de atenção/hiperatividade em tratamento farmacológico",
  "plan": "Manter metilfenidato conforme prescrição neurológica. Retorno em 30 dias.",
  "patient_updates": {
    "allergies": "Dipirona (reação alérgica prévia)",
    "current_medications": "Metilfenidato (Ritalina) - uso contínuo - prescrito por neurologista",
    "blood_type": "O+",
    "medical_history": null
  },
  "quality_score": 8
}

=== CONSTRAINTS (NUNCA FAÇA ISSO) ===
❌ NUNCA use diagnósticos vagos: "virose inespecífica", "possível infecção", "quadro viral"
❌ NUNCA deixe campos principais vazios se houver informação na transcrição
❌ NUNCA use linguagem coloquial - sempre use terminologia médica profissional
❌ NUNCA copie literalmente falas - organize em narrativa médica corrida
❌ NUNCA ignore dados do cadastro do paciente (histórico, alergias, medicações)
❌ NUNCA confunda conduct (exames/ações imediatas) com plan (terapêutica)

=== SEMPRE FAÇA ISSO ===
✅ SEMPRE use terminologia médica adequada e específica
✅ SEMPRE mescle histórico do cadastro com informações novas relevantes
✅ SEMPRE gere hipótese diagnóstica baseada no quadro clínico (nomenclatura CID-10)
✅ SEMPRE detalhe plan com medicações (nome+dose mg/kg+frequência+duração)
✅ SEMPRE separe conduct (exames/encaminhamentos) de plan (terapêutica)
✅ SEMPRE verifique alergias e interações medicamentosas
✅ SEMPRE documente prenatal_perinatal_history se mencionado (CRÍTICO!)
✅ SEMPRE considere tipo de consulta ao estruturar HMA
✅ SEMPRE atribua quality_score honesto (será usado para melhorias)

=== VALIDAÇÃO FINAL (Checklist antes de retornar JSON) ===
Antes de retornar, verifique:
□ has_sufficient_data true apenas se queixa principal clara identificada?
□ chief_complaint ≥ 30 caracteres e específico?
□ hma descreve evolução narrativa detalhada do quadro?
□ physical_exam usa terminologia médica por sistemas?
□ diagnosis específico com nomenclatura adequada (não genérico)?
□ conduct e plan separados corretamente?
□ plan contém ações terapêuticas concretas e completas?
□ Verifiquei alergias/medicações do paciente do cadastro?
□ Se gestação/parto mencionado, documentei detalhadamente em prenatal_perinatal_history?
□ quality_score reflete honestamente completude (1-10)?
□ Usei contexto de consultas anteriores se disponível?

=== TRANSCRIÇÃO DA CONSULTA ===
${cleanedText}

=== OUTPUT FORMAT (ESTRUTURA OBRIGATÓRIA - JSON) ===
Retorne APENAS um objeto JSON válido com esta estrutura exata (sem comentários):
{
  "has_sufficient_data": boolean,
  "chief_complaint": "string ou null",
  "hma": "string detalhada focada na queixa atual ou null",
  "history": "string com informações complementares de contexto ou null",
  "family_history": "string ou null",
  "prenatal_perinatal_history": "string detalhada ou null",
  "physical_exam": "string com terminologia médica ou null",
  "weight_kg": number ou null,
  "weight_source": "audio" | "profile" | null,
  "height_cm": number ou null,
  "height_source": "audio" | "profile" | null,
  "head_circumference_cm": number ou null,
  "head_circumference_source": "audio" | "profile" | null,
  "development_notes": "string ou null",
  "diagnosis": "string específica ou null",
  "diagnosis_is_ai_suggestion": boolean,
  "conduct": "string ou null",
  "plan": "string detalhada ou null",
  "notes": "string ou null",
  "medication_alerts": "string ou null",
  "patient_updates": {
    "allergies": "string ou null",
    "current_medications": "string ou null",
    "blood_type": "string ou null",
    "medical_history": "string ou null"
  },
  "speaker_analysis": {
    "mother_statements": ["array", "de", "strings"],
    "doctor_statements": ["array", "de", "strings"]
  },
  "quality_score": number
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é uma médica pediatra especialista em APS com 20 anos de experiência. Você extrai campos clínicos estruturados de transcrições de consultas seguindo metodologia APS."
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Reduzido para maior consistência (APS exige precisão)
      max_tokens: 10000, // Aumentado para suportar HMA detalhada + novos campos
    });

    const content = response.choices[0].message.content;

    if (!content) {
      throw new Error("Resposta vazia da API");
    }

    const parsedResponse = JSON.parse(content);

    // Verificar se a IA indicou dados insuficientes
    if (parsedResponse.has_sufficient_data === false) {
      throw new Error(
        "DADOS_INSUFICIENTES: O áudio não contém informações médicas suficientes para processar a consulta. " +
        "Por favor, grave novamente incluindo: queixa principal, sintomas, e informações relevantes da consulta."
      );
    }

    // Remover o campo de controle antes de retornar
    const { has_sufficient_data, ...extractedFields } = parsedResponse;

    // Validar que pelo menos a queixa principal foi preenchida
    if (!extractedFields.chief_complaint) {
      throw new Error(
        "DADOS_INSUFICIENTES: Não foi possível identificar a queixa principal do áudio. " +
        "Por favor, grave novamente mencionando claramente o motivo da consulta."
      );
    }

    const result = extractedFields as ConsultationFields;

    // === VALIDAÇÃO PÓS-EXTRAÇÃO ===
    const validationIssues: string[] = [];

    // Validar qualidade mínima dos campos principais
    if (result.chief_complaint && result.chief_complaint.length < 30) {
      validationIssues.push("Queixa principal muito curta (< 30 caracteres)");
    }

    if (result.hma && result.hma.length < 50) {
      validationIssues.push("HMA muito superficial (< 50 caracteres)");
    }

    if (result.physical_exam && result.physical_exam.length < 30) {
      validationIssues.push("Exame físico muito superficial (< 30 caracteres)");
    }

    if (result.diagnosis && result.diagnosis.length < 15) {
      validationIssues.push("Diagnóstico muito vago (< 15 caracteres)");
    }

    if (result.plan && result.plan.length < 30) {
      validationIssues.push("Plano terapêutico muito superficial (< 30 caracteres)");
    }

    // Verificar diagnósticos genéricos/vagos
    const vagueTerms = ["virose", "possível", "talvez", "pode ser", "provável", "quadro viral"];
    if (result.diagnosis) {
      const diagnosisLower = result.diagnosis.toLowerCase();
      const foundVague = vagueTerms.find(term => diagnosisLower.includes(term));
      if (foundVague) {
        validationIssues.push(`Diagnóstico contém termo vago: "${foundVague}"`);
      }
    }

    // Verificar quality_score
    if (result.quality_score && result.quality_score < 5) {
      validationIssues.push(`Quality score baixo: ${result.quality_score}/10 - IA indica dados insuficientes`);
    }

    // Log de validação
    if (validationIssues.length > 0) {
      console.warn("⚠️ Alertas de validação:");
      validationIssues.forEach(issue => console.warn(`   - ${issue}`));
    }

    console.log("✅ Campos extraídos com sucesso (metodologia APS)");
    console.log(`   - Tipo: ${consultationType || 'não especificado'}${consultationSubtype ? ` (${consultationSubtype})` : ''}`);
    console.log(`   - Queixa: ${result.chief_complaint ? '✓' : '✗'} (${result.chief_complaint?.length || 0} chars)`);
    console.log(`   - HMA: ${result.hma ? '✓' : '✗'} (${result.hma?.length || 0} chars)`);
    console.log(`   - Exame Físico: ${result.physical_exam ? '✓' : '✗'} (${result.physical_exam?.length || 0} chars)`);
    console.log(`   - Diagnóstico: ${result.diagnosis ? '✓' : '✗'} ${result.diagnosis_is_ai_suggestion ? '(sugestão IA)' : ''} (${result.diagnosis?.length || 0} chars)`);
    console.log(`   - Conduta: ${result.conduct ? '✓' : '✗'} (${result.conduct?.length || 0} chars)`);
    console.log(`   - Plano: ${result.plan ? '✓' : '✗'} (${result.plan?.length || 0} chars)`);
    console.log(`   - Histórico Familiar: ${result.family_history ? '✓' : '✗'}`);
    console.log(`   - Histórico Pré/Perinatal: ${result.prenatal_perinatal_history ? '✓' : '✗'}`);
    console.log(`   - Peso: ${result.weight_kg ? `${result.weight_kg}kg (${result.weight_source})` : '✗'}`);
    console.log(`   - Altura: ${result.height_cm ? `${result.height_cm}cm (${result.height_source})` : '✗'}`);
    console.log(`   - PC: ${result.head_circumference_cm ? `${result.head_circumference_cm}cm (${result.head_circumference_source})` : '✗'}`);

    if (result.quality_score) {
      console.log(`   - 📊 Quality Score: ${result.quality_score}/10`);
    }

    if (result.speaker_analysis) {
      console.log(`   - 🗣️  Análise: ${result.speaker_analysis.mother_statements?.length || 0} falas mãe, ${result.speaker_analysis.doctor_statements?.length || 0} falas médica`);
    }

    if (result.medication_alerts) {
      console.log(`   - ⚠️ Alertas: ${result.medication_alerts}`);
    }
    
    if (previousConsultations && previousConsultations.length > 0) {
      console.log(`   - 📋 Histórico: ${previousConsultations.length} consulta(s) anterior(es) considerada(s)`);
    }

    // Calcular taxa de preservação de conteúdo
    const totalExtractedText = [
      result.chief_complaint,
      result.hma,
      result.family_history,
      result.prenatal_perinatal_history,
      result.physical_exam,
      result.diagnosis,
      result.conduct,
      result.plan,
      result.notes,
      result.development_notes
    ].filter(Boolean).join(" ");
    
    const extractedWords = totalExtractedText.trim().split(/\s+/).length;
    const preservationRate = ((extractedWords / wordCount) * 100).toFixed(1);
    
    console.log(`\n📈 Taxa de preservação: ${extractedWords}/${wordCount} palavras (${preservationRate}%)`);
    
    if (Number(preservationRate) < 30) {
      console.warn(`⚠️ Taxa de preservação baixa (${preservationRate}%). Pode indicar perda excessiva de informação.`);
    }

    return result;
  } catch (error: any) {
    console.error("❌ Erro na extração de campos:", error);
    throw new Error(`Erro ao extrair campos: ${error.message}`);
  }
}
