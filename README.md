# Pediatra Gabriela 🩺

> Plataforma SaaS para transcrição e documentação automática de consultas médicas com IA

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-green)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-38B2AC)](https://tailwindcss.com/)

## 📋 Sobre o Projeto

Sistema inteligente que permite médicos gravarem e transcreverem automaticamente consultas, organizando as informações em ordem clínica e cronológica através de IA. Gera documentação completa incluindo histórico, exame físico, hipóteses diagnósticas, condutas e plano terapêutico.

## ✨ Funcionalidades Atuais (v0.1 - MVP)

### 🔐 Autenticação Completa
- Login seguro com Supabase Auth
- Cadastro com dados profissionais (CRM, especialidade, telefone)
- Recuperação de senha
- Verificação de email opcional (não bloqueia uso)

### 📊 Dashboard
- Visão geral de estatísticas
- Interface limpa e minimalista
- Cards informativos
- Acesso rápido a configurações

### ⚙️ Configurações de Perfil
- Visualização de informações pessoais
- Status de verificação de email
- Opção de verificar email quando desejar
- Interface responsiva

## 🛠️ Tecnologias

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: TailwindCSS
- **UI Components**: shadcn/ui
- **Autenticação**: Supabase Auth
- **Banco de Dados**: PostgreSQL (Supabase)
- **Ícones**: Lucide React
- **Notificações**: Sonner

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### 1. Clone o repositório

```bash
git clone https://github.com/fprado-dev/pediatra-gabriela.git
cd pediatra-gabriela
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configure o Supabase

Execute as migrations do banco de dados. Veja detalhes em `SUPABASE_EMAIL_CONFIG.md`.

**Importante**: Desabilite a confirmação obrigatória de email:
1. Dashboard Supabase → Authentication → Providers → Email
2. Desabilite "Confirm email"
3. Salve

### 5. Execute o projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

## 📁 Estrutura do Projeto

```
pediatra-gabriela/
├── app/
│   ├── auth/                   # Páginas de autenticação
│   │   ├── layout.tsx         # Layout auth com logo
│   │   ├── login/
│   │   └── sign-up/
│   ├── dashboard/             # Dashboard protegido
│   │   ├── page.tsx          # Página principal
│   │   └── settings/         # Configurações do usuário
│   ├── layout.tsx            # Layout root
│   └── globals.css           # Estilos globais
├── components/
│   ├── ui/                   # Componentes shadcn/ui
│   ├── login-form.tsx        # Formulário de login
│   ├── sign-up-form.tsx      # Formulário de cadastro
│   └── email-verification-section.tsx
├── lib/
│   └── supabase/             # Configuração Supabase
│       ├── client.ts         # Cliente browser
│       └── server.ts         # Cliente servidor
├── public/
│   └── full-logo.png         # Logo do projeto
├── FUNCIONALIDADES.md        # Documentação detalhada
├── SUPABASE_EMAIL_CONFIG.md  # Configuração de email
└── scope.md                  # Plano completo do projeto
```

## 🎨 Design

- **Tema**: Light mode (minimalista)
- **Cor primária**: #A8C9F5 (azul médico)
- **Tipografia**: Geist Sans
- **Layout**: Responsivo (mobile-first)

## 🔒 Segurança

- ✅ RLS (Row Level Security) ativo
- ✅ Autenticação via Supabase
- ✅ Cookies seguros (httpOnly)
- ✅ CSRF protection
- ✅ Validações client e server-side

## 📚 Documentação

- [FUNCIONALIDADES.md](./FUNCIONALIDADES.md) - Funcionalidades implementadas
- [SUPABASE_EMAIL_CONFIG.md](./SUPABASE_EMAIL_CONFIG.md) - Configuração de emails
- [scope.md](./scope.md) - Plano completo do produto

## 🗺️ Roadmap

Veja o plano completo em `scope.md`. Próximos passos:

- [ ] Módulo de Pacientes (CRUD)
- [ ] Gravação de áudio
- [ ] Upload de arquivos
- [ ] Integração com IA (Whisper + GPT-4)
- [ ] Transcrição automática
- [ ] Extração de entidades clínicas
- [ ] Geração de documentos estruturados
- [ ] Editor de documentos
- [ ] Exportação (PDF, DOCX)
- [ ] Templates customizáveis
- [ ] Analytics e métricas

## 🤝 Contribuindo

Este é um projeto em desenvolvimento ativo. Contribuições são bem-vindas!

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Filipe Prado** - [@fprado-dev](https://github.com/fprado-dev)

- LinkedIn: [dev-filipe](https://linkedin.com/in/dev-filipe/)
- GitHub: [@fprado-dev](https://github.com/fprado-dev)

---

<p align="center">
  Feito com ❤️ e ☕ por Filipe Prado
</p>

<p align="center">
  <sub>Transformando consultas médicas em documentação clínica completa com IA</sub>
</p>
