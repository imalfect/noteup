"use client";

import Link from "next/link";
import { FileText, Upload, Pencil } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function HomeActions() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [showEditForm, setShowEditForm] = useState(false);
  const [editSlug, setEditSlug] = useState("");
  const [editKey, setEditKey] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      localStorage.setItem(
        "noteup-draft",
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
      // navigate to editor in edit mode
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
    <div className="space-y-2">
      <div className="flex gap-2">
        <Link
          href="/draft"
          className="flex-1 border border-border p-3 font-mono text-xs font-medium hover:border-foreground/20 transition-colors flex items-center gap-2"
        >
          <FileText className="h-3 w-3 text-muted-foreground" />
          new note
        </Link>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 border border-border p-3 font-mono text-xs font-medium hover:border-foreground/20 transition-colors flex items-center gap-2"
        >
          <Upload className="h-3 w-3 text-muted-foreground" />
          import .md
        </button>
        <button
          onClick={() => setShowEditForm(!showEditForm)}
          className={`flex-1 border p-3 font-mono text-xs font-medium transition-colors flex items-center gap-2 ${
            showEditForm
              ? "border-foreground/30 text-foreground"
              : "border-border hover:border-foreground/20"
          }`}
        >
          <Pencil className="h-3 w-3 text-muted-foreground" />
          edit existing
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
        <div className="border border-border p-3 space-y-2">
          <input
            type="text"
            value={editSlug}
            onChange={(e) => setEditSlug(e.target.value)}
            placeholder="slug"
            className="w-full bg-transparent border border-border p-2 font-mono text-xs focus:border-foreground/30 focus:outline-none transition-colors"
          />
          <input
            type="text"
            value={editKey}
            onChange={(e) => setEditKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEditVerify()}
            placeholder="edit key"
            className="w-full bg-transparent border border-border p-2 font-mono text-xs focus:border-foreground/30 focus:outline-none transition-colors"
          />
          <button
            onClick={handleEditVerify}
            disabled={verifying || !editSlug || !editKey}
            className="w-full border border-border bg-foreground text-background p-2 font-mono text-xs font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {verifying ? "verifying..." : "open in editor"}
          </button>
        </div>
      )}
    </div>
  );
}
