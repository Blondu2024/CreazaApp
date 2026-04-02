"use client";

import { RefreshCw, Smartphone, Monitor, Loader2, Globe } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PreviewProps {
  html: string | null;
  isLoading: boolean;
}

export function Preview({ html, isLoading }: PreviewProps) {
  const [key, setKey] = useState(0);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  if (!html) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3 animate-fade-in-up">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto border border-border/30">
            {isLoading
              ? <Loader2 className="w-6 h-6 text-primary animate-spin" />
              : <Globe className="w-6 h-6 text-muted-foreground/30" />
            }
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {isLoading ? "Se genereaza..." : "Live Preview"}
            </p>
            <p className="text-[12px] text-muted-foreground/40 mt-1">
              {isLoading ? "AI-ul scrie codul" : "Apasa Ruleaza dupa ce AI genereaza codul"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-card/50">
        <div className="flex gap-1.5 mr-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 flex items-center gap-1.5 bg-muted/50 rounded-md px-2.5 py-1 text-[11px] border border-border/30">
          <Globe className="w-3 h-3 text-emerald-500 shrink-0" />
          <span className="truncate text-muted-foreground font-mono">preview.creazaapp.local</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setViewport("desktop")}
            className={cn("h-6 w-6 rounded flex items-center justify-center transition-colors", viewport === "desktop" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport("mobile")}
            className={cn("h-6 w-6 rounded flex items-center justify-center transition-colors", viewport === "mobile" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-border/50 mx-0.5" />
          <button onClick={() => setKey((k) => k + 1)} className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {/* iframe with srcdoc — no external URL, no CSP issues */}
      <div className="flex-1 flex items-start justify-center bg-[#1a1a24] overflow-hidden">
        <iframe
          key={key}
          srcDoc={html}
          className={cn(
            "h-full border-0 bg-white transition-all duration-300",
            viewport === "mobile" ? "w-[375px] rounded-xl shadow-2xl shadow-black/40 my-3" : "w-full"
          )}
          title="Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}
