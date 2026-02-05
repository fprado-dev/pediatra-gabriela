import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents removido pois é incompatível com rotas dinâmicas

  // Configurações para suportar uploads grandes
  experimental: {
    // Permitir body requests maiores (para uploads de áudio)
    serverActions: {
      bodySizeLimit: '200mb',
    },
  },

  // Externalizar pacotes com binários nativos
  serverExternalPackages: [
    '@ffmpeg-installer/ffmpeg',
    '@ffprobe-installer/ffprobe',
    'fluent-ffmpeg',
  ],
};

export default nextConfig;
