"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
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
  editor: Editor | null;
};

type MenuItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  show?: boolean;
};

type MenuSection = MenuItem[];

export function EditorContextMenu({ editor }: ContextMenuProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // only intercept right-click inside the tiptap editor
      const target = e.target as HTMLElement;
      if (!target.closest(".tiptap-editor")) return;

      e.preventDefault();
      const sel = window.getSelection();
      setHasSelection(!!sel && sel.toString().length > 0);
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
  }, []);

  if (!pos || !editor) return null;

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
          action: () => run(() => editor.chain().focus().toggleBold().run()),
        },
        {
          label: "italic",
          icon: Italic,
          action: () => run(() => editor.chain().focus().toggleItalic().run()),
        },
        {
          label: "strikethrough",
          icon: Strikethrough,
          action: () => run(() => editor.chain().focus().toggleStrike().run()),
        },
        {
          label: "code",
          icon: Code,
          action: () => run(() => editor.chain().focus().toggleCode().run()),
        },
        {
          label: "link",
          icon: Link2,
          action: () =>
            run(() => {
              const url = window.prompt("url:");
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }),
        },
      ]
    : [];

  const blockItems: MenuSection = [
    {
      label: "heading 1",
      icon: Heading1,
      action: () =>
        run(() => editor.chain().focus().toggleHeading({ level: 1 }).run()),
    },
    {
      label: "heading 2",
      icon: Heading2,
      action: () =>
        run(() => editor.chain().focus().toggleHeading({ level: 2 }).run()),
    },
    {
      label: "bullet list",
      icon: List,
      action: () =>
        run(() => editor.chain().focus().toggleBulletList().run()),
    },
    {
      label: "ordered list",
      icon: ListOrdered,
      action: () =>
        run(() => editor.chain().focus().toggleOrderedList().run()),
    },
    {
      label: "blockquote",
      icon: Quote,
      action: () =>
        run(() => editor.chain().focus().toggleBlockquote().run()),
    },
  ];

  const deleteItems: MenuSection = hasSelection
    ? [
        {
          label: "delete",
          icon: Trash2,
          action: () => run(() => editor.chain().focus().deleteSelection().run()),
        },
      ]
    : [];

  const sections = [selectionItems, formatItems, blockItems, deleteItems].filter(
    (s) => s.length > 0
  );

  // adjust position to stay in viewport
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
