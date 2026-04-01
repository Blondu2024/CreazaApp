"use client";

import { RefreshCw, ExternalLink, Globe, Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PreviewProps {
  url: string | null;
  isLoading: boolean;
}

export function Preview({ url, isLoading }: PreviewProps) {
  const [key, setKey] = useState(0);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  if (!url) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto">
            <Globe className="w-6 h-6 opacity-40" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {isLoading ? "Se pregătește preview-ul..." : "Live Preview"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {isLoading ? "Sandbox E2B se inițializează" : "Apasă \"Rulează\" pentru a vedea rezultatul"}
            </p>
          </div>
          {isLoading && (
            <RefreshCw className="w-5 h-5 mx-auto animate-spin text-primary/50" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
        <div className="flex gap-1.5 mr-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <div className="flex-1 flex items-center gap-1.5 bg-background/50 rounded-md px-2.5 py-1 text-xs">
          <Globe className="w-3 h-3 text-green-500 shrink-0" />
          <span className="truncate text-muted-foreground">{url}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7", viewport === "desktop" && "bg-accent")}
            onClick={() => setViewport("desktop")}
          >
            <Monitor className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7", viewport === "mobile" && "bg-accent")}
            onClick={() => setViewport("mobile")}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setKey((k) => k + 1)}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* iframe */}
      <div className="flex-1 flex items-start justify-center bg-muted/10 overflow-hidden">
        <iframe
          key={key}
          src={url}
          className={cn(
            "h-full border-0 bg-white transition-all duration-300",
            viewport === "mobile" ? "w-[375px] rounded-lg shadow-xl my-2 mx-auto" : "w-full"
          )}
          title="Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}
