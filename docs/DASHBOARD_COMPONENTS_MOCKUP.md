# Dashboard Components - Layout Mockup

Este documento descreve os componentes do dashboard que foram atualizados com **dados mockados** e estão prontos para receber dados reais.

---

## 📊 **InsightsCard** - Tendência de Consultas

### **Localização:**
`components/dashboard/insights-card.tsx`

### **Funcionalidades Implementadas:**

✅ **Seletor de Período**
- Tabs para alternar entre: Semanal, Mensal, Anual
- Estado gerenciado com `useState`

✅ **Gráfico de Barras**
- Visualização interativa usando Recharts
- Dados diferentes para cada período
- Tooltip com informações

✅ **Indicador de Tendência**
- Mostra crescimento/declínio vs período anterior
- Ícones e cores dinâmicas (verde/laranja)
- Cálculo de porcentagem

### **Dados Mockados Atuais:**

```typescript
const mockData = {
  week: {
    total: 12,
    previous: 10,
    chartData: [
      { name: 'Seg', value: 2 },
      { name: 'Ter', value: 3 },
      // ... resto da semana
    ]
  },
  month: {
    total: 48,
    previous: 42,
    chartData: [
      { name: 'Sem 1', value: 8 },
      // ... resto do mês
    ]
  },
  year: {
    total: 520,
    previous: 480,
    chartData: [
      { name: 'Jan', value: 35 },
      // ... resto do ano
    ]
  }
}
```

### **O que precisa ser implementado:**

🔲 **Query para dados semanais:**
```typescript
// Buscar consultas dos últimos 7 dias agrupadas por dia
async function getWeeklyConsultations() {
  // SELECT date, COUNT(*) 
  // FROM consultations 
  // WHERE date >= CURRENT_DATE - 7
  // GROUP BY date
}
```

🔲 **Query para dados mensais:**
```typescript
// Buscar consultas do mês atual agrupadas por semana
async function getMonthlyConsultations() {
  // SELECT WEEK(date), COUNT(*) 
  // FROM consultations 
  // WHERE MONTH(date) = CURRENT_MONTH
  // GROUP BY WEEK(date)
}
```

🔲 **Query para dados anuais:**
```typescript
// Buscar consultas do ano agrupadas por mês
async function getYearlyConsultations() {
  // SELECT MONTH(date), COUNT(*) 
  // FROM consultations 
  // WHERE YEAR(date) = CURRENT_YEAR
  // GROUP BY MONTH(date)
}
```

---

## 📈 **EfficiencyMetrics** - Métricas de Eficiência

### **Localização:**
`components/dashboard/efficiency-metrics.tsx`

### **Funcionalidades Implementadas:**

✅ **Card 1: Status das Consultas**
- Total de consultas
- Breakdown por status com ícones e cores:
  - ✅ Finalizadas (verde)
  - ✓ Confirmadas (azul)
  - ⚠ Pendentes (âmbar)
  - ✕ Canceladas (vermelho)
- Barras de progresso customizadas

✅ **Card 2: Tempo Economizado**
- Tempo total economizado este mês
- Formatação inteligente (min/horas)
- Comparação com mês anterior
- Indicador de tendência (%)

### **Dados Mockados Atuais:**

```typescript
const mockStatusData = {
  pending: 8,
  confirmed: 12,
  completed: 28,
  cancelled: 2
};

const mockTimeData = {
  currentMonth: 420,    // 7h em minutos
  previousMonth: 380,   // 6h20min em minutos
};
```

### **O que precisa ser implementado:**

🔲 **Query para status das consultas:**
```typescript
async function getConsultationsByStatus() {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from("appointments")
    .select("status")
    .eq("doctor_id", userId)
    .gte("appointment_date", monthStart);
  
  // Agrupar por status
  return {
    pending: data.filter(d => d.status === 'pending').length,
    confirmed: data.filter(d => d.status === 'confirmed').length,
    completed: data.filter(d => d.status === 'completed').length,
    cancelled: data.filter(d => d.status === 'cancelled').length,
  };
}
```

🔲 **Cálculo de tempo economizado:**
```typescript
async function getTimeSaved() {
  // Assumindo 15min economizados por consulta
  const consultationsThisMonth = await getMonthlyTotal();
  const consultationsPreviousMonth = await getPreviousMonthTotal();
  
  return {
    currentMonth: consultationsThisMonth * 15,
    previousMonth: consultationsPreviousMonth * 15,
  };
}
```

---

## 🚀 **Próximos Passos**

### **Fase 1: Implementar Queries**

1. Criar queries para dados semanais/mensais/anuais
2. Criar query para status de consultas
3. Implementar cálculo de tempo economizado

### **Fase 2: Integrar com Componentes**

1. Remover dados mockados
2. Passar props reais dos dados das queries
3. Adicionar loading states
4. Adicionar error handling

### **Fase 3: Otimizações**

1. Cache de dados (React Query / SWR)
2. Invalidação automática após mudanças
3. Skeleton loaders durante carregamento

---

## 📝 **Uso Atual**

No `app/(app)/dashboard/page.tsx`:

```typescript
// Atualmente usando mocks internos
<InsightsCard />
<EfficiencyMetrics />

// Futuro (após implementar queries):
<InsightsCard 
  weeklyData={weeklyData}
  monthlyData={monthlyData}
  yearlyData={yearlyData}
/>
<EfficiencyMetrics 
  statusData={statusData}
  timeData={timeData}
/>
```

---

## 🎨 **Design Features**

### **InsightsCard:**
- ✅ Tabs interativas para seleção de período
- ✅ Gráfico de barras responsivo
- ✅ Tooltip com hover
- ✅ Indicadores visuais de tendência
- ✅ Cores consistentes com design system

### **EfficiencyMetrics:**
- ✅ Cards com ícones temáticos
- ✅ Barras de progresso com cores por status
- ✅ Layout limpo e organizado
- ✅ Métricas comparativas
- ✅ Formatação inteligente de tempo

---

## 🔧 **Componentes Customizados Criados**

### **ProgressBar**
Barra de progresso customizada para aceitar cores diferentes:

```typescript
function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
```

---

## ✅ **Checklist de Implementação**

- [x] Layout do InsightsCard
- [x] Seletor de período (Semanal/Mensal/Anual)
- [x] Gráfico de barras
- [x] Indicadores de tendência
- [x] Layout do EfficiencyMetrics
- [x] Status das consultas com cores
- [x] Tempo economizado
- [x] Comparação com mês anterior
- [x] Dados mockados para visualização
- [ ] Implementar queries reais
- [ ] Integrar dados reais
- [ ] Loading states
- [ ] Error handling
- [ ] Testes

---

**Status:** ✅ Layout completo com mocks. Pronto para implementação de queries.
