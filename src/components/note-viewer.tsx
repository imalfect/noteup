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
};

export function NoteViewer({ note }: { note: NoteData }) {
  const [decryptedContent, setDecryptedContent] = useState<string | null>(
    note.encrypted ? null : note.content
  );
  const [password, setPassword] = useState("");
  const [decrypting, setDecrypting] = useState(false);
  const contentRef = useRef<string | null>(null);
  const router = useRouter();

  const handleDecrypt = async () => {
    if (!password || !note.salt || !note.iv) return;
    setDecrypting(true);
    try {
      const content = await decryptContent(
        note.content,
        password,
        note.salt,
        note.iv
      );
      setDecryptedContent(content);
      contentRef.current = content;
      toast("decrypted successfully");
    } catch {
      toast("wrong password — try again");
    } finally {
      setDecrypting(false);
    }
  };

  const copyContent = () => {
    const content = decryptedContent || note.content;
    navigator.clipboard.writeText(content);
    toast("copied to clipboard");
  };

  const downloadMd = () => {
    const content = decryptedContent || note.content;
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
    // store content in sessionStorage for the export page
    const content = decryptedContent || note.content;
    sessionStorage.setItem(
      "noteup-export",
      JSON.stringify({ content, title: note.title })
    );
    router.push("/export");
  };

  const createdDate = new Date(note.createdAt);

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
              {createdDate.toLocaleDateString()} {createdDate.toLocaleTimeString()}
            </span>
          </div>
          <div className="p-3 flex justify-between font-mono text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              encrypted
            </span>
            <span>{note.encrypted ? "yes — aes-256-gcm" : "no"}</span>
          </div>
        </div>

        {/* decrypt form */}
        {note.encrypted && !decryptedContent && (
          <div className="border border-border p-4 space-y-3">
            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              this note is encrypted
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
        {decryptedContent !== null && (
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
                {note.title}
              </h2>
              <MarkdownPreview content={decryptedContent} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
