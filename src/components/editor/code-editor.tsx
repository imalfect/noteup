"use client";

import { useCallback, useEffect, useRef } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { EditorView } from "@codemirror/view";
import { useTheme } from "next-themes";

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onViewReady: (view: EditorView) => void;
};

const darkTheme = EditorView.theme(
  {
    "&": { backgroundColor: "transparent" },
    ".cm-gutters": {
      backgroundColor: "transparent",
      borderRight: "1px solid hsl(0 0% 14%)",
      color: "hsl(0 0% 30%)",
    },
    ".cm-activeLineGutter": { backgroundColor: "hsl(0 0% 8%)" },
    ".cm-activeLine": { backgroundColor: "hsl(0 0% 8%)" },
    ".cm-cursor": { borderLeftColor: "hsl(0 0% 93%)" },
    ".cm-selectionBackground": { backgroundColor: "hsl(0 0% 20%) !important" },
    "&.cm-focused .cm-selectionBackground": {
      backgroundColor: "hsl(0 0% 20%) !important",
    },
    ".cm-content": { caretColor: "hsl(0 0% 93%)" },
  },
  { dark: true }
);

const lightTheme = EditorView.theme(
  {
    "&": { backgroundColor: "transparent" },
    ".cm-gutters": {
      backgroundColor: "transparent",
      borderRight: "1px solid hsl(0 0% 86%)",
      color: "hsl(0 0% 60%)",
    },
    ".cm-activeLineGutter": { backgroundColor: "hsl(0 0% 95%)" },
    ".cm-activeLine": { backgroundColor: "hsl(0 0% 95%)" },
    ".cm-cursor": { borderLeftColor: "hsl(0 0% 7%)" },
    ".cm-selectionBackground": { backgroundColor: "hsl(0 0% 85%) !important" },
    "&.cm-focused .cm-selectionBackground": {
      backgroundColor: "hsl(0 0% 85%) !important",
    },
    ".cm-content": { caretColor: "hsl(0 0% 7%)" },
  },
  { dark: false }
);

export function CodeEditor({ value, onChange, onViewReady }: CodeEditorProps) {
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleCreateEditor = useCallback(
    (view: EditorView) => {
      onViewReady(view);
    },
    [onViewReady]
  );

  return (
    <CodeMirror
      ref={editorRef}
      value={value}
      onChange={onChange}
      onCreateEditor={handleCreateEditor}
      extensions={[
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        EditorView.lineWrapping,
      ]}
      theme={isDark ? darkTheme : lightTheme}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        bracketMatching: true,
        autocompletion: false,
      }}
      className="flex-1 overflow-auto"
      height="100%"
    />
  );
}
