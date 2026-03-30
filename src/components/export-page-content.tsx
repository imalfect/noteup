"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Title } from "@/components/title";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { ArrowLeft, Download, Minus, Plus } from "lucide-react";
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

const FONTS = [
  { value: "mono", label: "monospace" },
  { value: "sans", label: "sans-serif" },
  { value: "serif", label: "serif" },
];

const DRAFT_KEY = "noteup-draft";

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
  const [fontFamily, setFontFamily] = useState("mono");
  const [darkMode, setDarkMode] = useState(false);
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [lineHeight, setLineHeight] = useState(1.6);

  const previewRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

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
  const previewScale = 0.65;
  const pageWidthPx = mmToPx(effectiveWidth);
  const pageHeightPx = mmToPx(effectiveHeight);
  const marginPx = mmToPx(marginMm);

  const fontFamilyCSS =
    fontFamily === "mono"
      ? "var(--font-mono)"
      : fontFamily === "serif"
        ? "Georgia, serif"
        : "var(--font-sans)";

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
            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
              doc.setPage(i);
              doc.setFontSize(8);
              doc.setTextColor(128);
              doc.text(
                `${i} / ${totalPages}`,
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
              {FONTS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
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

          <label className="flex items-center gap-2 font-mono text-xs cursor-pointer">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                darkMode
                  ? "bg-foreground border-foreground"
                  : "border-border"
              }`}
            >
              {darkMode && (
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
            dark background
          </label>

          <label className="flex items-center gap-2 font-mono text-xs cursor-pointer">
            <button
              onClick={() => setShowPageNumbers(!showPageNumbers)}
              className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                showPageNumbers
                  ? "bg-foreground border-foreground"
                  : "border-border"
              }`}
            >
              {showPageNumbers && (
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
            page numbers
          </label>
        </div>

        {/* preview */}
        <div className="flex-1 overflow-auto bg-muted p-8 flex justify-center">
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
                backgroundColor: darkMode ? "#080808" : "#ffffff",
                color: darkMode ? "#ededed" : "#171717",
                fontFamily: fontFamilyCSS,
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
                boxShadow: "0 0 0 1px var(--border)",
              }}
              className="markdown-preview"
            >
              <h1
                style={{
                  fontSize: `${fontSize * 1.5}px`,
                  fontWeight: 700,
                  marginBottom: `${fontSize}px`,
                  paddingBottom: `${fontSize * 0.5}px`,
                  borderBottom: `1px solid ${darkMode ? "#333" : "#ddd"}`,
                }}
              >
                {title}
              </h1>
              <MarkdownPreview content={content} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
