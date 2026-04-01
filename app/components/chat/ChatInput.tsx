"use client";

import { Button } from "@/components/ui/button";
import { ArrowUp, Square } from "lucide-react";
import { type FormEvent, useRef, useEffect } from "react";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onStop: () => void;
}

export function ChatInput({
  input,
  isLoading,
  onInputChange,
  onSubmit,
  onStop,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + "px";
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSubmit(e as unknown as FormEvent);
      }
    }
  };

  return (
    <form onSubmit={onSubmit} className="p-3 pt-0">
      <div className="relative flex items-end rounded-xl border bg-card/50 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Descrie aplicația pe care vrei să o creez..."
          className="flex-1 bg-transparent text-sm py-3 px-4 pr-12 resize-none outline-none placeholder:text-muted-foreground/50 max-h-[150px]"
          rows={1}
        />
        <div className="absolute right-2 bottom-2">
          {isLoading ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onStop}
              className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive"
            >
              <Square className="w-3.5 h-3.5" fill="currentColor" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className="h-7 w-7 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-30 disabled:bg-muted"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground/40 text-center mt-2">
        Enter pentru a trimite &middot; Shift+Enter pentru linie nouă
      </p>
    </form>
  );
}
