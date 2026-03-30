"use client";

import { Font } from "@react-pdf/renderer";

let registered = false;

export type PdfFontFamily =
  | "GeistMono"
  | "Geist"
  | "Inter"
  | "FiraCode"
  | "Courier"
  | "Helvetica"
  | "Times-Roman";

export const PDF_FONT_OPTIONS: {
  value: PdfFontFamily;
  label: string;
  category: "mono" | "sans" | "serif";
}[] = [
  { value: "GeistMono", label: "geist mono", category: "mono" },
  { value: "FiraCode", label: "fira code", category: "mono" },
  { value: "Courier", label: "courier", category: "mono" },
  { value: "Geist", label: "geist", category: "sans" },
  { value: "Inter", label: "inter", category: "sans" },
  { value: "Helvetica", label: "helvetica", category: "sans" },
  { value: "Times-Roman", label: "times roman", category: "serif" },
];

export function registerFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: "GeistMono",
    fonts: [
      { src: "/fonts/GeistMono-Regular.ttf", fontWeight: 400 },
      { src: "/fonts/GeistMono-Medium.ttf", fontWeight: 500 },
      { src: "/fonts/GeistMono-SemiBold.ttf", fontWeight: 600 },
      { src: "/fonts/GeistMono-Bold.ttf", fontWeight: 700 },
      {
        src: "/fonts/GeistMono-Italic.ttf",
        fontWeight: 400,
        fontStyle: "italic",
      },
    ],
  });

  Font.register({
    family: "Geist",
    fonts: [
      { src: "/fonts/Geist-Regular.ttf", fontWeight: 400 },
      { src: "/fonts/Geist-SemiBold.ttf", fontWeight: 600 },
      { src: "/fonts/Geist-Bold.ttf", fontWeight: 700 },
      {
        src: "/fonts/Geist-Italic.ttf",
        fontWeight: 400,
        fontStyle: "italic",
      },
    ],
  });

  Font.register({
    family: "Inter",
    fonts: [
      { src: "/fonts/Inter-Regular.woff", fontWeight: 400 },
      { src: "/fonts/Inter-Bold.woff", fontWeight: 700 },
      {
        src: "/fonts/Inter-Italic.woff",
        fontWeight: 400,
        fontStyle: "italic",
      },
    ],
  });

  Font.register({
    family: "FiraCode",
    fonts: [
      { src: "/fonts/FiraCode-Regular.woff", fontWeight: 400 },
      { src: "/fonts/FiraCode-Bold.woff", fontWeight: 700 },
    ],
  });

  // Disable hyphenation
  Font.registerHyphenationCallback((word: string) => [word]);
}
