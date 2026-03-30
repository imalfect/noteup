"use client";

import { useEffect, useRef, useState } from "react";
import type { MarkdownCodeEditorHandle } from "./markdown-code-editor";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Copy,
  Scissors,
  Clipboard,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link2,
  Trash2,
} from "lucide-react";

type ContextMenuProps = {
  codeEditorRef: React.RefObject<MarkdownCodeEditorHandle | null>;
};

type MenuItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  show?: boolean;
};

type MenuSection = MenuItem[];

export function EditorContextMenu({ codeEditorRef }: ContextMenuProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("textarea")) return;

      e.preventDefault();
      const ta = codeEditorRef.current?.getTextarea();
      setHasSelection(!!ta && ta.selectionStart !== ta.selectionEnd);
      setPos({ x: e.clientX, y: e.clientY });
    };

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPos(null);
      }
    };

    const handleScroll = () => setPos(null);

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("click", handleClick);
    document.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [codeEditorRef]);

  if (!pos) return null;

  const h = codeEditorRef.current;
  if (!h) return null;

  const close = () => setPos(null);

  const run = (fn: () => void) => {
    fn();
    close();
  };

  const selectionItems: MenuSection = [
    {
      label: "cut",
      icon: Scissors,
      action: () => run(() => document.execCommand("cut")),
      show: hasSelection,
    },
    {
      label: "copy",
      icon: Copy,
      action: () => run(() => document.execCommand("copy")),
      show: hasSelection,
    },
    {
      label: "paste",
      icon: Clipboard,
      action: () => run(() => document.execCommand("paste")),
    },
  ].filter((i) => i.show !== false);

  const formatItems: MenuSection = hasSelection
    ? [
        {
          label: "bold",
          icon: Bold,
          action: () => run(() => h.wrapSelection("**", "**")),
        },
        {
          label: "italic",
          icon: Italic,
          action: () => run(() => h.wrapSelection("*", "*")),
        },
        {
          label: "strikethrough",
          icon: Strikethrough,
          action: () => run(() => h.wrapSelection("~~", "~~")),
        },
        {
          label: "code",
          icon: Code,
          action: () => run(() => h.wrapSelection("`", "`")),
        },
        {
          label: "link",
          icon: Link2,
          action: () =>
            run(() => {
              const url = window.prompt("url:");
              if (url) h.wrapSelection("[", `](${url})`);
            }),
        },
      ]
    : [];

  const blockItems: MenuSection = [
    {
      label: "heading 1",
      icon: Heading1,
      action: () => run(() => h.insertLine("# ")),
    },
    {
      label: "heading 2",
      icon: Heading2,
      action: () => run(() => h.insertLine("## ")),
    },
    {
      label: "bullet list",
      icon: List,
      action: () => run(() => h.insertLine("- ")),
    },
    {
      label: "ordered list",
      icon: ListOrdered,
      action: () => run(() => h.insertLine("1. ")),
    },
    {
      label: "blockquote",
      icon: Quote,
      action: () => run(() => h.insertLine("> ")),
    },
  ];

  const deleteItems: MenuSection = hasSelection
    ? [
        {
          label: "delete",
          icon: Trash2,
          action: () =>
            run(() => {
              const ta = h.getTextarea();
              if (ta) {
                ta.setRangeText("", ta.selectionStart, ta.selectionEnd, "end");
                ta.dispatchEvent(new Event("input", { bubbles: true }));
              }
            }),
        },
      ]
    : [];

  const sections = [selectionItems, formatItems, blockItems, deleteItems].filter(
    (s) => s.length > 0
  );

  const menuWidth = 180;
  const menuHeight = sections.reduce(
    (acc, s) => acc + s.length * 28 + (acc > 0 ? 8 : 0),
    8
  );
  const x = Math.min(pos.x, window.innerWidth - menuWidth - 8);
  const y = Math.min(pos.y, window.innerHeight - menuHeight - 8);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 border border-border bg-card py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      {sections.map((section, si) => (
        <div key={si}>
          {si > 0 && <div className="h-px bg-border my-1" />}
          {section.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full flex items-center gap-2 px-3 py-1 font-mono text-xs text-foreground hover:bg-accent transition-colors text-left"
            >
              <item.icon className="h-3 w-3 text-muted-foreground" />
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
