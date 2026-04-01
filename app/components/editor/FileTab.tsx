"use client";

import { cn } from "@/lib/utils";
import { X, FileCode } from "lucide-react";

interface FileTabProps {
  files: { path: string; content: string }[];
  activeFile: string;
  onSelect: (path: string) => void;
}

export function FileTab({ files, activeFile, onSelect }: FileTabProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5 border-b bg-muted/30 overflow-x-auto">
      {files.map((file) => {
        const name = file.path.split("/").pop() || file.path;
        const isActive = file.path === activeFile;

        return (
          <button
            key={file.path}
            onClick={() => onSelect(file.path)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs border-b-2 transition-colors whitespace-nowrap",
              isActive
                ? "border-primary bg-background text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <FileCode className="w-3 h-3" />
            {name}
          </button>
        );
      })}
    </div>
  );
}
