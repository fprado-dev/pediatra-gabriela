# Sistema de Retry por Etapa

**Data**: 2026-02-03  
**Versão**: 1.0  
**Objetivo**: Permitir retry individual de etapas de processamento sem perder progresso

---

## 🎯 Problema Resolvido

**Antes**: Se o processamento falhava em qualquer etapa (ex: limpeza de texto), TODO o progresso era perdido e era necessário reprocessar desde o início, incluindo transcrição (etapa mais cara e demorada).

**Agora**: Cada etapa pode ser retentada individualmente, aproveitando o progresso já realizado nas etapas anteriores.

---

## 🏗️ Arquitetura

### Etapas do Processamento

```
1. Download ─────> 2. Transcrição ─────> 3. Limpeza ─────> 4. Extração
   (R2)              (Whisper)             (GPT-5)          (GPT-5)
   
   ↓ salva           ↓ salva              ↓ salva          ↓ salva
   áudio local       raw_transcription    cleaned_text     campos finais
```

Cada etapa:
- Salva seu resultado no banco de dados
- Atualiza `processing_steps` com timestamp e status
- Pode ser retentada independentemente se falhar

### Estados Possíveis

| Estado | Descrição | Permite Retry? |
|--------|-----------|----------------|
| `pending` | Não iniciado | Não |
| `in_progress` | Executando | Sim (timeout) |
| `completed` | Sucesso | Não |
| `error` | Falhou | Sim |

---

## 📁 Arquivos Criados/Modificados

### 1. API Route de Retry
**Arquivo**: [`app/api/consultations/[id]/retry/route.ts`](app/api/consultations/[id]/retry/route.ts)

**Endpoint**: `POST /api/consultations/[id]/retry`

**Body**:
```json
{
  "step": "transcription" | "cleaning" | "extraction"
}
```

**Funcionalidades**:
- ✅ Valida autenticação e permissão
- ✅ Verifica pré-requisitos de cada etapa
- ✅ Executa retry apenas da etapa solicitada
- ✅ Aproveita dados já salvos (ex: `raw_transcription`)
- ✅ Atualiza `processing_steps` com novo status
- ✅ Retorna próxima etapa sugerida

**Exemplo de Uso**:
```typescript
// Retry da limpeza de texto
const response = await fetch(`/api/consultations/${id}/retry`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ step: "cleaning" }),
});
```

**Response de Sucesso**:
```json
{
  "success": true,
  "message": "Limpeza de texto concluída com sucesso",
  "step": "cleaning",
  "nextStep": "extraction"
}
```

---

### 2. Componente de UI
**Arquivo**: [`components/consultations/processing-retry.tsx`](components/consultations/processing-retry.tsx)

**Funcionalidades**:
- ✅ Exibe todas as 4 etapas com status visual
- ✅ Badges coloridos (Concluído, Falhou, Em progresso, Pendente)
- ✅ Botão "Tentar Novamente" apenas em etapas com falha
- ✅ Desabilita retry se não houver pré-requisitos (ex: não pode fazer cleaning sem transcription)
- ✅ Loading state durante retry
- ✅ Toast de feedback
- ✅ Auto-refresh após retry
- ✅ Redireciona para preview quando completa extração

**Visual**:
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  Processamento Interrompido                              │
│ O processamento não foi concluído. Você pode tentar...     │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ ✓ Download do Áudio           [Concluído]          │   │
│ │ ✓ Transcrição                 [Concluído]          │   │
│ │ ✗ Limpeza de Texto            [Falhou]  [Retry →] │   │
│ │ ○ Extração de Campos          [Pendente]          │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ 💡 Dica: As etapas já concluídas não serão reprocessadas  │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. Integração na Página
**Arquivo**: [`app/(app)/consultations/[id]/preview/page.tsx`](app/(app)/consultations/[id]/preview/page.tsx)

**Mudanças**:
```tsx
// Importar componente
import { ProcessingRetry } from "@/components/consultations/processing-retry";

// Exibir se houver erro ou ainda processando
{(consultation.status === "error" || consultation.status === "processing") && (
  <ProcessingRetry
    consultationId={id}
    status={consultation.status}
    processingSteps={consultation.processing_steps}
    processingError={consultation.processing_error}
    rawTranscription={consultation.raw_transcription}
    cleanedTranscription={consultation.cleaned_transcription}
  />
)}
```

---

## 🔄 Fluxo de Retry

### Cenário 1: Falha na Limpeza

```
Situação Inicial:
✓ Download: completed
✓ Transcrição: completed (raw_transcription salvo)
✗ Limpeza: error
○ Extração: pending

Usuário clica em "Retry" na etapa "Limpeza":

1. Frontend chama: POST /api/consultations/[id]/retry { step: "cleaning" }
2. Backend verifica: raw_transcription existe? ✓ Sim
3. Backend executa: cleanTranscription(raw_transcription)
4. Backend salva: cleaned_transcription no banco
5. Backend atualiza: processing_steps (cleaning → completed)
6. Frontend: toast de sucesso + recarrega página

Situação Final:
✓ Download: completed
✓ Transcrição: completed
✓ Limpeza: completed (cleaned_transcription salvo)
○ Extração: pending (pronto para retry)
```

### Cenário 2: Falha na Extração

```
Situação Inicial:
✓ Download: completed
✓ Transcrição: completed
✓ Limpeza: completed (cleaned_transcription salvo)
✗ Extração: error

Usuário clica em "Retry" na etapa "Extração":

1. Frontend chama: POST /api/consultations/[id]/retry { step: "extraction" }
2. Backend verifica: cleaned_transcription existe? ✓ Sim
3. Backend executa: extractConsultationFields(cleaned_transcription)
4. Backend salva: todos os campos finais no banco
5. Backend atualiza: status → "completed", processing_steps
6. Frontend: redireciona para preview com dados completos

Situação Final:
✓ Todas as etapas completed
✓ Consulta completa e pronta para uso
```

---

## 🎨 Estados Visuais

### Ícones por Estado

| Estado | Ícone | Cor | Descrição |
|--------|-------|-----|-----------|
| `completed` | ✓ CheckCircle | Verde | Etapa concluída com sucesso |
| `error` | ✗ XCircle | Vermelho | Etapa falhou, pode fazer retry |
| `in_progress` | ⟳ Loader | Azul | Etapa executando (animado) |
| `pending` | ○ Circle | Cinza | Etapa não iniciada ainda |

### Badges por Estado

| Estado | Badge | Estilo |
|--------|-------|--------|
| `completed` | Concluído | Verde sólido |
| `error` | Falhou | Vermelho sólido |
| `in_progress` | Em progresso... | Azul outline |
| `pending` | Pendente | Cinza outline |

---

## 🛡️ Validações e Segurança

### Pré-requisitos por Etapa

```typescript
transcription: {
  requer: audio_url,
  produz: raw_transcription
}

cleaning: {
  requer: raw_transcription,
  produz: cleaned_transcription
}

extraction: {
  requer: cleaned_transcription,
  produz: campos finais (chief_complaint, history, etc)
}
```

### Verificações de Segurança

- ✅ Autenticação obrigatória
- ✅ Verificar `doctor_id` (apenas médico dono da consulta)
- ✅ Validar que etapa anterior foi completada antes de permitir retry
- ✅ Timeout de segurança (maxDuration: 300s)
- ✅ Erro tratado e salvo no banco

---

## 💰 Economia de Custos

### Antes (Sem Retry)
```
Falha na Limpeza:
- Transcrição Whisper: $0.006/min × 5min = $0.03 ❌ DESPERDIÇADO
- Reprocessar tudo: +$0.03 = $0.06 TOTAL
```

### Agora (Com Retry)
```
Falha na Limpeza:
- Transcrição Whisper: $0.006/min × 5min = $0.03 ✓ APROVEITADO
- Retry apenas limpeza: $0.001 = $0.031 TOTAL

Economia: 48% do custo!
```

---

## 🧪 Como Testar

### Teste 1: Simulação de Erro na Limpeza
1. Processe uma consulta normalmente
2. Simule erro na etapa de limpeza (ex: modificar código para `throw new Error()`)
3. Verifique que etapas anteriores estão salvas no banco
4. Clique em "Tentar Novamente" na etapa de limpeza
5. Verifique que transcrição não é refeita, apenas limpeza

### Teste 2: Retry Sequencial
1. Processe uma consulta que falhe na extração
2. Faça retry da extração
3. Verifique que vai direto para preview após sucesso
4. Confirme que todos os campos foram salvos

### Teste 3: Validação de Pré-requisitos
1. Tente fazer retry de "cleaning" sem ter "transcription"
2. Deve mostrar erro: "Transcrição não encontrada"
3. Tente fazer retry de "extraction" sem ter "cleaning"
4. Deve mostrar erro: "Texto limpo não encontrado"

---

## 📊 Métricas e Monitoramento

### Logs a Observar
```
🔄 Retry da etapa: cleaning
✅ Limpeza refeita com sucesso
```

### Dados no Banco
```sql
-- Ver etapas de processamento
SELECT 
  id, 
  status, 
  processing_steps,
  raw_transcription IS NOT NULL as has_transcription,
  cleaned_transcription IS NOT NULL as has_cleaning
FROM consultations
WHERE id = 'xxx';
```

---

## 🚀 Benefícios

1. **Economia**: Não repete etapas caras (Whisper)
2. **UX**: Usuário vê progresso e pode continuar
3. **Debugging**: Mais fácil identificar qual etapa falhou
4. **Confiabilidade**: Falhas pontuais não perdem todo trabalho
5. **Transparência**: Usuário vê cada etapa do processo

---

## 🔮 Melhorias Futuras

- [ ] Auto-retry com backoff exponencial
- [ ] Notificações em tempo real (WebSocket)
- [ ] Histórico de retries por consulta
- [ ] Métricas de taxa de sucesso por etapa
- [ ] Permitir retry manual da transcrição (forçar)

---

**Versão**: 1.0  
**Status**: ✅ Implementado e funcional  
**Arquivos**: 3 criados/modificados  
**Sem erros de linter**: ✓
