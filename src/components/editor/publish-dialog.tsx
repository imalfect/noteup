"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Lock, Shield, Check, Copy, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";

type PublishDialogProps = {
  open: boolean;
  onClose: () => void;
  onPublish: (slug: string, password: string) => Promise<string | null>;
  defaultSlug: string;
};

export function PublishDialog({
  open,
  onClose,
  onPublish,
  defaultSlug,
}: PublishDialogProps) {
  const [slug, setSlug] = useState(defaultSlug);
  const [password, setPassword] = useState("");
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSlug(defaultSlug);
      setPassword("");
      setSlugStatus("idle");
      setPublishing(false);
      setPublishedUrl(null);
    }
  }, [open, defaultSlug]);

  useEffect(() => {
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
  }, [slug]);

  const handlePublish = async () => {
    if (slugStatus === "taken") {
      toast("slug is already taken");
      return;
    }
    setPublishing(true);
    try {
      const url = await onPublish(slug, password);
      if (url) {
        setPublishedUrl(url);
        toast("published successfully");
      }
    } catch {
      toast("publish failed — try again");
    } finally {
      setPublishing(false);
    }
  };

  const copyUrl = () => {
    if (publishedUrl) {
      navigator.clipboard.writeText(publishedUrl);
      toast("link copied");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-lg bg-card border border-border overflow-x-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Dialog.Title className="font-mono text-xs font-semibold uppercase tracking-wider">
              {publishedUrl ? "published" : "publish note"}
            </Dialog.Title>
            <Dialog.Close className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </Dialog.Close>
          </div>

          {publishedUrl ? (
            <div className="p-4 space-y-4">
              <div className="border border-border divide-y divide-border">
                <div className="p-3 flex justify-between font-mono text-xs">
                  <span className="text-muted-foreground">url</span>
                  <span className="truncate ml-4">{publishedUrl}</span>
                </div>
                <div className="p-3 flex justify-between font-mono text-xs">
                  <span className="text-muted-foreground">encrypted</span>
                  <span>{password ? "yes" : "no"}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={copyUrl}
                  className="flex-1 border border-border p-2.5 font-mono text-xs font-medium hover:border-foreground/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="h-3 w-3" />
                  copy link
                </button>
                <a
                  href={publishedUrl}
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
