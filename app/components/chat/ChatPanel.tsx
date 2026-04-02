"use client";

import { useChat } from "@ai-sdk/react";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { useState, useCallback } from "react";
import type { UIMessage } from "ai";
import { Wand2, Layout, ShoppingBag, ClipboardList, Globe, Sparkles } from "lucide-react";

interface ChatPanelProps {
  selectedModel: string;
  onCodeGenerated: (code: string, files: { path: string; content: string }[]) => void;
}

const SUGGESTIONS = [
  { icon: Layout, text: "Landing page pentru o cafenea cu meniu și program", gradient: "from-orange-500 to-amber-500" },
  { icon: ClipboardList, text: "Todo app cu categorii și dark mode", gradient: "from-blue-500 to-cyan-500" },
  { icon: ShoppingBag, text: "Pagină de produs e-commerce cu galerie foto", gradient: "from-emerald-500 to-green-500" },
  { icon: Globe, text: "Portfolio personal minimalist cu proiecte", gradient: "from-violet-500 to-purple-500" },
];

function getTextFromMessage(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

const LANG_TO_FILE: Record<string, string> = {
  html: "index.html",
  css: "styles.css",
  javascript: "script.js",
  js: "script.js",
  jsx: "App.jsx",
  tsx: "App.tsx",
  typescript: "App.ts",
  ts: "App.ts",
  json: "package.json",
};

function parseCodeBlocks(content: string): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];
  const regex = /```(\S+)\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const tag = match[1];
    const code = match[2].trim();
    const filename = tag.includes(".") || tag.includes("/") ? tag : LANG_TO_FILE[tag.toLowerCase()];
    if (filename) {
      files.push({ path: filename, content: code });
    }
  }
  return files;
}

export function ChatPanel({ selectedModel, onCodeGenerated }: ChatPanelProps) {
  const [input, setInput] = useState("");

  const { messages, sendMessage, stop, status } = useChat({
    onFinish: useCallback(
      ({ message }: { message: UIMessage }) => {
        if (message.role === "assistant") {
          const text = getTextFromMessage(message);
          const files = parseCodeBlocks(text);
          if (files.length > 0) {
            onCodeGenerated(text, files);
          }
        }
      },
      [onCodeGenerated]
    ),
  });

  const isLoading = status === "streaming" || status === "submitted";

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      sendMessage({ text: input }, { body: { model: selectedModel } });
      setInput("");
    },
    [input, isLoading, sendMessage, selectedModel]
  );

  const handleSuggestion = useCallback(
    (text: string) => {
      if (isLoading) return;
      sendMessage({ text }, { body: { model: selectedModel } });
    },
    [isLoading, sendMessage, selectedModel]
  );

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {isEmpty ? (
        /* ===== EMPTY STATE ===== */
        <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in-up">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow-primary">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>

          <h2 className="text-xl font-bold mb-1">Ce vrei sa construiesti?</h2>
          <p className="text-sm text-muted-foreground mb-8 text-center max-w-[280px]">
            Descrie aplicatia si o generez instant.
          </p>

          <div className="w-full max-w-[320px] space-y-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.text}
                onClick={() => handleSuggestion(s.text)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card/50 hover:bg-accent hover:border-primary/30 transition-all text-left group"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center shrink-0 opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all`}>
                  <s.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-[13px] text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                  {s.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ===== MESSAGES ===== */
        <ChatMessages messages={messages} isLoading={isLoading} />
      )}

      {/* ===== INPUT ===== */}
      <ChatInput
        input={input}
        isLoading={isLoading}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        onStop={stop}
      />
    </div>
  );
}
