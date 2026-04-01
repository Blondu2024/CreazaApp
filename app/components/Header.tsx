"use client";

import { Sparkles, ChevronDown, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useCallback, useState } from "react";

export const MODELS = [
  { id: "google/gemini-2.0-flash-exp", name: "Gemini 2.0 Flash", tier: "free", emoji: "✦" },
  { id: "qwen/qwen3-coder", name: "Qwen3 Coder", tier: "free", emoji: "◆" },
  { id: "deepseek/deepseek-r1", name: "DeepSeek R1", tier: "free", emoji: "◈" },
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", tier: "pro", emoji: "▲" },
  { id: "openai/gpt-4.1", name: "GPT-4.1", tier: "pro", emoji: "●" },
] as const;

interface HeaderProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function Header({ selectedModel, onModelChange }: HeaderProps) {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }, []);

  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  return (
    <header className="h-11 border-b border-border/50 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 shrink-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow-primary-sm">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-bold text-sm">
          <span className="text-gradient">Creaza</span>
          <span className="text-foreground">App</span>
        </span>
        <span className="text-[10px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded">v2</span>
      </div>

      {/* Model Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 h-7 px-3 text-xs text-muted-foreground hover:text-foreground rounded-lg bg-muted/50 hover:bg-muted border border-border/50 transition-all cursor-pointer outline-none">
          <span className="text-primary">{currentModel.emoji}</span>
          <span className="font-medium">{currentModel.name}</span>
          <ChevronDown className="w-3 h-3 opacity-40" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {MODELS.filter((m) => m.tier === "free").map((model) => (
            <DropdownMenuItem
              key={model.id}
              onClick={() => onModelChange(model.id)}
            >
              <span className="flex items-center gap-2 w-full">
                <span className={selectedModel === model.id ? "text-primary" : "opacity-50"}>{model.emoji}</span>
                <span className={selectedModel === model.id ? "font-medium text-foreground" : "text-muted-foreground"}>
                  {model.name}
                </span>
                <span className="ml-auto text-[10px] text-emerald-500">FREE</span>
              </span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {MODELS.filter((m) => m.tier === "pro").map((model) => (
            <DropdownMenuItem
              key={model.id}
              onClick={() => onModelChange(model.id)}
            >
              <span className="flex items-center gap-2 w-full">
                <span className={selectedModel === model.id ? "text-primary" : "opacity-50"}>{model.emoji}</span>
                <span className={selectedModel === model.id ? "font-medium text-foreground" : "text-muted-foreground"}>
                  {model.name}
                </span>
                <span className="ml-auto text-[10px] text-amber-500 font-medium">PRO</span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Theme Toggle */}
      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={toggleTheme}>
        {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      </Button>
    </header>
  );
}
