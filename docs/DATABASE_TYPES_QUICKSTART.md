# 🚀 Database Types - Quick Start

Guia rápido para começar a usar tipos TypeScript gerados do Supabase.

---

## ⚡ **TL;DR**

```bash
# Atualizar tipos após mudanças no banco
npm run types:generate

# Ou pergunte ao Cursor AI
"Regenere os tipos do Supabase"
```

---

## 🎯 **Como Funciona**

```
┌─────────────────────┐
│  Supabase Database  │  (Fonte da verdade)
│  - appointments     │
│  - patients         │
│  - consultations    │
│  - ...              │
└──────────┬──────────┘
           │
           │ npm run types:generate
           │ (ou MCP via Cursor)
           │
           ▼
┌─────────────────────┐
│ database.types.ts   │  (Tipos gerados)
│                     │
│ type Appointment =  │
│   Database['public']│
│     ['Tables']      │
│     ['appointments']│
│     ['Row']         │
└──────────┬──────────┘
           │
           │ import
           │
           ▼
┌─────────────────────┐
│  Seu Código         │
│  - Queries          │
│  - Components       │
│  - API Routes       │
└─────────────────────┘
```

---

## 📝 **Exemplo Prático**

### **Antes (sem tipos gerados):**

```typescript
// ❌ Propenso a erros, sem autocomplete
interface Appointment {
  id: string;
  patient_id: string;
  // ... campos escritos manualmente
  // Pode ficar desatualizado!
}

const { data } = await supabase
  .from("appointments")
  .select("*")
  .eq("status", "confirmad"); // ❌ Typo não detectado!
```

### **Depois (com tipos gerados):**

```typescript
// ✅ Sempre correto, autocomplete perfeito
import { Database } from "@/types/database.types";

type Appointment = Database['public']['Tables']['appointments']['Row'];

const { data } = await supabase
  .from("appointments")
  .select("*")
  .eq("status", "confirmed"); // ✅ TypeScript valida!
//           ^^^ Autocomplete mostra: "pending" | "confirmed" | "completed" | "cancelled"
```

---

## 🔄 **Workflow Diário**

### **1. Fazer mudança no banco:**

```sql
-- supabase/migrations/20260207_add_column.sql
ALTER TABLE appointments ADD COLUMN notes TEXT;
```

### **2. Aplicar migration:**

```bash
psql ... -f supabase/migrations/20260207_add_column.sql
```

### **3. Atualizar tipos:**

```bash
npm run types:generate
```

✅ **Pronto!** TypeScript já conhece a nova coluna `notes`.

---

## 💡 **Uso nos Clientes Supabase**

Os clientes já estão configurados:

```typescript
// lib/supabase/client.ts
import { Database } from "@/types/database.types";

export function createClient() {
  return createBrowserClient<Database>(url, key);
  //                          ^^^^^^^^ Tipos aplicados!
}
```

Agora todas as queries são tipadas:

```typescript
const supabase = createClient();

// Autocomplete perfeito! ✨
const { data } = await supabase
  .from("patients")        // ← sugere todas as tabelas
  .select("full_name")     // ← sugere todas as colunas
  .eq("is_active", true);  // ← valida tipos de valores
```

---

## 🎨 **Tipos Customizados**

### **Para queries com joins:**

```typescript
import { Database } from "@/types/database.types";

type Appointment = Database['public']['Tables']['appointments']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

// Tipo customizado com relacionamento
interface AppointmentWithPatient extends Appointment {
  patient: Patient;
}
```

### **Para operações específicas:**

```typescript
// Para SELECT (todos os campos, alguns nullable)
type AppointmentRow = Database['public']['Tables']['appointments']['Row'];

// Para INSERT (alguns campos opcionais como id, created_at)
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];

// Para UPDATE (todos campos opcionais)
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];
```

---

## 🔍 **Explorando os Tipos**

No VS Code/Cursor, você pode explorar os tipos:

```typescript
import { Database } from "@/types/database.types";

// Ctrl/Cmd + Click em Database para ver estrutura completa
type DB = Database;
//   ^^^ Clique aqui!

// Autocomplete para descobrir tabelas
type Tables = Database['public']['Tables'];
//                                ^^^^^^ Ctrl+Space para ver todas

// Ver estrutura de uma tabela específica
type Appointment = Database['public']['Tables']['appointments'];
//                                              ^^^^^^^^^^^^ Ctrl+Space
```

---

## 📊 **Estatísticas do Projeto**

Após rodar `npm run types:generate`, você verá:

```
✅ Tipos gerados com sucesso!
📄 Arquivo: types/database.types.ts

📊 Estatísticas:
   • 938 linhas de código
   • 14 tabelas encontradas
```

Isso significa:
- ✅ 14 tabelas tipadas (appointments, patients, consultations, etc.)
- ✅ Cada tabela tem 3 tipos: Row, Insert, Update
- ✅ Relacionamentos (foreign keys) mapeados
- ✅ Enums e tipos customizados incluídos

---

## 🆘 **Precisa de Ajuda?**

- 📖 Guia completo: `/docs/WORKFLOW_DATABASE_TYPES.md`
- 📖 Documentação dos tipos: `/types/README.md`
- 🤖 Pergunte ao Cursor: "Como uso os tipos do Supabase?"

---

## ✅ **Checklist Rápido**

Antes de fazer commit:

- [ ] Mudanças no schema foram aplicadas no banco?
- [ ] `npm run types:generate` foi executado?
- [ ] `npm run build` passa sem erros?
- [ ] Tipos atualizados foram commitados junto?

---

**Bom desenvolvimento! 🚀**
