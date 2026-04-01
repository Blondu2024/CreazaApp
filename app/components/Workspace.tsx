"use client";

import { useState, useCallback } from "react";
import { ChatPanel } from "./chat/ChatPanel";
import { CodeEditor } from "./editor/CodeEditor";
import { FileTab } from "./editor/FileTab";
import { Preview } from "./preview/Preview";
import { Terminal } from "./terminal/Terminal";
import { Button } from "@/components/ui/button";
import { Play, TerminalSquare } from "lucide-react";

interface GeneratedFile {
  path: string;
  content: string;
}

export function Workspace() {
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [activeFile, setActiveFile] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);

  const addLog = useCallback((msg: string) => {
    setTerminalLogs((prev) => [...prev, msg]);
  }, []);

  const handleCodeGenerated = useCallback(
    (_fullContent: string, newFiles: GeneratedFile[]) => {
      setFiles(newFiles);
      if (newFiles.length > 0) {
        setActiveFile(newFiles[0].path);
      }
      addLog(`✓ ${newFiles.length} fișier(e) generate de AI`);
    },
    [addLog]
  );

  const handleDeploy = useCallback(async () => {
    if (files.length === 0) return;

    setIsDeploying(true);
    setShowTerminal(true);
    addLog("▶ Se creează sandbox-ul E2B...");

    try {
      // Create sandbox
      const createRes = await fetch("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      const { sandboxId } = await createRes.json();
      addLog(`✓ Sandbox creat: ${sandboxId}`);

      // Write files and start
      addLog("▶ Se scriu fișierele și se instalează dependențele...");
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
        addLog(`✗ Eroare: ${error}`);
      } else {
        addLog(`✓ Preview disponibil: ${url}`);
        setPreviewUrl(url);
      }
    } catch (err) {
      addLog(`✗ Eroare: ${err instanceof Error ? err.message : "Unknown"}`);
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

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel — Chat */}
      <div className="w-[380px] min-w-[320px] border-r flex flex-col">
        <ChatPanel onCodeGenerated={handleCodeGenerated} />
      </div>

      {/* Right Panel — Editor + Preview + Terminal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top — Editor */}
        <div className="flex-1 flex flex-col min-h-0 border-b">
          <div className="flex items-center justify-between border-b px-2">
            <FileTab
              files={files}
              activeFile={activeFile}
              onSelect={setActiveFile}
            />
            <div className="flex items-center gap-1 px-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTerminal(!showTerminal)}
                className="h-7 text-xs"
              >
                <TerminalSquare className="w-3.5 h-3.5 mr-1" />
                Terminal
              </Button>
              <Button
                size="sm"
                onClick={handleDeploy}
                disabled={files.length === 0 || isDeploying}
                className="h-7 text-xs"
              >
                <Play className="w-3.5 h-3.5 mr-1" />
                {isDeploying ? "Se rulează..." : "Rulează"}
              </Button>
            </div>
          </div>
          {files.length > 0 ? (
            <div className="flex-1 min-h-0">
              <CodeEditor
                code={activeContent}
                filename={activeFile}
                onChange={handleCodeChange}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Codul generat de AI va apărea aici
            </div>
          )}
        </div>

        {/* Middle — Preview */}
        <div className="h-[45%] min-h-[200px] border-b">
          <Preview url={previewUrl} isLoading={isDeploying} />
        </div>

        {/* Bottom — Terminal (collapsible) */}
        {showTerminal && (
          <div className="h-[180px] min-h-[100px]">
            <Terminal logs={terminalLogs} />
          </div>
        )}
      </div>
    </div>
  );
}
