"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Title } from "@/components/title";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { ArrowLeft, Download, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type PageSize = "a4" | "letter" | "a3" | "a5";
type Orientation = "portrait" | "landscape";

const PAGE_SIZES: Record<
  PageSize,
  { width: number; height: number; label: string }
> = {
  a4: { width: 210, height: 297, label: "a4 (210 x 297mm)" },
  letter: { width: 216, height: 279, label: "letter (216 x 279mm)" },
  a3: { width: 297, height: 420, label: "a3 (297 x 420mm)" },
  a5: { width: 148, height: 210, label: "a5 (148 x 210mm)" },
};

const FONT_OPTIONS = [
  { value: "jetbrains-mono", label: "JetBrains Mono", css: "'JetBrains Mono', monospace", group: "monospace" },
  { value: "fira-code", label: "Fira Code", css: "'Fira Code', monospace", group: "monospace" },
  { value: "sf-mono", label: "SF Mono", css: "'SF Mono', monospace", group: "monospace" },
  { value: "courier-new", label: "Courier New", css: "'Courier New', monospace", group: "monospace" },
  { value: "inter", label: "Inter", css: "'Inter', sans-serif", group: "sans-serif" },
  { value: "figtree", label: "Figtree", css: "'Figtree', sans-serif", group: "sans-serif" },
  { value: "lato", label: "Lato", css: "'Lato', sans-serif", group: "sans-serif" },
  { value: "dm-sans", label: "DM Sans", css: "'DM Sans', sans-serif", group: "sans-serif" },
  { value: "system", label: "System", css: "system-ui, sans-serif", group: "sans-serif" },
  { value: "times-new-roman", label: "Times New Roman", css: "'Times New Roman', serif", group: "serif" },
  { value: "georgia", label: "Georgia", css: "'Georgia', serif", group: "serif" },
  { value: "merriweather", label: "Merriweather", css: "'Merriweather', serif", group: "serif" },
  { value: "lora", label: "Lora", css: "'Lora', serif", group: "serif" },
];

const DRAFT_KEY = "noteup-draft";

function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 font-mono text-xs cursor-pointer">
      <button
        onClick={onChange}
        className={`w-4 h-4 border flex items-center justify-center transition-colors ${
          checked ? "bg-foreground border-foreground" : "border-border"
        }`}
      >
        {checked && (
          <svg
            viewBox="0 0 24 24"
            className="h-3 w-3 text-background"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      {children}
    </label>
  );
}

/**
 * Build a fully self-contained HTML document string for the print iframe.
 * All styles are inlined — no CSS variables, no external sheets needed
 * beyond Google Fonts and KaTeX/hljs which we inline-import.
 */
function buildPrintHtml(opts: {
  contentHtml: string;
  title: string;
  showTitle: boolean;
  pageSize: PageSize;
  orientation: Orientation;
  fontFamilyCSS: string;
  fontSize: number;
  lineHeight: number;
  marginMm: number;
  darkMode: boolean;
  showPageNumbers: boolean;
}) {
  const {
    contentHtml,
    title,
    showTitle,
    pageSize,
    orientation,
    fontFamilyCSS,
    fontSize,
    lineHeight,
    marginMm,
    darkMode,
    showPageNumbers,
  } = opts;

  const bg = darkMode ? "#080808" : "#ffffff";
  const fg = darkMode ? "#ededed" : "#171717";
  const muted = darkMode ? "#808080" : "#808080";
  const border = darkMode ? "#333333" : "#dddddd";
  const codeBg = darkMode ? "#111111" : "#f5f5f5";

  // hljs colors: GitHub light / GitHub dark
  const hljs = darkMode
    ? {
        base: "#c9d1d9",
        keyword: "#ff7b72",
        string: "#a5d6ff",
        title: "#d2a8ff",
        type: "#79c0ff",
        number: "#79c0ff",
        comment: "#8b949e",
        variable: "#ffa657",
        attr: "#79c0ff",
        symbol: "#f2cc60",
        deletion: "#ffa198",
        addition: "#aff5b4",
      }
    : {
        base: "#24292e",
        keyword: "#d73a49",
        string: "#032f62",
        title: "#6f42c1",
        type: "#005cc5",
        number: "#005cc5",
        comment: "#6a737d",
        variable: "#e36209",
        attr: "#005cc5",
        symbol: "#e36209",
        deletion: "#b31d28",
        addition: "#22863a",
      };

  const dims = PAGE_SIZES[pageSize];
  const w = orientation === "portrait" ? dims.width : dims.height;
  const h = orientation === "portrait" ? dims.height : dims.width;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Figtree:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Lato:wght@400;700&family=Lora:wght@400;500;600;700&family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<style>
  @page {
    size: ${w}mm ${h}mm;
    margin: ${marginMm}mm;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: ${fontFamilyCSS};
    font-size: ${fontSize}px;
    line-height: ${lineHeight};
    color: ${fg};
    background: ${bg};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  ${showPageNumbers ? `
  @page { @bottom-center { content: counter(page) " / " counter(pages); font-size: 8px; color: ${muted}; font-family: ${fontFamilyCSS}; } }
  ` : ""}

  /* title */
  .doc-title {
    font-size: ${fontSize * 1.5}px;
    font-weight: 700;
    margin-bottom: ${fontSize}px;
    padding-bottom: ${fontSize * 0.5}px;
    border-bottom: 1px solid ${border};
    color: ${fg};
  }

  /* headings */
  h1 { font-size: 1.5em; font-weight: 700; margin: 1em 0 0.5em; padding-bottom: 0.25em; border-bottom: 1px solid ${border}; }
  h2 { font-size: 1.3em; font-weight: 600; margin: 0.9em 0 0.4em; }
  h3 { font-size: 1.15em; font-weight: 600; margin: 0.8em 0 0.4em; }
  h4, h5, h6 { font-size: 1em; font-weight: 600; margin: 0.6em 0 0.3em; }

  /* text */
  p { margin: 0.4em 0; }
  a { color: ${fg}; text-decoration: underline; text-underline-offset: 2px; }

  /* blockquote */
  blockquote { border-left: 3px solid ${border}; padding-left: 1em; color: ${muted}; margin: 0.75em 0; }
  blockquote * { color: ${muted}; }

  /* lists */
  ul, ol { padding-left: 1.5em; margin: 0.5em 0; }
  ul { list-style-type: disc; }
  ol { list-style-type: decimal; }
  li { margin: 0.15em 0; }

  /* code */
  pre {
    background: ${codeBg};
    border: 1px solid ${border};
    padding: 0.75em;
    overflow-x: auto;
    margin: 0.75em 0;
    font-size: 0.85em;
    line-height: 1.5;
    page-break-inside: avoid;
  }
  pre, pre *, code {
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  }
  pre code { font-size: inherit; background: none; padding: 0; border: none; }
  :not(pre) > code {
    background: ${codeBg};
    padding: 0.15em 0.3em;
    border: 1px solid ${border};
    font-size: 0.9em;
  }

  /* tables */
  table { border-collapse: collapse; width: 100%; margin: 0.75em 0; font-size: 0.9em; page-break-inside: avoid; }
  th, td { border: 1px solid ${border}; padding: 0.35em 0.5em; text-align: left; }
  th { font-weight: 600; background: ${codeBg}; }

  /* hr */
  hr { border: none; border-top: 1px solid ${border}; margin: 1em 0; }

  /* images */
  img { max-width: 100%; page-break-inside: avoid; }

  /* task list */
  ul[data-type="taskList"] { list-style: none; padding-left: 0; }
  input[type="checkbox"] { margin-right: 0.5em; }

  /* details */
  details { border: 1px solid ${border}; margin: 0.75em 0; page-break-inside: avoid; }
  details summary { padding: 0.5em 0.75em; font-weight: 500; background: ${codeBg}; }
  details[open] summary { border-bottom: 1px solid ${border}; }
  details > *:not(summary) { padding: 0 0.75em; }
  details > p:first-of-type { margin-top: 0.5em; }
  details > *:last-child { margin-bottom: 0.75em; }

  /* syntax highlighting */
  .hljs { background: ${codeBg}; color: ${hljs.base}; }
  .hljs-keyword, .hljs-selector-tag { color: ${hljs.keyword}; }
  .hljs-string, .hljs-addition { color: ${hljs.string}; }
  .hljs-title, .hljs-section, .hljs-name { color: ${hljs.title}; }
  .hljs-type, .hljs-built_in { color: ${hljs.type}; }
  .hljs-number { color: ${hljs.number}; }
  .hljs-comment, .hljs-quote, .hljs-meta { color: ${hljs.comment}; }
  .hljs-variable, .hljs-template-variable { color: ${hljs.variable}; }
  .hljs-attr { color: ${hljs.attr}; }
  .hljs-symbol, .hljs-bullet { color: ${hljs.symbol}; }
  .hljs-deletion { color: ${hljs.deletion}; }
  .hljs-literal { color: ${hljs.keyword}; }
  .hljs-link { color: ${hljs.string}; }
  .hljs-regexp { color: ${hljs.string}; }
  .hljs-attribute { color: ${hljs.attr}; }
  .hljs-tag { color: ${hljs.keyword}; }
  .hljs-selector-id, .hljs-selector-class { color: ${hljs.variable}; }

  /* katex */
  .katex { font-size: 1em; }
  .katex-display { margin: 0.75em 0; overflow-x: auto; }

  /* page break helpers */
  h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
  p { orphans: 3; widows: 3; }
</style>
</head>
<body>
${showTitle ? `<h1 class="doc-title">${title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h1>` : ""}
${contentHtml}
</body>
</html>`;
}

export function ExportPageContent() {
  const searchParams = useSearchParams();
  const isDraft = searchParams.get("draft") === "true";
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("untitled");
  const [mounted, setMounted] = useState(false);

  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [fontSize, setFontSize] = useState(12);
  const [marginMm, setMarginMm] = useState(20);
  const [fontFamily, setFontFamily] = useState("jetbrains-mono");
  const [darkMode, setDarkMode] = useState(false);
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [lineHeight, setLineHeight] = useState(1.6);

  const previewRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setMounted(true);
    // always prefer sessionStorage (set by the editor right before navigating)
    // fall back to localStorage draft
    try {
      const fromSession = sessionStorage.getItem("noteup-export");
      if (fromSession) {
        const data = JSON.parse(fromSession);
        setContent(data.content || "");
        setTitle(data.title || "untitled");
        return;
      }
    } catch {}
    if (isDraft) {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const draft = JSON.parse(saved);
          setContent(draft.content || "");
          setTitle(draft.title || "untitled");
        }
      } catch {}
    }
  }, [isDraft]);

  const dims = PAGE_SIZES[pageSize];
  const effectiveWidth = orientation === "portrait" ? dims.width : dims.height;
  const effectiveHeight = orientation === "portrait" ? dims.height : dims.width;

  const mmToPx = (mm: number) => (mm * 96) / 25.4;
  const pageWidthPx = mmToPx(effectiveWidth);
  const pageHeightPx = mmToPx(effectiveHeight);
  const marginPx = mmToPx(marginMm);

  const fontFamilyCSS =
    FONT_OPTIONS.find((f) => f.value === fontFamily)?.css ||
    "'Courier New', monospace";

  const bgColor = darkMode ? "#080808" : "#ffffff";
  const fgColor = darkMode ? "#ededed" : "#171717";
  const mutedColor = darkMode ? "#808080" : "#808080";
  const borderColor = darkMode ? "#333333" : "#dddddd";
  const codeBgColor = darkMode ? "#111111" : "#f5f5f5";

  // hljs colors matching buildPrintHtml
  const hljs = darkMode
    ? { base: "#c9d1d9", keyword: "#ff7b72", string: "#a5d6ff", title: "#d2a8ff", type: "#79c0ff", number: "#79c0ff", comment: "#8b949e", variable: "#ffa657" }
    : { base: "#24292e", keyword: "#d73a49", string: "#032f62", title: "#6f42c1", type: "#005cc5", number: "#005cc5", comment: "#6a737d", variable: "#e36209" };

  const handleExport = useCallback(() => {
    if (!previewRef.current) return;

    const contentEl = previewRef.current.querySelector(
      ".markdown-preview"
    );
    if (!contentEl) return;

    const html = buildPrintHtml({
      contentHtml: contentEl.innerHTML,
      title,
      showTitle,
      pageSize,
      orientation,
      fontFamilyCSS,
      fontSize,
      lineHeight,
      marginMm,
      darkMode,
      showPageNumbers,
    });

    // open in a new window for print
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast("popup blocked — allow popups for this site");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();

    // wait for fonts/katex to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };

    // fallback if onload doesn't fire
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.print();
      }
    }, 2000);
  }, [
    title,
    showTitle,
    pageSize,
    orientation,
    fontFamilyCSS,
    fontSize,
    lineHeight,
    marginMm,
    darkMode,
    showPageNumbers,
  ]);

  if (!mounted) {
    return (
      <div className="h-dvh flex items-center justify-center">
        <span className="font-mono text-xs text-muted-foreground animate-pulse">
          loading...
        </span>
      </div>
    );
  }

  // preview scale so the page fits the panel
  const previewScale = 0.65;

  return (
    <div className="h-dvh flex flex-col">
      {/* header */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Link
          href={isDraft ? "/draft" : "/"}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
        <Title />
        <span className="font-mono text-xs text-muted-foreground ml-2">
          / export to pdf
        </span>
        <div className="flex-1" />
        <ThemeToggle />
        <button
          onClick={handleExport}
          disabled={!content}
          className="ml-2 border border-border bg-foreground text-background px-3 py-1.5 font-mono text-xs font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          <Download className="h-3 w-3" />
          export pdf
        </button>
      </div>

      {/* main: config sidebar + preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* config panel */}
        <div className="w-64 border-r border-border overflow-y-auto p-4 space-y-4 shrink-0">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider">
            page settings
          </h3>

          <div className="space-y-1.5">
            <label className="font-mono text-xs text-muted-foreground">
              page size
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as PageSize)}
              className="w-full bg-transparent border border-border p-2 font-mono text-xs focus:border-foreground/30 focus:outline-none"
            >
              {Object.entries(PAGE_SIZES).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-xs text-muted-foreground">
              orientation
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => setOrientation("portrait")}
                className={`flex-1 border p-2 font-mono text-xs transition-colors ${
                  orientation === "portrait"
                    ? "border-foreground text-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                portrait
              </button>
              <button
                onClick={() => setOrientation("landscape")}
                className={`flex-1 border p-2 font-mono text-xs transition-colors ${
                  orientation === "landscape"
                    ? "border-foreground text-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                landscape
              </button>
            </div>
          </div>

          <div className="w-full h-px bg-border" />

          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider">
            typography
          </h3>

          <div className="space-y-1.5">
            <label className="font-mono text-xs text-muted-foreground">
              font
            </label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full bg-transparent border border-border p-2 font-mono text-xs focus:border-foreground/30 focus:outline-none"
            >
              {["monospace", "sans-serif", "serif"].map((group) => (
                <optgroup key={group} label={group}>
                  {FONT_OPTIONS.filter((f) => f.group === group).map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-xs text-muted-foreground">
              font size: {fontSize}px
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFontSize(Math.max(8, fontSize - 1))}
                className="border border-border p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <input
                type="range"
                min={8}
                max={24}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="flex-1"
              />
              <button
                onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                className="border border-border p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-xs text-muted-foreground">
              line height: {lineHeight.toFixed(1)}
            </label>
            <input
              type="range"
              min={1}
              max={2.5}
              step={0.1}
              value={lineHeight}
              onChange={(e) => setLineHeight(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-xs text-muted-foreground">
              margin: {marginMm}mm
            </label>
            <input
              type="range"
              min={5}
              max={40}
              value={marginMm}
              onChange={(e) => setMarginMm(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="w-full h-px bg-border" />

          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider">
            options
          </h3>

          <Checkbox checked={showTitle} onChange={() => setShowTitle(!showTitle)}>
            show document title
          </Checkbox>

          <Checkbox checked={darkMode} onChange={() => setDarkMode(!darkMode)}>
            dark background
          </Checkbox>

          <Checkbox
            checked={showPageNumbers}
            onChange={() => setShowPageNumbers(!showPageNumbers)}
          >
            page numbers
          </Checkbox>

          <div className="border border-border p-3 font-mono text-xs text-muted-foreground space-y-1">
            <p>export opens your browser&apos;s print dialog.</p>
            <p>select &quot;save as pdf&quot; as the destination for a pdf file.</p>
          </div>
        </div>

        {/* live preview */}
        <div className="flex-1 overflow-auto bg-muted p-8 flex justify-center">
          <div
            style={{
              transform: `scale(${previewScale})`,
              transformOrigin: "top center",
            }}
          >
            <div
              ref={previewRef}
              style={{
                width: `${pageWidthPx}px`,
                minHeight: `${pageHeightPx}px`,
                padding: `${marginPx}px`,
                backgroundColor: bgColor,
                color: fgColor,
                fontFamily: fontFamilyCSS,
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
                boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                backgroundImage: `repeating-linear-gradient(
                  to bottom,
                  transparent,
                  transparent ${pageHeightPx - 1}px,
                  ${darkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"} ${pageHeightPx - 1}px,
                  ${darkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"} ${pageHeightPx}px
                )`,
                backgroundSize: `100% ${pageHeightPx}px`,
              }}
            >
              {/* self-contained inline overrides for the preview panel */}
              <style>{`
                [data-export-preview] .markdown-preview,
                [data-export-preview] .markdown-preview * {
                  font-family: inherit !important;
                  color: inherit !important;
                }
                [data-export-preview] .markdown-preview h1 { font-size: 1.5em !important; font-weight: 700; margin: 1em 0 0.5em; padding-bottom: 0.25em; border-bottom: 1px solid ${borderColor}; }
                [data-export-preview] .markdown-preview h2 { font-size: 1.3em !important; font-weight: 600; margin: 0.9em 0 0.4em; }
                [data-export-preview] .markdown-preview h3 { font-size: 1.15em !important; font-weight: 600; margin: 0.8em 0 0.4em; }
                [data-export-preview] .markdown-preview h4,
                [data-export-preview] .markdown-preview h5,
                [data-export-preview] .markdown-preview h6 { font-size: 1em !important; font-weight: 600; margin: 0.6em 0 0.3em; }
                [data-export-preview] .markdown-preview p { margin: 0.4em 0; }
                [data-export-preview] a { text-decoration: underline; text-underline-offset: 2px; }
                [data-export-preview] blockquote { border-left: 3px solid ${borderColor}; padding-left: 1em; color: ${mutedColor} !important; margin: 0.75em 0; }
                [data-export-preview] blockquote * { color: ${mutedColor} !important; }
                [data-export-preview] pre {
                  background: ${codeBgColor} !important;
                  border: 1px solid ${borderColor};
                  padding: 0.75em;
                  overflow-x: auto;
                  margin: 0.75em 0;
                  font-size: 0.85em !important;
                  line-height: 1.5;
                }
                [data-export-preview] pre, [data-export-preview] pre *, [data-export-preview] code {
                  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace !important;
                }
                [data-export-preview] pre code { font-size: inherit !important; background: none !important; padding: 0 !important; border: none !important; }
                [data-export-preview] :not(pre) > code { background: ${codeBgColor} !important; padding: 0.15em 0.3em; border: 1px solid ${borderColor}; font-size: 0.9em !important; }
                [data-export-preview] th { background: ${codeBgColor} !important; }
                [data-export-preview] th, [data-export-preview] td { border-color: ${borderColor} !important; }
                [data-export-preview] hr { border-color: ${borderColor} !important; }
                [data-export-preview] .katex * { color: ${fgColor} !important; }
                [data-export-preview] details { border: 1px solid ${borderColor}; margin: 0.75em 0; }
                [data-export-preview] details summary { padding: 0.5em 0.75em; font-weight: 500; background: ${codeBgColor}; }
                [data-export-preview] details[open] summary { border-bottom: 1px solid ${borderColor}; }
                [data-export-preview] details > *:not(summary) { padding: 0 0.75em; }
                [data-export-preview] img { max-width: 100%; }

                /* syntax highlighting */
                [data-export-preview] .hljs { background: ${codeBgColor} !important; color: ${hljs.base} !important; }
                [data-export-preview] .hljs-keyword, [data-export-preview] .hljs-selector-tag, [data-export-preview] .hljs-literal, [data-export-preview] .hljs-tag { color: ${hljs.keyword} !important; }
                [data-export-preview] .hljs-string, [data-export-preview] .hljs-addition, [data-export-preview] .hljs-link, [data-export-preview] .hljs-regexp { color: ${hljs.string} !important; }
                [data-export-preview] .hljs-title, [data-export-preview] .hljs-section, [data-export-preview] .hljs-name { color: ${hljs.title} !important; }
                [data-export-preview] .hljs-type, [data-export-preview] .hljs-built_in { color: ${hljs.type} !important; }
                [data-export-preview] .hljs-number { color: ${hljs.number} !important; }
                [data-export-preview] .hljs-comment, [data-export-preview] .hljs-quote, [data-export-preview] .hljs-meta { color: ${hljs.comment} !important; }
                [data-export-preview] .hljs-variable, [data-export-preview] .hljs-template-variable, [data-export-preview] .hljs-selector-id, [data-export-preview] .hljs-selector-class { color: ${hljs.variable} !important; }
                [data-export-preview] .hljs-attr, [data-export-preview] .hljs-attribute { color: ${hljs.type} !important; }
                [data-export-preview] .hljs-symbol, [data-export-preview] .hljs-bullet { color: ${hljs.variable} !important; }
                [data-export-preview] .hljs-deletion { color: ${hljs.keyword} !important; }
              `}</style>

              <div data-export-preview>
                {showTitle && (
                  <h1
                    style={{
                      fontSize: `${fontSize * 1.5}px`,
                      fontWeight: 700,
                      marginBottom: `${fontSize}px`,
                      paddingBottom: `${fontSize * 0.5}px`,
                      borderBottom: `1px solid ${borderColor}`,
                      color: fgColor,
                    }}
                  >
                    {title}
                  </h1>
                )}
                <div className="markdown-preview">
                  <MarkdownPreview content={content} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* hidden iframe for potential future use */}
      <iframe ref={iframeRef} className="hidden" title="print" />
    </div>
  );
}
