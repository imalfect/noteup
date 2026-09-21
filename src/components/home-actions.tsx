"use client";

import { ArrowRight, FileText, Upload, Pencil } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog } from "@base-ui/react/dialog";

const DRAFT_KEY = "noteup-draft";

export function HomeActions() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [showEditForm, setShowEditForm] = useState(false);
  const [editSlug, setEditSlug] = useState("");
  const [editKey, setEditKey] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);

  const handleNewNote = () => {
    // check if there's existing draft content
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.content && draft.content.trim().length > 0) {
          setShowDraftPrompt(true);
          return;
        }
      }
    } catch {}
    router.push("/draft");
  };

  const handleContinueDraft = () => {
    setShowDraftPrompt(false);
    router.push("/draft");
  };

  const handleNewClean = () => {
    localStorage.removeItem(DRAFT_KEY);
    setShowDraftPrompt(false);
    router.push("/draft");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          content,
          title: file.name.replace(/\.md$/, ""),
          updatedAt: Date.now(),
        })
      );
      router.push("/draft");
    };
    reader.readAsText(file);
  };

  const handleEditVerify = async () => {
    if (!editSlug || !editKey) {
      toast("slug and edit key required");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch("/api/edit/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: editSlug, editKey }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "verification failed");
        return;
      }
      router.push(
        `/draft?edit=${encodeURIComponent(editSlug)}&key=${encodeURIComponent(editKey)}`
      );
    } catch {
      toast("verification failed — try again");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleNewNote}
        className="primary-action w-full group"
      >
        <span className="flex items-center gap-3">
          <span className="action-icon"><FileText className="h-4 w-4" /></span>
          <span className="text-left">
            <span className="block text-sm font-semibold">New note</span>
            <span className="block text-xs font-normal text-primary-foreground/65 mt-0.5">Open a clean, auto-saved draft</span>
          </span>
        </span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="secondary-action"
        >
          <Upload className="h-4 w-4 text-muted-foreground" />
          Import Markdown
        </button>
        <button
          onClick={() => setShowEditForm(!showEditForm)}
          className={`secondary-action ${
            showEditForm
              ? "bg-accent text-foreground"
              : ""
          }`}
          aria-expanded={showEditForm}
        >
          <Pencil className="h-4 w-4 text-muted-foreground" />
          Edit published
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.txt"
          onChange={handleImport}
          className="hidden"
        />
      </div>

      {showEditForm && (
        <div className="surface p-4 space-y-3">
          <p className="text-sm font-medium">Open a published note</p>
          <p className="text-xs leading-5 text-muted-foreground">Use the slug and private edit key you received when publishing.</p>
          <input
            type="text"
            value={editSlug}
            onChange={(e) => setEditSlug(e.target.value)}
            placeholder="Note slug"
            aria-label="Note slug"
            className="field"
          />
          <input
            type="text"
            value={editKey}
            onChange={(e) => setEditKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEditVerify()}
            placeholder="Private edit key"
            aria-label="Private edit key"
            className="field font-mono"
          />
          <button
            onClick={handleEditVerify}
            disabled={verifying || !editSlug || !editKey}
            className="button-primary w-full"
          >
            {verifying ? "Verifying…" : "Open in editor"}
          </button>
        </div>
      )}

      {/* draft exists prompt */}
      <Dialog.Root open={showDraftPrompt} onOpenChange={(o) => !o && setShowDraftPrompt(false)}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-sm bg-card border border-border">
            <div className="p-4 border-b border-border">
              <Dialog.Title className="font-mono text-xs font-semibold uppercase tracking-wider">
                existing draft found
              </Dialog.Title>
            </div>
            <div className="p-4 space-y-3">
              <p className="font-mono text-xs text-muted-foreground">
                you have an unsaved draft. would you like to continue editing it or start fresh?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleContinueDraft}
                  className="flex-1 border border-border bg-foreground text-background p-2.5 font-mono text-xs font-medium hover:bg-foreground/90 transition-colors"
                >
                  continue draft
                </button>
                <button
                  onClick={handleNewClean}
                  className="flex-1 border border-border p-2.5 font-mono text-xs font-medium hover:border-foreground/20 transition-colors"
                >
                  start fresh
                </button>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
