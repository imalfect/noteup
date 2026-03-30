"use client";

import { useState, useEffect, useMemo } from "react";
import { Title } from "@/components/title";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { ArrowLeft, Download, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type PageSize = "a4" | "letter" | "a3" | "a5";
type Orientation = "portrait" | "landscape";

const PAGE_SIZE_LABELS: Record<PageSize, string> = {
  A4: "a4 (210 x 297mm)",
  LETTER: "letter (216 x 279mm)",
  A3: "a3 (297 x 420mm)",
  A5: "a5 (148 x 210mm)",
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

export function ExportPageContent() {
  const searchParams = useSearchParams();
  const isDraft = searchParams.get("draft") === "true";
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("untitled");
  const [mounted, setMounted] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [pageSize, setPageSize] = useState<PageSize>("A4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [fontSize, setFontSize] = useState(11);
  const [marginMm, setMarginMm] = useState(20);
  const [fontFamily, setFontFamily] = useState("jetbrains-mono");
  const [darkMode, setDarkMode] = useState(false);
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [keepSectionsTogether, setKeepSectionsTogether] = useState(true);
  const [lineHeight, setLineHeight] = useState(1.6);

  // for measuring content and paginating
  const measureRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  useEffect(() => {
    registerFonts();
    setMounted(true);
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
  const contentAreaHeight = pageHeightPx - 2 * marginPx;

  const fontFamilyCSS =
    FONT_OPTIONS.find((f) => f.value === fontFamily)?.css ||
    "'Courier New', monospace";

  const bgColor = darkMode ? "#080808" : "#ffffff";
  const fgColor = darkMode ? "#ededed" : "#171717";
  const mutedColor = darkMode ? "#808080" : "#808080";
  const borderColor = darkMode ? "#333333" : "#dddddd";
  const codeBgColor = darkMode ? "#111111" : "#f5f5f5";

  const hljs = darkMode
    ? { base: "#c9d1d9", keyword: "#ff7b72", string: "#a5d6ff", title: "#d2a8ff", type: "#79c0ff", number: "#79c0ff", comment: "#8b949e", variable: "#ffa657" }
    : { base: "#24292e", keyword: "#d73a49", string: "#032f62", title: "#6f42c1", type: "#005cc5", number: "#005cc5", comment: "#6a737d", variable: "#e36209" };

  // measure content height after render to calculate pages
  useEffect(() => {
    if (!measureRef.current || !mounted) return;

    const measure = () => {
      const el = measureRef.current;
      if (!el) return;
      const h = el.scrollHeight;
      setMeasuredHeight(h);
      const areaH = contentAreaHeight;
      if (areaH > 0) {
        setPageCount(Math.max(1, Math.ceil(h / areaH)));
      }
    };

    // measure after fonts load and content renders
    const timer = setTimeout(measure, 200);
    const ro = new ResizeObserver(measure);
    ro.observe(measureRef.current);

    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [mounted, content, contentAreaHeight, fontSize, lineHeight, fontFamily, showTitle, title]);

  // inline styles for the export content (applied to both measure container and page cards)
  const exportContentStyles = `
    .export-content, .export-content * { font-family: ${fontFamilyCSS}; color: ${fgColor}; }
    .export-content .markdown-preview, .export-content .markdown-preview * { font-family: inherit !important; color: inherit !important; }
    .export-content .markdown-preview h1 { font-size: 1.5em !important; font-weight: 700; margin: 1em 0 0.5em; padding-bottom: 0.25em; border-bottom: 1px solid ${borderColor}; }
    .export-content .markdown-preview h2 { font-size: 1.3em !important; font-weight: 600; margin: 0.9em 0 0.4em; }
    .export-content .markdown-preview h3 { font-size: 1.15em !important; font-weight: 600; margin: 0.8em 0 0.4em; }
    .export-content .markdown-preview h4,
    .export-content .markdown-preview h5,
    .export-content .markdown-preview h6 { font-size: 1em !important; font-weight: 600; margin: 0.6em 0 0.3em; }
    .export-content .markdown-preview p { margin: 0.4em 0; }
    .export-content a { text-decoration: underline; text-underline-offset: 2px; }
    .export-content blockquote { border-left: 3px solid ${borderColor}; padding-left: 1em; color: ${mutedColor} !important; margin: 0.75em 0; }
    .export-content blockquote * { color: ${mutedColor} !important; }
    .export-content pre {
      background: ${codeBgColor} !important;
      border: 1px solid ${borderColor};
      padding: 0.75em;
      overflow-x: auto;
      margin: 0.75em 0;
      font-size: 0.85em !important;
      line-height: 1.5;
    }
    .export-content pre, .export-content pre *, .export-content code {
      font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace !important;
    }
    .export-content pre code { font-size: inherit !important; background: none !important; padding: 0 !important; border: none !important; }
    .export-content :not(pre) > code { background: ${codeBgColor} !important; padding: 0.15em 0.3em; border: 1px solid ${borderColor}; font-size: 0.9em !important; }
    .export-content th { background: ${codeBgColor} !important; }
    .export-content th, .export-content td { border-color: ${borderColor} !important; }
    .export-content hr { border-color: ${borderColor} !important; }
    .export-content .katex * { color: ${fgColor} !important; }
    .export-content details { border: 1px solid ${borderColor}; margin: 0.75em 0; }
    .export-content details summary { padding: 0.5em 0.75em; font-weight: 500; background: ${codeBgColor}; }
    .export-content details[open] summary { border-bottom: 1px solid ${borderColor}; }
    .export-content details > *:not(summary) { padding: 0 0.75em; }
    .export-content img { max-width: 100%; }

    /* syntax highlighting */
    .export-content .hljs { background: ${codeBgColor} !important; color: ${hljs.base} !important; }
    .export-content .hljs-keyword, .export-content .hljs-selector-tag, .export-content .hljs-literal, .export-content .hljs-tag { color: ${hljs.keyword} !important; }
    .export-content .hljs-string, .export-content .hljs-addition, .export-content .hljs-link, .export-content .hljs-regexp { color: ${hljs.string} !important; }
    .export-content .hljs-title, .export-content .hljs-section, .export-content .hljs-name { color: ${hljs.title} !important; }
    .export-content .hljs-type, .export-content .hljs-built_in { color: ${hljs.type} !important; }
    .export-content .hljs-number { color: ${hljs.number} !important; }
    .export-content .hljs-comment, .export-content .hljs-quote, .export-content .hljs-meta { color: ${hljs.comment} !important; }
    .export-content .hljs-variable, .export-content .hljs-template-variable, .export-content .hljs-selector-id, .export-content .hljs-selector-class { color: ${hljs.variable} !important; }
    .export-content .hljs-attr, .export-content .hljs-attribute { color: ${hljs.type} !important; }
    .export-content .hljs-symbol, .export-content .hljs-bullet { color: ${hljs.variable} !important; }
    .export-content .hljs-deletion { color: ${hljs.keyword} !important; }
  `;

  const handleExport = useCallback(async () => {
    if (exporting) return;
    setExporting(true);

    try {
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default;

      const w = orientation === "portrait" ? dims.width : dims.height;
      const h = orientation === "portrait" ? dims.height : dims.width;
      const contentWidthPx = (w * 96) / 25.4 - 2 * (marginMm * 96) / 25.4;

      // build a temporary container on-screen (but visually hidden via opacity)
      // html2canvas requires the element to be in the layout flow
      const wrapper = document.createElement("div");
      wrapper.style.position = "fixed";
      wrapper.style.top = "0";
      wrapper.style.left = "0";
      wrapper.style.width = `${contentWidthPx}px`;
      wrapper.style.zIndex = "-9999";
      wrapper.style.opacity = "0";
      wrapper.style.pointerEvents = "none";
      wrapper.className = "export-content";
      wrapper.style.fontFamily = fontFamilyCSS;
      wrapper.style.fontSize = `${fontSize}px`;
      wrapper.style.lineHeight = `${lineHeight}`;
      wrapper.style.color = fgColor;
      wrapper.style.backgroundColor = bgColor;

      // add styles
      const styleEl = document.createElement("style");
      styleEl.textContent = exportContentStyles;
      wrapper.appendChild(styleEl);

      // add title
      if (showTitle) {
        const titleEl = document.createElement("h1");
        titleEl.textContent = title;
        titleEl.style.fontSize = `${fontSize * 1.5}px`;
        titleEl.style.fontWeight = "700";
        titleEl.style.marginBottom = `${fontSize}px`;
        titleEl.style.paddingBottom = `${fontSize * 0.5}px`;
        titleEl.style.borderBottom = `1px solid ${borderColor}`;
        titleEl.style.color = fgColor;
        wrapper.appendChild(titleEl);
      }

      // clone the rendered markdown content from the measure container
      const mdContent = measureRef.current?.querySelector(".markdown-preview");
      if (mdContent) {
        const mdClone = mdContent.cloneNode(true) as HTMLElement;
        wrapper.appendChild(mdClone);
      }

      document.body.appendChild(wrapper);

      // wait for layout
      await new Promise((r) => setTimeout(r, 100));

      await html2pdf()
        .set({
          margin: marginMm,
          filename: `${title}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 3, useCORS: true, backgroundColor: bgColor },
          jsPDF: { unit: "mm", format: [w, h], orientation },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        })
        .from(wrapper)
        .save();

      document.body.removeChild(wrapper);
      toast("pdf exported");
    } catch (err) {
      console.error("pdf export failed", err);
      toast("export failed");
    } finally {
      setExporting(false);
    }
  }, [
    exporting,
    title,
    orientation,
    fontFamilyCSS,
    fontSize,
    lineHeight,
    marginMm,
    showTitle,
    dims,
    bgColor,
    fgColor,
    borderColor,
    exportContentStyles,
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

  const previewScale = 0.65;

  const titleHtml = showTitle ? (
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
  ) : null;

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
          disabled={!content || exporting}
          className="ml-2 border border-border bg-foreground text-background px-3 py-1.5 font-mono text-xs font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          <Download className="h-3 w-3" />
          {exporting ? "exporting..." : "download pdf"}
        </button>
      </div>

      {/* main: config sidebar + live preview */}
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
              {Object.entries(PAGE_SIZE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
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
              onChange={(e) => setFontFamily(e.target.value as PdfFontFamily)}
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
              font size: {fontSize}pt
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFontSize(Math.max(6, fontSize - 1))}
                className="border border-border p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <input
                type="range"
                min={6}
                max={20}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="flex-1"
              />
              <button
                onClick={() => setFontSize(Math.min(20, fontSize + 1))}
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

        {/* live preview: paginated page cards */}
        <div className="flex-1 overflow-auto bg-muted p-8">
          {/* hidden measurement container - renders full content to measure height */}
          <div
            ref={measureRef}
            className="export-content"
            style={{
              position: "absolute",
              left: "-9999px",
              top: 0,
              width: `${pageWidthPx - 2 * marginPx}px`,
              backgroundColor: bgColor,
              color: fgColor,
              fontFamily: fontFamilyCSS,
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
            }}
          >
            <style>{exportContentStyles}</style>
            {titleHtml}
            <div className="markdown-preview">
              <MarkdownPreview content={content} />
            </div>
          </div>

          {/* page cards */}
          <div
            style={{
              transform: `scale(${previewScale})`,
              transformOrigin: "top center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px",
              paddingBottom: "48px",
            }}
          >
            <style>{exportContentStyles}</style>
            {Array.from({ length: pageCount }, (_, i) => (
              <div key={i} style={{ position: "relative" }}>
                {/* page card */}
                <div
                  style={{
                    width: `${pageWidthPx}px`,
                    height: `${pageHeightPx}px`,
                    backgroundColor: bgColor,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                    padding: `${marginPx}px`,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    className="export-content"
                    style={{
                      height: `${contentAreaHeight}px`,
                      overflow: "hidden",
                      position: "relative",
                      fontFamily: fontFamilyCSS,
                      fontSize: `${fontSize}px`,
                      lineHeight: lineHeight,
                      color: fgColor,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: `${-i * contentAreaHeight}px`,
                        left: 0,
                        right: 0,
                      }}
                    >
                      {titleHtml}
                      <div className="markdown-preview">
                        <MarkdownPreview content={content} />
                      </div>
                    </div>
                  </div>

                  {/* page number */}
                  {showPageNumbers && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: `${marginPx * 0.4}px`,
                        left: 0,
                        right: 0,
                        textAlign: "center",
                        fontSize: "8px",
                        color: mutedColor,
                        fontFamily: fontFamilyCSS,
                      }}
                    >
                      {i + 1} / {pageCount}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
