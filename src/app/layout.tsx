import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "noteup",
  description: "markdown notes, shared instantly",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              unstyled: true,
              classNames: {
                toast:
                  "bg-card border border-border p-3 font-mono text-xs text-foreground w-full flex items-center gap-2",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
