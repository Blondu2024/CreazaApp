"use client";

import { useChat } from "@ai-sdk/react";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { useState, useCallback } from "react";
import type { UIMessage } from "ai";

interface ChatPanelProps {
  onCodeGenerated: (code: string, files: { path: string; content: string }[]) => void;
}

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

export function ChatPanel({ onCodeGenerated }: ChatPanelProps) {
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

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b">
        <h2 className="text-sm font-semibold">Chat AI</h2>
      </div>
      <ChatMessages messages={messages} isLoading={isLoading} />
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
