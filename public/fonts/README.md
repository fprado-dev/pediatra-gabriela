# 📝 Fontes para PDF

## 🎯 Status Atual

⚠️ **ATENÇÃO**: Os arquivos atuais (`Inter-Regular.otf` e `Inter-Bold.otf`) são **HTML**, não fontes válidas.

O sistema está usando **FALLBACK** com **fontes padrão do PDF (Helvetica)**.

## 🔄 Como Funciona o Fallback

```
1. Tenta carregar fontes customizadas (Inter OTF)
   ↓
2. Se falhar ou arquivos inválidos:
   → Usa Helvetica (fonte padrão)
   → Remove emojis automaticamente
   → PDF funciona normalmente!
```

## ✅ Como Adicionar Fontes Válidas (OPCIONAL)

Se quiser **emojis no PDF**, siga estes passos:

### Opção A: Baixar Inter Font

```bash
# Entre na pasta de fontes
cd public/fonts

# Baixe as fontes do site oficial
curl -L "https://github.com/rsms/inter/releases/download/v4.0/Inter-4.0.zip" -o inter.zip
unzip inter.zip
mv Inter\ Desktop/Inter-Regular.otf ./Inter-Regular.otf
mv Inter\ Desktop/Inter-Bold.otf ./Inter-Bold.otf
rm -rf Inter\ Desktop inter.zip __MACOSX
```

### Opção B: Usar Noto Sans (melhor suporte Unicode)

```bash
cd public/fonts

# Baixe do Google Fonts (mais complexo, usar ferramenta)
# OU baixe manualmente de https://fonts.google.com/noto/specimen/Noto+Sans
# E renomeie para Inter-Regular.otf e Inter-Bold.otf
```

### Opção C: Usar Fontes do Sistema (macOS)

```bash
cd public/fonts

# Copie fontes do sistema
cp /System/Library/Fonts/Supplemental/Arial.ttf ./Inter-Regular.otf
cp /System/Library/Fonts/Supplemental/Arial\ Bold.ttf ./Inter-Bold.otf
```

## 🧪 Como Testar

1. **Adicione fontes válidas** usando uma das opções acima
2. **Reinicie o servidor** Next.js:
   ```bash
   npm run dev
   ```
3. **Gere um PDF** de uma consulta
4. **Verifique os logs** no console:
   ```
   ✅ Fontes customizadas Unicode carregadas  ← Sucesso!
   ou
   ✅ Usando fontes padrão (Helvetica) - emojis serão removidos  ← Fallback
   ```

## 📋 Requisitos das Fontes

Para funcionar, os arquivos devem:

- ✅ Ser fontes **OpenType (.otf)** ou **TrueType (.ttf)** válidas
- ✅ Ter suporte a **Unicode** (para emojis)
- ✅ Estar nomeados exatamente como:
  - `Inter-Regular.otf` (ou `.ttf`)
  - `Inter-Bold.otf` (ou `.ttf`)
- ✅ Ter tamanho maior que **50KB** (arquivos muito pequenos são suspeitos)

## ⚠️ Problemas Comuns

### "Unknown font format"
- Arquivo não é uma fonte válida
- Pode ser HTML, texto, ou corrupto
- Verifique com: `file Inter-Regular.otf`
- Deve retornar: `OpenType font data`

### "Fontes padrão usadas"
- Fontes customizadas não foram encontradas ou são inválidas
- PDF funciona normalmente, mas **sem emojis**
- Não é um erro, é o comportamento esperado!

## 💡 Dica Rápida

**Você pode ignorar isso completamente!**

O PDF funciona perfeitamente sem fontes customizadas. Os emojis na prescrição gerada pela IA são apenas visuais - o conteúdo importante está no texto.

Exemplo:
```
COM fontes:     💊 PRESCRIÇÃO: Dipirona 🌡️
SEM fontes:     PRESCRIÇÃO: Dipirona
                ↑ Funciona igual!
```

## 🔍 Verificar Status Atual

```bash
cd public/fonts

# Ver tipo de arquivo
file *.otf

# Deve retornar algo como:
# Inter-Regular.otf: OpenType font data
# 
# Se retornar "HTML document", são inválidos
```

## 🎨 Alternativa: Usar Emojis Texto

Se não quiser lidar com fontes customizadas, você pode:

1. Modificar o prompt da IA para **não usar emojis**
2. Usar texto simples: "[RX]" em vez de "💊"
3. O sistema já faz isso automaticamente no fallback!
