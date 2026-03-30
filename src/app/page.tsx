import { Title } from "@/components/title";
import { ThemeToggle } from "@/components/theme-toggle";
import { HomeActions } from "@/components/home-actions";
import Link from "next/link";

export default function Home() {
  return (
    <div className="h-dvh flex flex-col items-center justify-center px-6 sm:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Title />
          <ThemeToggle />
        </div>

        <p className="font-mono text-xs text-muted-foreground">
          markdown notes, shared instantly. write, publish, share.
        </p>

        <HomeActions />

        <div className="border border-border divide-y divide-border">
          <div className="p-3 flex justify-between font-mono text-xs">
            <span className="text-muted-foreground">encryption</span>
            <span>client-side aes-256-gcm</span>
          </div>
          <div className="p-3 flex justify-between font-mono text-xs">
            <span className="text-muted-foreground">editor</span>
            <span>codemirror + gfm + latex</span>
          </div>
          <div className="p-3 flex justify-between font-mono text-xs">
            <span className="text-muted-foreground">export</span>
            <span>pdf with page preview</span>
          </div>
          <div className="p-3 flex justify-between font-mono text-xs">
            <span className="text-muted-foreground">storage</span>
            <span>postgresql via drizzle</span>
          </div>
        </div>

        <div className="flex gap-4 font-mono text-xs text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground transition-colors">
            terms
          </Link>
        </div>
      </div>
    </div>
  );
}
