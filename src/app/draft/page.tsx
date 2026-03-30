"use client";

import { Suspense } from "react";
import { DraftEditor } from "@/components/draft-editor";

export default function DraftPage() {
  return (
    <Suspense
      fallback={
        <div className="h-dvh flex items-center justify-center">
          <span className="font-mono text-xs text-muted-foreground animate-pulse">
            loading...
          </span>
        </div>
      }
    >
      <DraftEditor />
    </Suspense>
  );
}
