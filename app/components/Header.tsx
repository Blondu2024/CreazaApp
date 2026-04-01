"use client";

import { Sparkles, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModelSelector } from "./ModelSelector";
import { useCallback, useState } from "react";

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
      </div>

      {/* Model Selector */}
      <ModelSelector value={selectedModel} onChange={onModelChange} />

      {/* Theme Toggle */}
      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={toggleTheme}>
        {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      </Button>
    </header>
  );
}
