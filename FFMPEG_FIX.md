# Fix: FFmpeg no Vercel

## Problema

O sistema estava falhando ao processar áudios grandes (>25MB) no Vercel com os seguintes erros:

```
Error: spawn /usr/bin/ffmpeg ENOENT
Error: Erro ao ler metadados: Cannot find ffprobe
```

## Causa

O código anterior tentava usar o ffmpeg do sistema operacional, que:
- Não estava disponível no ambiente Vercel
- O comando `which` não funcionava no Vercel
- Os caminhos hardcoded não eram confiáveis

## Solução Implementada

### 1. Instalação de Binários Estáticos

Instalamos pacotes que fornecem binários estáticos multiplataforma:

```bash
npm install --save @ffmpeg-installer/ffmpeg @ffprobe-installer/ffprobe
```

### 2. Atualização do Código

#### `lib/utils/compress-audio.ts`
```typescript
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

const ffmpegPath = ffmpegInstaller.path;
ffmpeg.setFfmpegPath(ffmpegPath);
```

#### `lib/utils/split-audio.ts`
```typescript
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);
```

### 3. Configuração do Next.js

Adicionamos os pacotes à lista de externos no `next.config.ts`:

```typescript
serverExternalPackages: [
  '@ffmpeg-installer/ffmpeg',
  '@ffprobe-installer/ffprobe',
  'fluent-ffmpeg',
],
```

Isso evita que o bundler do Next.js tente processar os binários nativos.

### 4. Definições de Tipo

Criamos `types/ffmpeg-installer.d.ts` para evitar erros de TypeScript.

## Deploy no Vercel

### Passo 1: Fazer Push das Mudanças

```bash
git add .
git commit -m "fix: use static ffmpeg binaries for cross-platform support"
git push origin main
```

### Passo 2: Vercel Deploy

O Vercel vai automaticamente:
1. Instalar as dependências (incluindo os binários do ffmpeg)
2. Fazer o build usando as configurações atualizadas
3. Deploy com os binários disponíveis

**Não é necessário nenhuma configuração adicional no Vercel!**

## Verificação

Após o deploy, teste enviando um áudio grande (>25MB) para verificar que:

1. ✅ O download do áudio funciona
2. ✅ A compressão com ffmpeg funciona
3. ✅ A transcrição é bem-sucedida
4. ✅ Não há mais erros de `ENOENT` ou `Cannot find ffprobe`

## Logs Esperados

Você deve ver nos logs do Vercel:

```
🎬 FFmpeg path: /var/task/node_modules/@ffmpeg-installer/linux-x64/ffmpeg
🔍 FFprobe path: /var/task/node_modules/@ffprobe-installer/linux-x64/ffprobe
```

Note que no Vercel será `linux-x64` (não `darwin-arm64` como no macOS local).

## Rollback (Se Necessário)

Se houver problemas, você pode reverter para a versão anterior:

```bash
git revert HEAD
git push origin main
```

## Benefícios da Solução

1. ✅ **Multiplataforma**: Funciona em Linux, macOS, Windows
2. ✅ **Zero configuração**: Não precisa instalar nada no servidor
3. ✅ **Consistente**: Mesma versão do ffmpeg em todos os ambientes
4. ✅ **Confiável**: Binários testados e mantidos pela comunidade
5. ✅ **Funciona no Vercel**: Sem necessidade de configurações especiais

## Arquivos Modificados

- `package.json` - Adicionadas dependências
- `lib/utils/compress-audio.ts` - Usa binário estático
- `lib/utils/split-audio.ts` - Usa binários estáticos
- `next.config.ts` - Externaliza pacotes com binários
- `types/ffmpeg-installer.d.ts` - Definições de tipo
- `FFMPEG_SETUP.md` - Documentação atualizada
