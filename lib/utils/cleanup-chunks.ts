/**
 * Utilitário para limpar chunks temporários órfãos
 * Chunks são considerados órfãos se ficarem no disco por mais de 1 hora
 */

import { readdir, stat, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

/**
 * Remove sessões de chunks que estão órfãs (> 1 hora sem atividade)
 * 
 * @param maxAgeHours - Idade máxima em horas antes de considerar órfão (padrão: 1)
 * @returns Número de sessões limpas
 */
export async function cleanupOldChunks(maxAgeHours: number = 1): Promise<number> {
  const chunksBaseDir = join(tmpdir(), 'audio-chunks');
  let cleanedCount = 0;

  try {
    // Verificar se o diretório existe
    try {
      await stat(chunksBaseDir);
    } catch {
      // Diretório não existe, nada para limpar
      return 0;
    }

    // Listar todas as sessões
    const sessions = await readdir(chunksBaseDir);
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

    console.log(`🧹 Verificando ${sessions.length} sessões de chunks...`);

    for (const sessionId of sessions) {
      const sessionPath = join(chunksBaseDir, sessionId);

      try {
        const sessionStats = await stat(sessionPath);
        const ageMs = now - sessionStats.mtimeMs;

        if (ageMs > maxAgeMs) {
          // Sessão órfã - remover
          await rm(sessionPath, { recursive: true, force: true });
          cleanedCount++;
          console.log(`🗑️  Sessão órfã removida: ${sessionId} (idade: ${(ageMs / 3600000).toFixed(1)}h)`);
        }
      } catch (err) {
        console.warn(`⚠️ Erro ao processar sessão ${sessionId}:`, err);
        // Continuar com próxima sessão
      }
    }

    if (cleanedCount > 0) {
      console.log(`✅ Limpeza concluída: ${cleanedCount} sessão(ões) órfã(s) removida(s)`);
    } else {
      console.log(`✅ Nenhuma sessão órfã encontrada`);
    }

    return cleanedCount;
  } catch (error) {
    console.error("❌ Erro na limpeza de chunks:", error);
    return 0;
  }
}

/**
 * Remove uma sessão específica de chunks
 * 
 * @param sessionId - ID da sessão a ser removida
 */
export async function cleanupSession(sessionId: string): Promise<boolean> {
  const sessionPath = join(tmpdir(), 'audio-chunks', sessionId);

  try {
    await rm(sessionPath, { recursive: true, force: true });
    console.log(`🗑️  Sessão removida: ${sessionId}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ Erro ao remover sessão ${sessionId}:`, error);
    return false;
  }
}

/**
 * Retorna informações sobre chunks órfãos para monitoramento
 */
export async function getOrphanedChunksInfo() {
  const chunksBaseDir = join(tmpdir(), 'audio-chunks');
  
  try {
    await stat(chunksBaseDir);
    const sessions = await readdir(chunksBaseDir);
    const now = Date.now();
    
    const sessionsInfo = await Promise.all(
      sessions.map(async (sessionId) => {
        const sessionPath = join(chunksBaseDir, sessionId);
        const sessionStats = await stat(sessionPath);
        const files = await readdir(sessionPath);
        
        return {
          sessionId,
          ageHours: (now - sessionStats.mtimeMs) / 3600000,
          chunkCount: files.length,
          path: sessionPath,
        };
      })
    );
    
    return sessionsInfo;
  } catch {
    return [];
  }
}
