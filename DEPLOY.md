# 🚀 Deploy e Configuração do Repositório GitHub

## Criar Repositório no GitHub

Como o token de acesso não possui permissões para criar repositórios automaticamente, siga estes passos:

### 1. Criar Repositório Manualmente

1. Acesse: https://github.com/new
2. Preencha os dados:
   - **Repository name**: `pediatra-gabriela`
   - **Description**: `🩺 Plataforma SaaS para transcrição e documentação automática de consultas médicas com IA`
   - **Visibility**: Public ✅ (ou Private se preferir)
   - **⚠️ NÃO marque**: "Add a README file"
   - **⚠️ NÃO marque**: "Add .gitignore"
   - **⚠️ NÃO marque**: "Choose a license"
3. Clique em **"Create repository"**

### 2. Conectar o Repositório Local

Após criar o repositório no GitHub, execute os comandos abaixo no terminal:

```bash
cd /Users/goker1/pediatra-gabriela

# Adicionar todos os arquivos
git add .

# Fazer o commit inicial
git commit -m "feat: implementa autenticação e sistema de perfil

- Autenticação completa com Supabase (login, cadastro, recuperação)
- Dashboard protegido com estatísticas
- Página de configurações/perfil
- Verificação de email opcional
- UI minimalista com tema azul médico (#A8C9F5)
- Componentes shadcn/ui
- Database com RLS e triggers automáticos
- Documentação completa (README, FUNCIONALIDADES, SUPABASE_EMAIL_CONFIG)"

# Renomear branch para main (se necessário)
git branch -M main

# Conectar ao repositório remoto
git remote add origin https://github.com/fprado-dev/pediatra-gabriela.git

# Push inicial
git push -u origin main
```

## Estrutura do Commit Inicial

O commit incluirá:

### ✅ Código Fonte
- Páginas de autenticação (`app/auth/`)
- Dashboard e settings (`app/dashboard/`)
- Componentes UI (`components/`)
- Configuração Supabase (`lib/supabase/`)

### ✅ Documentação
- `README.md` - Documentação principal
- `FUNCIONALIDADES.md` - Features implementadas
- `SUPABASE_EMAIL_CONFIG.md` - Configuração de email
- `scope.md` - Plano completo do produto
- `DEPLOY.md` - Este arquivo

### ✅ Configuração
- `package.json` - Dependências
- `tsconfig.json` - TypeScript
- `tailwind.config.ts` - TailwindCSS
- `.gitignore` - Arquivos ignorados
- `components.json` - shadcn/ui

### ✅ Assets
- `public/full-logo.png` - Logo do projeto

## Verificar Status

Depois do push, verifique se tudo está correto:

```bash
# Ver commits
git log --oneline

# Ver remote
git remote -v

# Ver branch
git branch
```

## Próximos Commits

Para commits futuros, use o padrão:

```bash
# Adicionar mudanças
git add .

# Commit com mensagem descritiva
git commit -m "tipo: descrição curta

- Detalhe 1
- Detalhe 2"

# Push
git push
```

### Tipos de Commit
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta código)
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Tarefas de build/config

## Configurar GitHub

### Topics (Recomendado)
Adicione topics ao repositório para melhor descoberta:

1. Vá em: https://github.com/fprado-dev/pediatra-gabriela
2. Clique em ⚙️ (Settings) ao lado de About
3. Adicione topics:
   - `nextjs`
   - `typescript`
   - `supabase`
   - `healthcare`
   - `medical`
   - `ai`
   - `transcription`
   - `saas`
   - `tailwindcss`
   - `react`

### Configurar GitHub Pages (Opcional)

Se quiser hospedar documentação:

1. Settings → Pages
2. Source: Deploy from a branch
3. Branch: `main` / docs
4. Save

### Proteger Branch Main

Recomendado para trabalho em equipe:

1. Settings → Branches
2. Add branch protection rule
3. Branch name: `main`
4. Marque:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass

## Deploy na Vercel

### 1. Conectar Repositório

1. Acesse: https://vercel.com/new
2. Import Git Repository
3. Selecione `fprado-dev/pediatra-gabriela`
4. Configure:

### 2. Variáveis de Ambiente

Adicione no Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_key
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
```

### 3. Deploy

- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### 4. Atualizar Supabase

No Supabase Dashboard:
- Authentication → URL Configuration
- Site URL: `https://seu-dominio.vercel.app`
- Redirect URLs: `https://seu-dominio.vercel.app/**`

## Troubleshooting

### Erro: remote origin already exists
```bash
git remote remove origin
git remote add origin https://github.com/fprado-dev/pediatra-gabriela.git
```

### Erro: Updates were rejected
```bash
git pull origin main --rebase
git push origin main
```

### Erro: Permission denied
Verifique se está usando HTTPS ou SSH e se tem as credenciais corretas.

---

✅ **Checklist Final**

Antes de considerar o deploy completo:

- [ ] Repositório criado no GitHub
- [ ] Código commitado e enviado
- [ ] README.md visível no GitHub
- [ ] Topics adicionados
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Deploy realizado com sucesso
- [ ] Site acessível e funcional
- [ ] Supabase configurado para produção

---

Qualquer dúvida, consulte a documentação oficial:
- [GitHub Docs](https://docs.github.com)
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deploy](https://nextjs.org/docs/deployment)
