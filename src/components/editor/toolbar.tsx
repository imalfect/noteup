"use client";

import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link2,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  Table,
  FileDown,
  Undo2,
  Redo2,
  CodeSquare,
} from "lucide-react";
import type { Editor } from "@tiptap/react";

type ToolbarProps = {
  editor: Editor | null;
  onExportPdf: () => void;
};

type ToolItem =
  | "sep"
  | {
      icon: React.ComponentType<{ className?: string }>;
      title: string;
      action: (e: Editor) => void;
      isActive?: (e: Editor) => boolean;
    };

const tools: ToolItem[] = [
  {
    icon: Undo2,
    title: "undo",
    action: (e) => e.chain().focus().undo().run(),
  },
  {
    icon: Redo2,
    title: "redo",
    action: (e) => e.chain().focus().redo().run(),
  },
  "sep",
  {
    icon: Bold,
    title: "bold",
    action: (e) => e.chain().focus().toggleBold().run(),
    isActive: (e) => e.isActive("bold"),
  },
  {
    icon: Italic,
    title: "italic",
    action: (e) => e.chain().focus().toggleItalic().run(),
    isActive: (e) => e.isActive("italic"),
  },
  {
    icon: Strikethrough,
    title: "strikethrough",
    action: (e) => e.chain().focus().toggleStrike().run(),
    isActive: (e) => e.isActive("strike"),
  },
  {
    icon: Code,
    title: "inline code",
    action: (e) => e.chain().focus().toggleCode().run(),
    isActive: (e) => e.isActive("code"),
  },
  "sep",
  {
    icon: Heading1,
    title: "heading 1",
    action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: (e) => e.isActive("heading", { level: 1 }),
  },
  {
    icon: Heading2,
    title: "heading 2",
    action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (e) => e.isActive("heading", { level: 2 }),
  },
  {
    icon: Heading3,
    title: "heading 3",
    action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: (e) => e.isActive("heading", { level: 3 }),
  },
  "sep",
  {
    icon: List,
    title: "bullet list",
    action: (e) => e.chain().focus().toggleBulletList().run(),
    isActive: (e) => e.isActive("bulletList"),
  },
  {
    icon: ListOrdered,
    title: "ordered list",
    action: (e) => e.chain().focus().toggleOrderedList().run(),
    isActive: (e) => e.isActive("orderedList"),
  },
  {
    icon: CheckSquare,
    title: "task list",
    action: (e) => e.chain().focus().toggleTaskList().run(),
    isActive: (e) => e.isActive("taskList"),
  },
  "sep",
  {
    icon: Quote,
    title: "blockquote",
    action: (e) => e.chain().focus().toggleBlockquote().run(),
    isActive: (e) => e.isActive("blockquote"),
  },
  {
    icon: CodeSquare,
    title: "code block",
    action: (e) => e.chain().focus().toggleCodeBlock().run(),
    isActive: (e) => e.isActive("codeBlock"),
  },
  {
    icon: Minus,
    title: "horizontal rule",
    action: (e) => e.chain().focus().setHorizontalRule().run(),
  },
  {
    icon: Link2,
    title: "link",
    action: (e) => {
      const url = window.prompt("url:");
      if (url) {
        e.chain().focus().setLink({ href: url }).run();
      }
    },
    isActive: (e) => e.isActive("link"),
  },
  {
    icon: Table,
    title: "table",
    action: (e) =>
      e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
];

export function Toolbar({ editor, onExportPdf }: ToolbarProps) {
  return (
    <div className="flex items-center gap-0.5 border-b border-border px-2 py-1.5 overflow-x-auto">
      {tools.map((tool, i) =>
        tool === "sep" ? (
          <div key={i} className="w-px h-4 bg-border mx-1" />
        ) : (
          <button
            key={i}
            title={tool.title}
            onClick={() => editor && tool.action(editor)}
            className={`p-1.5 transition-colors ${
              editor && tool.isActive?.(editor)
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tool.icon className="h-3.5 w-3.5" />
          </button>
        )
      )}

      <div className="flex-1" />

      <button
        title="export to pdf"
        onClick={onExportPdf}
        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
      >
        <FileDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
