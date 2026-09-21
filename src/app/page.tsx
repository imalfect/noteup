import { Title } from "@/components/title";
import { ThemeToggle } from "@/components/theme-toggle";
import { HomeActions } from "@/components/home-actions";
import Link from "next/link";

export default function Home() {
  return (
    <main id="main-content" className="min-h-dvh flex flex-col items-center justify-center px-5 py-12 sm:px-8">
      <div className="w-full max-w-lg space-y-8">
        <div className="flex items-center justify-between">
          <Title />
          <ThemeToggle />
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.04em] leading-[1.08] text-balance">
            Write it down. Share it when it’s ready.
          </h2>
          <p className="text-[15px] leading-7 text-muted-foreground max-w-[48ch]">
            A quiet Markdown editor for notes, drafts, and documents. No account required.
          </p>
        </div>

        <HomeActions />

        <div className="surface divide-y divide-border">
          <div className="p-3 flex justify-between font-mono text-xs">
            <span className="text-muted-foreground">encryption</span>
            <span>optional, in your browser</span>
          </div>
          <div className="p-3 flex justify-between font-mono text-xs">
            <span className="text-muted-foreground">editor</span>
            <span>Markdown, tables, and math</span>
          </div>
          <div className="p-3 flex justify-between font-mono text-xs">
            <span className="text-muted-foreground">export</span>
            <span>Markdown and PDF</span>
          </div>
          <div className="p-3 flex justify-between font-mono text-xs">
            <span className="text-muted-foreground">drafts</span>
            <span>saved automatically</span>
          </div>
        </div>

        <div className="flex gap-4 font-mono text-xs text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground transition-colors">
            terms
          </Link>
        </div>
      </div>
    </main>
  );
}
