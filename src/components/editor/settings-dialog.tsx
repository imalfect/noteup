"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X, Minus, Plus } from "lucide-react";

type SettingsDialogProps = {
  open: boolean;
  onClose: () => void;
  uiScale: number;
  onUiScaleChange: (scale: number) => void;
};

const SCALE_OPTIONS = [
  { value: 0.8, label: "80%" },
  { value: 0.9, label: "90%" },
  { value: 1.0, label: "100%" },
  { value: 1.1, label: "110%" },
  { value: 1.2, label: "120%" },
  { value: 1.3, label: "130%" },
];

export function SettingsDialog({
  open,
  onClose,
  uiScale,
  onUiScaleChange,
}: SettingsDialogProps) {
  const changeScale = (delta: number) => {
    const newScale = Math.round((uiScale + delta) * 10) / 10;
    if (newScale >= 0.7 && newScale <= 1.5) {
      onUiScaleChange(newScale);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-sm bg-card border border-border overflow-x-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Dialog.Title className="font-mono text-xs font-semibold uppercase tracking-wider">
              settings
            </Dialog.Title>
            <Dialog.Close className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </Dialog.Close>
          </div>

          <div className="p-4 space-y-4">
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

            <div className="border border-border p-3 font-mono text-xs text-muted-foreground">
              keyboard shortcuts: ctrl+k for command palette, ctrl+s to save draft
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
