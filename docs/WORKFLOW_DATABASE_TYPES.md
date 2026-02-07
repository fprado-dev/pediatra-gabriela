# Workflow: Mantendo os Tipos do Banco Atualizados

Este documento descreve o workflow completo para manter os tipos TypeScript sincronizados com o schema do banco Supabase.

---

## 📋 **Quando Atualizar os Tipos**

Execute a atualização de tipos **sempre que**:

- ✅ Criar uma nova tabela
- ✅ Adicionar/remover colunas em tabelas existentes
- ✅ Modificar tipos de dados (ex: string → number)
- ✅ Adicionar/remover relacionamentos (foreign keys)
- ✅ Após aplicar migrations
- ✅ Após mudanças no schema pelo dashboard

---

## 🔄 **Workflow Completo**

### **Cenário 1: Criar Nova Feature com Migration**

```bash
# 1. Criar migration
touch supabase/migrations/20260207_add_new_table.sql

# 2. Escrever o SQL da migration
# (adicionar tabelas, colunas, etc.)

# 3. Aplicar migration no banco
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase/migrations/20260207_add_new_table.sql

# 4. Atualizar tipos TypeScript
npm run types:generate

# 5. Usar os novos tipos no código!
```

### **Cenário 2: Mudança Rápida via Dashboard**

```bash
# 1. Fazer alteração no Supabase Dashboard
#    (ex: adicionar coluna via SQL Editor)

# 2. Atualizar tipos
npm run types:generate

# 3. Commit dos tipos atualizados
git add types/database.types.ts
git commit -m "chore: update database types"
```

### **Cenário 3: Trabalhando com Cursor AI**

```bash
# 1. Aplicar migration ou fazer mudança no schema

# 2. Pedir ao Cursor
"Regenere os tipos do Supabase"

# 3. Pronto! Os tipos estão atualizados
```

---

## 🎯 **Métodos de Atualização**

### **1️⃣ Script NPM (Recomendado para CI/CD)**

```bash
npm run types:generate
```

**Quando usar:**
- ✅ Em scripts automatizados
- ✅ Após aplicar migrations localmente
- ✅ Antes de fazer commit
- ✅ Em hooks de pre-commit

**Vantagens:**
- Rápido (1-2 segundos)
- Automático
- Mostra estatísticas

---

### **2️⃣ Cursor AI (Recomendado para Desenvolvimento)**

Simplesmente pergunte:
```
"Regenere os tipos do Supabase"
```

**Quando usar:**
- ✅ Durante desenvolvimento ativo
- ✅ Quando você quer que o AI também atualize código relacionado
- ✅ Para verificar impacto de mudanças no schema

**Vantagens:**
- Mais conveniente
- AI pode sugerir ajustes no código
- Não precisa sair do editor

---

### **3️⃣ Supabase CLI Manual**

```bash
npx supabase gen types typescript --project-id xxx > types/database.types.ts
```

**Quando usar:**
- ✅ Troubleshooting
- ✅ Quando os outros métodos falham
- ✅ Para gerar tipos de projetos diferentes

---

## ⚡ **Pre-commit Hook (Opcional)**

Para garantir que os tipos estejam sempre atualizados antes de fazer commit:

```bash
# .git/hooks/pre-commit
#!/bin/bash

echo "🔄 Verificando tipos do Supabase..."
npm run types:generate

# Adiciona os tipos atualizados ao commit se houver mudanças
git add types/database.types.ts

echo "✅ Tipos atualizados!"
```

Tornar o hook executável:
```bash
chmod +x .git/hooks/pre-commit
```

---

## 🚨 **Troubleshooting**

### **Erro: "NEXT_PUBLIC_SUPABASE_URL não encontrado"**

**Solução:**
```bash
# Certifique-se de ter um arquivo .env ou .env.local
echo 'NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co' > .env.local
echo 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...' >> .env.local
```

---

### **Erro: "Supabase CLI não encontrado"**

**Solução:**
```bash
npm install supabase --save-dev
```

---

### **Erro: "Authentication required"**

**Solução:**
```bash
# Login no Supabase CLI
npx supabase login

# Ou use a URL de conexão direta
npx supabase gen types typescript --db-url "postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres" > types/database.types.ts
```

---

### **Os tipos não refletem mudanças recentes**

**Causas possíveis:**
1. Migration não foi aplicada no banco
2. Conectando ao projeto errado
3. Cache do TypeScript

**Soluções:**
```bash
# 1. Verificar se migration foi aplicada
psql -h db.xxx.supabase.co -U postgres -c "\dt" postgres

# 2. Verificar project ID no .env
cat .env.local | grep SUPABASE_URL

# 3. Limpar cache e rebuild
rm -rf .next
npm run types:generate
npm run build
```

---

## 📚 **Referências**

- [Supabase TypeScript Support](https://supabase.com/docs/guides/api/generating-types)
- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- Código fonte: `/types/database.types.ts`
- Script de geração: `/scripts/generate-types.js`

---

## 💡 **Dicas**

1. **Sempre teste após atualizar tipos:**
   ```bash
   npm run types:generate
   npm run build  # Verifica se não quebrou nada
   ```

2. **Commit os tipos junto com migrations:**
   ```bash
   git add supabase/migrations/20260207_*.sql
   git add types/database.types.ts
   git commit -m "feat: add new table with types"
   ```

3. **Use em code reviews:**
   - Verificar se PR que muda schema inclui tipos atualizados
   - Comparar diff dos tipos para entender mudanças

4. **Automatize em CI:**
   ```yaml
   # .github/workflows/verify-types.yml
   - name: Verify types are up to date
     run: |
       npm run types:generate
       git diff --exit-code types/database.types.ts
   ```
