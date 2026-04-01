"use client";

import { ArrowUp, Square } from "lucide-react";
import { type FormEvent, useRef, useEffect } from "react";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onStop: () => void;
}

export function ChatInput({ input, isLoading, onInputChange, onSubmit, onStop }: ChatInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  useEffect(() => {
    const el = ref.current;
    if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 140) + "px"; }
  }, [input]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) onSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <div className="p-3">
      <form onSubmit={onSubmit} className="relative">
        <div className="relative rounded-xl border border-border/50 bg-card/80 focus-within:border-primary/40 focus-within:shadow-[0_0_0_1px_rgba(99,102,241,0.15)] transition-all">
          <textarea
            ref={ref}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKey}
            placeholder="Descrie ce vrei sa construiesti..."
            className="w-full bg-transparent text-sm py-3 pl-4 pr-12 resize-none outline-none placeholder:text-muted-foreground/40 max-h-[140px] leading-relaxed"
            rows={1}
          />
          <div className="absolute right-2 bottom-2">
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="h-7 w-7 rounded-lg flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
              >
                <Square className="w-3 h-3" fill="currentColor" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="h-7 w-7 rounded-lg flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white disabled:opacity-20 disabled:from-muted disabled:to-muted hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </form>
      <p className="text-[10px] text-muted-foreground/30 text-center mt-1.5 select-none">
        Enter trimite &middot; Shift+Enter linie noua
      </p>
    </div>
  );
}
