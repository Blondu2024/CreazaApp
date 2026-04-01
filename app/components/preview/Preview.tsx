"use client";

import { RefreshCw, ExternalLink, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface PreviewProps {
  url: string | null;
  isLoading: boolean;
}

export function Preview({ url, isLoading }: PreviewProps) {
  const [key, setKey] = useState(0);

  if (!url) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground bg-black/5 dark:bg-white/5">
        <div className="text-center space-y-2">
          <Globe className="w-10 h-10 mx-auto opacity-30" />
          <p className="text-sm">
            {isLoading ? "Se pregătește preview-ul..." : "Preview-ul va apărea aici"}
          </p>
          {isLoading && (
            <RefreshCw className="w-5 h-5 mx-auto animate-spin opacity-50" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/50 text-xs">
        <Globe className="w-3.5 h-3.5 text-green-500" />
        <span className="truncate flex-1 text-muted-foreground">{url}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setKey((k) => k + 1)}
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-accent hover:text-accent-foreground"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <iframe
        key={key}
        src={url}
        className="flex-1 w-full border-0 bg-white"
        title="Preview"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}
