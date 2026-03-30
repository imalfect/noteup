"use client";

import { Suspense } from "react";
import { ExportPageContent } from "@/components/export-page-content";

export default function ExportPage() {
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
      <ExportPageContent />
    </Suspense>
  );
}
