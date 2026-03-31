"use client";

import { useState, useEffect, useMemo } from "react";
import { Title } from "@/components/title";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { ArrowLeft, Download, Minus, Plus, SlidersHorizontal } from "lucide-react";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  registerFonts,
  PDF_FONT_OPTIONS,
  type PdfFontFamily,
} from "@/lib/pdf-fonts";
import { PdfDocument, type PdfConfig } from "@/components/pdf/pdf-document";
import { pdf } from "@react-pdf/renderer";

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  { ssr: false }
);

type PageSize = "A4" | "LETTER" | "A3" | "A5";
type Orientation = "portrait" | "landscape";

const PAGE_SIZE_LABELS: Record<PageSize, string> = {
  A4: "a4 (210 x 297mm)",
  LETTER: "letter (216 x 279mm)",
  A3: "a3 (297 x 420mm)",
  A5: "a5 (148 x 210mm)",
};

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

  const [pageSize, setPageSize] = useState<PageSize>("A4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [fontSize, setFontSize] = useState(11);
  const [marginMm, setMarginMm] = useState(20);
  const [fontFamily, setFontFamily] = useState<PdfFontFamily>("GeistMono");
  const [darkMode, setDarkMode] = useState(false);
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [keepSectionsTogether, setKeepSectionsTogether] = useState(true);
  const [lineHeight, setLineHeight] = useState(1.6);

  const [exporting, setExporting] = useState(false);
  const [showMobileConfig, setShowMobileConfig] = useState(false);

  useEffect(() => {
    registerFonts();
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

  const pdfConfig: PdfConfig = useMemo(
    () => ({
      pageSize,
      orientation,
      fontSize,
      fontFamily,
      lineHeight,
      marginMm,
      darkMode,
      showTitle,
      showPageNumbers,
      keepSectionsTogether,
      title,
      content,
    }),
    [
      pageSize,
      orientation,
      fontSize,
      fontFamily,
      lineHeight,
      marginMm,
      darkMode,
      showTitle,
      showPageNumbers,
      keepSectionsTogether,
      title,
      content,
    ]
  );

  const handleExport = async () => {
    setExporting(true);
    toast("generating pdf...");
    try {
      const blob = await pdf(<PdfDocument config={pdfConfig} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast("pdf exported");
    } catch (err) {
      console.error("pdf export error:", err);
      toast("export failed — try again");
    } finally {
      setExporting(false);
    }
  };

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
      <div className="flex items-center gap-1 sm:gap-2 border-b border-border px-2 sm:px-3 py-2">
        <Link
          href={isDraft ? "/draft" : "/"}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
        <span className="hidden sm:inline-flex"><Title /></span>
        <span className="font-mono text-xs text-muted-foreground ml-1 sm:ml-2 hidden sm:inline">
          / export to pdf
        </span>
        <span className="font-mono text-xs text-muted-foreground sm:hidden">
          export
        </span>
        <div className="flex-1" />
        {/* mobile config button */}
        <button
          onClick={() => setShowMobileConfig(true)}
          className="md:hidden p-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </button>
        <ThemeToggle />
        <button
          onClick={handleExport}
          disabled={exporting || !content}
          className="ml-1 sm:ml-2 border border-border bg-foreground text-background px-2 sm:px-3 py-1.5 font-mono text-xs font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          <Download className="h-3 w-3" />
          <span className="hidden sm:inline">{exporting ? "exporting..." : "export pdf"}</span>
          <span className="sm:hidden">{exporting ? "..." : "export"}</span>
        </button>
      </div>

      {/* main: config sidebar (desktop) + live pdf preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* desktop config panel */}
        <div className="hidden md:block w-64 border-r border-border overflow-y-auto p-4 space-y-4 shrink-0">
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
              onChange={(e) =>
                setFontFamily(e.target.value as PdfFontFamily)
              }
              className="w-full bg-transparent border border-border p-2 font-mono text-xs focus:border-foreground/30 focus:outline-none"
            >
              {PDF_FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label} ({f.category})
                </option>
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

          <Checkbox
            checked={showTitle}
            onChange={() => setShowTitle(!showTitle)}
          >
            show document title
          </Checkbox>

          <Checkbox
            checked={darkMode}
            onChange={() => setDarkMode(!darkMode)}
          >
            dark background
          </Checkbox>

          <Checkbox
            checked={showPageNumbers}
            onChange={() => setShowPageNumbers(!showPageNumbers)}
          >
            page numbers
          </Checkbox>

          <Checkbox
            checked={keepSectionsTogether}
            onChange={() =>
              setKeepSectionsTogether(!keepSectionsTogether)
            }
          >
            keep sections together
          </Checkbox>

          <p className="font-mono text-xs text-muted-foreground leading-relaxed">
            prevents headings from being orphaned at the bottom of a page —
            pushes them to the next page with their content.
          </p>
        </div>

        {/* live pdf preview — 1:1 accurate via React-PDF */}
        <div className="flex-1 overflow-hidden bg-muted">
          {content ? (
            <PDFViewer
              width="100%"
              height="100%"
              showToolbar={false}
              className="border-0"
            >
              <PdfDocument config={pdfConfig} />
            </PDFViewer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="font-mono text-xs text-muted-foreground">
                no content to preview
              </span>
            </div>
          )}
        </div>
      </div>

      {/* mobile config drawer */}
      <MobileDrawer
        open={showMobileConfig}
        onClose={() => setShowMobileConfig(false)}
        title="pdf settings"
      >
        <div className="p-4 space-y-4">
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
              {PDF_FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label} ({f.category})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-xs text-muted-foreground">
              font size: {fontSize}pt
            </label>
            <input
              type="range"
              min={6}
              max={20}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full"
            />
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
          <Checkbox checked={showPageNumbers} onChange={() => setShowPageNumbers(!showPageNumbers)}>
            page numbers
          </Checkbox>
          <Checkbox checked={keepSectionsTogether} onChange={() => setKeepSectionsTogether(!keepSectionsTogether)}>
            keep sections together
          </Checkbox>
        </div>
      </MobileDrawer>
    </div>
  );
}
