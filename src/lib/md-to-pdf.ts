// Simple markdown tokenizer for React-PDF rendering.
// Converts markdown string into a token tree that the PDF document component consumes.

export type MdToken =
  | { type: "heading"; level: number; children: InlineToken[] }
  | { type: "paragraph"; children: InlineToken[] }
  | { type: "blockquote"; children: MdToken[] }
  | { type: "code_block"; lang: string; content: string }
  | { type: "hr" }
  | { type: "list"; ordered: boolean; items: ListItem[] }
  | { type: "task_list"; items: TaskItem[] }
  | { type: "table"; headers: InlineToken[][]; rows: InlineToken[][][] }
  | { type: "math_block"; content: string };

export type ListItem = { children: InlineToken[]; subItems?: ListItem[] };
export type TaskItem = { checked: boolean; children: InlineToken[] };

export type InlineToken =
  | { type: "text"; text: string }
  | { type: "bold"; children: InlineToken[] }
  | { type: "italic"; children: InlineToken[] }
  | { type: "strikethrough"; children: InlineToken[] }
  | { type: "code"; text: string }
  | { type: "link"; href: string; children: InlineToken[] }
  | { type: "math_inline"; content: string };

// --- Inline parser ---

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let i = 0;

  while (i < text.length) {
    // Bold **text** or __text__
    if (
      (text[i] === "*" && text[i + 1] === "*") ||
      (text[i] === "_" && text[i + 1] === "_")
    ) {
      const marker = text.slice(i, i + 2);
      const end = text.indexOf(marker, i + 2);
      if (end !== -1) {
        tokens.push({
          type: "bold",
          children: parseInline(text.slice(i + 2, end)),
        });
        i = end + 2;
        continue;
      }
    }

    // Strikethrough ~~text~~
    if (text[i] === "~" && text[i + 1] === "~") {
      const end = text.indexOf("~~", i + 2);
      if (end !== -1) {
        tokens.push({
          type: "strikethrough",
          children: parseInline(text.slice(i + 2, end)),
        });
        i = end + 2;
        continue;
      }
    }

    // Italic *text* or _text_
    if (
      (text[i] === "*" || text[i] === "_") &&
      text[i + 1] !== text[i]
    ) {
      const marker = text[i];
      const end = text.indexOf(marker, i + 1);
      if (end !== -1 && end > i + 1) {
        tokens.push({
          type: "italic",
          children: parseInline(text.slice(i + 1, end)),
        });
        i = end + 1;
        continue;
      }
    }

    // Inline code `text`
    if (text[i] === "`") {
      const end = text.indexOf("`", i + 1);
      if (end !== -1) {
        tokens.push({ type: "code", text: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    // Inline math $text$
    if (text[i] === "$" && text[i + 1] !== "$") {
      const end = text.indexOf("$", i + 1);
      if (end !== -1 && end > i + 1) {
        tokens.push({
          type: "math_inline",
          content: text.slice(i + 1, end),
        });
        i = end + 1;
        continue;
      }
    }

    // Link [text](url)
    if (text[i] === "[") {
      const closeBracket = text.indexOf("]", i + 1);
      if (closeBracket !== -1 && text[closeBracket + 1] === "(") {
        const closeParen = text.indexOf(")", closeBracket + 2);
        if (closeParen !== -1) {
          tokens.push({
            type: "link",
            href: text.slice(closeBracket + 2, closeParen),
            children: parseInline(text.slice(i + 1, closeBracket)),
          });
          i = closeParen + 1;
          continue;
        }
      }
    }

    // Plain text — consume until next special char
    let end = i + 1;
    while (
      end < text.length &&
      !"*_~`$[".includes(text[end])
    ) {
      end++;
    }
    tokens.push({ type: "text", text: text.slice(i, end) });
    i = end;
  }

  return tokens;
}

// --- Block parser ---

export function parseMarkdown(md: string): MdToken[] {
  const lines = md.split("\n");
  const tokens: MdToken[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Math block $$
    if (line.trim() === "$$") {
      i++;
      const mathLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== "$$") {
        mathLines.push(lines[i]);
        i++;
      }
      tokens.push({ type: "math_block", content: mathLines.join("\n") });
      i++; // skip closing $$
      continue;
    }

    // Code block ```
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      tokens.push({ type: "code_block", lang, content: codeLines.join("\n") });
      i++; // skip closing ```
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      tokens.push({
        type: "heading",
        level: headingMatch[1].length,
        children: parseInline(headingMatch[2]),
      });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      tokens.push({ type: "hr" });
      i++;
      continue;
    }

    // Table
    if (line.includes("|") && i + 1 < lines.length && /^\|?\s*[-:]+/.test(lines[i + 1])) {
      const headerCells = parsePipeLine(line);
      i += 2; // skip header + separator
      const rows: InlineToken[][][] = [];
      while (i < lines.length && lines[i].includes("|")) {
        rows.push(parsePipeLine(lines[i]).map((c) => parseInline(c)));
        i++;
      }
      tokens.push({
        type: "table",
        headers: headerCells.map((c) => parseInline(c)),
        rows,
      });
      continue;
    }

    // Task list
    if (/^\s*-\s+\[([ xX])\]\s/.test(line)) {
      const items: TaskItem[] = [];
      while (i < lines.length) {
        const taskMatch = lines[i].match(/^\s*-\s+\[([ xX])\]\s(.+)$/);
        if (!taskMatch) break;
        items.push({
          checked: taskMatch[1] !== " ",
          children: parseInline(taskMatch[2]),
        });
        i++;
      }
      tokens.push({ type: "task_list", items });
      continue;
    }

    // Unordered list
    if (/^\s*[-*+]\s/.test(line)) {
      const items: ListItem[] = [];
      while (i < lines.length && /^\s*[-*+]\s/.test(lines[i])) {
        const content = lines[i].replace(/^\s*[-*+]\s/, "");
        items.push({ children: parseInline(content) });
        i++;
      }
      tokens.push({ type: "list", ordered: false, items });
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s/.test(line)) {
      const items: ListItem[] = [];
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) {
        const content = lines[i].replace(/^\s*\d+\.\s/, "");
        items.push({ children: parseInline(content) });
        i++;
      }
      tokens.push({ type: "list", ordered: true, items });
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      const bqLines: string[] = [];
      while (i < lines.length && (lines[i].startsWith(">") || (lines[i].trim() !== "" && bqLines.length > 0 && !lines[i].startsWith("#")))) {
        bqLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      tokens.push({
        type: "blockquote",
        children: parseMarkdown(bqLines.join("\n")),
      });
      continue;
    }

    // Paragraph — collect contiguous non-empty lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("```") &&
      !lines[i].startsWith(">") &&
      !lines[i].startsWith("$$") &&
      !/^\s*[-*+]\s/.test(lines[i]) &&
      !/^\s*\d+\.\s/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      tokens.push({
        type: "paragraph",
        children: parseInline(paraLines.join(" ")),
      });
    }
  }

  return tokens;
}

function parsePipeLine(line: string): string[] {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}
