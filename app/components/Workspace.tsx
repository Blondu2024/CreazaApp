"use client";

import { useState, useCallback } from "react";
import { ChatPanel } from "./chat/ChatPanel";
import { CodeEditor } from "./editor/CodeEditor";
import { FileTab } from "./editor/FileTab";
import { Preview } from "./preview/Preview";
import { Terminal } from "./terminal/Terminal";
import { Header } from "./Header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Play,
  TerminalSquare,
  Code2,
  Eye,
  Loader2,
  Maximize2,
  Minimize2,
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
  const [chatExpanded, setChatExpanded] = useState(false);

  const addLog = useCallback((msg: string) => {
    setTerminalLogs((prev) => [...prev, msg]);
  }, []);

  const handleCodeGenerated = useCallback(
    (_fullContent: string, newFiles: GeneratedFile[]) => {
      setFiles(newFiles);
      if (newFiles.length > 0) {
        setActiveFile(newFiles[0].path);
      }
      setRightTab("code");
      addLog(`[AI] ${newFiles.length} fișier(e) generate`);
    },
    [addLog]
  );

  const handleDeploy = useCallback(async () => {
    if (files.length === 0) return;

    setIsDeploying(true);
    setShowTerminal(true);
    addLog("[E2B] Se creează sandbox-ul...");

    try {
      const createRes = await fetch("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      const { sandboxId } = await createRes.json();
      addLog(`[E2B] Sandbox: ${sandboxId}`);

      addLog("[E2B] Se scriu fișierele + npm install...");
      const writeRes = await fetch("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "write",
          sandboxId,
          files: files.map((f) => ({
            path: `/home/user/app/${f.path}`,
            content: f.content,
          })),
        }),
      });
      const { previewUrl: url, error } = await writeRes.json();

      if (error) {
        addLog(`[ERR] ${error}`);
      } else {
        addLog(`[OK] Preview: ${url}`);
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
      setFiles((prev) =>
        prev.map((f) =>
          f.path === activeFile ? { ...f, content: newCode } : f
        )
      );
    },
    [activeFile]
  );

  const activeContent = files.find((f) => f.path === activeFile)?.content || "";
  const hasCode = files.length > 0;

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header selectedModel={selectedModel} onModelChange={setSelectedModel} />

      <div className="flex flex-1 min-h-0">
        {/* Left — Chat */}
        <div
          className={cn(
            "border-r panel-border flex flex-col transition-all duration-300",
            chatExpanded ? "w-[600px]" : "w-[380px] min-w-[340px]"
          )}
        >
          <ChatPanel selectedModel={selectedModel} onCodeGenerated={handleCodeGenerated} />
        </div>

        {/* Right — Code/Preview + Terminal */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab bar */}
          <div className="h-10 border-b bg-card/30 flex items-center justify-between px-1">
            <div className="flex items-center">
              <button
                onClick={() => setRightTab("code")}
                className={cn(
                  "flex items-center gap-1.5 px-3 h-10 text-xs font-medium transition-colors border-b-2",
                  rightTab === "code"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Code2 className="w-3.5 h-3.5" />
                Cod
                {hasCode && (
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]">
                    {files.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setRightTab("preview")}
                className={cn(
                  "flex items-center gap-1.5 px-3 h-10 text-xs font-medium transition-colors border-b-2",
                  rightTab === "preview"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
                {previewUrl && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-1 pr-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChatExpanded(!chatExpanded)}
                className="h-7 w-7 p-0"
              >
                {chatExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTerminal(!showTerminal)}
                className={cn("h-7 text-xs gap-1.5", showTerminal && "bg-accent")}
              >
                <TerminalSquare className="w-3.5 h-3.5" />
                Terminal
              </Button>
              <Button
                size="sm"
                onClick={handleDeploy}
                disabled={!hasCode || isDeploying}
                className="h-7 text-xs gap-1.5 glow-blue"
              >
                {isDeploying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                {isDeploying ? "Se rulează..." : "Rulează"}
              </Button>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 min-h-0">
            {rightTab === "code" ? (
              <div className="flex flex-col h-full">
                {hasCode && (
                  <div className="border-b bg-muted/20">
                    <FileTab files={files} activeFile={activeFile} onSelect={setActiveFile} />
                  </div>
                )}
                {hasCode ? (
                  <div className="flex-1 min-h-0">
                    <CodeEditor
                      code={activeContent}
                      filename={activeFile}
                      onChange={handleCodeChange}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                    <Code2 className="w-10 h-10 opacity-20 mb-3" />
                    <p className="text-sm font-medium">Editor de cod</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Codul generat de AI va apărea aici
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <Preview url={previewUrl} isLoading={isDeploying} />
            )}
          </div>

          {/* Terminal */}
          {showTerminal && (
            <div className="h-[180px] border-t">
              <Terminal logs={terminalLogs} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
