"use client";

import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";

export type MarkdownCodeEditorHandle = {
  insertSyntax: (before: string, after?: string) => void;
  wrapSelection: (before: string, after: string) => void;
  insertLine: (prefix: string) => void;
  getTextarea: () => HTMLTextAreaElement | null;
};

type MarkdownCodeEditorProps = {
  content: string;
  onChange: (markdown: string) => void;
};

export const MarkdownCodeEditor = forwardRef<MarkdownCodeEditorHandle, MarkdownCodeEditorProps>(
  function MarkdownCodeEditor({ content, onChange }, ref) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isInternalChange = useRef(false);

    // sync content from parent
    useEffect(() => {
      if (!textareaRef.current || isInternalChange.current) return;
      if (textareaRef.current.value !== content) {
        textareaRef.current.value = content;
      }
    }, [content]);

    const fireChange = useCallback(() => {
      if (!textareaRef.current) return;
      isInternalChange.current = true;
      onChange(textareaRef.current.value);
      requestAnimationFrame(() => {
        isInternalChange.current = false;
      });
    }, [onChange]);

    useImperativeHandle(ref, () => ({
      getTextarea: () => textareaRef.current,

      // insert text at cursor, replacing selection
      insertSyntax: (before: string, after?: string) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = ta.value.substring(start, end);
        const replacement = after ? `${before}${selected}${after}` : before;
        ta.setRangeText(replacement, start, end, "end");
        ta.focus();
        if (after && !selected) {
          // place cursor between before and after
          ta.selectionStart = ta.selectionEnd = start + before.length;
        }
        fireChange();
      },

      // wrap selected text with before/after
      wrapSelection: (before: string, after: string) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = ta.value.substring(start, end);
        const replacement = `${before}${selected}${after}`;
        ta.setRangeText(replacement, start, end, "end");
        ta.focus();
        if (!selected) {
          ta.selectionStart = ta.selectionEnd = start + before.length;
        }
        fireChange();
      },

      // insert line prefix (for headings, lists, etc.) — operates on the current line
      insertLine: (prefix: string) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const value = ta.value;
        // find start of current line
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const lineEnd = value.indexOf("\n", start);
        const actualEnd = lineEnd === -1 ? value.length : lineEnd;
        const line = value.substring(lineStart, actualEnd);

        // if line already has this prefix, remove it (toggle)
        if (line.startsWith(prefix)) {
          const newLine = line.substring(prefix.length);
          ta.setRangeText(newLine, lineStart, actualEnd, "end");
        } else {
          // remove other heading prefixes if applying a heading
          const stripped = line.replace(/^#{1,6}\s/, "");
          const newLine = prefix + stripped;
          ta.setRangeText(newLine, lineStart, actualEnd, "end");
        }
        ta.focus();
        fireChange();
      },
    }));

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        isInternalChange.current = true;
        onChange(e.target.value);
        requestAnimationFrame(() => {
          isInternalChange.current = false;
        });
      },
      [onChange]
    );

    // handle tab key for indentation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Tab") {
          e.preventDefault();
          const textarea = textareaRef.current;
          if (!textarea) return;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const value = textarea.value;
          textarea.value =
            value.substring(0, start) + "  " + value.substring(end);
          textarea.selectionStart = textarea.selectionEnd = start + 2;
          isInternalChange.current = true;
          onChange(textarea.value);
          requestAnimationFrame(() => {
            isInternalChange.current = false;
          });
        }
      },
      [onChange]
    );

    return (
      <textarea
        ref={textareaRef}
        defaultValue={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="flex-1 w-full h-full resize-none bg-transparent p-4 text-[13px] leading-relaxed focus:outline-none text-foreground"
        style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
        spellCheck={false}
        placeholder="write markdown here..."
      />
    );
  }
);
