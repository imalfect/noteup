"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Editor } from "@tiptap/react";
import { Title } from "@/components/title";
import { ThemeToggle } from "@/components/theme-toggle";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { Toolbar } from "@/components/editor/toolbar";
import { MarkdownPreview } from "@/components/markdown-preview";
import { PublishDialog } from "@/components/editor/publish-dialog";
import { MathDialog } from "@/components/editor/math-dialog";
import { CommandPalette } from "@/components/editor/command-palette";
import { EditorContextMenu } from "@/components/editor/context-menu";
import { SettingsDialog } from "@/components/editor/settings-dialog";
import { encryptContent } from "@/lib/crypto";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import {
  Save,
  ArrowLeft,
  Upload,
  Sigma,
  Eye,
  EyeOff,
  Settings,
  Command,
} from "lucide-react";
import Link from "next/link";

const DRAFT_KEY = "noteup-draft";
const AUTOSAVE_INTERVAL = 3000;
const UI_SCALE_KEY = "noteup-ui-scale";

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

function loadUiScale(): number {
  if (typeof window === "undefined") return 1;
  try {
    const saved = localStorage.getItem(UI_SCALE_KEY);
    if (saved) return parseFloat(saved);
  } catch {}
  return 1;
}

export default function DraftPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("untitled");
  const [showPreview, setShowPreview] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [showMathDialog, setShowMathDialog] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [uiScale, setUiScale] = useState(1);
  const lastSaveRef = useRef<number>(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const draft = loadDraft();
    setContent(draft.content);
    setTitle(draft.title);
    setUiScale(loadUiScale());
  }, []);

  const handleUiScaleChange = (scale: number) => {
    setUiScale(scale);
    localStorage.setItem(UI_SCALE_KEY, String(scale));
  };

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

  // keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveDraft({ content, title, updatedAt: Date.now() });
        toast("draft saved");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [content, title]);

  const handleEditorReady = useCallback((ed: Editor) => {
    setEditor(ed);
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

  const generateSlug = () => {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) || nanoid(8)
    );
  };

  const handleInsertMath = (latex: string, isBlock: boolean) => {
    if (!editor) return;
    const insert = isBlock ? `\n$$\n${latex}\n$$\n` : `$${latex}$`;
    editor.chain().focus().insertContent(insert).run();
    setShowMathDialog(false);
  };

  const doSaveDraft = () => {
    saveDraft({ content, title, updatedAt: Date.now() });
    toast("draft saved");
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
    <div
      className="h-dvh flex flex-col"
      style={{ fontSize: `${uiScale * 100}%` }}
    >
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
            onClick={() => setShowCommandPalette(true)}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            title="command palette (ctrl+k)"
          >
            <Command className="h-3.5 w-3.5" />
          </button>

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
            onClick={doSaveDraft}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            title="save draft (ctrl+s)"
          >
            <Save className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            title={
              showPreview ? "hide markdown preview" : "show markdown preview"
            }
          >
            {showPreview ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            title="settings"
          >
            <Settings className="h-3.5 w-3.5" />
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
        editor={editor}
        onExportPdf={() => router.push(`/export?draft=true`)}
      />

      {/* editor + optional markdown preview */}
      <div className="flex-1 flex overflow-hidden">
        <div
          className={`${showPreview ? "w-1/2 border-r border-border" : "w-full"} flex flex-col overflow-hidden`}
        >
          <TiptapEditor
            content={content}
            onChange={setContent}
            onEditorReady={handleEditorReady}
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
        <span>ctrl+k command palette</span>
        <span>draft · auto-saved</span>
      </div>

      {/* context menu */}
      <EditorContextMenu editor={editor} />

      {/* command palette */}
      <CommandPalette
        open={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        editor={editor}
        onExportPdf={() => router.push(`/export?draft=true`)}
        onOpenMath={() => setShowMathDialog(true)}
        onImport={() => fileInputRef.current?.click()}
        onSaveDraft={doSaveDraft}
        onTogglePreview={() => setShowPreview(!showPreview)}
        onPublish={() => setShowPublish(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* settings dialog */}
      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        uiScale={uiScale}
        onUiScaleChange={handleUiScaleChange}
      />

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
