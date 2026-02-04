import { openai } from "./client";

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
  // Estrutura SOAP
  chief_complaint: string | null;
  history: string | null;
  physical_exam: string | null;
  diagnosis: string | null;
  diagnosis_is_ai_suggestion?: boolean;
  plan: string | null;
  notes: string | null;

  // Dados antropométricos
  weight_kg: number | null;
  weight_source?: "audio" | "profile" | null;
  height_cm: number | null;
  height_source?: "audio" | "profile" | null;
  head_circumference_cm: number | null;
  head_circumference_source?: "audio" | "profile" | null;

  // Campos adicionais
  development_notes: string | null;
  medication_alerts?: string | null;
  prenatal_perinatal_history?: string | null; // Histórico de gestação/parto mencionado pela mãe

  // Metadata de análise
  speaker_analysis?: {
    mother_statements: string[];
    doctor_statements: string[];
  };
  quality_score?: number;
}

const MIN_WORDS_FOR_EXTRACTION = 20;

/**
 * Extrai campos estruturados de uma consulta médica a partir do texto limpo
 * @param cleanedText - Texto limpo e processado
 * @param context - Contexto do paciente para melhorar a análise
 * @returns Campos estruturados da consulta
 */
export async function extractConsultationFields(
  cleanedText: string,
  context?: PatientContext
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

    // 🎙️ Detectar se transcrição tem identificação automática de falantes
    const hasDiarization = cleanedText.includes("[Speaker");

    if (hasDiarization) {
      console.log("🎙️ Transcrição com diarização detectada - usando contexto específico");
    }

    const diarizationContext = hasDiarization
      ? `
🎙️ IDENTIFICAÇÃO AUTOMÁTICA DE FALANTES DISPONÍVEL:
Esta transcrição foi processada com identificação automática de falantes no formato [Speaker 1]:, [Speaker 2]:, etc.

INTERPRETAÇÃO TÍPICA (usar contexto do diálogo se incerto):
- [Speaker 1] = Tipicamente a Médica Pediatra (Dra. Gabriela)
- [Speaker 2] = Tipicamente a Mãe/Responsável do paciente
- [Speaker 3] (se existir) = Pai ou outro acompanhante

INSTRUÇÕES CRÍTICAS PARA EXTRAÇÃO COM DIARIZAÇÃO:

1. SUBJETIVO (history): Use EXATAMENTE o que [Speaker 2] (mãe/responsável) relatou
   - "Mãe relata que criança apresenta febre de 38.5°C há 2 dias..."
   - Preserve todos os detalhes do relato materno
   - Mantenha a narrativa da mãe sobre sintomas, início, evolução
   
2. OBJETIVO (physical_exam): Use SOMENTE o que [Speaker 1] (médica) observou no exame físico
   - "Ao exame: paciente ativo, bem hidratado, corado..."
   - "Orofaringe: hiperemiada sem exsudato"
   - "Ausculta pulmonar: murmúrio vesicular presente bilateralmente"
   - Achados objetivos do exame realizado pela médica
   
3. AVALIAÇÃO (diagnosis): Interpretação e hipótese diagnóstica da médica

4. PLANO (plan): Orientações, prescrições e condutas da médica

5. ATRIBUIÇÃO CLARA: Sempre deixe explícito quem forneceu cada informação crítica
   - Use "Mãe relata...", "Responsável informa...", "Ao exame...", "Observado..."

⚠️ IMPORTANTE: A separação entre Subjetivo (relato materno) e Objetivo (achados médicos) 
deve ser MUITO clara quando há diarização automática!
`
      : `
CONTEXTO: Transcrição sem identificação automática de falantes.
Você deve inferir quem está falando pelo contexto da fala:
- Termos médicos técnicos, achados de exame = provavelmente médica
- Relato de sintomas, história recente, rotina = provavelmente mãe/responsável

Use sempre atribuições claras: "Mãe relata...", "Ao exame...", "Responsável informa..."
`;

    const prompt = `=== ROLE ===
Você é uma médica pediatra com 15+ anos de experiência em documentação clínica e análise de consultas médicas. 
Você é especialista em organizar informações de consultas gravadas ao vivo seguindo a metodologia SOAP 
(Subjetivo, Objetivo, Avaliação, Plano), padrão ouro em documentação médica.
${patientContextText}

${diarizationContext}

=== CONTEXTO DA TAREFA ===
Você receberá a transcrição de uma consulta pediátrica gravada AO VIVO durante o atendimento.
A gravação contém um DIÁLOGO entre a mãe/responsável e a médica pediatra.

Seu objetivo é:
1. Identificar quem está falando (mãe vs médica) - USE a diarização [Speaker X] se disponível
2. Extrair informações clínicas seguindo estrutura SOAP com SEPARAÇÃO CLARA entre Subjetivo e Objetivo
3. Gerar documentação médica completa, específica e profissional

=== INSTRUÇÕES PASSO A PASSO (Chain-of-Thought) ===

**PASSO 1: IDENTIFICAR FALANTES**
${hasDiarization
        ? "✅ USE a identificação [Speaker X] para atribuir corretamente as falas!"
        : "Analise o diálogo e identifique quem disse cada informação:"}
- MÃE/RESPONSÁVEL: Relata sintomas, conta histórico recente, responde perguntas sobre rotina/alimentação
- MÉDICA: Faz perguntas específicas, relata achados do exame físico, orienta conduta, prescreve medicações

**PASSO 2: EXTRAIR DADOS ANTROPOMÉTRICOS**
- Se peso/altura/PC mencionado no ÁUDIO → use o valor e marque source como "audio"
- Se NÃO mencionado no áudio mas existe no CADASTRO → use o valor do cadastro e marque source como "profile"
- Se não existe em nenhum → retorne null

**PASSO 3: ESTRUTURAR SEGUNDO SOAP**

**S - SUBJETIVO (Queixa + História):**
- chief_complaint: Queixa principal clara e objetiva (ex: "Febre há 3 dias associada a tosse produtiva")
- history: História completa incluindo:
  * História da doença atual (HDA): início dos sintomas, evolução, fatores de melhora/piora
  * Histórico médico prévio do cadastro (se relevante)
  * Sintomas associados mencionados pela mãe
  * Informações de contexto (alimentação, sono, evacuações, comportamento)

**O - OBJETIVO (Exame Físico + Dados):**
- physical_exam: Achados do exame físico de forma DETALHADA e ESTRUTURADA:
  * Estado geral
  * Sinais vitais se mencionados (temperatura, FC, FR, saturação)
  * Exame por sistemas (cabeça/pescoço, tórax, abdome, pele, etc)
  * Use terminologia médica adequada
  * Se não houver exame físico explícito mas houve consulta, inferir achados normais relevantes

**A - AVALIAÇÃO (Diagnóstico):**
- diagnosis: Hipótese diagnóstica ESPECÍFICA baseada no quadro clínico
  * NUNCA use termos vagos como "virose", "possível infecção"
  * Use nomenclatura médica precisa (ex: "Rinofaringite viral aguda", "Bronquiolite viral", "Dermatite atópica leve")
  * Se múltiplos sintomas, considere diagnósticos diferenciais
- diagnosis_is_ai_suggestion: true se você inferiu o diagnóstico; false se a médica disse explicitamente

**P - PLANO (Conduta):**
- plan: Conduta terapêutica DETALHADA e ESPECÍFICA:
  * Medicações prescritas (nome, dose, frequência, duração)
  * Medidas não-farmacológicas (hidratação, repouso, cuidados gerais)
  * Orientações aos pais (sinais de alerta, quando retornar)
  * Seguimento/retorno agendado
  * Exames solicitados (se houver)

**PASSO 4: CAMPOS ADICIONAIS CRÍTICOS**
- development_notes: Observações sobre desenvolvimento neuropsicomotor/comportamental
- medication_alerts: ⚠️ SEMPRE verificar se paciente tem alergias ou medicações em uso contínuo e alertar sobre interações/contraindicações
- prenatal_perinatal_history: 🔴 **SUPER IMPORTANTE** - Se a mãe mencionar QUALQUER informação sobre:
  * Gestação: intercorrências, infecções, medicações, diabetes gestacional, hipertensão, sangramento, etc
  * Parto: tipo (normal/cesárea), complicações, tempo de trabalho de parto, sofrimento fetal, circular de cordão, etc
  * Perinatal: prematuridade, peso ao nascer, necessidade de UTI neonatal, icterícia, infecções, etc
  * Esta informação é CRÍTICA especialmente para recém-nascidos e lactentes jovens
  * Documente de forma detalhada e clara tudo que foi mencionado pela mãe
- notes: Outras observações relevantes não categorizadas acima

**PASSO 5: ANÁLISE DE FALANTES (Metadata)**
- speaker_analysis: Identifique as 3-5 afirmações mais importantes ditas pela mãe e pela médica

**PASSO 6: QUALITY SCORE**
Antes de retornar, avalie a qualidade da sua extração (1-10):
- 10: Todos os campos SOAP completos, específicos, terminologia médica adequada
- 7-9: Maioria dos campos bem preenchidos, alguns genéricos
- 4-6: Campos básicos preenchidos mas superficiais
- 1-3: Informações insuficientes ou muito genéricas

=== EXEMPLOS (Few-Shot Learning) ===

EXEMPLO 1 - Consulta de Febre:
Input: "Mãe: Doutora, ele tá com febre desde anteontem, começou com 38°C e ontem chegou a 39,5°C. Tá tossindo também, uma tosse seca que incomoda. Médica: Vou examinar. [examina] Garganta bem hiperemiada, amígdalas aumentadas com pontos de exsudato. Pulmões limpos. Abdome normal."

Output esperado:
{
  "chief_complaint": "Febre há 3 dias (até 39,5°C) associada a tosse seca",
  "history": "Paciente com quadro febril iniciado há 3 dias, com temperatura inicial de 38°C evoluindo para 39,5°C. Apresenta tosse seca concomitante que causa desconforto. Sem outros sintomas respiratórios relatados pela mãe.",
  "physical_exam": "Orofaringe: hiperemia importante de orofaringe, amígdalas palatinas aumentadas de volume com presença de exsudato purulento. Aparelho respiratório: murmúrio vesicular preservado bilateralmente, sem ruídos adventícios. Abdome: plano, flácido, indolor à palpação, sem visceromegalias.",
  "diagnosis": "Faringoamigdalite bacteriana aguda",
  "diagnosis_is_ai_suggestion": false,
  "plan": "Prescrito antibioticoterapia com Amoxicilina 50mg/kg/dia dividido em 3 doses por 10 dias. Antitérmico: Dipirona 15mg/kg a cada 6 horas se febre. Orientações: hidratação oral abundante, repouso, dieta leve. Retornar em 3 dias para reavaliação ou antes se piora do estado geral, persistência de febre após 48h de antibiótico ou dificuldade respiratória.",
  "speaker_analysis": {
    "mother_statements": ["Febre há 3 dias chegando a 39,5°C", "Tosse seca incômoda", "Sintomas iniciaram anteontem"],
    "doctor_statements": ["Garganta com hiperemia importante", "Amígdalas aumentadas com exsudato", "Pulmões limpos", "Prescrição de Amoxicilina"]
  },
  "quality_score": 9
}

EXEMPLO 2 - Puericultura:
Input: "Mãe: Vim para a consulta de rotina. Ele tá comendo bem, brincando normal. Médica: Ótimo! Vou pesar e medir. [mede] 12kg e 85cm. Está no percentil adequado. Desenvolvimento ótimo para idade, já fala várias palavras."

Output esperado:
{
  "chief_complaint": "Consulta de puericultura (acompanhamento de rotina)",
  "history": "Mãe relata que criança está se alimentando bem e mantendo atividades lúdicas preservadas. Sem queixas específicas.",
  "physical_exam": "Peso: 12kg, Altura: 85cm. Crescimento adequado para idade, dentro dos percentis esperados. Exame físico sem alterações.",
  "diagnosis": "Criança hígida em acompanhamento de puericultura",
  "diagnosis_is_ai_suggestion": true,
  "plan": "Manter acompanhamento regular de puericultura. Orientações sobre alimentação saudável e estímulos ao desenvolvimento. Calendário vacinal em dia. Retorno em 3 meses para próxima avaliação.",
  "development_notes": "Desenvolvimento neuropsicomotor adequado para a idade. Vocabulário em expansão com produção de múltiplas palavras.",
  "speaker_analysis": {
    "mother_statements": ["Alimentação preservada", "Brincando normalmente"],
    "doctor_statements": ["Peso 12kg e altura 85cm", "Percentil adequado", "Desenvolvimento ótimo"]
  },
  "quality_score": 8
}

EXEMPLO 3 - Recém-nascido com Histórico Gestacional:
Input: "Mãe: Doutora, ele tem 15 dias de vida e tá com muita dificuldade pra mamar. Na gestação eu tive diabetes gestacional e ele nasceu com 4,2kg. Foi cesárea de urgência porque o líquido tava diminuindo. Ele ficou 3 dias na UTI neonatal por causa de hipoglicemia. Médica: Vou examinar. [examina] Bebê ativo, boa coloração. Peso atual 4kg. Vou ver a pega na amamentação... a pega tá inadequada, isso explica a dificuldade."

Output esperado:
{
  "chief_complaint": "Dificuldade na amamentação em recém-nascido de 15 dias de vida",
  "history": "Mãe relata dificuldade importante na amamentação desde o nascimento. Lactente com 15 dias de vida apresentando dificuldade persistente para realizar pega adequada ao seio materno.",
  "physical_exam": "Recém-nascido ativo, responsivo, boa coloração de pele e mucosas. Peso atual: 4000g. Avaliação da amamentação: pega inadequada observada durante a consulta.",
  "diagnosis": "Dificuldade de amamentação por pega inadequada em recém-nascido",
  "diagnosis_is_ai_suggestion": false,
  "plan": "Orientações sobre técnica de amamentação e correção da pega. Demonstração prática de posicionamento adequado. Acompanhamento do ganho ponderal. Retorno em 3 dias para reavaliação do peso e da amamentação.",
  "prenatal_perinatal_history": "🔴 HISTÓRICO GESTACIONAL/PERINATAL IMPORTANTE: Mãe apresentou diabetes mellitus gestacional durante a gravidez. Parto: cesariana de urgência indicada por oligoidrâmnio (redução de líquido amniótico). Nascimento: macrossomia fetal (peso ao nascer 4200g, acima do percentil 90). Período neonatal: necessitou internação em UTI neonatal por 3 dias devido a hipoglicemia neonatal (comum em filhos de mães diabéticas). Estes fatores são relevantes para o acompanhamento do desenvolvimento e risco metabólico futuro.",
  "speaker_analysis": {
    "mother_statements": ["Dificuldade para mamar", "Diabetes gestacional na gravidez", "Peso ao nascer 4,2kg", "Cesárea de urgência por oligoidrâmnio", "3 dias em UTI por hipoglicemia"],
    "doctor_statements": ["Bebê ativo e bem corado", "Peso atual 4kg", "Pega inadequada na amamentação", "Orientações sobre técnica"]
  },
  "quality_score": 10
}

=== CONSTRAINTS (NUNCA FAÇA ISSO) ===
❌ NUNCA use diagnósticos vagos como "virose inespecífica", "possível infecção"
❌ NUNCA deixe campos principais vazios se houver informação na transcrição
❌ NUNCA use linguagem coloquial - sempre use terminologia médica
❌ NUNCA copie literalmente falas - organize em texto corrido profissional
❌ NUNCA ignore dados do cadastro do paciente (histórico, alergias, medicações)

=== SEMPRE FAÇA ISSO ===
✅ SEMPRE use terminologia médica adequada e específica
✅ SEMPRE mescle histórico do cadastro com informações novas
✅ SEMPRE gere hipótese diagnóstica baseada no quadro clínico
✅ SEMPRE detalhe o plano com medicações (dose/frequência/duração)
✅ SEMPRE verifique alergias e interações medicamentosas
✅ SEMPRE documente histórico gestacional/perinatal se mencionado pela mãe (CRÍTICO!)
✅ SEMPRE atribua quality_score honesto (será usado para melhorias)

=== VALIDAÇÃO FINAL (Checklist antes de retornar) ===
Antes de retornar o JSON, verifique:
□ chief_complaint tem pelo menos 30 caracteres e é específico?
□ history descreve a evolução do quadro de forma narrativa?
□ physical_exam usa terminologia médica adequada?
□ diagnosis é específico (não genérico)?
□ plan contém ações concretas e detalhadas?
□ Verifiquei alergias/medicações do paciente?
□ Se a mãe mencionou gestação/parto, documentei em prenatal_perinatal_history?
□ quality_score reflete honestamente a completude da extração?
□ has_sufficient_data é true apenas se houver queixa principal clara?

=== TRANSCRIÇÃO DA CONSULTA ===
${cleanedText}

=== OUTPUT FORMAT (OBRIGATÓRIO) ===
Retorne APENAS um objeto JSON válido com esta estrutura exata:
{
  "has_sufficient_data": boolean,
  "chief_complaint": "string ou null",
  "history": "string detalhada ou null",
  "physical_exam": "string com terminologia médica ou null",
  "diagnosis": "string específica ou null",
  "diagnosis_is_ai_suggestion": boolean,
  "plan": "string detalhada ou null",
  "notes": "string ou null",
  "weight_kg": number ou null,
  "weight_source": "audio" | "profile" | null,
  "height_cm": number ou null,
  "height_source": "audio" | "profile" | null,
  "head_circumference_cm": number ou null,
  "head_circumference_source": "audio" | "profile" | null,
  "development_notes": "string ou null",
  "medication_alerts": "string ou null",
  "prenatal_perinatal_history": "string detalhada ou null (CRÍTICO se mencionado)",
  "speaker_analysis": {
    "mother_statements": ["array", "de", "strings"],
    "doctor_statements": ["array", "de", "strings"]
  },
  "quality_score": number (1-10)
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.5, // Equilíbrio entre precisão e criatividade clínica
      max_tokens: 4000,
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
    if (result.chief_complaint && result.chief_complaint.length < 20) {
      validationIssues.push("Queixa principal muito curta (< 20 caracteres)");
    }

    if (result.history && result.history.length < 30) {
      validationIssues.push("História muito superficial (< 30 caracteres)");
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
    const vagueTerms = ["virose", "possível", "talvez", "pode ser", "provável"];
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

    console.log("✅ Campos extraídos com sucesso");
    console.log(`   - Queixa: ${result.chief_complaint ? '✓' : '✗'} (${result.chief_complaint?.length || 0} chars)`);
    console.log(`   - História: ${result.history ? '✓' : '✗'} (${result.history?.length || 0} chars)`);
    console.log(`   - Exame: ${result.physical_exam ? '✓' : '✗'} (${result.physical_exam?.length || 0} chars)`);
    console.log(`   - Diagnóstico: ${result.diagnosis ? '✓' : '✗'} ${result.diagnosis_is_ai_suggestion ? '(sugestão IA)' : ''} (${result.diagnosis?.length || 0} chars)`);
    console.log(`   - Plano: ${result.plan ? '✓' : '✗'} (${result.plan?.length || 0} chars)`);
    console.log(`   - Peso: ${result.weight_kg ? `${result.weight_kg}kg (${result.weight_source})` : '✗'}`);
    console.log(`   - Altura: ${result.height_cm ? `${result.height_cm}cm (${result.height_source})` : '✗'}`);

    if (result.quality_score) {
      console.log(`   - 📊 Quality Score: ${result.quality_score}/10`);
    }

    if (result.speaker_analysis) {
      console.log(`   - 🗣️  Análise de falantes: ${result.speaker_analysis.mother_statements?.length || 0} falas mãe, ${result.speaker_analysis.doctor_statements?.length || 0} falas médica`);
    }

    if (result.medication_alerts) {
      console.log(`   - ⚠️ Alertas: ${result.medication_alerts}`);
    }

    return result;
  } catch (error: any) {
    console.error("❌ Erro na extração de campos:", error);
    throw new Error(`Erro ao extrair campos: ${error.message}`);
  }
}
