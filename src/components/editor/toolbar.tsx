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
  Sigma,
  Eye,
  EyeOff,
  FileDown,
} from "lucide-react";
import type { EditorView } from "@codemirror/view";

type ToolbarProps = {
  editorView: EditorView | null;
  showPreview: boolean;
  onTogglePreview: () => void;
  onExportPdf: () => void;
};

function insertWrap(view: EditorView, before: string, after: string) {
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to);
  view.dispatch({
    changes: { from, to, insert: `${before}${selected || "text"}${after}` },
    selection: {
      anchor: from + before.length,
      head: from + before.length + (selected?.length || 4),
    },
  });
  view.focus();
}

function insertLine(view: EditorView, prefix: string) {
  const { from } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);
  view.dispatch({
    changes: { from: line.from, to: line.from, insert: prefix },
  });
  view.focus();
}

function insertBlock(view: EditorView, text: string) {
  const { from } = view.state.selection.main;
  view.dispatch({
    changes: { from, insert: text },
    selection: { anchor: from + text.length },
  });
  view.focus();
}

const tools = [
  {
    icon: Bold,
    title: "bold",
    action: (v: EditorView) => insertWrap(v, "**", "**"),
  },
  {
    icon: Italic,
    title: "italic",
    action: (v: EditorView) => insertWrap(v, "_", "_"),
  },
  {
    icon: Strikethrough,
    title: "strikethrough",
    action: (v: EditorView) => insertWrap(v, "~~", "~~"),
  },
  {
    icon: Code,
    title: "inline code",
    action: (v: EditorView) => insertWrap(v, "`", "`"),
  },
  "sep" as const,
  {
    icon: Heading1,
    title: "heading 1",
    action: (v: EditorView) => insertLine(v, "# "),
  },
  {
    icon: Heading2,
    title: "heading 2",
    action: (v: EditorView) => insertLine(v, "## "),
  },
  {
    icon: Heading3,
    title: "heading 3",
    action: (v: EditorView) => insertLine(v, "### "),
  },
  "sep" as const,
  {
    icon: List,
    title: "bullet list",
    action: (v: EditorView) => insertLine(v, "- "),
  },
  {
    icon: ListOrdered,
    title: "numbered list",
    action: (v: EditorView) => insertLine(v, "1. "),
  },
  {
    icon: CheckSquare,
    title: "task list",
    action: (v: EditorView) => insertLine(v, "- [ ] "),
  },
  "sep" as const,
  {
    icon: Quote,
    title: "blockquote",
    action: (v: EditorView) => insertLine(v, "> "),
  },
  {
    icon: Minus,
    title: "horizontal rule",
    action: (v: EditorView) => insertBlock(v, "\n---\n"),
  },
  {
    icon: Link2,
    title: "link",
    action: (v: EditorView) => insertWrap(v, "[", "](url)"),
  },
  {
    icon: Table,
    title: "table",
    action: (v: EditorView) =>
      insertBlock(
        v,
        "\n| header | header |\n| ------ | ------ |\n| cell   | cell   |\n"
      ),
  },
  {
    icon: Sigma,
    title: "math block",
    action: (v: EditorView) => insertBlock(v, "\n$$\nE = mc^2\n$$\n"),
  },
];

export function Toolbar({
  editorView,
  showPreview,
  onTogglePreview,
  onExportPdf,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-0.5 border-b border-border px-2 py-1.5 overflow-x-auto">
      {tools.map((tool, i) =>
        tool === "sep" ? (
          <div key={i} className="w-px h-4 bg-border mx-1" />
        ) : (
          <button
            key={i}
            title={tool.title}
            onClick={() => editorView && tool.action(editorView)}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
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

      <button
        title={showPreview ? "hide preview" : "show preview"}
        onClick={onTogglePreview}
        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
      >
        {showPreview ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
