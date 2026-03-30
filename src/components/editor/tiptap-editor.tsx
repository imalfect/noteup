"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Typography } from "@tiptap/extension-typography";
import { Markdown } from "tiptap-markdown";
import { common, createLowlight } from "lowlight";
import { useEffect, useRef } from "react";

const lowlight = createLowlight(common);

type TiptapEditorProps = {
  content: string;
  onChange: (markdown: string) => void;
  onEditorReady: (editor: Editor) => void;
};

export function TiptapEditor({
  content,
  onChange,
  onEditorReady,
}: TiptapEditorProps) {
  const initialContentRef = useRef(content);
  const isSettingContent = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "underline underline-offset-2" },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({
        placeholder: "start writing...",
      }),
      Typography,
      Markdown.configure({
        html: false,
        transformCopiedText: true,
        transformPastedText: true,
      }),
    ],
    content: initialContentRef.current,
    editorProps: {
      attributes: {
        class: "tiptap-editor outline-none min-h-full",
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (isSettingContent.current) return;
      const md = (ed.storage as Record<string, any>).markdown.getMarkdown();
      onChange(md);
    },
  });

  // notify parent when ready
  useEffect(() => {
    if (editor) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // sync content from parent (e.g. file import)
  useEffect(() => {
    if (!editor) return;
    const currentMd = (editor.storage as Record<string, any>).markdown.getMarkdown();
    if (content !== currentMd) {
      isSettingContent.current = true;
      editor.commands.setContent(content);
      isSettingContent.current = false;
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <EditorContent
      editor={editor}
      className="flex-1 overflow-auto p-4"
    />
  );
}
