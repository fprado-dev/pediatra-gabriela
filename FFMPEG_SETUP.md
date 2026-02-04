# FFmpeg Setup

Este projeto usa FFmpeg para comprimir arquivos de áudio grandes antes de enviá-los para transcrição no Whisper API.

## Por que FFmpeg?

- **Whisper API tem limite de 25MB** por arquivo
- FFmpeg comprime áudios grandes mantendo qualidade de voz
- Reduz custos e tempo de processamento

## Instalação

### macOS
```bash
brew install ffmpeg
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

### Windows
1. Baixar de https://ffmpeg.org/download.html
2. Adicionar ao PATH do sistema

### Vercel (Produção)
✅ FFmpeg já vem pré-instalado nas funções serverless da Vercel!

## Detecção Automática

O sistema detecta automaticamente o caminho do FFmpeg:

1. Variável de ambiente `FFMPEG_PATH` (Vercel)
2. Comando `which ffmpeg` (sistema)
3. Caminhos comuns:
   - `/usr/bin/ffmpeg` (Linux/Vercel)
   - `/usr/local/bin/ffmpeg` (macOS Intel)
   - `/opt/homebrew/bin/ffmpeg` (macOS ARM)

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

### Erro: "ffmpeg not found"
```bash
# Verificar instalação
which ffmpeg

# Se não instalado, instalar via homebrew (macOS)
brew install ffmpeg

# Linux
sudo apt install ffmpeg
```

### Erro: "Module not found: @ffmpeg-installer"
✅ **Resolvido!** Agora usamos FFmpeg do sistema, não via npm.

### Arquivo ainda muito grande após compressão
Se mesmo após compressão o arquivo exceder 25MB, considere:
1. Dividir a gravação em partes menores
2. Reduzir qualidade (bitrate < 64k)
3. Processar em múltiplas partes

## Mais Informações

- [FFmpeg Official Docs](https://ffmpeg.org/documentation.html)
- [fluent-ffmpeg (Node.js wrapper)](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)
