import { NextRequest, NextResponse } from "next/server";
import { cleanupOldChunks } from "@/lib/utils/cleanup-chunks";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/consultations/cleanup-chunks
 * 
 * Remove chunks órfãos (> 1 hora sem atividade)
 * Pode ser chamado por cron job ou manualmente
 */
export async function GET(request: NextRequest) {
  try {
    console.log("🧹 Iniciando limpeza de chunks órfãos...");
    
    const cleanedCount = await cleanupOldChunks();
    
    return NextResponse.json({
      success: true,
      cleanedSessions: cleanedCount,
      message: cleanedCount > 0 
        ? `${cleanedCount} sessão(ões) órfã(s) removida(s)` 
        : "Nenhuma sessão órfã encontrada",
    });
  } catch (error: any) {
    console.error("❌ Erro na limpeza:", error);
    return NextResponse.json(
      { error: error.message || "Erro na limpeza de chunks" },
      { status: 500 }
    );
  }
}
