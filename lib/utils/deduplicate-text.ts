/**
 * Remove repetições consecutivas de frases/sentenças em texto transcrito
 * Útil para corrigir bugs do Whisper que geram loops de repetição
 */

export function deduplicateText(text: string): string {
  if (!text || text.trim().length === 0) {
    return text;
  }

  console.log("🔄 Iniciando deduplização de texto...");
  console.log(`📊 Tamanho original: ${text.length} caracteres`);

  // ESTRATÉGIA 1: Remover repetições de frases completas (3+ palavras)
  // Ex: "E aí você ficou..." repetido 100x → mantém apenas 1
  const removeLongPhraseRepetitions = (input: string): string => {
    // Quebrar em sentenças (por pontuação ou quebras de linha)
    const sentences = input.split(/([.!?]\s+|\n+)/g);
    const deduplicated: string[] = [];
    let lastSentence = "";
    let repetitionCount = 0;

    for (const sentence of sentences) {
      const cleanSentence = sentence.trim();

      // Se for pontuação ou vazio, adicionar
      if (cleanSentence.length < 5 || /^[.!?,;\n\s]+$/.test(cleanSentence)) {
        deduplicated.push(sentence);
        continue;
      }

      // Se for igual à anterior, contar repetição
      if (cleanSentence === lastSentence) {
        repetitionCount++;
        // Manter no máximo 2 repetições (pode ser intencional)
        if (repetitionCount <= 2) {
          deduplicated.push(sentence);
        }
      } else {
        // Nova sentença, resetar contador
        deduplicated.push(sentence);
        lastSentence = cleanSentence;
        repetitionCount = 0;
      }
    }

    return deduplicated.join("");
  };

  // ESTRATÉGIA 2: Remover repetições de palavras/frases curtas
  // Ex: "Não precisa. Não precisa. Não precisa." → "Não precisa."
  const removeShortPhraseRepetitions = (input: string): string => {
    // Padrão: mesma frase de 1-10 palavras repetida 3+ vezes consecutivas
    // Regex: captura uma frase, seguida de repetições dela mesma
    const pattern = /(\b[\wÀ-ÿ\s]{3,50}[.!?,;]?\s*)\1{2,}/gi;

    return input.replace(pattern, (match, phrase) => {
      const count = match.split(phrase).length - 1;
      console.log(`🗑️ Removendo ${count} repetições de: "${phrase.trim().substring(0, 40)}..."`);
      // Manter apenas 1 ocorrência
      return phrase;
    });
  };

  // ESTRATÉGIA 3: Remover repetições de blocos de diálogo
  // Ex: "Pergunta? Resposta. Pergunta? Resposta." repetido
  const removeDialogueRepetitions = (input: string): string => {
    // Quebrar em linhas
    const lines = input.split(/\n+/);
    const deduplicated: string[] = [];
    const seenBlocks = new Map<string, number>();
    const BLOCK_SIZE = 3; // Considerar blocos de 3 linhas

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.length === 0) {
        deduplicated.push("");
        continue;
      }

      // Criar bloco de contexto (3 linhas)
      const block = lines
        .slice(Math.max(0, i - 1), i + BLOCK_SIZE)
        .map(l => l.trim())
        .join(" ")
        .substring(0, 200); // Primeiros 200 chars como fingerprint

      // Verificar se já vimos esse bloco recentemente
      const lastSeen = seenBlocks.get(block) || -100;

      if (i - lastSeen < 5) {
        // Bloco repetido dentro de 5 linhas, pular
        console.log(`🗑️ Pulando linha repetida: "${line.substring(0, 40)}..."`);
        continue;
      }

      deduplicated.push(line);
      seenBlocks.set(block, i);
    }

    return deduplicated.join("\n");
  };

  // Aplicar estratégias em sequência
  let result = text;

  // 1. Remover frases curtas repetidas (mais agressivo)
  result = removeShortPhraseRepetitions(result);

  // 2. Remover frases longas repetidas
  result = removeLongPhraseRepetitions(result);

  // 3. Remover blocos de diálogo repetidos
  result = removeDialogueRepetitions(result);

  const originalLength = text.length;
  const newLength = result.length;
  const reduction = ((1 - newLength / originalLength) * 100).toFixed(1);

  console.log(`✅ Deduplização concluída:`);
  console.log(`   - Tamanho original: ${originalLength} caracteres`);
  console.log(`   - Tamanho final: ${newLength} caracteres`);
  console.log(`   - Redução: ${reduction}%`);

  return result;
}

/**
 * Versão mais conservadora que remove apenas repetições óbvias (5+ vezes)
 */
export function deduplicateTextConservative(text: string): string {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // Remover apenas repetições muito óbvias (5+ vezes seguidas)
  const pattern = /(\b[\wÀ-ÿ\s]{3,50}[.!?,;]?\s*)\1{4,}/gi;

  return text.replace(pattern, (match, phrase) => {
    const count = match.split(phrase).length - 1;
    console.log(`🗑️ [Conservador] Removendo ${count} repetições de: "${phrase.trim().substring(0, 40)}..."`);
    // Manter 2 ocorrências (pode ser intencional)
    return phrase + phrase;
  });
}
