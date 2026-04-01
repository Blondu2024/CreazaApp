"use client";

import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { oneDark } from "@codemirror/theme-one-dark";

interface CodeEditorProps {
  code: string;
  filename: string;
  onChange?: (code: string) => void;
}

function getLanguage(filename: string) {
  if (filename.match(/\.(jsx?|tsx?)$/)) return javascript({ jsx: true, typescript: filename.includes("ts") });
  if (filename.match(/\.html?$/)) return html();
  if (filename.match(/\.css$/)) return css();
  return javascript({ jsx: true, typescript: true });
}

export function CodeEditor({ code, filename, onChange }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        keymap.of(defaultKeymap),
        getLanguage(filename),
        oneDark,
        EditorView.theme({
          "&": { height: "100%", fontSize: "13px" },
          ".cm-scroller": { overflow: "auto" },
        }),
        ...(onChange
          ? [
              EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                  onChange(update.state.doc.toString());
                }
              }),
            ]
          : [EditorState.readOnly.of(true)]),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
    // Recreate editor when filename changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filename]);

  // Update content when code prop changes
  useEffect(() => {
    const view = viewRef.current;
    if (view && code !== view.state.doc.toString()) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: code,
        },
      });
    }
  }, [code]);

  return (
    <div ref={editorRef} className="h-full w-full overflow-hidden" />
  );
}
