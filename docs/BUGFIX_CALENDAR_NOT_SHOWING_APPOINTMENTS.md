# BugFix: Agendamentos não aparecendo no calendário

## Problema Reportado
Na Tela de Agenda (Appointments), os agendamentos criados não apareciam no calendário. Quando o usuário criava um novo agendamento, a operação era confirmada com sucesso, mas o agendamento não era exibido no calendário.

## Investigação

### 1. Verificação do Banco de Dados
- ✅ Os appointments estavam sendo salvos corretamente no Supabase
- ✅ O status padrão dos appointments é `'pending'`
- ✅ A API `/api/appointments` estava retornando os dados corretamente

### 2. Análise do Fluxo de Dados

**Fluxo esperado:**
1. Usuário preenche o modal de novo agendamento
2. Modal faz POST para `/api/appointments` 
3. API retorna sucesso (201)
4. Modal chama `onSuccess()` 
5. `onSuccess()` chama `refreshCalendar(true)` no store
6. Store busca appointments da API
7. `getCalendarEvents()` converte appointments para CalendarEvent[]
8. CalendarView renderiza os eventos

### 3. Problema Identificado

O problema estava no componente `AppointmentsPageClientV2` (`app/(app)/appointments/page-client-v2.tsx`):

```typescript
// ❌ CÓDIGO PROBLEMÁTICO
useEffect(() => {
  refreshCalendar();
}, [currentView]); // Só executava quando currentView mudava
```

**Causa raiz:**
- O `useEffect` só executava quando `currentView` mudava
- No primeiro mount, `currentView` já tinha o valor inicial `'week'` (definido no store)
- Como o valor não mudava, o useEffect **não executava** no mount inicial
- Resultado: o calendário carregava vazio na primeira vez
- Após criar um appointment e chamar `refreshCalendar(true)`, os dados eram buscados e exibidos

## Solução Implementada

Reorganizamos os `useEffect` para garantir que os dados sejam carregados:
1. **No mount inicial** (com force refresh)
2. **Quando a view muda** (sem force, usando cache)

```typescript
// ✅ CÓDIGO CORRIGIDO
// Load initial data on mount
useEffect(() => {
  refreshCalendar(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Only run once on mount

// Refresh when view changes  
useEffect(() => {
  refreshCalendar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentView]); // Refresh when view changes
```

### Benefícios da solução:
1. ✅ Dados são carregados **imediatamente** no mount
2. ✅ Force refresh no mount garante dados atualizados
3. ✅ Mudanças de view usam cache inteligente (melhor performance)
4. ✅ Após criar/editar/deletar, força refresh para atualizar

## Arquivos Modificados

1. **`app/(app)/appointments/page-client-v2.tsx`**
   - Reorganizado os useEffects para garantir carregamento no mount
   - Adicionado force refresh no mount inicial

2. **`app/(app)/appointments/page-client.tsx`** (versão antiga)
   - Adicionado eslint-disable para consistência

3. **Limpeza de código**
   - Removidos logs de debug temporários
   - Mantida estrutura limpa e focada

## Testes Recomendados

Para validar a correção, teste os seguintes cenários:

1. **Carregamento inicial:**
   - [ ] Acesse /appointments
   - [ ] Verifique se appointments existentes aparecem imediatamente

2. **Criação de novo appointment:**
   - [ ] Crie um novo agendamento
   - [ ] Verifique se aparece no calendário após salvar

3. **Navegação entre views:**
   - [ ] Mude entre Week/Month/Day/Agenda
   - [ ] Verifique se os appointments continuam visíveis

4. **Navegação entre semanas/meses:**
   - [ ] Use os botões de navegação (← →)
   - [ ] Verifique se os appointments corretos são exibidos

5. **Edição/Cancelamento:**
   - [ ] Edite um agendamento existente
   - [ ] Verifique se as mudanças são refletidas no calendário

## Prevenção de Regressão

Para evitar que este problema volte no futuro:

1. **Code Review:** Sempre verificar se useEffects dependem de valores que podem não mudar
2. **Testes:** Considerar adicionar testes E2E para o fluxo de carregamento do calendário
3. **Documentação:** Este documento serve como referência para problemas similares

## Data da Correção
- **Data:** 2026-02-07
- **Autor:** Cursor AI Agent
- **Impacto:** Alto (funcionalidade crítica)
- **Complexidade:** Baixa (problema de lifecycle do React)
