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
import type { MarkdownCodeEditorHandle } from "./markdown-code-editor";
import { Tooltip } from "@/components/ui/tooltip";

type ToolbarProps = {
  codeEditorRef: React.RefObject<MarkdownCodeEditorHandle | null>;
  onExportPdf: () => void;
};

type ToolItem =
  | "sep"
  | {
      icon: React.ComponentType<{ className?: string }>;
      title: string;
      action: (h: MarkdownCodeEditorHandle) => void;
    };

const tools: ToolItem[] = [
  {
    icon: Undo2,
    title: "undo",
    action: (h) => {
      const ta = h.getTextarea();
      if (ta) {
        ta.focus();
        document.execCommand("undo");
      }
    },
  },
  {
    icon: Redo2,
    title: "redo",
    action: (h) => {
      const ta = h.getTextarea();
      if (ta) {
        ta.focus();
        document.execCommand("redo");
      }
    },
  },
  "sep",
  {
    icon: Bold,
    title: "bold",
    action: (h) => h.wrapSelection("**", "**"),
  },
  {
    icon: Italic,
    title: "italic",
    action: (h) => h.wrapSelection("*", "*"),
  },
  {
    icon: Strikethrough,
    title: "strikethrough",
    action: (h) => h.wrapSelection("~~", "~~"),
  },
  {
    icon: Code,
    title: "inline code",
    action: (h) => h.wrapSelection("`", "`"),
  },
  "sep",
  {
    icon: Heading1,
    title: "heading 1",
    action: (h) => h.insertLine("# "),
  },
  {
    icon: Heading2,
    title: "heading 2",
    action: (h) => h.insertLine("## "),
  },
  {
    icon: Heading3,
    title: "heading 3",
    action: (h) => h.insertLine("### "),
  },
  "sep",
  {
    icon: List,
    title: "bullet list",
    action: (h) => h.insertLine("- "),
  },
  {
    icon: ListOrdered,
    title: "ordered list",
    action: (h) => h.insertLine("1. "),
  },
  {
    icon: CheckSquare,
    title: "task list",
    action: (h) => h.insertLine("- [ ] "),
  },
  "sep",
  {
    icon: Quote,
    title: "blockquote",
    action: (h) => h.insertLine("> "),
  },
  {
    icon: CodeSquare,
    title: "code block",
    action: (h) => h.insertSyntax("\n```\n", "\n```\n"),
  },
  {
    icon: Minus,
    title: "horizontal rule",
    action: (h) => h.insertSyntax("\n---\n"),
  },
  {
    icon: Link2,
    title: "link",
    action: (h) => {
      const url = window.prompt("url:");
      if (url) {
        h.wrapSelection("[", `](${url})`);
      }
    },
  },
  {
    icon: Table,
    title: "table",
    action: (h) =>
      h.insertSyntax(
        "\n| Header | Header | Header |\n| --- | --- | --- |\n| Cell | Cell | Cell |\n| Cell | Cell | Cell |\n| Cell | Cell | Cell |\n"
      ),
  },
];

export function Toolbar({ codeEditorRef, onExportPdf }: ToolbarProps) {
  return (
    <div className="flex items-center gap-0.5 border-b border-border px-2 py-1.5 overflow-x-auto">
      {tools.map((tool, i) =>
        tool === "sep" ? (
          <div key={i} className="w-px h-4 bg-border mx-1" />
        ) : (
          <Tooltip key={i} content={tool.title}>
            <button
              onClick={() => {
                const handle = codeEditorRef.current;
                if (handle) tool.action(handle);
              }}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <tool.icon className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        )
      )}

      <div className="flex-1" />

      <Tooltip content="export to pdf">
        <button
          onClick={onExportPdf}
          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <FileDown className="h-3.5 w-3.5" />
        </button>
      </Tooltip>
    </div>
  );
}
