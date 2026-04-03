"use client";

import Link from "next/link";
import { Sparkles, Zap } from "lucide-react";
import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";

// Duplicated from page.tsx to avoid circular deps — these are pure functions
function stripCodeBlocks(text: string): string {
  // Remove completed code blocks
  let cleaned = text.replace(/```\S*\n([\s\S]*?)```/g, "");
  // Remove unclosed code block at the end (streaming — cod care se scrie)
  cleaned = cleaned.replace(/```[\s\S]*$/, "");
  return cleaned.replace(/\n{3,}/g, "\n\n").trim();
}

function isWritingCode(text: string): boolean {
  const opens = (text.match(/```/g) || []).length;
  return opens % 2 !== 0;
}

function getTextFromMessage(message: UIMessage): string {
  return message.parts.filter((p): p is { type: "text"; text: string } => p.type === "text").map((p) => p.text).join("");
}

function ChatMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;
  let inList = false;
  let listItems: React.ReactNode[] = [];
  let listType: "ul" | "ol" = "ul";

  const flushList = () => {
    if (listItems.length > 0) {
      if (listType === "ol") {
        elements.push(<ol key={key++} className="list-decimal pl-6 my-2 space-y-1">{listItems}</ol>);
      } else {
        elements.push(<ul key={key++} className="list-disc pl-6 my-2 space-y-1">{listItems}</ul>);
      }
      listItems = [];
      inList = false;
    }
  };

  const renderInline = (str: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const rx = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
    let last = 0;
    let m;
    let k = 0;
    while ((m = rx.exec(str)) !== null) {
      if (m.index > last) parts.push(<span key={k++}>{str.slice(last, m.index)}</span>);
      if (m[2]) parts.push(<strong key={k++} className="text-white font-bold">{m[2]}</strong>);
      else if (m[4]) parts.push(<em key={k++} className="text-[#a78bfa] italic">{m[4]}</em>);
      else if (m[6]) parts.push(<code key={k++} className="bg-[#6366f1]/15 text-[#a78bfa] px-1.5 py-0.5 rounded text-[0.85em] font-mono">{m[6]}</code>);
      else if (m[8]) parts.push(<a key={k++} href={m[9]} target="_blank" rel="noopener noreferrer" className="text-[#818cf8] underline underline-offset-2 hover:text-[#a78bfa]">{m[8]}</a>);
      last = m.index + m[0].length;
    }
    if (last < str.length) parts.push(<span key={k++}>{str.slice(last)}</span>);
    return parts;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("### ")) { flushList(); elements.push(<h3 key={key++} className="text-[1.15em] font-bold text-[#e2e8f0] mt-3 mb-1">{renderInline(trimmed.slice(4))}</h3>); continue; }
    if (trimmed.startsWith("## ")) { flushList(); elements.push(<h2 key={key++} className="text-[1.35em] font-bold text-white mt-4 mb-2">{renderInline(trimmed.slice(3))}</h2>); continue; }
    if (trimmed.startsWith("# ")) { flushList(); elements.push(<h1 key={key++} className="text-[1.6em] font-extrabold text-white mt-4 mb-2">{renderInline(trimmed.slice(2))}</h1>); continue; }
    if (/^[-*_]{3,}$/.test(trimmed)) { flushList(); elements.push(<hr key={key++} className="border-[#6366f1]/20 my-3" />); continue; }
    if (trimmed.startsWith("> ")) { flushList(); elements.push(<blockquote key={key++} className="border-l-3 border-[#6366f1] pl-3 text-[#94a3b8] italic my-2">{renderInline(trimmed.slice(2))}</blockquote>); continue; }

    const ulMatch = trimmed.match(/^[-*]\s+(.*)/);
    const olMatch = trimmed.match(/^\d+\.\s+(.*)/);
    if (ulMatch) { if (!inList || listType !== "ul") { flushList(); inList = true; listType = "ul"; } listItems.push(<li key={key++} className="text-[#e2e8f0]">{renderInline(ulMatch[1])}</li>); continue; }
    if (olMatch) { if (!inList || listType !== "ol") { flushList(); inList = true; listType = "ol"; } listItems.push(<li key={key++} className="text-[#e2e8f0]">{renderInline(olMatch[1])}</li>); continue; }

    flushList();
    if (!trimmed) { elements.push(<div key={key++} className="h-2" />); continue; }
    elements.push(<p key={key++} className="text-[32px] leading-relaxed text-[#e2e8f0]">{renderInline(trimmed)}</p>);
  }
  flushList();
  return <>{elements}</>;
}

interface ChatMessagesProps {
  allChatMessages: { role: string; content: string }[];
  streamingMessages: UIMessage[];
  isLoading: boolean;
  status: string;
  lastCreditCost: number | null;
  error: Error | undefined;
  onSwitchFreeModel: () => void;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessages({
  allChatMessages, streamingMessages, isLoading, status,
  lastCreditCost, error, onSwitchFreeModel, bottomRef,
}: ChatMessagesProps) {
  return (
    <div className="p-3 space-y-3">
      {allChatMessages.map((msg, i) => {
        const isUser = msg.role === "user";
        return (
          <div key={`chat-${i}`} className={cn("rounded-lg p-3 border", isUser ? "bg-[#111118] border-[rgba(30,30,46,0.8)]" : "bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 border-[#6366f1]/30")}>
            {!isUser && (
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#6366f1]" />
                <span className="text-xs font-medium text-[#e2e8f0]">CreazaApp AI</span>
              </div>
            )}
            <div className="chat-markdown text-[#e2e8f0] break-words">
              {isUser
                ? <p className="text-[25px] leading-relaxed">{msg.content}</p>
                : <ChatMarkdown text={stripCodeBlocks(msg.content)} />
              }
            </div>
          </div>
        );
      })}
      {streamingMessages.filter(m => m.role === "assistant").map((msg) => {
        const text = getTextFromMessage(msg);
        if (!text) return null;
        const cleaned = stripCodeBlocks(text);
        const writingCode = isWritingCode(text);
        return (
          <div key={msg.id} className="rounded-lg p-3 border bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 border-[#6366f1]/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#6366f1]" />
              <span className="text-xs font-medium text-[#e2e8f0]">CreazaApp AI</span>
            </div>
            {cleaned && (
              <div className="chat-markdown text-[#e2e8f0] break-words">
                <ChatMarkdown text={cleaned} />
              </div>
            )}
            {writingCode && (
              <div className="flex items-center gap-3 mt-3 py-3 px-4 rounded-lg bg-gradient-to-r from-[#6366f1]/15 to-[#a855f7]/15 border border-[#6366f1]/30">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#6366f1] animate-bounce" style={{ animationDelay: "0ms", animationDuration: "0.8s" }} />
                  <div className="w-2 h-2 rounded-full bg-[#818cf8] animate-bounce" style={{ animationDelay: "150ms", animationDuration: "0.8s" }} />
                  <div className="w-2 h-2 rounded-full bg-[#a855f7] animate-bounce" style={{ animationDelay: "300ms", animationDuration: "0.8s" }} />
                </div>
                <span className="text-sm text-[#a78bfa] font-medium">Se construiește aplicația...</span>
              </div>
            )}
          </div>
        );
      })}
      {isLoading && streamingMessages.filter(m => m.role === "assistant").length === 0 && (
        <div className="rounded-lg p-4 bg-gradient-to-r from-[#6366f1]/15 to-[#a855f7]/15 border border-[#6366f1]/30">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#6366f1] animate-pulse" />
            <span className="text-sm text-[#e2e8f0] font-medium animate-pulse">Se pregătește...</span>
          </div>
        </div>
      )}
      {lastCreditCost !== null && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/20">
          <Zap className="w-3 h-3 text-[#f59e0b]" />
          <span className="text-xs text-[#f59e0b]">{lastCreditCost} credite consumate</span>
          <Link href="/preturi" className="text-xs text-[#6366f1] underline ml-auto">Cumpara credite</Link>
        </div>
      )}
      {error && (
        <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/30">
          {error.message?.includes("429") || error.message?.includes("rate_limit") ? (
            <p className="text-xs text-red-400">Prea multe cereri. Așteaptă câteva secunde și încearcă din nou.</p>
          ) : error.message?.includes("402") || error.message?.includes("insufficient_credits") ? (
            <>
              <p className="text-xs text-red-400">Credite insuficiente.</p>
              <div className="flex gap-3 mt-2">
                <Link href="/preturi" className="text-xs text-[#6366f1] underline">Cumpara credite</Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-red-400">Eroare: {error.message}</p>
              <p className="text-[10px] text-red-400/60 mt-1">Status: {status}</p>
            </>
          )}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
