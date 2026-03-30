"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X, Minus, Plus } from "lucide-react";

type SettingsDialogProps = {
  open: boolean;
  onClose: () => void;
  uiScale: number;
  onUiScaleChange: (scale: number) => void;
  editorFont: string;
  onEditorFontChange: (font: string) => void;
};

const SCALE_OPTIONS = [
  { value: 0.8, label: "80%" },
  { value: 0.9, label: "90%" },
  { value: 1.0, label: "100%" },
  { value: 1.1, label: "110%" },
  { value: 1.2, label: "120%" },
  { value: 1.3, label: "130%" },
];

type FontOption = {
  value: string;
  label: string;
};

const FONT_CATEGORIES: { label: string; fonts: FontOption[] }[] = [
  {
    label: "monospace",
    fonts: [
      { value: "'JetBrains Mono', monospace", label: "JetBrains Mono" },
      { value: "'Fira Code', monospace", label: "Fira Code" },
      { value: "'SF Mono', monospace", label: "SF Mono" },
      { value: "'Courier New', monospace", label: "Courier New" },
    ],
  },
  {
    label: "sans-serif",
    fonts: [
      { value: "'Inter', sans-serif", label: "Inter" },
      { value: "'Figtree', sans-serif", label: "Figtree" },
      { value: "'Lato', sans-serif", label: "Lato" },
      { value: "'DM Sans', sans-serif", label: "DM Sans" },
      { value: "system-ui, sans-serif", label: "System" },
    ],
  },
  {
    label: "serif",
    fonts: [
      { value: "'Times New Roman', serif", label: "Times New Roman" },
      { value: "'Georgia', serif", label: "Georgia" },
      { value: "'Merriweather', serif", label: "Merriweather" },
      { value: "'Lora', serif", label: "Lora" },
    ],
  },
];

const DEFAULT_FONT = "'JetBrains Mono', monospace";

export function SettingsDialog({
  open,
  onClose,
  uiScale,
  onUiScaleChange,
  editorFont,
  onEditorFontChange,
}: SettingsDialogProps) {
  const changeScale = (delta: number) => {
    const newScale = Math.round((uiScale + delta) * 10) / 10;
    if (newScale >= 0.7 && newScale <= 1.5) {
      onUiScaleChange(newScale);
    }
  };

  const currentFont = editorFont || DEFAULT_FONT;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-md bg-card border border-border overflow-x-hidden max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Dialog.Title className="font-mono text-xs font-semibold uppercase tracking-wider">
              settings
            </Dialog.Title>
            <Dialog.Close className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </Dialog.Close>
          </div>

          <div className="p-4 space-y-5">
            {/* UI Scale */}
            <div className="space-y-2">
              <label className="font-mono text-xs text-muted-foreground">
                ui scale: {Math.round(uiScale * 100)}%
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeScale(-0.1)}
                  className="border border-border p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <div className="flex-1 flex gap-1">
                  {SCALE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onUiScaleChange(opt.value)}
                      className={`flex-1 border p-1.5 font-mono text-xs transition-colors ${
                        Math.abs(uiScale - opt.value) < 0.05
                          ? "border-foreground text-foreground"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => changeScale(0.1)}
                  className="border border-border p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Editor Font */}
            <div className="space-y-2">
              <label className="font-mono text-xs text-muted-foreground">
                preview font
              </label>
              <div className="space-y-3">
                {FONT_CATEGORIES.map((cat) => (
                  <div key={cat.label} className="space-y-1">
                    <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                      {cat.label}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cat.fonts.map((font) => (
                        <button
                          key={font.value}
                          onClick={() => onEditorFontChange(font.value)}
                          className={`border px-2 py-1.5 text-xs transition-colors ${
                            currentFont === font.value
                              ? "border-foreground text-foreground"
                              : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                          style={{ fontFamily: font.value }}
                        >
                          {font.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p
                className="border border-border p-2 text-xs text-muted-foreground"
                style={{ fontFamily: currentFont }}
              >
                the quick brown fox jumps over the lazy dog
              </p>
            </div>

            <div className="border border-border p-3 font-mono text-xs text-muted-foreground">
              keyboard shortcuts: ctrl+k for command palette, ctrl+s to save draft
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
