"use client";

import { useChat } from "@ai-sdk/react";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { useState, useCallback } from "react";
import type { UIMessage } from "ai";
import { Sparkles, Layout, ShoppingBag, ClipboardList, Globe } from "lucide-react";

interface ChatPanelProps {
  selectedModel: string;
  onCodeGenerated: (code: string, files: { path: string; content: string }[]) => void;
}

const SUGGESTIONS = [
  { icon: Layout, text: "Landing page pentru o cafenea", color: "text-orange-400" },
  { icon: ClipboardList, text: "Todo app cu React", color: "text-blue-400" },
  { icon: ShoppingBag, text: "Pagină de produs e-commerce", color: "text-green-400" },
  { icon: Globe, text: "Portfolio personal cu dark mode", color: "text-purple-400" },
];

function getTextFromMessage(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function parseCodeBlocks(content: string): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];
  const regex = /```(\S+)\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const filename = match[1];
    const code = match[2].trim();
    if (filename.includes(".") || filename.includes("/")) {
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
      sendMessage({ text: input });
      setInput("");
    },
    [input, isLoading, sendMessage]
  );

  const handleSuggestion = useCallback(
    (text: string) => {
      if (isLoading) return;
      sendMessage({ text });
    },
    [isLoading, sendMessage]
  );

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-medium">Chat</h2>
        {isLoading && (
          <span className="text-[11px] text-primary animate-pulse ml-auto">
            generare...
          </span>
        )}
      </div>

      {/* Messages or empty state */}
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold mb-1">Ce vrei să construiești?</h3>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-[260px]">
            Descrie aplicația și o creez instant cu AI.
          </p>

          <div className="grid grid-cols-1 gap-2 w-full max-w-[280px]">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.text}
                onClick={() => handleSuggestion(s.text)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border bg-card/50 hover:bg-accent hover:border-primary/20 transition-all text-left text-sm group"
              >
                <s.icon className={`w-4 h-4 ${s.color} shrink-0 group-hover:scale-110 transition-transform`} />
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">{s.text}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ChatMessages messages={messages} isLoading={isLoading} />
      )}

      {/* Input */}
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
