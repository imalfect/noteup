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
    <div className="min-h-dvh py-12">
      <div className="max-w-xl mx-auto px-6 sm:px-8 space-y-6">
        {/* header */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Title />
          </Link>
          <ThemeToggle />
        </div>

        {/* note metadata */}
        <div className="border border-border divide-y divide-border">
          <div className="p-3 flex justify-between font-mono text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Hash className="h-3 w-3" />
              slug
            </span>
            <span>{note.slug}</span>
          </div>
          <div className="p-3 flex justify-between font-mono text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              created
            </span>
            <span>
              {createdDate.toLocaleDateString()}{" "}
              {createdDate.toLocaleTimeString()}
            </span>
          </div>
          <div className="p-3 flex justify-between font-mono text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              encrypted
            </span>
            <span>
              {isCurrentVersionEncrypted ? "yes — aes-256-gcm" : "no"}
            </span>
          </div>
          <div className="p-3 flex justify-between font-mono text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <History className="h-3 w-3" />
              version
            </span>
            <span>
              {viewingVersion ? `v${viewingVersion}` : `v${note.version}`}
              {viewingVersion && (
                <span className="text-muted-foreground ml-1">(viewing old)</span>
              )}
            </span>
          </div>
        </div>

        {/* version history toggle */}
        <button
          onClick={toggleVersions}
          className="w-full border border-border p-2.5 font-mono text-xs font-medium hover:border-foreground/20 transition-colors flex items-center justify-center gap-2"
        >
          <History className="h-3 w-3 text-muted-foreground" />
          version history
          {showVersions ? (
            <ChevronUp className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
        </button>

        {showVersions && (
          <div className="border border-border divide-y divide-border">
            {loadingVersions ? (
              <div className="p-3 font-mono text-xs text-muted-foreground animate-pulse">
                loading...
              </div>
            ) : versions.length === 0 ? (
              <div className="p-3 font-mono text-xs text-muted-foreground">
                no version history
              </div>
            ) : (
              versions.map((v) => {
                const vDate = new Date(v.createdAt);
                const isCurrent = v.version === note.version && !viewingVersion;
                const isViewing = v.version === viewingVersion;
                return (
                  <button
                    key={v.id}
                    onClick={() => loadVersion(v.version)}
                    className={`w-full p-3 flex justify-between font-mono text-xs text-left hover:bg-accent transition-colors ${
                      isCurrent || isViewing ? "bg-muted/50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">v{v.version}</span>
                      {v.version === note.version && (
                        <span className="text-muted-foreground">(latest)</span>
                      )}
                      {isViewing && (
                        <span className="text-muted-foreground">(viewing)</span>
                      )}
                    </div>
                    <span className="text-muted-foreground">
                      {vDate.toLocaleDateString()} {vDate.toLocaleTimeString()}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* decrypt form */}
        {needsDecrypt && (
          <div className="border border-border p-4 space-y-3">
            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              {viewingVersion
                ? `version ${viewingVersion} is encrypted`
                : "this note is encrypted"}
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleDecrypt()}
                placeholder="enter password"
                className="flex-1 bg-transparent border border-border p-2 font-mono text-xs focus:border-foreground/30 focus:outline-none transition-colors"
              />
              <button
                onClick={handleDecrypt}
                disabled={decrypting || !password}
                className="border border-border bg-foreground text-background px-4 py-2 font-mono text-xs font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
              >
                {decrypting ? "..." : "decrypt"}
              </button>
            </div>
          </div>
        )}

        {/* content */}
        {displayContent !== null && (
          <>
            {/* actions */}
            <div className="flex gap-2">
              <button
                onClick={copyContent}
                className="flex-1 border border-border p-2.5 font-mono text-xs font-medium hover:border-foreground/20 transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="h-3 w-3 text-muted-foreground" />
                copy markdown
              </button>
              <button
                onClick={downloadMd}
                className="flex-1 border border-border p-2.5 font-mono text-xs font-medium hover:border-foreground/20 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="h-3 w-3 text-muted-foreground" />
                download .md
              </button>
              <button
                onClick={handleExportPdf}
                className="flex-1 border border-border p-2.5 font-mono text-xs font-medium hover:border-foreground/20 transition-colors flex items-center justify-center gap-2"
              >
                <FileDown className="h-3 w-3 text-muted-foreground" />
                export pdf
              </button>
            </div>

            {/* rendered content */}
            <div className="border border-border p-4">
              <h2 className="font-mono text-sm font-semibold mb-4">
                {displayTitle}
              </h2>
              <MarkdownPreview content={displayContent} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
