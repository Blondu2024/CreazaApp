"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { Bot, User } from "lucide-react";

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

interface ChatMessagesProps {
  messages: UIMessage[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-3">
          <Bot className="w-12 h-12 mx-auto opacity-50" />
          <div>
            <p className="text-lg font-medium">Salut! Sunt CreazaApp AI</p>
            <p className="text-sm">Descrie ce aplicație vrei și o creez pentru tine.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4 max-w-full">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 text-sm",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <Avatar className="w-7 h-7 bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </Avatar>
            )}
            <div
              className={cn(
                "rounded-lg px-3 py-2 max-w-[85%] whitespace-pre-wrap break-words",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {getMessageText(message)}
            </div>
            {message.role === "user" && (
              <Avatar className="w-7 h-7 bg-blue-600 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-white" />
              </Avatar>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 text-sm">
            <Avatar className="w-7 h-7 bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </Avatar>
            <div className="bg-muted rounded-lg px-3 py-2">
              <span className="animate-pulse">Se generează...</span>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
