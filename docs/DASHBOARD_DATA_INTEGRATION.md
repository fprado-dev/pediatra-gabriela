# Dashboard - Integração de Dados Reais

Este documento explica como integrar os dados reais nos componentes do dashboard.

---

## 🚨 **Problema Identificado**

**Erro:**
```
You're importing a component that needs "next/headers". 
That only works in a Server Component.
```

**Causa:**
`InsightsCard` é um **Client Component** (`"use client"`) tentando importar `getAllAppointments()` que usa `createClient()` do servidor, que depende de `next/headers`.

**Regra do Next.js:**
- ❌ Client Components NÃO podem usar `next/headers`
- ✅ Server Components PODEM usar `next/headers`

---

## ✅ **Solução: Server → Client Data Flow**

### **Arquitetura Correta:**

```
┌─────────────────────────┐
│ dashboard/page.tsx      │ ← Server Component
│ (Server Component)      │
│                         │
│ const data = await      │ ← Busca dados do servidor
│   getAllAppointments(); │
│                         │
│ return (                │
│   <InsightsCard         │ ← Passa dados como props
│     data={data}         │
│   />                    │
│ )                       │
└─────────────────────────┘
           │
           │ props
           ▼
┌─────────────────────────┐
│ InsightsCard            │ ← Client Component
│ ("use client")          │
│                         │
│ function InsightsCard({ │
│   data                  │ ← Recebe dados por props
│ }) {                    │
│   // Usa dados aqui     │
│   return <AreaChart />  │
│ }                       │
└─────────────────────────┘
```

---

## 🔧 **Implementação Futura**

### **Passo 1: Buscar dados no Server Component**

```typescript
// app/(app)/dashboard/page.tsx
import { getAllAppointments } from "@/lib/queries/appointments/get-all-appoitments";

export default async function DashboardPage() {
  // ✅ Server Component pode usar funções de servidor
  const appointmentsData = await getAllAppointments();
  
  return (
    <div className="space-y-8">
      <InsightsCard data={appointmentsData} />
    </div>
  );
}
```

### **Passo 2: Atualizar props do Client Component**

```typescript
// components/dashboard/insights-card.tsx
"use client";

import { AppointmentsGroupedData } from "@/lib/queries/appointments/get-all-appoitments";

interface InsightsCardProps {
  data: AppointmentsGroupedData;  // ← Recebe dados por props
}

export function InsightsCard({ data }: InsightsCardProps) {
  const [period, setPeriod] = useState<PeriodType>('week');
  
  // Remove mockData, usa dados reais
  const currentData = data[period];
  
  // ... resto do componente
}
```

---

## 📝 **Estado Atual (com Mocks)**

**InsightsCard:**
- ✅ Layout completo
- ✅ Seletor de período funcional
- ✅ Gráfico de área renderizando
- ✅ Dados mockados internos
- ✅ **NÃO** busca dados do servidor (correto!)

**getAllAppointments():**
- ✅ Função implementada em `lib/queries/appointments/get-all-appoitments.ts`
- ✅ Agrupa dados em week/month/year
- ✅ Calcula totais e períodos anteriores
- ✅ Tipos exportados (`AppointmentsGroupedData`)
- ⏳ **Aguardando integração** no dashboard page

---

## 🎯 **Checklist de Integração**

Quando estiver pronto para integrar dados reais:

### **1. Atualizar Dashboard Page**

```typescript
// app/(app)/dashboard/page.tsx

// Adicionar import
import { getAllAppointments } from "@/lib/queries/appointments/get-all-appoitments";

export default async function DashboardPage() {
  // ... outros dados ...
  
  // Buscar dados agrupados
  const appointmentsData = await getAllAppointments();
  
  return (
    <div className="space-y-8">
      {/* ... outros componentes ... */}
      
      {/* Grid Principal */}
      <div className="grid gap-4 lg:grid-cols-3 min-h-[400px]">
        {/* Passar dados reais */}
        <InsightsCard data={appointmentsData} />
        
        <EfficiencyMetrics />
      </div>
    </div>
  );
}
```

### **2. Atualizar InsightsCard Props**

```typescript
// components/dashboard/insights-card.tsx

import { AppointmentsGroupedData } from "@/lib/queries/appointments/get-all-appoitments";

interface InsightsCardProps {
  data: AppointmentsGroupedData;  // ← Adicionar
}

export function InsightsCard({ data }: InsightsCardProps) {
  const [period, setPeriod] = useState<PeriodType>('week');
  
  // REMOVER mockData, usar dados reais
  const currentData = data[period];
  
  // ... resto continua igual
}
```

### **3. Remover Mock Data**

- [ ] Remover objeto `mockData` do InsightsCard
- [ ] Usar `data[period]` em vez de `mockData[period]`
- [ ] Testar todos os 3 períodos (week, month, year)

---

## 🔍 **Por que essa Arquitetura?**

### **Server Components (Page):**
- ✅ Podem usar `next/headers`, `cookies`, etc
- ✅ Rodam no servidor
- ✅ Buscam dados diretamente do banco
- ✅ Não aumentam bundle JavaScript do cliente

### **Client Components (InsightsCard):**
- ✅ Podem usar `useState`, `useEffect`, etc
- ✅ São interativos (cliques, tabs, etc)
- ✅ Recebem dados por props
- ❌ NÃO podem usar `next/headers` diretamente

---

## 📚 **Referências**

- Função implementada: `/lib/queries/appointments/get-all-appoitments.ts`
- Tipos exportados: `AppointmentsGroupedData`, `PeriodData`, `ChartData`
- Componente preparado: `/components/dashboard/insights-card.tsx`
- Dashboard: `/app/(app)/dashboard/page.tsx`

---

## ⚠️ **Importante**

**Não tente:**
- ❌ Importar funções de servidor em Client Components
- ❌ Usar `next/headers` em Client Components
- ❌ Fazer queries diretas em Client Components

**Sempre:**
- ✅ Busque dados em Server Components (pages, layouts)
- ✅ Passe dados por props para Client Components
- ✅ Ou use API Routes + fetch para Client Components

---

**Status:** ✅ Build error corrigido. Componente usando mocks. Função de queries pronta para integração futura.
