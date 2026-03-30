import { Title } from "@/components/title";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="h-dvh flex flex-col items-center justify-center px-6 sm:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Title />
          <ThemeToggle />
        </div>

        <div className="border border-border p-4 space-y-2">
          <h2 className="font-mono text-xs font-semibold">404 — not found</h2>
          <p className="font-mono text-xs text-muted-foreground">
            this note doesn't exist or has been removed.
          </p>
        </div>

        <Link
          href="/"
          className="block border border-border p-3 font-mono text-xs font-medium hover:border-foreground/20 transition-colors text-center"
        >
          back to home
        </Link>
      </div>
    </div>
  );
}
