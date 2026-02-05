# Calendário V2 - React Big Calendar

## Resumo das Alterações

O calendário de agendamentos foi completamente refatorado usando **react-big-calendar**, resolvendo os problemas de timezone e adicionando novas funcionalidades.

## ✅ O que foi implementado

### 1. Nova estrutura com react-big-calendar
- ✅ Substituição da implementação custom por biblioteca robusta e testada
- ✅ Suporte a múltiplas visualizações: **Semana**, **Mês**, **Dia**, **Agenda**
- ✅ Localização completa em **Português (PT-BR)**
- ✅ Integração com shadcn/ui (estilos consistentes)

### 2. Gerenciamento de Estado (Zustand)
- ✅ Store global para gerenciar appointments, blocks e estado do calendário
- ✅ Fetch automático baseado na view atual
- ✅ Refresh inteligente ao mudar de período

### 3. Drag & Drop
- ✅ Arrastar agendamentos para reorganizar horários
- ✅ Redimensionar agendamentos para alterar duração
- ✅ Validações automáticas:
  - Não permite mover para o passado
  - Não permite mover para finais de semana
  - Valida horário de trabalho (8h-18h)
  - Valida duração mínima (15 min) e máxima (4 horas)
- ✅ Atualização automática no backend via API

### 4. Funcionalidades Mantidas
- ✅ **Criar agendamento** - modal com todos os campos existentes
- ✅ **Editar agendamento** - drawer lateral com detalhes completos
- ✅ **Cancelar agendamento** - soft delete mantido
- ✅ **Bloqueios de horário** - visualização e gestão completa
- ✅ **Tipos de consulta** - cores diferentes por tipo (Consulta, Retorno, Urgência)
- ✅ **Status visual** - indicadores de status (pendente, confirmado, em atendimento, concluído, cancelado)

### 5. Melhorias de UX/UI
- ✅ **Indicador de hora atual** - linha vermelha mostrando horário atual
- ✅ **Destaque do dia atual** - background diferenciado
- ✅ **Cores por tipo de agendamento**:
  - 🔵 Azul: Consulta
  - 🟢 Verde: Retorno
  - 🟠 Laranja: Urgência
  - ⚪ Cinza tracejado: Bloqueios
- ✅ **Animação para "em atendimento"** - pulse effect
- ✅ **Hover effects** - feedback visual ao passar mouse
- ✅ **Slots de 15 minutos** - precisão mantida

### 6. Responsividade Mobile
- ✅ Altura ajustada automaticamente em mobile
- ✅ CSS responsivo para todos os breakpoints
- ✅ Touch gestures nativos
- ✅ Toolbar adaptável

### 7. Tipos TypeScript
- ✅ Tipos completos para CalendarEvent
- ✅ Tipos preparados para recorrência (futura implementação)
- ✅ Type-safety em todo o código

## 📁 Arquivos Criados/Modificados

### Novos Arquivos
- `lib/stores/calendar-store.ts` - Store Zustand
- `components/appointments/calendar-view.tsx` - Wrapper do react-big-calendar
- `components/appointments/calendar-styles.css` - Estilos customizados
- `app/(app)/appointments/page-client-v2.tsx` - Novo componente principal

### Modificados
- `lib/types/appointment.ts` - Adicionados tipos CalendarEvent e recorrência
- `app/(app)/appointments/page.tsx` - Atualizado para usar V2

### Backup
- `app/(app)/appointments/page-client-backup.tsx` - Backup da versão antiga

## 🚀 Como usar

### Visualizações

O calendário agora suporta 4 views diferentes:

1. **Semana** (padrão) - Visualização semanal de segunda a domingo
2. **Mês** - Visualização mensal completa
3. **Dia** - Visualização detalhada de um único dia
4. **Agenda** - Lista de eventos futuros

Use os botões na toolbar para alternar entre views.

### Criar Agendamento

**Opção 1:** Clique em um slot vazio no calendário
- O modal abrirá com data e hora pré-preenchidas

**Opção 2:** Clique no botão "Novo Agendamento" no header
- O modal abrirá com horário atual arredondado

### Editar Agendamento

Clique em um agendamento existente para abrir o drawer lateral com:
- Informações do paciente
- Detalhes da consulta
- Opções de edição
- Botão de cancelamento

### Mover Agendamento (Drag & Drop)

1. Clique e segure em um agendamento
2. Arraste para o novo horário/dia
3. Solte para confirmar
4. O sistema validará e atualizará automaticamente

### Redimensionar Agendamento

1. Posicione o mouse na borda inferior do agendamento
2. Clique e arraste para ajustar a duração
3. Solte para confirmar

### Bloquear Horários

1. Clique no botão "Bloquear Horário"
2. Selecione data, horário inicial e final
3. Adicione motivo (opcional)
4. Confirme

Para **desbloquear**, clique no bloqueio (cinza tracejado) e confirme remoção.

## 🎨 Cores e Indicadores

### Por Tipo de Consulta
- **Consulta** 🔵 - Azul (`#3b82f6`)
- **Retorno** 🟢 - Verde (`#10b981`)
- **Urgência** 🟠 - Laranja (`#f97316`)

### Por Status
- **Cancelado** - Opacidade reduzida + texto riscado
- **Concluído** - Borda verde
- **Em Atendimento** - Borda laranja + animação pulse

### Outros
- **Bloqueio** - Cinza tracejado (`#e5e7eb` com borda `#9ca3af`)
- **Dia Atual** - Background accent
- **Hora Atual** - Linha vermelha (`#ef4444`)

## 🔧 Configurações

### Horário de Trabalho
Atualmente fixo em **8h-18h**. Para alterar, edite em `calendar-view.tsx`:

```typescript
const min = new Date();
min.setHours(8, 0, 0); // Horário inicial

const max = new Date();
max.setHours(18, 0, 0); // Horário final
```

### Duração dos Slots
Slots de **15 minutos**. Para alterar, modifique:

```typescript
step={15} // minutos por slot
timeslots={4} // quantos slots por hora
```

## 📱 Compatibilidade

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (Desktop e Mobile)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🐛 Problemas Resolvidos

1. ✅ **Timezone inconsistente** - Resolvido com normalização de datas
2. ✅ **Horário errado no modal** - Resolvido com Date objects limpos
3. ✅ **Performance** - Melhorada com Zustand e memoization
4. ✅ **UI quebrada** - Substituída por biblioteca robusta

## 🔜 Próximas Funcionalidades (Planejadas)

- 📅 **Agendamentos recorrentes** - Tipos já criados, falta implementação
- 🔔 **Notificações/lembretes** - Sistema de notificações
- 👥 **Múltiplos médicos** - Timeline view (requer FullCalendar Premium)
- 📊 **Relatórios** - Estatísticas de agendamentos
- 🔄 **Sync em tempo real** - Supabase Realtime

## 🧪 Testes

Para testar todas as funcionalidades:

1. **Criar agendamento:**
   - Clique em slot vazio → preencha → confirme
   - Use botão "Novo Agendamento" → preencha → confirme

2. **Visualizar detalhes:**
   - Clique em agendamento existente → drawer abre

3. **Editar agendamento:**
   - Abra drawer → clique "Editar" → modifique → salve

4. **Mover agendamento (Drag & Drop):**
   - Arraste agendamento para novo slot → confirme
   - Tente mover para passado (deve bloquear)
   - Tente mover para fim de semana (deve bloquear)

5. **Redimensionar agendamento:**
   - Arraste borda inferior → ajuste duração → confirme

6. **Criar bloqueio:**
   - Clique "Bloquear Horário" → preencha → confirme
   - Bloqueio aparece cinza tracejado

7. **Remover bloqueio:**
   - Clique em bloqueio → confirme remoção

8. **Trocar visualizações:**
   - Teste Week, Month, Day, Agenda
   - Navegue entre períodos

9. **Mobile:**
   - Acesse em dispositivo móvel
   - Teste todas as funcionalidades

## 📚 Dependências Adicionadas

```json
{
  "react-big-calendar": "^1.15.0",
  "date-fns-tz": "^3.2.0",
  "zustand": "^5.0.2",
  "react-dnd": "^16.0.1",
  "react-dnd-html5-backend": "^16.0.1"
}
```

## 🔗 Recursos Úteis

- [React Big Calendar Docs](https://jquense.github.io/react-big-calendar)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [date-fns Docs](https://date-fns.org/)

## 💡 Dicas

1. **Atalhos de teclado:**
   - Use setas para navegar entre períodos
   - ESC para fechar modals

2. **Performance:**
   - O calendário carrega apenas eventos do período visível
   - Dados são cacheados no Zustand store

3. **Customização:**
   - Estilos em `calendar-styles.css`
   - Cores em `eventStyleGetter` no `calendar-view.tsx`

## ⚠️ Notas Importantes

- **Backup criado:** A versão antiga foi salva em `page-client-backup.tsx`
- **Compatibilidade:** Todas as APIs existentes foram mantidas
- **Dados:** Nenhuma migração de dados necessária
- **Rollback:** Para voltar à versão antiga, basta reverter o import em `page.tsx`

---

**Desenvolvido com:** react-big-calendar + Zustand + shadcn/ui + date-fns
