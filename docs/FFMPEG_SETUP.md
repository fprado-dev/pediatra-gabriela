# FFmpeg Setup

Este projeto usa FFmpeg para comprimir arquivos de áudio grandes antes de enviá-los para transcrição no Whisper API.

## Por que FFmpeg?

- **Whisper API tem limite de 25MB** por arquivo
- FFmpeg comprime áudios grandes mantendo qualidade de voz
- Reduz custos e tempo de processamento

## Instalação

### Desenvolvimento Local (Opcional)

Para desenvolvimento local, você pode instalar ffmpeg no sistema, mas não é necessário pois usamos binários estáticos:

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
1. Baixar de https://ffmpeg.org/download.html
2. Adicionar ao PATH do sistema

### Produção (Vercel/Deploy)

✅ **Sem configuração necessária!** 

O projeto agora usa `@ffmpeg-installer/ffmpeg` e `@ffprobe-installer/ffprobe` que fornecem binários estáticos multiplataforma. Isso garante que o ffmpeg funcione em qualquer ambiente (desenvolvimento local, Vercel, Docker, etc.) sem necessidade de instalação manual.

## Como Funciona

O sistema usa binários estáticos fornecidos pelos pacotes npm:

```typescript
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);
```

Benefícios:
- ✅ Funciona em qualquer plataforma (Linux, macOS, Windows)
- ✅ Não requer instalação manual no servidor
- ✅ Funciona no Vercel sem configuração adicional
- ✅ Versões consistentes em todos os ambientes

## Verificar Instalação

```bash
which ffmpeg
# Deve retornar: /opt/homebrew/bin/ffmpeg ou similar

ffmpeg -version
# Deve mostrar versão instalada
```

## Configurações de Compressão

O sistema usa configurações otimizadas para voz:

```typescript
audioCodec: "libmp3lame"    // Codec MP3
audioBitrate: "64k"         // 64 kbps (boa qualidade para voz)
audioChannels: 1            // Mono (reduz 50% do tamanho)
audioFrequency: 16000       // 16 kHz (suficiente para fala)
```

## Exemplo de Redução

- **Arquivo original**: 40MB (webm, stereo, 48kHz)
- **Após compressão**: ~15MB (mp3, mono, 16kHz)
- **Redução**: 62.5%

## Troubleshooting

### Erro: "spawn /usr/bin/ffmpeg ENOENT" ou "Cannot find ffprobe"
✅ **Resolvido!** Agora usamos binários estáticos via `@ffmpeg-installer/ffmpeg` e `@ffprobe-installer/ffprobe`.

Se ainda tiver problemas:
1. Verifique se os pacotes estão instalados:
```bash
npm list @ffmpeg-installer/ffmpeg @ffprobe-installer/ffprobe
```

2. Reinstale se necessário:
```bash
npm install --save @ffmpeg-installer/ffmpeg @ffprobe-installer/ffprobe
```

### Erro: "Module not found: @ffmpeg-installer/ffmpeg"
```bash
npm install --save @ffmpeg-installer/ffmpeg @ffprobe-installer/ffprobe
```

### Arquivo ainda muito grande após compressão
Se mesmo após compressão o arquivo exceder 25MB, considere:
1. Dividir a gravação em partes menores
2. Reduzir qualidade (bitrate < 64k)
3. Processar em múltiplas partes

## Mais Informações

- [FFmpeg Official Docs](https://ffmpeg.org/documentation.html)
- [fluent-ffmpeg (Node.js wrapper)](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)
