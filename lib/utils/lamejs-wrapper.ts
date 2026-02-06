/**
 * Wrapper para lamejs - só funciona no cliente
 * Arquivo separado para evitar problemas de SSR
 */

"use client";

// @ts-ignore - lamejs não tem tipos
import * as lamejs from "lamejs";

export default lamejs;
