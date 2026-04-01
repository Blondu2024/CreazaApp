"use client";

import { Sparkles, ChevronDown, Moon, Sun, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useCallback, useState } from "react";

const MODELS = [
  { id: "google/gemini-2.0-flash-exp", name: "Gemini 2.0 Flash", tier: "free" },
  { id: "qwen/qwen3-coder", name: "Qwen3 Coder", tier: "free" },
  { id: "deepseek/deepseek-r1", name: "DeepSeek R1", tier: "free" },
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", tier: "pro" },
  { id: "openai/gpt-4.1", name: "GPT-4.1", tier: "pro" },
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
    <header className="h-12 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center glow-blue">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sm tracking-tight">
          <span className="gradient-text">Creaza</span>App
        </span>
      </div>

      {/* Center — Model Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors cursor-pointer outline-none">
          <Zap className="w-3.5 h-3.5 text-primary" />
          {currentModel.name}
          <ChevronDown className="w-3 h-3 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Modele gratuite</DropdownMenuLabel>
          {MODELS.filter((m) => m.tier === "free").map((model) => (
            <DropdownMenuItem
              key={model.id}
              onClick={() => onModelChange(model.id)}
              className="flex items-center justify-between"
            >
              <span className={selectedModel === model.id ? "font-medium" : ""}>{model.name}</span>
              {selectedModel === model.id && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Pro</DropdownMenuLabel>
          {MODELS.filter((m) => m.tier === "pro").map((model) => (
            <DropdownMenuItem
              key={model.id}
              onClick={() => onModelChange(model.id)}
              className="flex items-center justify-between"
            >
              <span className={selectedModel === model.id ? "font-medium" : ""}>{model.name}</span>
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">PRO</Badge>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Right — Theme toggle */}
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </Button>
    </header>
  );
}
