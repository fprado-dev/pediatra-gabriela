/**
 * Converte HTML do Tiptap em elementos estruturados para renderização em PDF
 */

export interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

export interface PdfElement {
  type: "paragraph" | "bullet-list" | "ordered-list" | "line-break";
  content?: TextSegment[];
  items?: TextSegment[][];
}

/**
 * Remove tags HTML e retorna apenas texto limpo
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Converte HTML em elementos estruturados para PDF
 */
export function htmlToPdfElements(html: string): PdfElement[] {
  if (!html || html === "<p></p>") return [];

  const elements: PdfElement[] = [];

  // Parse HTML simples (sem usar DOMParser no Node.js)
  // Dividir por tags de bloco
  const blockRegex = /<(p|ul|ol|br)[\s>].*?<\/\1>|<br\s*\/?>/gi;
  let match;
  let lastIndex = 0;
  const matches: { tag: string; content: string; index: number }[] = [];

  // Encontrar todas as tags de bloco
  const tempHtml = html.replace(/<br\s*\/?>/gi, "<br></br>");
  const parser = tempHtml.matchAll(/<(p|ul|ol|br)[\s>](.*?)<\/\1>/g);

  for (const match of parser) {
    matches.push({
      tag: match[1].toLowerCase(),
      content: match[2],
      index: match.index || 0,
    });
  }

  // Processar cada bloco
  for (const { tag, content } of matches) {
    if (tag === "br") {
      elements.push({ type: "line-break" });
      continue;
    }

    if (tag === "p") {
      const segments = parseTextSegments(content);
      if (segments.length > 0) {
        elements.push({
          type: "paragraph",
          content: segments,
        });
      }
      continue;
    }

    if (tag === "ul") {
      const items = parseListItems(content);
      if (items.length > 0) {
        elements.push({
          type: "bullet-list",
          items,
        });
      }
      continue;
    }

    if (tag === "ol") {
      const items = parseListItems(content);
      if (items.length > 0) {
        elements.push({
          type: "ordered-list",
          items,
        });
      }
      continue;
    }
  }

  return elements;
}

/**
 * Parse texto com formatação inline (strong, em)
 */
function parseTextSegments(html: string): TextSegment[] {
  if (!html) return [];

  const segments: TextSegment[] = [];
  let currentText = "";
  let isBold = false;
  let isItalic = false;

  // Substituir <br> por espaço
  html = html.replace(/<br\s*\/?>/gi, " ");

  // Parse simples de tags inline
  const regex = /<(\/?)(?:strong|b|em|i)>/gi;
  let lastIndex = 0;
  let match;

  const parts: { tag: string; closing: boolean; index: number }[] = [];
  while ((match = regex.exec(html)) !== null) {
    parts.push({
      tag: match[1] ? "" : match[0].toLowerCase().replace(/<|>/g, ""),
      closing: !!match[1],
      index: match.index,
    });
  }

  // Processar partes
  let pos = 0;
  for (let i = 0; i <= parts.length; i++) {
    const part = parts[i];
    const nextPos = part?.index ?? html.length;

    // Extrair texto entre tags
    const text = html.substring(pos, nextPos);
    if (text) {
      const cleanText = stripHtml(text).trim();
      if (cleanText) {
        segments.push({
          text: cleanText,
          bold: isBold,
          italic: isItalic,
        });
      }
    }

    if (!part) break;

    // Atualizar flags
    const tagName = part.tag;
    if (tagName.includes("strong") || tagName.includes("b")) {
      isBold = !part.closing;
    }
    if (tagName.includes("em") || tagName.includes("i")) {
      isItalic = !part.closing;
    }

    pos = nextPos + html.substring(nextPos).match(/<[^>]*>/)![0].length;
  }

  return segments;
}

/**
 * Parse itens de lista
 */
function parseListItems(html: string): TextSegment[][] {
  const items: TextSegment[][] = [];

  // Extrair cada <li>
  const liRegex = /<li>(.*?)<\/li>/g;
  let match;

  while ((match = liRegex.exec(html)) !== null) {
    const segments = parseTextSegments(match[1]);
    if (segments.length > 0) {
      items.push(segments);
    }
  }

  return items;
}
