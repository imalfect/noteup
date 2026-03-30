"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { EditorView } from "@codemirror/view";
import { Title } from "@/components/title";
import { ThemeToggle } from "@/components/theme-toggle";
import { CodeEditor } from "@/components/editor/code-editor";
import { Toolbar } from "@/components/editor/toolbar";
import { MarkdownPreview } from "@/components/markdown-preview";
import { PublishDialog } from "@/components/editor/publish-dialog";
import { MathDialog } from "@/components/editor/math-dialog";
import { encryptContent } from "@/lib/crypto";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import {
  Save,
  ArrowLeft,
  Upload,
  Sigma,
} from "lucide-react";
import Link from "next/link";

const DRAFT_KEY = "noteup-draft";
const AUTOSAVE_INTERVAL = 3000;

type Draft = {
  content: string;
  title: string;
  updatedAt: number;
};

function loadDraft(): Draft {
  if (typeof window === "undefined")
    return { content: "", title: "untitled", updatedAt: Date.now() };
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { content: "", title: "untitled", updatedAt: Date.now() };
}

function saveDraft(draft: Draft) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export default function DraftPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("untitled");
  const [showPreview, setShowPreview] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [showMathDialog, setShowMathDialog] = useState(false);
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const lastSaveRef = useRef<number>(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const draft = loadDraft();
    setContent(draft.content);
    setTitle(draft.title);
  }, []);

  // autosave
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      if (Date.now() - lastSaveRef.current > AUTOSAVE_INTERVAL) {
        saveDraft({ content, title, updatedAt: Date.now() });
        lastSaveRef.current = Date.now();
      }
    }, AUTOSAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [content, title, mounted]);

  // save on content change (debounced via autosave)
  useEffect(() => {
    if (!mounted) return;
    lastSaveRef.current = Date.now();
  }, [content, title, mounted]);

  // save on unmount
  useEffect(() => {
    if (!mounted) return;
    return () => {
      saveDraft({ content, title, updatedAt: Date.now() });
    };
  }, [content, title, mounted]);

  const handleViewReady = useCallback((view: EditorView) => {
    setEditorView(view);
  }, []);

  const handlePublish = async (
    slug: string,
    password: string
  ): Promise<string | null> => {
    let finalContent = content;
    let salt: string | null = null;
    let iv: string | null = null;
    let encrypted = false;

    if (password) {
      const enc = await encryptContent(content, password);
      finalContent = enc.encrypted;
      salt = enc.salt;
      iv = enc.iv;
      encrypted = true;
    }

    const id = nanoid(12);

    const res = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        slug,
        title,
        content: finalContent,
        salt,
        iv,
        encrypted,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast(data.error || "publish failed");
      return null;
    }

    // clear draft after successful publish
    localStorage.removeItem(DRAFT_KEY);

    const origin = window.location.origin;
    return `${origin}/${slug}`;
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const imported = event.target?.result as string;
      setContent(imported);
      setTitle(file.name.replace(/\.md$/, ""));
      toast("file imported");
    };
    reader.readAsText(file);
  };

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      // allow normal paste in editor - this handles paste from outside
    },
    []
  );

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const generateSlug = () => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || nanoid(8);
  };

  const handleInsertMath = (latex: string, isBlock: boolean) => {
    if (!editorView) return;
    const { from } = editorView.state.selection.main;
    const insert = isBlock ? `\n$$\n${latex}\n$$\n` : `$${latex}$`;
    editorView.dispatch({
      changes: { from, insert },
      selection: { anchor: from + insert.length },
    });
    editorView.focus();
    setShowMathDialog(false);
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
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Link
          href="/"
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>

        <Title />

        <div className="w-px h-4 bg-border mx-1" />

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-transparent font-mono text-xs focus:outline-none flex-1 min-w-0"
          placeholder="untitled"
        />

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowMathDialog(true)}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            title="math formula editor"
          >
            <Sigma className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            title="import markdown"
          >
            <Upload className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt"
            onChange={handleImport}
            className="hidden"
          />

          <button
            onClick={() => {
              saveDraft({ content, title, updatedAt: Date.now() });
              toast("draft saved");
            }}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            title="save draft"
          >
            <Save className="h-3.5 w-3.5" />
          </button>

          <ThemeToggle />

          <button
            onClick={() => setShowPublish(true)}
            className="ml-2 border border-border bg-foreground text-background px-3 py-1.5 font-mono text-xs font-medium hover:bg-foreground/90 transition-colors"
          >
            publish
          </button>
        </div>
      </div>

      {/* toolbar */}
      <Toolbar
        editorView={editorView}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview(!showPreview)}
        onExportPdf={() => router.push(`/export?draft=true`)}
      />

      {/* editor + preview */}
      <div className="flex-1 flex overflow-hidden">
        <div
          className={`${showPreview ? "w-1/2 border-r border-border" : "w-full"} flex flex-col overflow-hidden`}
        >
          <CodeEditor
            value={content}
            onChange={setContent}
            onViewReady={handleViewReady}
          />
        </div>

        {showPreview && (
          <div className="w-1/2 overflow-auto p-4">
            <MarkdownPreview content={content} />
          </div>
        )}
      </div>

      {/* status bar */}
      <div className="flex items-center gap-4 border-t border-border px-3 py-1.5 font-mono text-xs text-muted-foreground">
        <span>{content.length} chars</span>
        <span>{content.split(/\s+/).filter(Boolean).length} words</span>
        <span>{content.split("\n").length} lines</span>
        <span className="flex-1" />
        <span>draft · auto-saved</span>
      </div>

      {/* publish dialog */}
      <PublishDialog
        open={showPublish}
        onClose={() => setShowPublish(false)}
        onPublish={handlePublish}
        defaultSlug={generateSlug()}
      />

      {/* math dialog */}
      <MathDialog
        open={showMathDialog}
        onClose={() => setShowMathDialog(false)}
        onInsert={handleInsertMath}
      />
    </div>
  );
}
