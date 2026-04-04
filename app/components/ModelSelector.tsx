"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const POPULAR_MODELS = [
  // Free models (verified working on OpenRouter)
  { id: "qwen/qwen3.6-plus-preview:free", name: "Qwen 3.6 Plus", tag: "FREE" },
  { id: "qwen/qwen3-coder:free", name: "Qwen3 Coder", tag: "FREE" },
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B", tag: "FREE" },
  { id: "qwen/qwen3-next-80b-a3b-instruct:free", name: "Qwen3 Next 80B", tag: "FREE" },
  { id: "nousresearch/hermes-3-llama-3.1-405b:free", name: "Hermes 3 405B", tag: "FREE" },
  { id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free", name: "Dolphin Mistral 24B", tag: "FREE" },
  // Premium (Ultra)
  { id: "anthropic/claude-opus-4.6", name: "Claude Opus 4.6", tag: "$$$" },
  { id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6", tag: "$$" },
  { id: "openai/gpt-5.4", name: "GPT-5.4", tag: "$$$" },
  // Pro
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", tag: "$$" },
  { id: "anthropic/claude-sonnet-4.5", name: "Claude Sonnet 4.5", tag: "$$" },
  { id: "openai/gpt-5.3-codex", name: "GPT-5.3 Codex", tag: "$$" },
  { id: "openai/gpt-4.1", name: "GPT-4.1", tag: "$$" },
  { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5", tag: "$" },
  { id: "google/gemini-2.5-pro-preview", name: "Gemini 2.5 Pro", tag: "$" },
  { id: "deepseek/deepseek-r1", name: "DeepSeek R1", tag: "$" },
];

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customInput, setCustomInput] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const displayName = POPULAR_MODELS.find((m) => m.id === value)?.name || value;

  const filtered = POPULAR_MODELS.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setSearch("");
    setCustomInput(false);
  };

  const handleCustomSubmit = () => {
    if (search.trim() && search.includes("/")) {
      onChange(search.trim());
      setOpen(false);
      setSearch("");
      setCustomInput(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 h-7 px-3 text-xs text-muted-foreground hover:text-foreground rounded-lg bg-muted/50 hover:bg-muted border border-border/50 transition-all cursor-pointer"
      >
        <Sparkles className="w-3 h-3 text-primary" />
        <span className="font-medium max-w-[180px] truncate">{displayName}</span>
        <ChevronDown className={cn("w-3 h-3 opacity-40 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 w-[320px] bg-popover border border-border/50 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden animate-fade-in-up">
          {/* Search */}
          <div className="p-2 border-b border-border/50">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/50 rounded-lg">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCustomInput(e.target.value.includes("/"));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customInput) handleCustomSubmit();
                }}
                placeholder="Cauta model sau scrie ID (ex: google/gemini-2.0-flash-exp)"
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          {/* Models list */}
          <div className="max-h-[280px] overflow-y-auto p-1">
            {filtered.map((model) => (
              <button
                key={model.id}
                onClick={() => handleSelect(model.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-accent transition-colors text-left"
              >
                <span className={cn(
                  "w-4 h-4 rounded flex items-center justify-center shrink-0",
                  value === model.id ? "text-primary" : "text-transparent"
                )}>
                  <Check className="w-3 h-3" />
                </span>
                <span className={cn("flex-1", value === model.id ? "text-foreground font-medium" : "text-muted-foreground")}>
                  {model.name}
                </span>
                <span className="text-[10px] text-muted-foreground/60 font-mono">{model.id.split("/")[0]}</span>
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded",
                  model.tag === "FREE" ? "text-emerald-400 bg-emerald-500/10" :
                  model.tag === "$" ? "text-amber-400 bg-amber-500/10" :
                  "text-red-400 bg-red-500/10"
                )}>
                  {model.tag}
                </span>
              </button>
            ))}

            {/* Custom model input hint */}
            {search && filtered.length === 0 && (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-muted-foreground">
                  {search.includes("/") ? (
                    <>
                      Apasa <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Enter</kbd> pentru a folosi: <span className="text-primary font-mono">{search}</span>
                    </>
                  ) : (
                    "Scrie ID-ul complet: provider/model-name"
                  )}
                </p>
              </div>
            )}

            {customInput && filtered.length > 0 && search.includes("/") && (
              <button
                onClick={handleCustomSubmit}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-accent transition-colors text-left border-t border-border/30 mt-1"
              >
                <span className="w-4 h-4" />
                <span className="text-primary font-mono">{search}</span>
                <span className="ml-auto text-muted-foreground/40">custom</span>
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-border/50 bg-muted/20">
            <p className="text-[10px] text-muted-foreground/40">
              Orice model de pe openrouter.ai/models functioneaza
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
