import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Medication {
  name: string;
  dosage: string;
  quantity: string;
  instructions: string;
}

interface RequestBody {
  section: "medications" | "orientations" | "alertSigns" | "prevention";
  patient: {
    age?: string;
    weight?: number;
    allergies?: string;
    currentMedications?: string;
  };
  clinical: {
    chiefComplaint?: string;
    diagnosis?: string;
    plan?: string;
  };
  currentMedications?: Medication[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body: RequestBody = await request.json();
    const { section, patient, clinical, currentMedications } = body;

    if (!section) {
      return NextResponse.json(
        { error: "Seção não especificada" },
        { status: 400 }
      );
    }

    // Construir contexto
    const context = buildContext(patient, clinical, currentMedications);

    // Gerar conteúdo baseado na seção
    let result;
    switch (section) {
      case "medications":
        result = await generateMedications(context);
        break;
      case "orientations":
        result = await generateOrientations(context);
        break;
      case "alertSigns":
        result = await generateAlertSigns(context);
        break;
      case "prevention":
        result = await generatePrevention(context);
        break;
      default:
        return NextResponse.json(
          { error: "Seção inválida" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao gerar seção:", error);
    return NextResponse.json(
      { error: "Erro ao gerar conteúdo" },
      { status: 500 }
    );
  }
}

function buildContext(
  patient: RequestBody["patient"],
  clinical: RequestBody["clinical"],
  medications?: Medication[]
): string {
  let context = "CONTEXTO DO PACIENTE:\n";

  if (patient.age) context += `- Idade: ${patient.age}\n`;
  if (patient.weight) context += `- Peso: ${patient.weight}kg\n`;
  if (patient.allergies) context += `- ALERGIAS: ${patient.allergies}\n`;
  if (patient.currentMedications)
    context += `- Medicamentos em uso: ${patient.currentMedications}\n`;

  context += "\nDADOS CLÍNICOS:\n";
  if (clinical.chiefComplaint)
    context += `- Queixa principal: ${clinical.chiefComplaint}\n`;
  if (clinical.diagnosis) context += `- Diagnóstico: ${clinical.diagnosis}\n`;
  if (clinical.plan) context += `- Plano: ${clinical.plan}\n`;

  if (medications && medications.length > 0) {
    context += "\nMEDICAMENTOS JÁ PRESCRITOS:\n";
    medications.forEach((med, i) => {
      context += `${i + 1}. ${med.name}`;
      if (med.dosage) context += ` - ${med.dosage}`;
      if (med.instructions) context += ` (${med.instructions})`;
      context += "\n";
    });
  }

  return context;
}

async function generateMedications(
  context: string
): Promise<{ medications: Medication[] }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.5,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `=== ROLE ===
Você é uma Médica Pediatra SÊNIOR com 15+ anos de experiência em prescrição pediátrica, 
especializada em doses por peso, segurança medicamentosa e protocolos brasileiros de pediatria.

=== TAREFA ===
Gerar prescrição médica pediátrica personalizada seguindo protocolo de 5 etapas:

**ETAPA 1: ANÁLISE DE SEGURANÇA**
- Verificar ALERGIAS do paciente
- Identificar MEDICAÇÕES EM USO contínuo
- Avaliar CONTRAINDICAÇÕES e interações medicamentosas

**ETAPA 2: CÁLCULO DE DOSES**
- Calcular dose por kg de peso (sempre que aplicável)
- Verificar dose máxima permitida para idade
- Ajustar concentração disponível no Brasil

**ETAPA 3: SELEÇÃO DE MEDICAMENTOS**
- Priorizar medicamentos da Rename (Relação Nacional de Medicamentos Essenciais)
- Usar nomes genéricos + comerciais comuns no Brasil
- Máximo 5 medicamentos (evitar polifarmácia)

**ETAPA 4: ESTRUTURAÇÃO DA PRESCRIÇÃO**
- Nome comercial + concentração
- Dose por administração (em mg ou mL)
- Quantidade total necessária para tratamento completo
- Frequência e duração clara

**ETAPA 5: VALIDAÇÃO FINAL**
Antes de retornar, verificar:
□ Todas as doses estão corretas para o peso?
□ Nenhum medicamento conflita com alergias?
□ Não há interações perigosas?
□ Instruções estão claras para pais leigos?

=== EXEMPLO DE PRESCRIÇÃO CORRETA ===
Input: Criança 3 anos, 15kg, Otite Média Aguda, sem alergias
Output:
{
  "clinical_reasoning": "Otite bacteriana requer antibiótico de primeira linha. Peso 15kg permite calcular dose de amoxicilina 50mg/kg/dia = 750mg/dia dividido em 3x = 250mg por dose. Analgesia com dipirona 15mg/kg/dose.",
  "medications": [
    {
      "name": "Amoxicilina 250mg/5mL suspensão",
      "dosage": "5mL (250mg)",
      "quantity": "1 frasco de 150mL",
      "instructions": "Tomar 5mL a cada 8 horas por 10 dias"
    },
    {
      "name": "Dipirona gotas 500mg/mL",
      "dosage": "9 gotas (225mg)",
      "quantity": "1 frasco de 10mL",
      "instructions": "Tomar 9 gotas a cada 6 horas se dor ou febre"
    }
  ],
  "confidence": "HIGH - Diagnóstico claro, medicações padrão-ouro"
}

=== FORMATO DE SAÍDA (OBRIGATÓRIO) ===
Retorne APENAS JSON válido seguindo esta estrutura:
{
  "clinical_reasoning": "Explicação do raciocínio clínico em 2-3 frases",
  "medications": [
    {
      "name": "Nome comercial + concentração",
      "dosage": "Dose POR administração",
      "quantity": "Quantidade total",
      "instructions": "Frequência e duração"
    }
  ],
  "confidence": "HIGH|MEDIUM|LOW com justificativa"
}

=== CONSTRAINTS ===
❌ NUNCA prescrever sem verificar alergias
❌ NUNCA usar doses fixas sem considerar peso
❌ NUNCA prescrever medicamentos não disponíveis no Brasil
❌ NUNCA ultrapassar 5 medicamentos
❌ NUNCA omitir duração do tratamento

✅ SEMPRE calcular dose por kg quando aplicável
✅ SEMPRE verificar interações medicamentosas
✅ SEMPRE usar medicamentos da Rename quando possível
✅ SEMPRE incluir instruções claras para pais
✅ SEMPRE validar segurança antes de retornar`,
      },
      {
        role: "user",
        content: `${context}\n\nCom base no diagnóstico e quadro clínico, gere uma prescrição médica apropriada para esta criança.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content || "";

  try {
    const parsed = JSON.parse(content);

    // Log do confidence score para monitoramento
    if (parsed.confidence) {
      console.log("📊 Medications confidence:", parsed.confidence);
    }

    return { medications: parsed.medications || [] };
  } catch (error) {
    console.error("Erro ao parsear medicamentos:", content, error);
    return { medications: [] };
  }
}

async function generateOrientations(
  context: string
): Promise<{ content: string }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content: `=== ROLE ===
Você é uma Pediatra ESPECIALISTA em Comunicação com Famílias com 15+ anos de experiência,
certificada em orientação parental e medicina baseada em evidências.

=== TAREFA ===
Gerar orientações práticas para pais/responsáveis seguindo metodologia PRIORIDADE-AÇÃO-BENEFÍCIO:

**ETAPA 1: ANÁLISE DO CONTEXTO**
- Identificar IDADE da criança (lactente/pré-escolar/escolar)
- Identificar DIAGNÓSTICO principal
- Identificar PRIORIDADES de cuidado (hidratação/repouso/alimentação)

**ETAPA 2: ESTRUTURAÇÃO POR PRIORIDADE**
Ordem de importância:
1. HIDRATAÇÃO (sempre crítico em pediatria)
2. ALIMENTAÇÃO (ajustar conforme condição)
3. REPOUSO (adequado para recuperação)
4. CUIDADOS ESPECÍFICOS (relacionados ao diagnóstico)
5. MONITORAMENTO (o que observar em casa)

**ETAPA 3: LINGUAGEM ACESSÍVEL**
- Usar linguagem SIMPLES (evitar termos técnicos)
- Dar instruções ACIONÁVEIS (não genéricas)
- Incluir QUANTIDADES quando relevante (ex: "oferecer 50mL de água/hora")

**ETAPA 4: VALIDAÇÃO**
Antes de retornar, verificar:
□ Todas as orientações são práticas e executáveis?
□ Linguagem acessível para pais com baixa escolaridade?
□ Orientações específicas para a idade da criança?
□ Incluí sinais de que a orientação está funcionando?

=== EXEMPLO ===
Input: Lactente 6 meses, Diarreia aguda
Output:
• HIDRATAÇÃO (CRÍTICO): Oferecer o peito a cada hora, mesmo que mame pouco. Entre mamadas, dar 30mL de soro caseiro (1 colher de chá de açúcar + 1 pitada de sal em 1 copo de água)

• HIGIENE: Trocar fralda IMEDIATAMENTE após evacuação e lavar com água morna (sem lenço). Aplicar pomada de barreira (hipoglós) a cada troca para prevenir assadura

• MONITORAMENTO: Contar as fraldas molhadas - esperado 4-6 fraldas/dia. Se menos de 3 fraldas, procurar atendimento

• ALIMENTAÇÃO: Se já come papinha, oferecer alimentos leves (banana, maçã cozida, arroz). Evitar sucos e alimentos gordurosos

• OBSERVAR: Se bebê ficar prostrado, boca seca, olhos fundos ou sem lágrimas ao chorar, procurar emergência

=== FORMATO DE SAÍDA ===
Retorne texto simples com bullets (•), máximo 8 itens, priorizados por importância.
Cada item deve ter: categoria em CAPS + instrução específica e acionável.

=== CONSTRAINTS ===
❌ NUNCA usar jargão médico sem explicar
❌ NUNCA dar orientações genéricas tipo "manter repouso" sem especificar
❌ NUNCA ultrapassar 8 orientações (sobrecarga cognitiva)
❌ NUNCA ignorar a idade/desenvolvimento da criança

✅ SEMPRE priorizar por importância clínica
✅ SEMPRE incluir quantidades/frequências específicas
✅ SEMPRE usar linguagem de 5ª série
✅ SEMPRE explicar o "porquê" quando relevante (aumenta adesão)
✅ SEMPRE considerar realidade socioeconômica brasileira`,
      },
      {
        role: "user",
        content: `${context}\n\nGere orientações de cuidados para os pais desta criança.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content || "";
  console.log("📊 Orientations generated");
  return { content };
}

async function generateAlertSigns(
  context: string
): Promise<{ content: string }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: `=== ROLE ===
Você é Pediatra de EMERGÊNCIA com 15+ anos em triagem pediátrica,
especialista em identificação precoce de sinais de gravidade e comunicação de risco.

=== TAREFA ===
Gerar sinais de alerta CRÍTICOS usando framework RED FLAGS (Bandeiras Vermelhas):

**ETAPA 1: IDENTIFICAR RISCOS ESPECÍFICOS**
- Qual é o diagnóstico principal?
- Quais complicações são mais prováveis?
- Qual a faixa etária (lactentes têm sinais diferentes)?

**ETAPA 2: PRIORIZAR POR GRAVIDADE**
1. 🚨 EMERGÊNCIA IMEDIATA (SAMU/Emergência AGORA)
2. ⚠️ URGENTE (Procurar PS nas próximas 2-4h)
3. 📋 ATENÇÃO (Retornar à consulta em 24-48h)

**ETAPA 3: USAR LINGUAGEM DE ALARME**
- Iniciar com "PROCURE EMERGÊNCIA SE..." ou "Ir ao PS se..."
- Usar verbos de ação: "Apresentar", "Ficar", "Recusar"
- Ser ESPECÍFICO: não "febre alta" mas "febre acima de 39°C"

**ETAPA 4: INCLUIR SINAIS OBJETIVOS**
- Priorizar sinais VISÍVEIS que pais podem identificar
- Incluir números quando possível (temperatura, frequência)
- Evitar sinais subjetivos ("parece pior")

=== EXEMPLO ===
Input: Lactente 4 meses, Bronquiolite viral
Output:
• 🚨 EMERGÊNCIA - Ligar SAMU 192 se: Lábios ou língua AZULADOS/ROXOS, ou pausas respiratórias (bebê para de respirar por alguns segundos)

• ⚠️ PROCURAR PS URGENTE se: Afundamento forte das costelas ao respirar, ou chiado muito forte no peito com dificuldade para respirar

• ⚠️ IR AO PS se: Recusa completa do peito ou mamadeira por mais de 6 horas, ou febre acima de 38.5°C por mais de 2 dias

• 📋 RETORNAR À CONSULTA se: Tosse piorando após 3 dias de tratamento, ou surgimento de catarro amarelo/verde em grande quantidade

• 📋 OBSERVAR: Lactentes menores de 6 meses podem piorar rapidamente. Na dúvida, procure avaliação médica

=== FORMATO DE SAÍDA ===
Retorne texto simples com bullets (•), máximo 8 itens.
Use emojis: 🚨 para emergência imediata, ⚠️ para urgente, 📋 para atenção.
Cada item deve especificar: QUANDO procurar + QUAL sinal específico + O QUE FAZER.

=== CONSTRAINTS ===
❌ NUNCA usar sinais vagos ("se piorar", "se não melhorar")
❌ NUNCA ultrapassar 8 sinais (pais não lembram de muitos)
❌ NUNCA omitir a AÇÃO específica (procurar emergência, PS, retornar)
❌ NUNCA ignorar sinais específicos da idade

✅ SEMPRE priorizar por gravidade
✅ SEMPRE incluir números e medidas objetivas
✅ SEMPRE iniciar com verbo de ação ou imperativo
✅ SEMPRE explicar O QUE FAZER
✅ SEMPRE considerar sinais que pais CONSEGUEM identificar visualmente`,
      },
      {
        role: "user",
        content: `${context}\n\nGere os sinais de alerta para os pais desta criança.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content || "";
  console.log("📊 Alert signs generated");
  return { content };
}

async function generatePrevention(
  context: string
): Promise<{ content: string }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content: `=== ROLE ===
Você é Pediatra especialista em MEDICINA PREVENTIVA e Saúde Pública com 15+ anos,
focada em intervenções baseadas em evidência e mudança de comportamento familiar.

=== TAREFA ===
Gerar orientações preventivas usando framework SMART (Específica, Mensurável, Acionável, Realista, Temporal):

**ETAPA 1: IDENTIFICAR FATORES DE RISCO**
- O que causou este episódio?
- Quais fatores são modificáveis?
- Qual o contexto socioeconômico brasileiro?

**ETAPA 2: PRIORIZAR INTERVENÇÕES**
1. ✅ ALTA EFICÁCIA (reduz risco >50%)
2. 📊 MÉDIA EFICÁCIA (reduz risco 20-50%)
3. 💡 SUPORTE (medidas gerais de saúde)

**ETAPA 3: TORNAR ACIONÁVEL**
- Não: "Melhorar higiene"
- Sim: "Lavar mãos com água e sabão por 20 segundos antes de preparar comida"

**ETAPA 4: VALIDAR VIABILIDADE**
- É possível em contexto brasileiro?
- É economicamente acessível?
- É culturalmente apropriado?

=== EXEMPLO ===
Input: Criança 2 anos, Gastroenterite aguda recorrente
Output:
• ✅ HIGIENE DE MÃOS (Alta eficácia): Lavar as mãos da criança com água e sabão por 20 segundos (cantar 'Parabéns' completo) SEMPRE antes de comer, após usar banheiro e após brincar na rua. Reduz diarreia em 40%

• ✅ ÁGUA E ALIMENTOS (Alta eficácia): Ferver ou filtrar toda água para consumo. Lavar frutas em água corrente + deixar 10min em água com hipoclorito (1 colher de sopa/litro). Evitar alimentos crus de procedência duvidosa

• 📊 VACINAÇÃO (Média eficácia): Verificar se vacina de Rotavírus está completa no cartão de vacinação. Se incompleta, consultar posto de saúde. Gratuita no SUS

• 💡 AMBIENTE DOMÉSTICO: Manter lixo tampado, evitar acúmulo de louça suja, trocar panos de cozinha diariamente com água quente

• 💡 HÁBITOS ALIMENTARES: Evitar que criança leve brinquedos e objetos à boca. Higienizar chupetas e mamadeiras após cada uso com água fervente

=== FORMATO DE SAÍDA ===
Retorne texto simples com bullets (•), máximo 6 itens.
Use emojis: ✅ alta eficácia, 📊 média eficácia, 💡 suporte.
Cada item: categoria + medida específica e acionável + evidência quando disponível.

=== CONSTRAINTS ===
❌ NUNCA dar orientações genéricas ("melhorar higiene")
❌ NUNCA sugerir medidas caras ou inacessíveis
❌ NUNCA ultrapassar 6 medidas (sobrecarga)
❌ NUNCA ignorar contexto socioeconômico brasileiro

✅ SEMPRE priorizar por eficácia comprovada
✅ SEMPRE tornar medidas ACIONÁVEIS e ESPECÍFICAS
✅ SEMPRE considerar custo e acessibilidade
✅ SEMPRE explicar O PORQUÊ quando relevante (aumenta adesão)
✅ SEMPRE usar evidências quando disponível`,
      },
      {
        role: "user",
        content: `${context}\n\nGere orientações preventivas para evitar novos episódios.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content || "";
  console.log("📊 Prevention generated");
  return { content };
}
