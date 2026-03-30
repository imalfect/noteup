"use client";

import Link from "next/link";
import { FileUp, FileText, Upload } from "lucide-react";
import { useRef } from "react";
import { useRouter } from "next/navigation";

export function HomeActions() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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

  return (
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
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  );
}
