import OpenAI from "openai";

// Lazy initialization - só cria quando realmente for usar
let openaiInstance: OpenAI | null = null;

export const openai = new Proxy({} as OpenAI, {
  get(target, prop) {
    if (!openaiInstance) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY não está configurada nas variáveis de ambiente");
      }
      openaiInstance = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return (openaiInstance as any)[prop];
  },
});
