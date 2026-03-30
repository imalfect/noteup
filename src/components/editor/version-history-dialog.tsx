"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X, Clock, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type Version = {
  id: string;
  version: number;
  title: string;
  createdAt: string;
};

type VersionHistoryDialogProps = {
  open: boolean;
  onClose: () => void;
  slug: string;
  currentVersion: number | null;
  onLoadVersion: (content: string, title: string) => void;
};

export function VersionHistoryDialog({
  open,
  onClose,
  slug,
  currentVersion,
  onLoadVersion,
}: VersionHistoryDialogProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingVersion, setLoadingVersion] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/note/${encodeURIComponent(slug)}/versions`)
      .then((res) => res.json())
      .then((data) => setVersions(data.versions || []))
      .catch(() => toast("failed to load versions"))
      .finally(() => setLoading(false));
  }, [open, slug]);

  const handleLoadVersion = async (version: number) => {
    setLoadingVersion(version);
    try {
      const res = await fetch(
        `/api/note/${encodeURIComponent(slug)}/versions/${version}`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      onLoadVersion(data.content, data.title);
    } catch {
      toast("failed to load version");
    } finally {
      setLoadingVersion(null);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-md bg-card border border-border overflow-x-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Dialog.Title className="font-mono text-xs font-semibold uppercase tracking-wider">
              version history
            </Dialog.Title>
            <Dialog.Close className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </Dialog.Close>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 font-mono text-xs text-muted-foreground animate-pulse">
                loading...
              </div>
            ) : versions.length === 0 ? (
              <div className="p-4 font-mono text-xs text-muted-foreground">
                no versions found
              </div>
            ) : (
              <div className="divide-y divide-border">
                {versions.map((v) => {
                  const date = new Date(v.createdAt);
                  const isCurrent = v.version === currentVersion;
                  return (
                    <div
                      key={v.id}
                      className={`p-3 flex items-center gap-3 ${
                        isCurrent ? "bg-muted/50" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="font-semibold">v{v.version}</span>
                          {isCurrent && (
                            <span className="text-muted-foreground">
                              (current)
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {date.toLocaleDateString()}{" "}
                          {date.toLocaleTimeString()}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground truncate mt-0.5">
                          {v.title}
                        </div>
                      </div>
                      {!isCurrent && (
                        <button
                          onClick={() => handleLoadVersion(v.version)}
                          disabled={loadingVersion === v.version}
                          className="border border-border p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          title="load this version into editor"
                        >
                          <RotateCcw
                            className={`h-3 w-3 ${
                              loadingVersion === v.version
                                ? "animate-pulse"
                                : ""
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border font-mono text-xs text-muted-foreground">
            loading a previous version replaces the editor content. save changes
            to create a new version.
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
