"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Title } from "@/components/title";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toolbar } from "@/components/editor/toolbar";
import { MarkdownPreview } from "@/components/markdown-preview";
import { PublishDialog } from "@/components/editor/publish-dialog";
import { MathDialog } from "@/components/editor/math-dialog";
import { CommandPalette } from "@/components/editor/command-palette";
import { EditorContextMenu } from "@/components/editor/context-menu";
import { SettingsDialog } from "@/components/editor/settings-dialog";
import { VersionHistoryDialog } from "@/components/editor/version-history-dialog";
import { MarkdownCodeEditor, type MarkdownCodeEditorHandle } from "@/components/editor/markdown-code-editor";
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
  History,
  FilePlus,
} from "lucide-react";
import Link from "next/link";
import { Tooltip } from "@/components/ui/tooltip";
import { Dialog } from "@base-ui/react/dialog";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { Menu } from "lucide-react";

const DRAFT_KEY = "noteup-draft";
const AUTOSAVE_INTERVAL = 3000;
const UI_SCALE_KEY = "noteup-ui-scale";
const EDITOR_FONT_KEY = "noteup-editor-font";

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

function loadEditorFont(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(EDITOR_FONT_KEY) || "";
  } catch {}
  return "";
}

export function DraftEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // edit mode params
  const editSlug = searchParams.get("edit");
  const editKeyParam = searchParams.get("key");
  const isEditMode = !!editSlug && !!editKeyParam;

  const [content, setContent] = useState("");
  const [title, setTitle] = useState("untitled");
  const [showPreview, setShowPreview] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [showMathDialog, setShowMathDialog] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [uiScale, setUiScale] = useState(1);
  const [editorFont, setEditorFont] = useState("");
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [justPublished, setJustPublished] = useState<{
    url: string;
    editKey: string;
    slug: string;
  } | null>(null);
  const [showNewNoteConfirm, setShowNewNoteConfirm] = useState(false);
  const lastSaveRef = useRef<number>(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const codeEditorRef = useRef<MarkdownCodeEditorHandle>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUiScale(loadUiScale());
    setEditorFont(loadEditorFont());

    if (isEditMode) {
      fetch("/api/edit/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: editSlug, editKey: editKeyParam }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("verification failed");
          return res.json();
        })
        .then((data) => {
          setContent(data.content);
          setTitle(data.title);
          setCurrentVersion(data.version);
        })
        .catch(() => {
          toast("failed to load note — invalid edit key");
          router.push("/");
        });
    } else {
      const draft = loadDraft();
      setContent(draft.content);
      setTitle(draft.title);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUiScaleChange = (scale: number) => {
    setUiScale(scale);
    localStorage.setItem(UI_SCALE_KEY, String(scale));
  };

  const handleEditorFontChange = (font: string) => {
    setEditorFont(font);
    localStorage.setItem(EDITOR_FONT_KEY, font);
  };

  // autosave (only for new notes, not edit mode)
  useEffect(() => {
    if (!mounted || isEditMode) return;
    const interval = setInterval(() => {
      if (Date.now() - lastSaveRef.current > AUTOSAVE_INTERVAL) {
        saveDraft({ content, title, updatedAt: Date.now() });
        lastSaveRef.current = Date.now();
      }
    }, AUTOSAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [content, title, mounted, isEditMode]);

  useEffect(() => {
    if (!mounted || isEditMode) return;
    lastSaveRef.current = Date.now();
  }, [content, title, mounted, isEditMode]);

  useEffect(() => {
    if (!mounted || isEditMode) return;
    return () => {
      saveDraft({ content, title, updatedAt: Date.now() });
    };
  }, [content, title, mounted, isEditMode]);

  // keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (!isEditMode) {
          saveDraft({ content, title, updatedAt: Date.now() });
          toast("draft saved");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [content, title, isEditMode]);

  const handlePublish = async (
    slug: string,
    password: string
  ): Promise<{ url: string; editKey: string } | null> => {
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
    const editKey = nanoid(24);

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
        editKey,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast(data.error || "publish failed");
      return null;
    }

    localStorage.removeItem(DRAFT_KEY);
    const origin = window.location.origin;
    setJustPublished({ url: `${origin}/${slug}`, editKey, slug });
    return { url: `${origin}/${slug}`, editKey };
  };

  const handleSaveEdit = async (password?: string): Promise<boolean> => {
    if (!editSlug || !editKeyParam) return false;

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

    const res = await fetch("/api/edit/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: editSlug,
        editKey: editKeyParam,
        title,
        content: finalContent,
        salt,
        iv,
        encrypted,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast(data.error || "save failed");
      return false;
    }

    const data = await res.json();
    setCurrentVersion(data.version);
    return true;
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
    const handle = codeEditorRef.current;
    if (!handle) return;
    const insert = isBlock ? `\n$$\n${latex}\n$$\n` : `$${latex}$`;
    handle.insertSyntax(insert);
    setShowMathDialog(false);
  };

  const doSaveDraft = () => {
    if (isEditMode) return;
    saveDraft({ content, title, updatedAt: Date.now() });
    toast("draft saved");
  };

  const handleExportPdf = () => {
    sessionStorage.setItem(
      "noteup-export",
      JSON.stringify({ content, title })
    );
    router.push("/export?draft=true");
  };

  const handleLoadVersion = (versionContent: string, versionTitle: string) => {
    setContent(versionContent);
    setTitle(versionTitle);
    setShowVersionHistory(false);
    toast("version loaded into editor");
  };

  const handleNewNote = () => {
    if (content.trim().length > 0) {
      setShowNewNoteConfirm(true);
    } else {
      doNewNote();
    }
  };

  const doNewNote = () => {
    localStorage.removeItem(DRAFT_KEY);
    setContent("");
    setTitle("untitled");
    setShowNewNoteConfirm(false);
    setJustPublished(null);
    toast("new note");
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
      className="flex flex-col overflow-hidden origin-top-left"
      style={{
        transform: `scale(${uiScale})`,
        width: `${100 / uiScale}%`,
        height: `${100 / uiScale}dvh`,
      }}
    >
      {/* header */}
      <header className="flex min-h-14 items-center gap-2 border-b border-border px-3 sm:px-4">
        <Link
          href="/"
          className="icon-button"
          aria-label="Back to noteup"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="hidden sm:block"><Title /></div>

        {isEditMode && (
          <span className="font-mono text-xs text-muted-foreground ml-1 hidden md:inline">
            / editing{" "}
            <span className="text-foreground">{editSlug}</span>
            {currentVersion && (
              <span className="text-muted-foreground"> v{currentVersion}</span>
            )}
          </span>
        )}

        <div className="hidden h-5 w-px bg-border sm:block" />

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="min-w-0 flex-1 rounded-md bg-transparent px-2 py-2 text-sm font-medium focus:outline-none focus:bg-muted/60"
          placeholder="Untitled note"
          aria-label="Note title"
        />

        {/* desktop actions */}
        <div className="hidden md:flex items-center gap-1">
          {!isEditMode && (
            <Tooltip content="new note">
              <button
                onClick={handleNewNote}
                className="toolbar-button desktop-sm-action"
                aria-label="New note"
              >
                <FilePlus className="h-4 w-4" />
              </button>
            </Tooltip>
          )}

          <Tooltip content="command palette (ctrl+k)">
            <button
              onClick={() => setShowCommandPalette(true)}
              className="toolbar-button desktop-lg-action"
              aria-label="Command palette"
            >
              <Command className="h-4 w-4" />
            </button>
          </Tooltip>

          <Tooltip content="math formula">
            <button
              onClick={() => setShowMathDialog(true)}
              className="toolbar-button desktop-lg-action"
              aria-label="Insert math formula"
            >
              <Sigma className="h-4 w-4" />
            </button>
          </Tooltip>

          {isEditMode && (
            <Tooltip content="version history">
              <button
                onClick={() => setShowVersionHistory(true)}
                className="toolbar-button desktop-md-action"
                aria-label="Version history"
              >
                <History className="h-4 w-4" />
              </button>
            </Tooltip>
          )}

          {!isEditMode && (
            <>
              <Tooltip content="import markdown">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="toolbar-button desktop-lg-action"
                  aria-label="Import Markdown"
                >
                  <Upload className="h-4 w-4" />
                </button>
              </Tooltip>

              <Tooltip content="save draft (ctrl+s)">
                <button
                  onClick={doSaveDraft}
                  className="toolbar-button desktop-lg-action"
                  aria-label="Save draft"
                >
                  <Save className="h-4 w-4" />
                </button>
              </Tooltip>
            </>
          )}

          <Tooltip content={showPreview ? "hide preview" : "show preview"}>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`toolbar-button ${showPreview ? "bg-accent text-foreground" : ""}`}
              aria-label={showPreview ? "Hide preview" : "Show preview"}
              aria-pressed={showPreview}
            >
              {showPreview ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </Tooltip>

          <Tooltip content="settings">
            <button
              onClick={() => setShowSettings(true)}
              className="toolbar-button desktop-sm-action"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </Tooltip>

          <ThemeToggle />
        </div>

        {/* mobile: preview + menu buttons */}
        <div className="flex md:hidden items-center gap-0.5">
          <button
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            className="toolbar-button"
            aria-label={showMobilePreview ? "Hide preview" : "Show preview"}
            aria-pressed={showMobilePreview}
          >
            {showMobilePreview ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => setShowMobileMenu(true)}
            className="toolbar-button"
            aria-label="Open actions menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.txt"
          onChange={handleImport}
          className="hidden"
        />

        {justPublished && !isEditMode ? (
          <Tooltip content="edit the published note">
            <button
              onClick={() => {
                router.push(`/draft?edit=${justPublished.slug}&key=${justPublished.editKey}`);
              }}
              className="button-primary ml-1 whitespace-nowrap px-3 py-2 text-xs"
            >
              <span className="hidden sm:inline">edit published</span>
              <span className="sm:hidden">edit</span>
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={() => setShowPublish(true)}
            className="button-primary ml-1 whitespace-nowrap px-3 py-2 text-xs"
          >
            {isEditMode ? (
              <><span className="hidden sm:inline">save changes</span><span className="sm:hidden">save</span></>
            ) : (
              "publish"
            )}
          </button>
        )}
      </header>

      {/* toolbar */}
      <Toolbar
        codeEditorRef={codeEditorRef}
        onExportPdf={handleExportPdf}
      />

      {/* editor + optional desktop markdown preview */}
      <div className="flex-1 flex overflow-hidden">
        <div
          className={`${showPreview ? "hidden md:flex md:w-1/2 md:border-r md:border-border" : "flex w-full"} flex-col overflow-hidden`}
        >
          <MarkdownCodeEditor
            ref={codeEditorRef}
            content={content}
            onChange={setContent}
          />
        </div>
        {showPreview && (
          <div
            className="w-full overflow-auto px-5 py-8 sm:px-8 md:w-1/2 lg:px-12"
            style={{
              fontFamily: editorFont || "var(--font-sans), system-ui, sans-serif",
            }}
          >
            <MarkdownPreview content={content} />
          </div>
        )}
      </div>

      {/* mobile preview drawer */}
      <MobileDrawer
        open={showMobilePreview}
        onClose={() => setShowMobilePreview(false)}
        title="preview"
      >
        <div
          className="p-5 sm:p-8"
          style={{
            fontFamily: editorFont || "var(--font-sans), system-ui, sans-serif",
          }}
        >
          <MarkdownPreview content={content} />
        </div>
      </MobileDrawer>

      {/* mobile menu drawer */}
      <MobileDrawer
        open={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        title="actions"
      >
        <div className="p-3 space-y-1">
          {!isEditMode && (
            <button
              onClick={() => { setShowMobileMenu(false); handleNewNote(); }}
              className="w-full flex items-center gap-3 p-2.5 font-mono text-xs hover:bg-accent transition-colors"
            >
              <FilePlus className="h-3.5 w-3.5 text-muted-foreground" />
              new note
            </button>
          )}
          <button
            onClick={() => { setShowMobileMenu(false); setShowCommandPalette(true); }}
            className="w-full flex items-center gap-3 p-2.5 font-mono text-xs hover:bg-accent transition-colors"
          >
            <Command className="h-3.5 w-3.5 text-muted-foreground" />
            command palette
          </button>
          <button
            onClick={() => { setShowMobileMenu(false); setShowMathDialog(true); }}
            className="w-full flex items-center gap-3 p-2.5 font-mono text-xs hover:bg-accent transition-colors"
          >
            <Sigma className="h-3.5 w-3.5 text-muted-foreground" />
            math formula
          </button>
          {isEditMode && (
            <button
              onClick={() => { setShowMobileMenu(false); setShowVersionHistory(true); }}
              className="w-full flex items-center gap-3 p-2.5 font-mono text-xs hover:bg-accent transition-colors"
            >
              <History className="h-3.5 w-3.5 text-muted-foreground" />
              version history
            </button>
          )}
          {!isEditMode && (
            <>
              <button
                onClick={() => { setShowMobileMenu(false); fileInputRef.current?.click(); }}
                className="w-full flex items-center gap-3 p-2.5 font-mono text-xs hover:bg-accent transition-colors"
              >
                <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                import markdown
              </button>
              <button
                onClick={() => { setShowMobileMenu(false); doSaveDraft(); }}
                className="w-full flex items-center gap-3 p-2.5 font-mono text-xs hover:bg-accent transition-colors"
              >
                <Save className="h-3.5 w-3.5 text-muted-foreground" />
                save draft
              </button>
            </>
          )}
          <div className="h-px bg-border my-1" />
          <button
            onClick={() => { setShowMobileMenu(false); handleExportPdf(); }}
            className="w-full flex items-center gap-3 p-2.5 font-mono text-xs hover:bg-accent transition-colors"
          >
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            export to pdf
          </button>
          <button
            onClick={() => { setShowMobileMenu(false); setShowSettings(true); }}
            className="w-full flex items-center gap-3 p-2.5 font-mono text-xs hover:bg-accent transition-colors"
          >
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            settings
          </button>
          <div className="h-px bg-border my-1" />
          <div className="flex items-center gap-3 p-2.5 font-mono text-xs text-muted-foreground">
            <ThemeToggle />
            <span>toggle theme</span>
          </div>
        </div>
      </MobileDrawer>

      {/* status bar */}
      <div className="flex min-h-8 items-center gap-4 border-t border-border px-3 font-mono text-[11px] text-muted-foreground">
        <span>{content.length} chars</span>
        <span className="hidden sm:inline">{content.split(/\s+/).filter(Boolean).length} words</span>
        <span className="hidden sm:inline">{content.split("\n").length} lines</span>
        <span className="flex-1" />
        {isEditMode && currentVersion && <span>v{currentVersion}</span>}
        <span className="hidden md:inline">ctrl+k command palette</span>
        <span className="truncate">{isEditMode ? `editing · ${editSlug}` : justPublished ? `published · ${justPublished.slug}` : "draft · auto-saved"}</span>
      </div>

      {/* context menu */}
      <EditorContextMenu codeEditorRef={codeEditorRef} />

      {/* command palette */}
      <CommandPalette
        open={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        codeEditorRef={codeEditorRef}
        onExportPdf={handleExportPdf}
        onOpenMath={() => setShowMathDialog(true)}
        onImport={() => !isEditMode && fileInputRef.current?.click()}
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
        editorFont={editorFont}
        onEditorFontChange={handleEditorFontChange}
      />

      {/* publish / save dialog */}
      <PublishDialog
        open={showPublish}
        onClose={() => setShowPublish(false)}
        onPublish={handlePublish}
        defaultSlug={isEditMode ? editSlug : generateSlug()}
        isEditMode={isEditMode}
        onSaveEdit={handleSaveEdit}
      />

      {/* math dialog */}
      <MathDialog
        open={showMathDialog}
        onClose={() => setShowMathDialog(false)}
        onInsert={handleInsertMath}
      />

      {/* version history (edit mode only) */}
      {isEditMode && editSlug && (
        <VersionHistoryDialog
          open={showVersionHistory}
          onClose={() => setShowVersionHistory(false)}
          slug={editSlug}
          currentVersion={currentVersion}
          onLoadVersion={handleLoadVersion}
        />
      )}

      {/* new note confirmation */}
      <Dialog.Root open={showNewNoteConfirm} onOpenChange={(o) => !o && setShowNewNoteConfirm(false)}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-sm bg-card border border-border">
            <div className="p-4 border-b border-border">
              <Dialog.Title className="font-mono text-xs font-semibold uppercase tracking-wider">
                start new note?
              </Dialog.Title>
            </div>
            <div className="p-4 space-y-3">
              <p className="font-mono text-xs text-muted-foreground">
                you have unsaved content. starting a new note will clear the current draft.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewNoteConfirm(false)}
                  className="flex-1 border border-border p-2.5 font-mono text-xs font-medium hover:border-foreground/20 transition-colors"
                >
                  cancel
                </button>
                <button
                  onClick={doNewNote}
                  className="flex-1 border border-border bg-foreground text-background p-2.5 font-mono text-xs font-medium hover:bg-foreground/90 transition-colors"
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
