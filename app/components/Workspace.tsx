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
} from "lucide-react";

interface GeneratedFile {
  path: string;
  content: string;
}

type RightTab = "code" | "preview";

// Build a self-contained HTML page from generated files
function buildPreviewHtml(files: GeneratedFile[]): string {
  const htmlFile = files.find((f) => f.path.endsWith(".html"));
  if (htmlFile) return htmlFile.content;

  // If no HTML file, wrap JSX/CSS in a self-contained HTML page with React CDN
  const cssFile = files.find((f) => f.path.endsWith(".css"));
  const jsxFile = files.find((f) =>
    f.path.endsWith(".jsx") || f.path.endsWith(".tsx") || f.path.endsWith(".js")
  );

  if (!jsxFile) return "";

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  ${cssFile ? `<style>${cssFile.content}</style>` : ""}
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${jsxFile.content}

    const rootEl = document.getElementById('root');
    if (typeof App !== 'undefined') {
      ReactDOM.createRoot(rootEl).render(React.createElement(App));
    }
  <\/script>
</body>
</html>`;
}

export function Workspace() {
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [activeFile, setActiveFile] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("code");
  const [selectedModel, setSelectedModel] = useState("qwen/qwen3.6-plus-preview:free");
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

  const handleRun = useCallback(() => {
    if (files.length === 0) return;
    setIsRunning(true);
    setShowTerminal(true);
    addLog("[preview] Se construieste preview-ul...");

    const html = buildPreviewHtml(files);
    if (!html) {
      addLog("[ERR] Nu s-a gasit fisier HTML sau JSX pentru preview");
      setIsRunning(false);
      return;
    }

    addLog(`[preview] ${files.length} fisier(e): ${files.map((f) => f.path).join(", ")}`);
    addLog("[OK] Preview gata!");
    setPreviewHtml(html);
    setRightTab("preview");
    setIsRunning(false);
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
          "flex flex-col border-r border-border/50 transition-all duration-300 min-w-0",
          chatCollapsed ? "w-0 overflow-hidden border-r-0" : "flex-1"
        )}>
          <ChatPanel selectedModel={selectedModel} onCodeGenerated={handleCodeGenerated} />
        </div>

        {/* ===== RIGHT: CODE / PREVIEW ===== */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="h-10 border-b border-border/50 bg-card/30 flex items-center px-1 shrink-0">
            <button
              onClick={() => setChatCollapsed(!chatCollapsed)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors ml-1"
            >
              {chatCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            <div className="w-px h-5 bg-border/50 mx-1" />

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
              {previewHtml && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
            </button>

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
                onClick={handleRun}
                disabled={!hasCode || isRunning}
                className={cn(
                  "flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium transition-all",
                  hasCode && !isRunning
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/20 glow-primary-sm"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                {isRunning ? "Ruleaza..." : "Ruleaza"}
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
              <Preview html={previewHtml} isLoading={isRunning} />
            )}
          </div>

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
