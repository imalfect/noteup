"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Lock, Shield, Check, Copy, ExternalLink, X, Key, AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

type PublishResult = {
  url: string;
  editKey: string;
} | null;

type PublishDialogProps = {
  open: boolean;
  onClose: () => void;
  onPublish: (slug: string, password: string) => Promise<PublishResult>;
  defaultSlug: string;
  isEditMode?: boolean;
  onSaveEdit?: () => Promise<boolean>;
};

export function PublishDialog({
  open,
  onClose,
  onPublish,
  defaultSlug,
  isEditMode,
  onSaveEdit,
}: PublishDialogProps) {
  const [slug, setSlug] = useState(defaultSlug);
  const [password, setPassword] = useState("");
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ url: string; editKey: string } | null>(
    null
  );
  const [editSaved, setEditSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setSlug(defaultSlug);
      setPassword("");
      setSlugStatus("idle");
      setPublishing(false);
      setResult(null);
      setEditSaved(false);
    }
  }, [open, defaultSlug]);

  useEffect(() => {
    if (isEditMode) return; // skip slug check in edit mode
    if (!slug || slug.length < 2) {
      setSlugStatus("idle");
      return;
    }
    if (!/^[A-Za-z0-9-]+$/.test(slug)) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/slug-check?slug=${encodeURIComponent(slug)}`
        );
        const data = await res.json();
        setSlugStatus(data.available ? "available" : "taken");
      } catch {
        setSlugStatus("idle");
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [slug, isEditMode]);

  const handlePublish = async () => {
    if (!isEditMode && slugStatus === "taken") {
      toast("slug is already taken");
      return;
    }
    setPublishing(true);
    try {
      const res = await onPublish(slug, password);
      if (res) {
        setResult(res);
        toast("published successfully");
      }
    } catch {
      toast("publish failed — try again");
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!onSaveEdit) return;
    setPublishing(true);
    try {
      const ok = await onSaveEdit();
      if (ok) {
        setEditSaved(true);
        toast("changes saved");
      }
    } catch {
      toast("save failed — try again");
    } finally {
      setPublishing(false);
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast(`${label} copied`);
  };

  const downloadEditKeyPdf = async () => {
    if (!result) return;
    const ks = StyleSheet.create({
      page: { padding: 60, fontFamily: "Courier", backgroundColor: "#fff" },
      title: { fontSize: 20, fontWeight: 700, textAlign: "center", color: "#171717" },
      subtitle: { fontSize: 11, textAlign: "center", color: "#646464", marginTop: 10, marginBottom: 30 },
      box: { border: "1 solid #ccc", padding: 20 },
      row: { flexDirection: "row", marginBottom: 10 },
      label: { width: 80, fontSize: 9, color: "#828282" },
      value: { flex: 1, fontSize: 9, color: "#171717" },
      keyValue: { flex: 1, fontSize: 9, color: "#171717", fontWeight: 700 },
      warning: { fontSize: 8, textAlign: "center", color: "#b4b4b4", marginTop: 30 },
    });
    const keyDoc = (
      <Document>
        <Page size="A4" style={ks.page}>
          <Text style={ks.title}>&gt; noteup</Text>
          <Text style={ks.subtitle}>edit key — keep this document safe</Text>
          <View style={ks.box}>
            <View style={ks.row}>
              <Text style={ks.label}>slug</Text>
              <Text style={ks.value}>{slug}</Text>
            </View>
            <View style={ks.row}>
              <Text style={ks.label}>url</Text>
              <Text style={ks.value}>{result.url}</Text>
            </View>
            <View style={ks.row}>
              <Text style={ks.label}>edit key</Text>
              <Text style={ks.keyValue}>{result.editKey}</Text>
            </View>
            <View style={ks.row}>
              <Text style={ks.label}>encrypted</Text>
              <Text style={ks.value}>{password ? "yes" : "no"}</Text>
            </View>
            <View style={ks.row}>
              <Text style={ks.label}>created</Text>
              <Text style={ks.value}>{new Date().toISOString().split("T")[0]}</Text>
            </View>
          </View>
          <Text style={ks.warning}>
            this edit key cannot be recovered. without it you cannot edit your note.
          </Text>
          <Text style={[ks.warning, { marginTop: 4 }]}>
            store this document securely.
          </Text>
        </Page>
      </Document>
    );
    try {
      const blob = await pdf(keyDoc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `noteup-editkey-${slug}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast("edit key pdf downloaded");
    } catch {
      toast("pdf generation failed");
    }
  };

  // edit mode: simple save button
  if (isEditMode) {
    return (
      <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-lg bg-card border border-border overflow-x-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Dialog.Title className="font-mono text-xs font-semibold uppercase tracking-wider">
                {editSaved ? "saved" : "save changes"}
              </Dialog.Title>
              <Dialog.Close className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-3.5 w-3.5" />
              </Dialog.Close>
            </div>
            <div className="p-4 space-y-4">
              {editSaved ? (
                <p className="font-mono text-xs text-muted-foreground">
                  changes saved as a new version.
                </p>
              ) : (
                <>
                  <p className="font-mono text-xs text-muted-foreground">
                    this will save a new version of the note. the previous
                    version will remain in the history.
                  </p>
                  {password !== undefined && (
                    <div className="space-y-2">
                      <label className="font-mono text-xs text-muted-foreground flex items-center gap-1.5">
                        <Lock className="h-3 w-3" />
                        password (optional — re-encrypt)
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="leave empty for public"
                        className="w-full bg-transparent border border-border p-2 font-mono text-xs focus:border-foreground/30 focus:outline-none transition-colors"
                      />
                    </div>
                  )}
                  <button
                    onClick={handleSaveEdit}
                    disabled={publishing}
                    className="w-full border border-border bg-foreground text-background p-2.5 font-mono text-xs font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {publishing ? "saving..." : "save new version"}
                  </button>
                </>
              )}
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-lg bg-card border border-border overflow-x-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Dialog.Title className="font-mono text-xs font-semibold uppercase tracking-wider">
              {result ? "published" : "publish note"}
            </Dialog.Title>
            <Dialog.Close className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </Dialog.Close>
          </div>

          {result ? (
            <div className="p-4 space-y-4">
              <div className="border border-border divide-y divide-border">
                <div className="p-3 flex justify-between font-mono text-xs">
                  <span className="text-muted-foreground">url</span>
                  <span className="truncate ml-4">{result.url}</span>
                </div>
                <div className="p-3 flex justify-between font-mono text-xs">
                  <span className="text-muted-foreground">encrypted</span>
                  <span>{password ? "yes" : "no"}</span>
                </div>
              </div>

              {/* edit key - critical section */}
              <div className="border border-border p-3 space-y-2">
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <Key className="h-3 w-3 text-muted-foreground" />
                  <span className="font-semibold">edit key</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted border border-border px-2 py-1.5 font-mono text-xs break-all select-all">
                    {result.editKey}
                  </code>
                  <button
                    onClick={() => copyText(result.editKey, "edit key")}
                    className="border border-border p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    title="copy"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    onClick={downloadEditKeyPdf}
                    className="border border-border p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    title="download as pdf"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-start gap-1.5 font-mono text-xs text-muted-foreground">
                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>
                    save this key — it cannot be recovered. you need it to edit
                    this note later.
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => copyText(result.url, "link")}
                  className="flex-1 border border-border p-2.5 font-mono text-xs font-medium hover:border-foreground/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="h-3 w-3" />
                  copy link
                </button>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 border border-border p-2.5 font-mono text-xs font-medium hover:border-foreground/20 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  open
                </a>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="font-mono text-xs text-muted-foreground block">
                  slug
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="my-note"
                    className="flex-1 bg-transparent border border-border p-2 font-mono text-xs focus:border-foreground/30 focus:outline-none transition-colors"
                  />
                  {slugStatus === "checking" && (
                    <span className="font-mono text-xs text-muted-foreground animate-pulse">
                      ...
                    </span>
                  )}
                  {slugStatus === "available" && (
                    <Check className="h-3.5 w-3.5 text-foreground" />
                  )}
                  {slugStatus === "taken" && (
                    <span className="font-mono text-xs text-destructive">
                      taken
                    </span>
                  )}
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  alphanumeric and dashes only
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-xs text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  password (optional)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="leave empty for public access"
                  className="w-full bg-transparent border border-border p-2 font-mono text-xs focus:border-foreground/30 focus:outline-none transition-colors"
                />
                {password && (
                  <p className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    content will be encrypted client-side
                  </p>
                )}
              </div>

              <button
                onClick={handlePublish}
                disabled={publishing || slugStatus === "taken" || !slug}
                className="w-full border border-border bg-foreground text-background p-2.5 font-mono text-xs font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishing ? "publishing..." : "publish"}
              </button>
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
