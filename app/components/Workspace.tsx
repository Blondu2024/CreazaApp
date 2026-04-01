"use client";

import { useState, useCallback } from "react";
import { ChatPanel } from "./chat/ChatPanel";
import { CodeEditor } from "./editor/CodeEditor";
import { FileTab } from "./editor/FileTab";
import { Preview } from "./preview/Preview";
import { Terminal } from "./terminal/Terminal";
import { Header } from "./Header";
import { cn } from "@/lib/utils";
import {
  Play,
  TerminalSquare,
  Code2,
  Eye,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Download,
} from "lucide-react";

interface GeneratedFile {
  path: string;
  content: string;
}

type RightTab = "code" | "preview";

export function Workspace() {
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [activeFile, setActiveFile] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("code");
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.0-flash-exp");
  const [chatCollapsed, setChatCollapsed] = useState(false);

  const addLog = useCallback((msg: string) => {
    setTerminalLogs((prev) => [...prev, msg]);
  }, []);

  const handleCodeGenerated = useCallback(
    (_fullContent: string, newFiles: GeneratedFile[]) => {
      setFiles(newFiles);
      if (newFiles.length > 0) setActiveFile(newFiles[0].path);
      setRightTab("code");
      addLog(`[AI] ${newFiles.length} fisier(e) generate`);
    },
    [addLog]
  );

  const handleDeploy = useCallback(async () => {
    if (files.length === 0) return;
    setIsDeploying(true);
    setShowTerminal(true);
    addLog("[E2B] Se creeaza sandbox-ul...");
    try {
      const res1 = await fetch("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      const { sandboxId } = await res1.json();
      addLog(`[E2B] Sandbox: ${sandboxId}`);
      addLog("[E2B] Se scriu fisierele + npm install...");
      const res2 = await fetch("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "write",
          sandboxId,
          files: files.map((f) => ({ path: `/home/user/app/${f.path}`, content: f.content })),
        }),
      });
      const { previewUrl: url, error } = await res2.json();
      if (error) {
        addLog(`[ERR] ${error}`);
      } else {
        addLog(`[OK] ${url}`);
        setPreviewUrl(url);
        setRightTab("preview");
      }
    } catch (err) {
      addLog(`[ERR] ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setIsDeploying(false);
    }
  }, [files, addLog]);

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setFiles((prev) => prev.map((f) => (f.path === activeFile ? { ...f, content: newCode } : f)));
    },
    [activeFile]
  );

  const activeContent = files.find((f) => f.path === activeFile)?.content || "";
  const hasCode = files.length > 0;

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header selectedModel={selectedModel} onModelChange={setSelectedModel} />

      <div className="flex flex-1 min-h-0">
        {/* ===== LEFT: CHAT ===== */}
        <div className={cn(
          "flex flex-col border-r border-border/50 transition-all duration-300 shrink-0",
          chatCollapsed ? "w-0 overflow-hidden border-r-0" : "w-[400px]"
        )}>
          <ChatPanel selectedModel={selectedModel} onCodeGenerated={handleCodeGenerated} />
        </div>

        {/* ===== RIGHT: CODE / PREVIEW ===== */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="h-10 border-b border-border/50 bg-card/30 flex items-center px-1 shrink-0">
            {/* Collapse chat */}
            <button
              onClick={() => setChatCollapsed(!chatCollapsed)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors ml-1"
            >
              {chatCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            <div className="w-px h-5 bg-border/50 mx-1" />

            {/* Tabs */}
            <button
              onClick={() => setRightTab("code")}
              className={cn(
                "flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-lg transition-all mx-0.5",
                rightTab === "code"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <Code2 className="w-3.5 h-3.5" />
              Cod
              {hasCode && (
                <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">{files.length}</span>
              )}
            </button>
            <button
              onClick={() => setRightTab("preview")}
              className={cn(
                "flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-lg transition-all mx-0.5",
                rightTab === "preview"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
              {previewUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
            </button>

            {/* Right side actions */}
            <div className="ml-auto flex items-center gap-1 pr-2">
              <button
                onClick={() => setShowTerminal(!showTerminal)}
                className={cn(
                  "flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs transition-all",
                  showTerminal
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <TerminalSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Terminal</span>
              </button>

              <button
                onClick={handleDeploy}
                disabled={!hasCode || isDeploying}
                className={cn(
                  "flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium transition-all",
                  hasCode && !isDeploying
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/20 glow-primary-sm"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {isDeploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                {isDeploying ? "Ruleaza..." : "Ruleaza"}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0">
            {rightTab === "code" ? (
              <div className="flex flex-col h-full">
                {hasCode && (
                  <div className="border-b border-border/50 bg-card/20">
                    <FileTab files={files} activeFile={activeFile} onSelect={setActiveFile} />
                  </div>
                )}
                {hasCode ? (
                  <div className="flex-1 min-h-0">
                    <CodeEditor code={activeContent} filename={activeFile} onChange={handleCodeChange} />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center animate-fade-in-up">
                    <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4 border border-border/30">
                      <Code2 className="w-7 h-7 text-muted-foreground/20" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Editor de cod</p>
                    <p className="text-[12px] text-muted-foreground/40 mt-1">Codul generat de AI va aparea aici</p>
                  </div>
                )}
              </div>
            ) : (
              <Preview url={previewUrl} isLoading={isDeploying} />
            )}
          </div>

          {/* Terminal */}
          {showTerminal && (
            <div className="h-[180px] border-t border-border/50 shrink-0">
              <Terminal logs={terminalLogs} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
