"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Title } from "@/components/title";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { ArrowLeft, Download, Minus, Plus, ChevronUp, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { jsPDF } from "jspdf";

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
  // monospace
  { value: "jetbrains-mono", label: "JetBrains Mono", css: "'JetBrains Mono', monospace", group: "monospace" },
  { value: "fira-code", label: "Fira Code", css: "'Fira Code', monospace", group: "monospace" },
  { value: "sf-mono", label: "SF Mono", css: "'SF Mono', monospace", group: "monospace" },
  { value: "courier-new", label: "Courier New", css: "'Courier New', monospace", group: "monospace" },
  // sans-serif
  { value: "inter", label: "Inter", css: "'Inter', sans-serif", group: "sans-serif" },
  { value: "figtree", label: "Figtree", css: "'Figtree', sans-serif", group: "sans-serif" },
  { value: "lato", label: "Lato", css: "'Lato', sans-serif", group: "sans-serif" },
  { value: "dm-sans", label: "DM Sans", css: "'DM Sans', sans-serif", group: "sans-serif" },
  { value: "system", label: "System", css: "system-ui, sans-serif", group: "sans-serif" },
  // serif
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setMounted(true);
    if (isDraft) {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const draft = JSON.parse(saved);
          setContent(draft.content || "");
          setTitle(draft.title || "untitled");
        }
      } catch {}
    } else {
      try {
        const saved = sessionStorage.getItem("noteup-export");
        if (saved) {
          const data = JSON.parse(saved);
          setContent(data.content || "");
          setTitle(data.title || "untitled");
        }
      } catch {}
    }
  }, [isDraft]);

  const dims = PAGE_SIZES[pageSize];
  const effectiveWidth =
    orientation === "portrait" ? dims.width : dims.height;
  const effectiveHeight =
    orientation === "portrait" ? dims.height : dims.width;

  const mmToPx = (mm: number) => (mm * 96) / 25.4;
  const previewScale = 0.85;
  const pageWidthPx = mmToPx(effectiveWidth);
  const pageHeightPx = mmToPx(effectiveHeight);
  const marginPx = mmToPx(marginMm);

  const fontFamilyCSS = FONT_OPTIONS.find((f) => f.value === fontFamily)?.css || "'Courier New', monospace";

  const bgColor = darkMode ? "#080808" : "#ffffff";
  const fgColor = darkMode ? "#ededed" : "#171717";
  const mutedColor = darkMode ? "#808080" : "#808080";
  const borderColor = darkMode ? "#333333" : "#dddddd";
  const codeBgColor = darkMode ? "#111111" : "#f5f5f5";

  // estimate total pages from content height
  useEffect(() => {
    if (!previewRef.current) return;
    const contentEl = previewRef.current.querySelector("[data-pdf-content]") as HTMLElement;
    if (!contentEl) return;
    const observer = new ResizeObserver(() => {
      // subtract padding to get actual content height
      const contentHeight = contentEl.scrollHeight - marginPx * 2;
      const usableHeight = pageHeightPx - marginPx * 2;
      const pages = Math.max(1, Math.ceil(contentHeight / usableHeight));
      setTotalPages(pages);
    });
    observer.observe(contentEl);
    return () => observer.disconnect();
  }, [content, pageHeightPx, marginPx, fontSize, lineHeight, fontFamily, showTitle]);

  // track scroll position to determine current page
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scaledPageHeight = pageHeightPx * previewScale;
      const pageGap = 32 * previewScale;
      const page = Math.floor(scrollTop / (scaledPageHeight + pageGap)) + 1;
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [pageHeightPx, previewScale, totalPages]);

  const scrollToPage = (page: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const clamped = Math.max(1, Math.min(page, totalPages));
    const scaledPageHeight = pageHeightPx * previewScale;
    const pageGap = 32 * previewScale;
    container.scrollTo({
      top: (clamped - 1) * (scaledPageHeight + pageGap),
      behavior: "smooth",
    });
    setCurrentPage(clamped);
  };

  const handleExport = useCallback(async () => {
    if (!previewRef.current) return;
    setExporting(true);
    toast("generating pdf...");

    try {
      const pdf = new jsPDF({
        orientation: orientation === "portrait" ? "p" : "l",
        unit: "mm",
        format: pageSize === "letter" ? "letter" : pageSize,
      });

      const contentEl = previewRef.current.querySelector(
        "[data-pdf-content]"
      ) as HTMLElement;
      if (!contentEl) return;

      await pdf.html(contentEl, {
        callback: (doc) => {
          if (showPageNumbers) {
            const total = doc.getNumberOfPages();
            for (let i = 1; i <= total; i++) {
              doc.setPage(i);
              doc.setFontSize(8);
              doc.setTextColor(128);
              doc.text(
                `${i} / ${total}`,
                effectiveWidth / 2,
                effectiveHeight - 8,
                { align: "center" }
              );
            }
          }
          doc.save(`${title}.pdf`);
          toast("pdf exported");
          setExporting(false);
        },
        x: marginMm,
        y: marginMm,
        width: effectiveWidth - marginMm * 2,
        windowWidth: pageWidthPx - marginPx * 2,
        margin: [marginMm, marginMm, marginMm, marginMm],
      });
    } catch (err) {
      console.error("pdf export error:", err);
      toast("export failed — try again");
      setExporting(false);
    }
  }, [
    orientation,
    pageSize,
    marginMm,
    effectiveWidth,
    effectiveHeight,
    pageWidthPx,
    marginPx,
    title,
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
          disabled={exporting || !content}
          className="ml-2 border border-border bg-foreground text-background px-3 py-1.5 font-mono text-xs font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          <Download className="h-3 w-3" />
          {exporting ? "exporting..." : "export pdf"}
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
        </div>

        {/* preview — fully self-contained, no CSS variable colors */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-auto bg-muted p-8 flex justify-center"
          >
            <div
              ref={previewRef}
              style={{
                transform: `scale(${previewScale})`,
                transformOrigin: "top center",
              }}
            >
              <div
                data-pdf-content
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
                }}
              >
                <style>{`
                  [data-pdf-content] .markdown-preview,
                  [data-pdf-content] .markdown-preview * {
                    font-family: inherit !important;
                    color: inherit !important;
                    font-size: inherit !important;
                    line-height: inherit !important;
                  }
                  [data-pdf-content] .markdown-preview h1 {
                    font-size: 1.5em !important;
                    font-weight: 700;
                    margin: 1em 0 0.5em;
                    padding-bottom: 0.25em;
                    border-bottom: 1px solid ${borderColor};
                  }
                  [data-pdf-content] .markdown-preview h2 {
                    font-size: 1.3em !important;
                    font-weight: 600;
                    margin: 0.9em 0 0.4em;
                  }
                  [data-pdf-content] .markdown-preview h3 {
                    font-size: 1.15em !important;
                    font-weight: 600;
                    margin: 0.8em 0 0.4em;
                  }
                  [data-pdf-content] .markdown-preview h4,
                  [data-pdf-content] .markdown-preview h5,
                  [data-pdf-content] .markdown-preview h6 {
                    font-size: 1em !important;
                    font-weight: 600;
                    margin: 0.6em 0 0.3em;
                  }
                  [data-pdf-content] .markdown-preview p {
                    margin: 0.4em 0;
                  }
                  [data-pdf-content] a {
                    text-decoration: underline;
                    text-underline-offset: 2px;
                  }
                  [data-pdf-content] blockquote {
                    border-left: 2px solid ${borderColor};
                    padding-left: 1rem;
                    color: ${mutedColor} !important;
                    margin: 0.75rem 0;
                  }
                  [data-pdf-content] blockquote * {
                    color: ${mutedColor} !important;
                  }
                  [data-pdf-content] pre {
                    background: ${codeBgColor} !important;
                    border: 1px solid ${borderColor};
                    padding: 0.75rem;
                    overflow-x: auto;
                    margin: 0.75rem 0;
                    font-size: 0.85em !important;
                  }
                  [data-pdf-content] pre *,
                  [data-pdf-content] code {
                    font-family: "Courier New", monospace !important;
                  }
                  [data-pdf-content] :not(pre) > code {
                    background: ${codeBgColor} !important;
                    padding: 0.15rem 0.3rem;
                    border: 1px solid ${borderColor};
                    font-size: 0.85em !important;
                  }
                  [data-pdf-content] th {
                    background: ${codeBgColor} !important;
                  }
                  [data-pdf-content] th,
                  [data-pdf-content] td {
                    border-color: ${borderColor} !important;
                  }
                  [data-pdf-content] hr {
                    border-color: ${borderColor} !important;
                  }
                  [data-pdf-content] .katex * {
                    color: ${fgColor} !important;
                  }
                  [data-pdf-content] .hljs,
                  [data-pdf-content] pre {
                    background: ${codeBgColor} !important;
                    color: ${fgColor} !important;
                  }
                  [data-pdf-content] .hljs-keyword,
                  [data-pdf-content] .hljs-selector-tag,
                  [data-pdf-content] .hljs-literal,
                  [data-pdf-content] .hljs-section,
                  [data-pdf-content] .hljs-link {
                    color: ${darkMode ? "#c678dd" : "#a626a4"} !important;
                  }
                  [data-pdf-content] .hljs-string,
                  [data-pdf-content] .hljs-title,
                  [data-pdf-content] .hljs-name,
                  [data-pdf-content] .hljs-type,
                  [data-pdf-content] .hljs-attribute,
                  [data-pdf-content] .hljs-symbol,
                  [data-pdf-content] .hljs-bullet,
                  [data-pdf-content] .hljs-addition,
                  [data-pdf-content] .hljs-variable,
                  [data-pdf-content] .hljs-template-tag,
                  [data-pdf-content] .hljs-template-variable {
                    color: ${darkMode ? "#98c379" : "#50a14f"} !important;
                  }
                  [data-pdf-content] .hljs-comment,
                  [data-pdf-content] .hljs-quote,
                  [data-pdf-content] .hljs-deletion,
                  [data-pdf-content] .hljs-meta {
                    color: ${darkMode ? "#5c6370" : "#a0a1a7"} !important;
                  }
                  [data-pdf-content] .hljs-number,
                  [data-pdf-content] .hljs-regexp,
                  [data-pdf-content] .hljs-literal,
                  [data-pdf-content] .hljs-built_in {
                    color: ${darkMode ? "#d19a66" : "#986801"} !important;
                  }
                `}</style>

                {showTitle && (
                  <h1
                    style={{
                      fontSize: `${fontSize * 1.5}px`,
                      fontWeight: 700,
                      marginBottom: `${fontSize}px`,
                      paddingBottom: `${fontSize * 0.5}px`,
                      borderBottom: `1px solid ${borderColor}`,
                      color: fgColor,
                      fontFamily: fontFamilyCSS,
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

          {/* page navigation bar */}
          <div className="flex items-center justify-center gap-3 border-t border-border px-4 py-2 bg-card">
            <button
              onClick={() => scrollToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
              title="previous page"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono text-xs text-muted-foreground">
              page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => scrollToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
              title="next page"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
