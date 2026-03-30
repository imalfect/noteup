import { Title } from "@/components/title";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

const TERMS = [
  {
    title: "1. service",
    content:
      "noteup is a markdown note-sharing service. notes are stored in postgresql. optional client-side encryption is available — the server never accesses your password or plaintext when encryption is enabled.",
  },
  {
    title: "2. prohibited content",
    content:
      "you may not publish: child exploitation material, non-consensual intimate imagery, unlawful content, malware, content that infringes copyright, terrorist content, doxxing, or fraudulent material.",
  },
  {
    title: "3. encryption",
    content:
      "when a password is set, content is encrypted client-side using aes-256-gcm before being sent to the server. the server stores only the encrypted data, salt, and iv. you are still responsible for the content you publish regardless of encryption status.",
  },
  {
    title: "4. storage",
    content:
      "notes are stored indefinitely unless removed by the operator. the service reserves the right to delete content at any time without notice.",
  },
  {
    title: "5. liability",
    content:
      "the service is provided as-is with no warranty of any kind. the operator is not liable for data loss, downtime, or service unavailability.",
  },
  {
    title: "6. enforcement",
    content:
      "the operator may remove content, block users or ips, and report violations to law enforcement without advance notice.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-dvh py-12">
      <div className="max-w-xl mx-auto px-6 sm:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Title />
          </Link>
          <ThemeToggle />
        </div>

        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider">
          terms & conditions
        </h2>

        <div className="border border-border divide-y divide-border">
          {TERMS.map((term) => (
            <div key={term.title} className="p-4 space-y-2">
              <h3 className="font-mono text-xs font-semibold">{term.title}</h3>
              <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                {term.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
