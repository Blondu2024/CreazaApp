"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { Bot, Copy, Check } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setOk(true);
    setTimeout(() => setOk(false), 2000);
  }, [text]);
  return (
    <button onClick={copy} className="absolute top-2 right-2 p-1 rounded bg-white/5 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
      {ok ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
    </button>
  );
}

function MessageContent({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const codeRx = /```(\w*)\n([\s\S]*?)```/g;
  let last = 0;
  let match;
  let k = 0;

  while ((match = codeRx.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<InlineText key={k++} text={text.slice(last, match.index)} />);
    }
    const lang = match[1];
    const code = match[2].trim();
    parts.push(
      <div key={k++} className="group relative my-2 animate-fade-in-up">
        {lang && (
          <div className="flex items-center px-3 py-1 bg-[#0d0d14] rounded-t-lg border border-b-0 border-border/30 text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
            {lang}
          </div>
        )}
        <pre className={cn("bg-[#0d0d14] border border-border/30 p-3 overflow-x-auto text-[13px] leading-relaxed font-mono text-[#e2e8f0]", lang ? "rounded-b-lg" : "rounded-lg")}>
          <code>{code}</code>
        </pre>
        <CopyBtn text={code} />
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
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-5">
        {messages.map((message) => {
          const text = getMessageText(message);
          if (!text) return null;
          const isUser = message.role === "user";

          return (
            <div key={message.id} className={cn("flex gap-3 animate-fade-in-up", isUser && "justify-end")}>
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center shrink-0 mt-1 border border-primary/10">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div className={cn("text-sm max-w-[90%]", isUser
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-lg shadow-indigo-500/10"
                : "msg-code text-foreground/90 leading-relaxed"
              )}>
                {isUser ? text : <MessageContent text={text} />}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 animate-fade-in-up">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center shrink-0 border border-primary/10">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex items-center gap-1.5 py-3 dot-pulse">
              <span className="w-2 h-2 rounded-full bg-primary/50" />
              <span className="w-2 h-2 rounded-full bg-primary/50" />
              <span className="w-2 h-2 rounded-full bg-primary/50" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </ScrollArea>
  );
}
