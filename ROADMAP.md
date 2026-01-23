# 🗺️ Roadmap de Desenvolvimento - Pediatra Gabriela

## ✅ Fase 1: Autenticação e Perfil (CONCLUÍDO) ✨

**Status**: 100% completo
**Commit**: `fc40aa4`
**Data**: Janeiro 2024

### O que foi feito:
- ✅ Sistema completo de autenticação (Supabase)
- ✅ Cadastro com dados médicos (CRM, especialidade, telefone)
- ✅ Login/Logout
- ✅ Recuperação de senha
- ✅ Dashboard protegido
- ✅ Página de configurações/perfil
- ✅ Verificação de email opcional
- ✅ UI minimalista com tema azul médico
- ✅ Database estruturado com RLS
- ✅ Documentação completa
- ✅ Repositório GitHub criado

---

## 🎯 Próximos Passos - Fase 2: Módulo de Pacientes

**Prioridade**: ALTA 🔴
**Tempo estimado**: 2-3 semanas
**Objetivo**: CRUD completo de pacientes

### 2.1 Backend - Database

**Tarefas**:
- [ ] Criar tabela `patients` no Supabase
  - Campos: nome, data_nascimento, cpf, telefone, email, endereço
  - Campos médicos: histórico, alergias, medicações atuais
  - Relacionamento com `profiles` (doctor_id)
  - RLS configurado

- [ ] Criar tabela `patient_notes` (opcional)
  - Notas rápidas sobre cada paciente
  - Timestamps

**SQL Migration**:
```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  cpf TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  medical_history TEXT,
  allergies TEXT[],
  current_medications JSONB[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.2 Frontend - CRUD Interface

**Páginas**:
- [ ] `/dashboard/patients` - Lista de pacientes
- [ ] `/dashboard/patients/new` - Cadastrar paciente
- [ ] `/dashboard/patients/[id]` - Perfil do paciente
- [ ] `/dashboard/patients/[id]/edit` - Editar paciente

**Componentes**:
- [ ] `PatientList` - Lista com search e filtros
- [ ] `PatientCard` - Card com info resumida
- [ ] `PatientForm` - Formulário completo
- [ ] `PatientProfile` - Visualização detalhada
- [ ] `SearchBar` - Busca por nome/CPF
- [ ] `FilterDropdown` - Filtros (idade, última consulta)

**Funcionalidades**:
- [ ] Busca em tempo real (debounced)
- [ ] Ordenação (nome, data cadastro, última consulta)
- [ ] Paginação
- [ ] Validação de CPF
- [ ] Máscara de telefone/CPF
- [ ] Avatar placeholder com iniciais
- [ ] Indicador de pacientes recentes

### 2.3 UX/UI

**Design**:
- [ ] Cards com hover effect
- [ ] Empty state quando não há pacientes
- [ ] Loading states
- [ ] Error states
- [ ] Confirmação de delete
- [ ] Toast notifications

**Componentes shadcn/ui necessários**:
```bash
npx shadcn@latest add dialog
npx shadcn@latest add table
npx shadcn@latest add pagination
npx shadcn@latest add avatar
npx shadcn@latest add separator
```

---

## 🎯 Fase 3: Módulo de Consultas (Base)

**Prioridade**: ALTA 🔴
**Tempo estimado**: 2-3 semanas
**Objetivo**: Criar consultas vinculadas a pacientes

### 3.1 Backend - Database

**Tarefas**:
- [ ] Criar tabela `consultations`
  - Vinculada a `patients` e `doctor_id`
  - Status: rascunho, em_processamento, concluída
  - Data da consulta
  - Notas iniciais (manual)

- [ ] Criar tabela `consultation_attachments`
  - Para anexar PDFs, imagens de exames, etc
  - Usar Supabase Storage

**SQL Migration**:
```sql
CREATE TYPE consultation_status AS ENUM (
  'draft',
  'completed',
  'archived'
);

CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES profiles(id),
  patient_id UUID REFERENCES patients(id),
  consultation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status consultation_status DEFAULT 'draft',
  
  -- Campos clínicos (manual por enquanto)
  chief_complaint TEXT,
  history TEXT,
  physical_exam TEXT,
  diagnosis TEXT,
  plan TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3.2 Frontend - Interface Básica

**Páginas**:
- [ ] `/dashboard/consultations` - Lista de consultas
- [ ] `/dashboard/consultations/new` - Nova consulta
- [ ] `/dashboard/consultations/[id]` - Ver consulta
- [ ] `/dashboard/consultations/[id]/edit` - Editar consulta

**Componentes**:
- [ ] `ConsultationList` - Lista com filtros
- [ ] `ConsultationCard` - Card com resumo
- [ ] `ConsultationForm` - Formulário SOAP
- [ ] `PatientSelector` - Selecionar paciente
- [ ] `DatePicker` - Data da consulta

**Formato SOAP** (Subjective, Objective, Assessment, Plan):
- [ ] Section: Anamnese (S)
- [ ] Section: Exame Físico (O)
- [ ] Section: Avaliação (A)
- [ ] Section: Plano (P)

---

## 🎯 Fase 4: Upload de Áudio (Preparação para IA)

**Prioridade**: MÉDIA 🟡
**Tempo estimado**: 1-2 semanas
**Objetivo**: Permitir upload de áudios

### 4.1 Backend - Storage

**Tarefas**:
- [ ] Configurar Supabase Storage bucket `consultation-audios`
- [ ] Criar tabela `audio_files`
  - Vinculada a `consultations`
  - URL, duração, tamanho
  - Status: uploaded, processing, transcribed

- [ ] Políticas de Storage (RLS)
  - Médico só acessa seus próprios áudios

### 4.2 Frontend - Upload Interface

**Componentes**:
- [ ] `AudioUploader` - Drag & drop
- [ ] `AudioRecorder` - Gravar no browser (Web Audio API)
- [ ] `AudioPlayer` - Player customizado
- [ ] `UploadProgress` - Barra de progresso
- [ ] `FilePreview` - Preview antes de upload

**Funcionalidades**:
- [ ] Drag & drop
- [ ] Validação de formato (MP3, WAV, M4A)
- [ ] Limite de tamanho (100MB)
- [ ] Compressão client-side (opcional)
- [ ] Retry em caso de falha

---

## 🎯 Fase 5: Integração com IA (Transcrição)

**Prioridade**: ALTA 🔴
**Tempo estimado**: 3-4 semanas
**Objetivo**: Transcrever áudios automaticamente

### 5.1 Backend - Serviços de IA

**Opções de API**:
1. **OpenAI Whisper API** (Recomendado)
   - Melhor para português BR
   - Suporta timestamps
   - US$ 0.006/minuto

2. **Google Speech-to-Text**
   - Bom custo-benefício
   - Streaming opcional

3. **AssemblyAI**
   - Especializado em transcrição
   - Features extras

**Implementação**:
- [ ] Criar Edge Function no Supabase
  - Trigger quando áudio é uploaded
  - Chama API de transcrição
  - Salva resultado em `transcriptions`

- [ ] Criar tabela `transcriptions`
  - Texto bruto
  - Timestamps
  - Confiança (confidence)
  - Identificação de falantes

### 5.2 Frontend - Visualização

**Componentes**:
- [ ] `TranscriptionViewer` - Ver transcrição
- [ ] `TranscriptionEditor` - Editar texto
- [ ] `SpeakerLabels` - Identificar quem falou
- [ ] `TimestampMarkers` - Navegar por timestamps

**Funcionalidades**:
- [ ] Sincronização áudio ↔ texto
- [ ] Edição inline
- [ ] Exportar transcrição (TXT, PDF)
- [ ] Buscar na transcrição

---

## 🎯 Fase 6: IA Estruturação Clínica

**Prioridade**: ALTA 🔴
**Tempo estimado**: 3-4 semanas
**Objetivo**: Converter transcrição em documento SOAP

### 6.1 Backend - LLM Processing

**Implementação**:
- [ ] Prompt engineering para GPT-4
  - Extrair: queixa principal
  - Extrair: história clínica
  - Extrair: exame físico
  - Extrair: diagnósticos
  - Extrair: plano terapêutico

- [ ] Edge Function `process-transcription`
  - Recebe transcrição
  - Envia para GPT-4 com prompt
  - Estrutura resposta em JSON
  - Salva em `documents`

- [ ] Criar tabela `documents`
  - Documento estruturado (JSON)
  - Campos SOAP
  - Versões (histórico de edições)

**Exemplo de Prompt**:
```
Você é um assistente médico especializado em documentação clínica.
Analise a transcrição abaixo e extraia as informações em formato SOAP:

[TRANSCRIÇÃO]

Retorne JSON com:
- chief_complaint
- history_present_illness
- past_medical_history
- physical_examination
- diagnoses
- plan
```

### 6.2 Frontend - Editor Rico

**Componentes**:
- [ ] `DocumentEditor` - Editor completo
- [ ] `SOAPTemplate` - Template SOAP
- [ ] `AIHighlights` - Sugestões da IA
- [ ] `VersionHistory` - Histórico de mudanças
- [ ] `ExportOptions` - PDF, DOCX, etc

**Bibliotecas**:
```bash
npm install tiptap react-pdf @react-pdf/renderer
```

---

## 🎯 Fase 7: Templates e Exportação

**Prioridade**: MÉDIA 🟡
**Tempo estimado**: 2 semanas

**Funcionalidades**:
- [ ] Sistema de templates
- [ ] Editor de templates
- [ ] Exportação PDF com logo
- [ ] Exportação DOCX
- [ ] Envio por email
- [ ] Impressão direta

---

## 🎯 Fase 8: Analytics e Métricas

**Prioridade**: BAIXA 🟢
**Tempo estimado**: 1-2 semanas

**Funcionalidades**:
- [ ] Dashboard de métricas
- [ ] Gráficos de uso
- [ ] Relatórios mensais
- [ ] Exportação de dados

---

## 📋 Checklist de Qualidade (Todas as Fases)

Para cada feature implementada, verificar:

- [ ] Código limpo e comentado
- [ ] TypeScript types corretos
- [ ] Testes unitários (opcional no MVP)
- [ ] Responsividade mobile
- [ ] Loading states
- [ ] Error handling
- [ ] Validações client + server
- [ ] Documentação atualizada
- [ ] Commit com mensagem descritiva

---

## 🚀 Estratégia de Desenvolvimento

### Abordagem Recomendada: Incremental

**Semana 1-2**: Módulo de Pacientes (CRUD)
**Semana 3-4**: Módulo de Consultas (Manual)
**Semana 5-6**: Upload de Áudio
**Semana 7-9**: Transcrição (IA)
**Semana 10-12**: Estruturação Clínica (IA)
**Semana 13-14**: Templates e Exportação
**Semana 15-16**: Polish e Analytics

**Total**: ~4 meses para MVP completo

---

## 🎯 Milestones

### M1: Gestão de Pacientes e Consultas Manuais ✅
- Objetivo: Médicos podem gerenciar pacientes e criar consultas manualmente
- Data alvo: +3 semanas

### M2: Upload e Armazenamento de Áudio
- Objetivo: Médicos podem anexar áudios às consultas
- Data alvo: +4 semanas

### M3: Transcrição Automática
- Objetivo: Áudios são transcritos automaticamente
- Data alvo: +8 semanas

### M4: Estruturação com IA
- Objetivo: Transcrições viram documentos SOAP automaticamente
- Data alvo: +12 semanas

### M5: MVP Completo
- Objetivo: Todas funcionalidades core funcionando
- Data alvo: +16 semanas

---

## 💡 Dicas de Desenvolvimento

### Priorização
1. Sempre complete uma feature antes de começar outra
2. Teste cada feature com usuários reais (se possível)
3. Mantenha a documentação atualizada
4. Faça commits frequentes e descritivos

### Boas Práticas
- Use TypeScript rigorosamente
- Adicione testes para lógica crítica
- Mantenha componentes pequenos e reutilizáveis
- Use Server Components quando possível (Next.js)
- Otimize imagens e assets

### Deploy Contínuo
- Deploy na Vercel após cada feature
- Use branches para features (`feature/patients-crud`)
- PRs com revisão de código
- CI/CD com testes automáticos

---

## 📚 Recursos Úteis

### Documentação
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

### Inspiração
- [Cursor AI](https://cursor.sh)
- [Linear](https://linear.app)
- [Notion](https://notion.so)

---

**Última atualização**: Janeiro 2026
**Versão atual**: v0.1.0 (Autenticação e Perfil)
**Próxima versão**: v0.2.0 (Gestão de Pacientes)
