"use client";

import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { Bot, FileCode2 } from "lucide-react";
import { useEffect, useRef } from "react";

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

/* ---- Render doar textul, cod-ul devine un indicator mic ---- */

const LANG_LABELS: Record<string, string> = {
  html: "HTML",
  css: "CSS",
  js: "JavaScript",
  jsx: "React JSX",
  tsx: "React TSX",
  typescript: "TypeScript",
  json: "JSON",
  python: "Python",
};

function MessageContent({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const codeRx = /```(\w*)\n([\s\S]*?)```/g;
  let last = 0;
  let match;
  let k = 0;

  while ((match = codeRx.exec(text)) !== null) {
    // Text before code block
    if (match.index > last) {
      parts.push(<InlineText key={k++} text={text.slice(last, match.index)} />);
    }
    // Collapsed code indicator instead of full code block
    const lang = match[1];
    const label = LANG_LABELS[lang?.toLowerCase()] || lang || "Cod";
    const lineCount = match[2].trim().split("\n").length;
    parts.push(
      <div key={k++} className="flex items-center gap-2 my-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
        <FileCode2 className="w-4 h-4 text-primary/40 shrink-0" />
        <span className="text-sm text-muted-foreground">
          {label} generat &middot; {lineCount} linii
        </span>
      </div>
    );
    last = match.index + match[0].length;
  }

  if (last < text.length) parts.push(<InlineText key={k++} text={text.slice(last)} />);
  return <>{parts}</>;
}

function InlineText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const rx = /`([^`]+)`/g;
  let last = 0;
  let match;
  let k = 0;
  while ((match = rx.exec(text)) !== null) {
    if (match.index > last) parts.push(<span key={k++} className="whitespace-pre-wrap">{text.slice(last, match.index)}</span>);
    parts.push(<code key={k++} className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[0.85em] font-mono">{match[1]}</code>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(<span key={k++} className="whitespace-pre-wrap">{text.slice(last)}</span>);
  return <>{parts}</>;
}

interface ChatMessagesProps {
  messages: UIMessage[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll instant (no smooth = no jitter during streaming)
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading]);

  return (
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
      <div className="p-4 space-y-5">
        {messages.map((message) => {
          const text = getMessageText(message);
          if (!text) return null;
          const isUser = message.role === "user";

          return (
            <div key={message.id} className={cn("flex gap-3", isUser && "justify-end")}>
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center shrink-0 mt-1 border border-primary/10">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={cn("max-w-[85%]", isUser
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-base shadow-lg shadow-indigo-500/10"
                : "text-base text-foreground/90 leading-relaxed"
              )}>
                {isUser ? text : <MessageContent text={text} />}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center shrink-0 border border-primary/10">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex items-center gap-1.5 py-3 dot-pulse">
              <span className="w-2 h-2 rounded-full bg-primary/50" />
              <span className="w-2 h-2 rounded-full bg-primary/50" />
              <span className="w-2 h-2 rounded-full bg-primary/50" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
