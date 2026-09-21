"use client";

import { useState, useRef } from "react";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Title } from "@/components/title";
import { ThemeToggle } from "@/components/theme-toggle";
import { decryptContent } from "@/lib/crypto";
import { toast } from "sonner";
import {
  Lock,
  Copy,
  Download,
  FileDown,
  Clock,
  Shield,
  Hash,
  History,
  ChevronDown,
  ChevronUp,
  Type,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type NoteData = {
  id: string;
  slug: string;
  title: string;
  content: string;
  encrypted: boolean;
  salt: string | null;
  iv: string | null;
  createdAt: string;
  version: number;
};

type VersionSummary = {
  id: string;
  version: number;
  title: string;
  createdAt: string;
};

type VersionDetail = {
  version: number;
  title: string;
  content: string;
  encrypted: boolean;
  salt: string | null;
  iv: string | null;
};

export function NoteViewer({ note }: { note: NoteData }) {
  const [decryptedContent, setDecryptedContent] = useState<string | null>(
    note.encrypted ? null : note.content
  );
  const [password, setPassword] = useState("");
  const [decrypting, setDecrypting] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<number | null>(null);
  const [versionContent, setVersionContent] = useState<string | null>(null);
  const [versionTitle, setVersionTitle] = useState<string | null>(null);
  const [versionEncrypted, setVersionEncrypted] = useState(false);
  const [versionNeedsDecrypt, setVersionNeedsDecrypt] = useState(false);
  const [versionSalt, setVersionSalt] = useState<string | null>(null);
  const [versionIv, setVersionIv] = useState<string | null>(null);
  const [readerSize, setReaderSize] = useState<"compact" | "comfortable" | "large">(
    "comfortable"
  );

  // cache password across version switches within the session
  const cachedPasswordRef = useRef<string>("");
  const router = useRouter();

  const isCurrentVersionEncrypted = viewingVersion ? versionEncrypted : note.encrypted;

  const tryDecrypt = async (
    content: string,
    salt: string,
    iv: string,
    pwd: string
  ): Promise<string | null> => {
    try {
      return await decryptContent(content, pwd, salt, iv);
    } catch {
      return null;
    }
  };

  const handleDecrypt = async () => {
    if (!password) return;
    setDecrypting(true);
    try {
      // decrypt whichever version is currently active
      if (viewingVersion && versionNeedsDecrypt && versionSalt && versionIv) {
        const result = await tryDecrypt(versionContent!, versionSalt, versionIv, password);
        if (result) {
          setVersionContent(result);
          setVersionNeedsDecrypt(false);
          cachedPasswordRef.current = password;
          toast("decrypted successfully");
        } else {
          toast("wrong password — try again");
        }
      } else if (note.encrypted && !decryptedContent && note.salt && note.iv) {
        const result = await tryDecrypt(note.content, note.salt, note.iv, password);
        if (result) {
          setDecryptedContent(result);
          cachedPasswordRef.current = password;
          toast("decrypted successfully");
        } else {
          toast("wrong password — try again");
        }
      }
    } finally {
      setDecrypting(false);
    }
  };

  const copyContent = () => {
    const content = versionContent || decryptedContent || note.content;
    navigator.clipboard.writeText(content);
    toast("copied to clipboard");
  };

  const downloadMd = () => {
    const content = versionContent || decryptedContent || note.content;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast("download started");
  };

  const handleExportPdf = () => {
    const content = versionContent || decryptedContent || note.content;
    sessionStorage.setItem(
      "noteup-export",
      JSON.stringify({ content, title: versionTitle || note.title })
    );
    router.push("/export");
  };

  const toggleVersions = async () => {
    if (showVersions) {
      setShowVersions(false);
      return;
    }
    setShowVersions(true);
    if (versions.length > 0) return;
    setLoadingVersions(true);
    try {
      const res = await fetch(
        `/api/note/${encodeURIComponent(note.slug)}/versions`
      );
      const data = await res.json();
      setVersions(data.versions || []);
    } catch {
      toast("failed to load versions");
    } finally {
      setLoadingVersions(false);
    }
  };

  const loadVersion = async (version: number) => {
    // clicking current version = go back to latest
    if (version === note.version) {
      setViewingVersion(null);
      setVersionContent(null);
      setVersionTitle(null);
      setVersionEncrypted(false);
      setVersionNeedsDecrypt(false);
      setVersionSalt(null);
      setVersionIv(null);
      return;
    }
    try {
      const res = await fetch(
        `/api/note/${encodeURIComponent(note.slug)}/versions/${version}`
      );
      if (!res.ok) throw new Error();
      const data: VersionDetail = await res.json();
      setViewingVersion(version);
      setVersionTitle(data.title);
      setVersionEncrypted(data.encrypted);

      if (data.encrypted && data.salt && data.iv) {
        // try auto-decrypt with cached password
        if (cachedPasswordRef.current) {
          const result = await tryDecrypt(
            data.content,
            data.salt,
            data.iv,
            cachedPasswordRef.current
          );
          if (result) {
            setVersionContent(result);
            setVersionNeedsDecrypt(false);
            setVersionSalt(null);
            setVersionIv(null);
            return;
          }
        }
        // need manual decryption
        setVersionContent(data.content);
        setVersionNeedsDecrypt(true);
        setVersionSalt(data.salt);
        setVersionIv(data.iv);
      } else {
        setVersionContent(data.content);
        setVersionNeedsDecrypt(false);
        setVersionSalt(null);
        setVersionIv(null);
      }
    } catch {
      toast("failed to load version");
    }
  };

  const createdDate = new Date(note.createdAt);

  // determine what to show
  const needsDecrypt =
    viewingVersion
      ? versionNeedsDecrypt
      : note.encrypted && !decryptedContent;

  const displayContent = needsDecrypt
    ? null
    : viewingVersion
      ? versionContent
      : decryptedContent;

  const displayTitle = versionTitle || note.title;

  return (
    <main id="main-content" className="min-h-dvh pb-20">
      <header className="reader-header sticky top-0 z-20">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="icon-button" aria-label="Back to noteup">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Link href="/" className="hidden sm:block"><Title /></Link>
          <div className="h-5 w-px bg-border" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{displayTitle}</span>

          {displayContent !== null ? (
            <div className="hidden items-center gap-1 sm:flex">
              <button onClick={copyContent} className="toolbar-button" aria-label="Copy Markdown" title="Copy Markdown">
                <Copy className="h-4 w-4" />
              </button>
              <button onClick={downloadMd} className="toolbar-button" aria-label="Download Markdown" title="Download Markdown">
                <Download className="h-4 w-4" />
              </button>
              <button onClick={handleExportPdf} className="toolbar-button" aria-label="Export PDF" title="Export PDF">
                <FileDown className="h-4 w-4" />
              </button>
            </div>
          ) : null}
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pt-10 sm:px-8 sm:pt-16">
        <div className="mx-auto max-w-[76ch]">
          <div className="mb-10 border-b border-border pb-8 sm:mb-12 sm:pb-10">
            {viewingVersion ? (
              <div className="mb-4 inline-flex rounded-md bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground">
                Viewing version {viewingVersion}. Select the latest version below to return.
              </div>
            ) : null}
            <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-5xl">
              {displayTitle}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span>{createdDate.toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
              <span aria-hidden="true">·</span>
              <span>Version {viewingVersion || note.version}</span>
              {isCurrentVersionEncrypted ? (
                <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" />Encrypted</span>
              ) : null}
            </div>
          </div>

          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div className="reader-controls" aria-label="Reading size">
              <Type className="mx-1 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              {(["compact", "comfortable", "large"] as const).map((size, index) => (
                <button
                  key={size}
                  onClick={() => setReaderSize(size)}
                  className="reader-size-button"
                  aria-label={`${size} text size`}
                  aria-pressed={readerSize === size}
                  title={`${size} text size`}
                >
                  <span style={{ fontSize: `${12 + index * 2}px` }}>A</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 sm:hidden">
              <button onClick={copyContent} className="button-secondary px-3" disabled={displayContent === null}>
                <Copy className="h-4 w-4" /> Copy
              </button>
              <button onClick={downloadMd} className="button-secondary px-3" disabled={displayContent === null}>
                <Download className="h-4 w-4" /> .md
              </button>
            </div>
          </div>

          {needsDecrypt ? (
            <section className="surface p-5 sm:p-6" aria-labelledby="decrypt-heading">
              <div className="mb-4 flex items-start gap-3">
                <span className="action-icon"><Lock className="h-4 w-4" /></span>
                <div>
                  <h2 id="decrypt-heading" className="font-semibold">Password required</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {viewingVersion ? `Version ${viewingVersion} is encrypted.` : "This note is encrypted."} Decryption happens in your browser.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleDecrypt()}
                  placeholder="Enter password"
                  aria-label="Note password"
                  className="field flex-1"
                />
                <button onClick={handleDecrypt} disabled={decrypting || !password} className="button-primary sm:px-5">
                  {decrypting ? "Decrypting…" : "Open note"}
                </button>
              </div>
            </section>
          ) : null}

          {displayContent !== null ? (
            <article className={`reader-document reader-${readerSize}`}>
              <MarkdownPreview content={displayContent} />
            </article>
          ) : null}

          <section className="mt-16 border-t border-border pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <details className="note-details">
                <summary>About this note</summary>
                <dl className="mt-4 grid gap-3 rounded-lg bg-muted/60 p-4 text-sm sm:grid-cols-2">
                  <div><dt><Hash className="h-3.5 w-3.5" />Slug</dt><dd>{note.slug}</dd></div>
                  <div><dt><Clock className="h-3.5 w-3.5" />Published</dt><dd>{createdDate.toLocaleString()}</dd></div>
                  <div><dt><Shield className="h-3.5 w-3.5" />Privacy</dt><dd>{isCurrentVersionEncrypted ? "AES-256-GCM encrypted" : "Public"}</dd></div>
                  <div><dt><History className="h-3.5 w-3.5" />Version</dt><dd>{viewingVersion || note.version}</dd></div>
                </dl>
              </details>

              <button onClick={toggleVersions} className="button-secondary" aria-expanded={showVersions}>
                <History className="h-4 w-4" /> Version history
                {showVersions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>

            {showVersions ? (
              <div className="surface mt-4 divide-y divide-border overflow-hidden">
                {loadingVersions ? (
                  <div className="p-4 text-sm text-muted-foreground animate-pulse">Loading versions…</div>
                ) : versions.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No earlier versions yet.</div>
                ) : versions.map((v) => {
                  const vDate = new Date(v.createdAt);
                  const isCurrent = v.version === note.version && !viewingVersion;
                  const isViewing = v.version === viewingVersion;
                  return (
                    <button
                      key={v.id}
                      onClick={() => loadVersion(v.version)}
                      className={`version-row ${isCurrent || isViewing ? "bg-muted/70" : ""}`}
                    >
                      <span className="font-medium">Version {v.version}{v.version === note.version ? " · latest" : ""}</span>
                      <span className="text-muted-foreground">{vDate.toLocaleString()}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
