# Configuração de Email no Supabase

## ⚠️ Configuração Obrigatória

O sistema está configurado para **não exigir confirmação de email** para login. Usuários podem opcionalmente verificar seu email através da página de Configurações.

## Opção 1: Desabilitar Confirmação de Email (✅ Configuração Atual)

**Esta é a configuração recomendada e atual do sistema.**

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, vá em **Authentication** → **Providers**
4. Clique em **Email**
5. **Desabilite** a opção **"Confirm email"** ❌
6. Clique em **Save**

Com isso:
- ✅ Usuários podem fazer login imediatamente após o cadastro
- ✅ Usuários podem verificar email opcionalmente em **Dashboard → Configurações**
- ✅ O sistema envia emails de verificação apenas quando solicitado pelo usuário

## Opção 2: Configurar SMTP para Envio de Emails (Produção)

Para enviar emails de confirmação em produção:

### 2.1 Usando Gmail (Simples)

1. Vá em **Project Settings** → **Auth**
2. Role até **SMTP Settings**
3. Clique em **Enable Custom SMTP**
4. Preencha:
   - **SMTP Host**: `smtp.gmail.com`
   - **SMTP Port**: `587`
   - **SMTP User**: seu email do Gmail
   - **SMTP Password**: Senha de app do Gmail (veja abaixo)
   - **Sender email**: mesmo email do Gmail
   - **Sender name**: `Pediatra Gabriela`

#### Como obter Senha de App do Gmail:
1. Acesse: https://myaccount.google.com/apppasswords
2. Crie uma nova senha de app
3. Use essa senha no campo **SMTP Password**

### 2.2 Usando SendGrid, Resend ou Postmark (Recomendado)

Serviços profissionais de email têm melhor entregabilidade:

**SendGrid:**
- **SMTP Host**: `smtp.sendgrid.net`
- **SMTP Port**: `587`
- **SMTP User**: `apikey`
- **SMTP Password**: Sua API Key do SendGrid

**Resend:**
- **SMTP Host**: `smtp.resend.com`
- **SMTP Port**: `587`
- **SMTP User**: `resend`
- **SMTP Password**: Sua API Key do Resend

**Postmark:**
- **SMTP Host**: `smtp.postmarkapp.com`
- **SMTP Port**: `587`
- **SMTP User**: Seu Server Token
- **SMTP Password**: Seu Server Token

## Opção 3: Configurar Auto-Confirmação

Se quiser que os usuários recebam o email mas possam fazer login antes de confirmar:

1. No Supabase Dashboard, vá em **Authentication** → **Settings**
2. Em **Email Settings**, configure:
   - ✅ **Enable email confirmations**
   - ✅ **Enable auto-confirm** (permite login antes de confirmar)

## Template de Email Personalizado

Para personalizar os emails enviados:

1. Vá em **Authentication** → **Email Templates**
2. Edite o template **"Confirm signup"**
3. Personalize o assunto e o corpo do email
4. Use variáveis como `{{ .ConfirmationURL }}` para o link de confirmação

### Exemplo de Template:

```html
<h2>Bem-vindo ao Pediatra Gabriela!</h2>
<p>Olá, {{ .Name }}!</p>
<p>Confirme seu email clicando no botão abaixo:</p>
<a href="{{ .ConfirmationURL }}" style="background: #A8C9F5; color: #272424; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
  Confirmar Email
</a>
```

## Verificar Configuração

Após configurar, teste criando uma nova conta. Você deve:
- **Opção 1**: Conseguir fazer login imediatamente
- **Opção 2**: Receber um email de confirmação
- **Opção 3**: Conseguir fazer login e receber o email

## Troubleshooting

### Email não está sendo enviado:
- Verifique se o SMTP está habilitado
- Confirme as credenciais
- Verifique a caixa de spam
- Tente com outro email

### Erro "Email not confirmed":
- Desabilite a confirmação obrigatória (Opção 1)
- Ou habilite auto-confirm (Opção 3)

### Emails vão para spam:
- Configure SPF, DKIM e DMARC no seu domínio
- Use um serviço profissional (SendGrid, Resend, Postmark)
- Considere usar domínio personalizado

---

**Recomendação:** Para desenvolvimento, use a **Opção 1**. Para produção, use a **Opção 2** com serviço profissional.
