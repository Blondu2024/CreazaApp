"use client";

import { cn } from "@/lib/utils";

interface FileTabProps {
  files: { path: string; content: string }[];
  activeFile: string;
  onSelect: (path: string) => void;
}

const EXT_COLORS: Record<string, string> = {
  tsx: "text-blue-400",
  ts: "text-blue-400",
  jsx: "text-yellow-400",
  js: "text-yellow-400",
  css: "text-pink-400",
  html: "text-orange-400",
  json: "text-emerald-400",
};

const EXT_DOTS: Record<string, string> = {
  tsx: "bg-blue-400",
  ts: "bg-blue-400",
  jsx: "bg-yellow-400",
  js: "bg-yellow-400",
  css: "bg-pink-400",
  html: "bg-orange-400",
  json: "bg-emerald-400",
};

export function FileTab({ files, activeFile, onSelect }: FileTabProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex items-center overflow-x-auto">
      {files.map((file) => {
        const name = file.path.split("/").pop() || file.path;
        const ext = name.split(".").pop() || "";
        const isActive = file.path === activeFile;

        return (
          <button
            key={file.path}
            onClick={() => onSelect(file.path)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-[12px] font-mono transition-all whitespace-nowrap border-r border-border/30",
              isActive
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
            )}
          >
            <span className={cn("w-2 h-2 rounded-full", isActive ? (EXT_DOTS[ext] || "bg-muted-foreground") : "bg-muted-foreground/30")} />
            {name}
          </button>
        );
      })}
    </div>
  );
}
