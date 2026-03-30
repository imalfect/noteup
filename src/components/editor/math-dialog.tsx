"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import katex from "katex";

type MathDialogProps = {
  open: boolean;
  onClose: () => void;
  onInsert: (latex: string, isBlock: boolean) => void;
};

const PRESETS = [
  { label: "fraction", latex: "\\frac{a}{b}" },
  { label: "square root", latex: "\\sqrt{x}" },
  { label: "summation", latex: "\\sum_{i=1}^{n} x_i" },
  { label: "integral", latex: "\\int_{a}^{b} f(x) \\, dx" },
  { label: "limit", latex: "\\lim_{x \\to \\infty} f(x)" },
  { label: "matrix", latex: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}" },
  { label: "greek (alpha)", latex: "\\alpha" },
  { label: "subscript", latex: "x_{n}" },
  { label: "superscript", latex: "x^{n}" },
  { label: "binomial", latex: "\\binom{n}{k}" },
];

export function MathDialog({ open, onClose, onInsert }: MathDialogProps) {
  const [latex, setLatex] = useState("");
  const [isBlock, setIsBlock] = useState(true);
  const [preview, setPreview] = useState("");

  const updatePreview = (val: string) => {
    setLatex(val);
    try {
      const html = katex.renderToString(val, {
        throwOnError: false,
        displayMode: isBlock,
      });
      setPreview(html);
    } catch {
      setPreview("");
    }
  };

  const handleInsert = () => {
    if (latex.trim()) {
      onInsert(latex.trim(), isBlock);
      setLatex("");
      setPreview("");
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setLatex("");
          setPreview("");
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-lg bg-card border border-border overflow-x-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Dialog.Title className="font-mono text-xs font-semibold uppercase tracking-wider">
              math formula editor
            </Dialog.Title>
            <Dialog.Close className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </Dialog.Close>
          </div>

          <div className="p-4 space-y-4">
            {/* presets */}
            <div className="space-y-2">
              <label className="font-mono text-xs text-muted-foreground">
                presets
              </label>
              <div className="flex flex-wrap gap-1">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => updatePreview(p.latex)}
                    className="border border-border px-2 py-1 font-mono text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* input */}
            <div className="space-y-2">
              <label className="font-mono text-xs text-muted-foreground">
                latex
              </label>
              <textarea
                value={latex}
                onChange={(e) => updatePreview(e.target.value)}
                placeholder="e.g. E = mc^2"
                className="w-full bg-transparent border border-border p-2 font-mono text-xs focus:border-foreground/30 focus:outline-none transition-colors resize-none h-20"
              />
            </div>

            {/* block/inline toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsBlock(true)}
                className={`font-mono text-xs px-2 py-1 border transition-colors ${
                  isBlock
                    ? "border-foreground text-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                block
              </button>
              <button
                onClick={() => setIsBlock(false)}
                className={`font-mono text-xs px-2 py-1 border transition-colors ${
                  !isBlock
                    ? "border-foreground text-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                inline
              </button>
            </div>

            {/* preview */}
            {preview && (
              <div className="space-y-2">
                <label className="font-mono text-xs text-muted-foreground">
                  preview
                </label>
                <div
                  className="border border-border p-3 overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: preview }}
                />
              </div>
            )}

            <button
              onClick={handleInsert}
              disabled={!latex.trim()}
              className="w-full border border-border bg-foreground text-background p-2.5 font-mono text-xs font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              insert
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
