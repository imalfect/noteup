"use client";

import { Command } from "cmdk";
import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
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
  CodeSquare,
  Undo2,
  Redo2,
  FileDown,
  Sigma,
  Upload,
  Save,
  Eye,
  Copy,
  Scissors,
  Clipboard,
  Sun,
  Moon,
  Settings,
} from "lucide-react";
import { useTheme } from "next-themes";

type CommandItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string;
  action: () => void;
  group: string;
};

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  editor: Editor | null;
  onExportPdf: () => void;
  onOpenMath: () => void;
  onImport: () => void;
  onSaveDraft: () => void;
  onTogglePreview: () => void;
  onPublish: () => void;
  onOpenSettings: () => void;
};

export function CommandPalette({
  open,
  onClose,
  editor,
  onExportPdf,
  onOpenMath,
  onImport,
  onSaveDraft,
  onTogglePreview,
  onPublish,
  onOpenSettings,
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  if (!open) return null;

  const items: CommandItem[] = [
    // formatting
    {
      id: "bold",
      label: "bold",
      icon: Bold,
      keywords: "strong",
      action: () => editor?.chain().focus().toggleBold().run(),
      group: "formatting",
    },
    {
      id: "italic",
      label: "italic",
      icon: Italic,
      keywords: "emphasis",
      action: () => editor?.chain().focus().toggleItalic().run(),
      group: "formatting",
    },
    {
      id: "strikethrough",
      label: "strikethrough",
      icon: Strikethrough,
      keywords: "strike delete",
      action: () => editor?.chain().focus().toggleStrike().run(),
      group: "formatting",
    },
    {
      id: "inline-code",
      label: "inline code",
      icon: Code,
      keywords: "monospace",
      action: () => editor?.chain().focus().toggleCode().run(),
      group: "formatting",
    },
    // blocks
    {
      id: "heading-1",
      label: "heading 1",
      icon: Heading1,
      keywords: "h1 title",
      action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
      group: "blocks",
    },
    {
      id: "heading-2",
      label: "heading 2",
      icon: Heading2,
      keywords: "h2",
      action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      group: "blocks",
    },
    {
      id: "heading-3",
      label: "heading 3",
      icon: Heading3,
      keywords: "h3",
      action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
      group: "blocks",
    },
    {
      id: "bullet-list",
      label: "bullet list",
      icon: List,
      keywords: "unordered ul",
      action: () => editor?.chain().focus().toggleBulletList().run(),
      group: "blocks",
    },
    {
      id: "ordered-list",
      label: "ordered list",
      icon: ListOrdered,
      keywords: "numbered ol",
      action: () => editor?.chain().focus().toggleOrderedList().run(),
      group: "blocks",
    },
    {
      id: "task-list",
      label: "task list",
      icon: CheckSquare,
      keywords: "todo checkbox",
      action: () => editor?.chain().focus().toggleTaskList().run(),
      group: "blocks",
    },
    {
      id: "blockquote",
      label: "blockquote",
      icon: Quote,
      keywords: "quote",
      action: () => editor?.chain().focus().toggleBlockquote().run(),
      group: "blocks",
    },
    {
      id: "code-block",
      label: "code block",
      icon: CodeSquare,
      keywords: "fence pre",
      action: () => editor?.chain().focus().toggleCodeBlock().run(),
      group: "blocks",
    },
    {
      id: "horizontal-rule",
      label: "horizontal rule",
      icon: Minus,
      keywords: "hr divider line",
      action: () => editor?.chain().focus().setHorizontalRule().run(),
      group: "blocks",
    },
    {
      id: "link",
      label: "insert link",
      icon: Link2,
      keywords: "url href",
      action: () => {
        const url = window.prompt("url:");
        if (url) editor?.chain().focus().setLink({ href: url }).run();
      },
      group: "blocks",
    },
    {
      id: "table",
      label: "insert table",
      icon: Table,
      keywords: "grid",
      action: () =>
        editor
          ?.chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
      group: "blocks",
    },
    {
      id: "math",
      label: "math formula",
      icon: Sigma,
      keywords: "latex katex equation",
      action: onOpenMath,
      group: "blocks",
    },
    // edit
    {
      id: "undo",
      label: "undo",
      icon: Undo2,
      keywords: "back",
      action: () => editor?.chain().focus().undo().run(),
      group: "edit",
    },
    {
      id: "redo",
      label: "redo",
      icon: Redo2,
      keywords: "forward",
      action: () => editor?.chain().focus().redo().run(),
      group: "edit",
    },
    {
      id: "copy",
      label: "copy",
      icon: Copy,
      action: () => document.execCommand("copy"),
      group: "edit",
    },
    {
      id: "cut",
      label: "cut",
      icon: Scissors,
      action: () => document.execCommand("cut"),
      group: "edit",
    },
    {
      id: "paste",
      label: "paste",
      icon: Clipboard,
      action: () => document.execCommand("paste"),
      group: "edit",
    },
    // actions
    {
      id: "publish",
      label: "publish note",
      icon: Upload,
      keywords: "share upload",
      action: onPublish,
      group: "actions",
    },
    {
      id: "save",
      label: "save draft",
      icon: Save,
      keywords: "store",
      action: onSaveDraft,
      group: "actions",
    },
    {
      id: "import",
      label: "import markdown file",
      icon: Upload,
      keywords: "open file",
      action: onImport,
      group: "actions",
    },
    {
      id: "export-pdf",
      label: "export to pdf",
      icon: FileDown,
      keywords: "download print",
      action: onExportPdf,
      group: "actions",
    },
    {
      id: "preview",
      label: "toggle markdown preview",
      icon: Eye,
      keywords: "split",
      action: onTogglePreview,
      group: "actions",
    },
    {
      id: "settings",
      label: "settings",
      icon: Settings,
      keywords: "config preferences scale",
      action: onOpenSettings,
      group: "actions",
    },
    {
      id: "toggle-theme",
      label: theme === "dark" ? "switch to light theme" : "switch to dark theme",
      icon: theme === "dark" ? Sun : Moon,
      keywords: "dark light mode",
      action: () => setTheme(theme === "dark" ? "light" : "dark"),
      group: "actions",
    },
  ];

  const handleSelect = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      onClose();
      // slight delay so dialog closes first
      requestAnimationFrame(() => item.action());
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg">
        <Command
          className="border border-border bg-card overflow-hidden"
          shouldFilter={true}
        >
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="type a command..."
            className="w-full bg-transparent border-b border-border p-3 font-mono text-xs focus:outline-none placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
            }}
            autoFocus
          />
          <Command.List className="max-h-72 overflow-y-auto p-1">
            <Command.Empty className="p-4 font-mono text-xs text-muted-foreground text-center">
              no results
            </Command.Empty>

            <Command.Group
              heading="formatting"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:font-semibold"
            >
              {items
                .filter((i) => i.group === "formatting")
                .map((item) => (
                  <Command.Item
                    key={item.id}
                    value={`${item.label} ${item.keywords || ""}`}
                    onSelect={() => handleSelect(item.id)}
                    className="flex items-center gap-2 px-2 py-1.5 font-mono text-xs cursor-pointer data-[selected=true]:bg-accent transition-colors"
                  >
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {item.label}
                  </Command.Item>
                ))}
            </Command.Group>

            <Command.Group
              heading="blocks"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:font-semibold"
            >
              {items
                .filter((i) => i.group === "blocks")
                .map((item) => (
                  <Command.Item
                    key={item.id}
                    value={`${item.label} ${item.keywords || ""}`}
                    onSelect={() => handleSelect(item.id)}
                    className="flex items-center gap-2 px-2 py-1.5 font-mono text-xs cursor-pointer data-[selected=true]:bg-accent transition-colors"
                  >
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {item.label}
                  </Command.Item>
                ))}
            </Command.Group>

            <Command.Group
              heading="edit"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:font-semibold"
            >
              {items
                .filter((i) => i.group === "edit")
                .map((item) => (
                  <Command.Item
                    key={item.id}
                    value={`${item.label} ${item.keywords || ""}`}
                    onSelect={() => handleSelect(item.id)}
                    className="flex items-center gap-2 px-2 py-1.5 font-mono text-xs cursor-pointer data-[selected=true]:bg-accent transition-colors"
                  >
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {item.label}
                  </Command.Item>
                ))}
            </Command.Group>

            <Command.Group
              heading="actions"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:font-semibold"
            >
              {items
                .filter((i) => i.group === "actions")
                .map((item) => (
                  <Command.Item
                    key={item.id}
                    value={`${item.label} ${item.keywords || ""}`}
                    onSelect={() => handleSelect(item.id)}
                    className="flex items-center gap-2 px-2 py-1.5 font-mono text-xs cursor-pointer data-[selected=true]:bg-accent transition-colors"
                  >
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {item.label}
                  </Command.Item>
                ))}
            </Command.Group>
          </Command.List>

          <div className="border-t border-border px-3 py-1.5 font-mono text-xs text-muted-foreground flex gap-3">
            <span>ctrl+k to open</span>
            <span>esc to close</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
