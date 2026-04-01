"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { Bot, User, Copy, Check } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-white/5 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
    </button>
  );
}

function renderMessageContent(text: string) {
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Text before code block
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++} className="whitespace-pre-wrap">
          {renderInlineText(text.slice(lastIndex, match.index))}
        </span>
      );
    }

    const lang = match[1];
    const code = match[2].trim();

    parts.push(
      <div key={key++} className="group relative my-2">
        {lang && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 rounded-t-lg border border-b-0 border-border/50 text-[11px] text-muted-foreground font-mono">
            {lang}
          </div>
        )}
        <pre className={cn(
          "bg-[oklch(0.12_0.01_264)] border border-border/50 p-3 overflow-x-auto text-[13px] leading-relaxed font-mono",
          lang ? "rounded-b-lg" : "rounded-lg"
        )}>
          <code>{code}</code>
        </pre>
        <CopyButton text={code} />
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={key++} className="whitespace-pre-wrap">
        {renderInlineText(text.slice(lastIndex))}
      </span>
    );
  }

  return parts;
}

function renderInlineText(text: string) {
  // Handle inline code with backticks
  const parts: React.ReactNode[] = [];
  const inlineCodeRegex = /`([^`]+)`/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = inlineCodeRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <code key={key++} className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[0.85em] font-mono">
        {match[1]}
      </code>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

interface ChatMessagesProps {
  messages: UIMessage[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return null; // Empty state is handled by ChatPanel
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-4">
        {messages.map((message) => {
          const text = getMessageText(message);
          if (!text) return null;

          return (
            <div key={message.id} className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}>
              {message.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "text-sm max-w-[88%] chat-message",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5"
                    : "text-foreground"
                )}
              >
                {message.role === "user" ? text : renderMessageContent(text)}
              </div>
              {message.role === "user" && (
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex items-center gap-1.5 py-2">
              <span className="typing-dot w-2 h-2 rounded-full bg-primary/60" />
              <span className="typing-dot w-2 h-2 rounded-full bg-primary/60" />
              <span className="typing-dot w-2 h-2 rounded-full bg-primary/60" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
