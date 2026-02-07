# Database Types

Este diretório contém os tipos TypeScript gerados automaticamente do schema do banco Supabase.

## 📁 Arquivos

- `database.types.ts` - Tipos gerados automaticamente do Supabase
- `ffmpeg-installer.d.ts` - Declarações para ffmpeg
- `lamejs.d.ts` - Declarações para lamejs

## 🔄 Como Atualizar os Tipos

Os tipos em `database.types.ts` são gerados automaticamente do schema do banco de dados Supabase.

**⚠️ IMPORTANTE:** Execute um dos métodos abaixo sempre que:
- Criar novas tabelas
- Adicionar/remover colunas
- Modificar tipos de dados
- Alterar relacionamentos (foreign keys)
- Após aplicar migrations

---

### **Método 1: Script NPM (MAIS RÁPIDO)** ⚡

```bash
npm run types:generate
```

Este comando:
1. ✅ Conecta automaticamente ao Supabase usando credenciais do `.env`
2. ✅ Gera os tipos atualizados
3. ✅ Salva em `types/database.types.ts`
4. ✅ Mostra estatísticas (número de tabelas, linhas, etc.)

**Exemplo de saída:**
```
🔄 Gerando tipos do Supabase...
📦 Projeto: abcdefghijk
🔗 Conectando ao Supabase...
✅ Tipos gerados com sucesso!
📄 Arquivo: types/database.types.ts
📊 Estatísticas:
   • 938 linhas de código
   • 14 tabelas encontradas
🎉 Pronto! Os tipos estão atualizados com o schema do banco.
```

---

### **Método 2: Via Cursor AI (MAIS FÁCIL)** 🤖

No Cursor AI, simplesmente peça ao assistente:

```
"Regenere os tipos do Supabase"
```

Ou:

```
"Atualize os tipos do banco de dados"
```

O assistente usará o MCP (Model Context Protocol) do Supabase para:
1. Conectar ao banco de dados
2. Ler o schema atual
3. Gerar os tipos TypeScript atualizados
4. Salvar em `types/database.types.ts`

---

### **Método 3: Supabase CLI Manual**

Se preferir rodar manualmente:

```bash
# Via project ID (mais comum)
npx supabase gen types typescript --project-id your-project-ref > types/database.types.ts

# Via URL de conexão
npx supabase gen types typescript --db-url "postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres" > types/database.types.ts
```

**Como encontrar seu project ref:**
- Olhe na URL do dashboard: `https://supabase.com/dashboard/project/[PROJECT_REF]`
- Ou na URL da API: `https://[PROJECT_REF].supabase.co`

---

### **Método 4: Baixar do Dashboard**

1. Acesse: `https://supabase.com/dashboard/project/[seu-projeto]/api`
2. Role até "Project API keys"
3. Clique em "Generate Types"
4. Copie e cole em `types/database.types.ts`

## ⚙️ Clientes Configurados

Os clientes Supabase já estão configurados para usar esses tipos:

- `lib/supabase/client.ts` - Cliente browser
- `lib/supabase/server.ts` - Cliente server

## 💡 Como Usar

### Tipos de Tabelas

```typescript
import { Database } from "@/types/database.types";

// Tipo da linha completa
type Appointment = Database['public']['Tables']['appointments']['Row'];

// Tipo para inserção (alguns campos opcionais)
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];

// Tipo para atualização (todos campos opcionais)
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];
```

### Com Relacionamentos

```typescript
import { Database } from "@/types/database.types";

type AppointmentRow = Database['public']['Tables']['appointments']['Row'];
type PatientRow = Database['public']['Tables']['patients']['Row'];

// Tipo customizado com join
interface AppointmentWithPatient extends AppointmentRow {
  patient: PatientRow;
}
```

### Queries Tipadas

```typescript
import { createClient } from "@/lib/supabase/server";

export async function getAppointments() {
  const supabase = await createClient();
  
  // TypeScript já conhece todos os campos!
  const { data } = await supabase
    .from("appointments") // Autocomplete funcionará aqui
    .select("*")
    .eq("status", "confirmed"); // Campos são verificados em compile-time
  
  return data; // Tipo correto automaticamente
}
```

## 📝 Quando Atualizar

Atualize os tipos sempre que:

- ✅ Criar novas tabelas
- ✅ Adicionar/remover colunas
- ✅ Modificar tipos de dados
- ✅ Alterar relacionamentos (foreign keys)
- ✅ Após aplicar migrations

## 🎯 Benefícios

- ✅ Autocomplete perfeito em todas as queries
- ✅ Type-safety em compile-time
- ✅ Documentação automática do schema
- ✅ Refatoração segura
- ✅ Menos bugs em produção
