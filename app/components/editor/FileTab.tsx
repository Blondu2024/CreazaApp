"use client";

import { cn } from "@/lib/utils";
import { FileCode2, X } from "lucide-react";

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
  json: "text-green-400",
};

function getExtColor(filename: string) {
  const ext = filename.split(".").pop() || "";
  return EXT_COLORS[ext] || "text-muted-foreground";
}

export function FileTab({ files, activeFile, onSelect }: FileTabProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
      {files.map((file) => {
        const name = file.path.split("/").pop() || file.path;
        const isActive = file.path === activeFile;

        return (
          <button
            key={file.path}
            onClick={() => onSelect(file.path)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 transition-all whitespace-nowrap",
              isActive
                ? "border-primary bg-background text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            <FileCode2 className={cn("w-3.5 h-3.5", isActive ? getExtColor(name) : "")} />
            {name}
          </button>
        );
      })}
    </div>
  );
}
