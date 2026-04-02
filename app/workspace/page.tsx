"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { CodeEditor } from "../components/editor/CodeEditor";
import { Terminal } from "../components/terminal/Terminal";
import { models, MODEL_CATEGORIES } from "../components/models";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles, PanelLeftClose, PanelLeftOpen, Code, Eye,
  Terminal as TerminalIcon, Play, RefreshCw, ExternalLink,
  Monitor, Smartphone, Send, Coffee, CheckSquare, ShoppingBag,
  User, FolderTree, Plus, X, Loader2, Globe, Download,
  Rocket, Copy, Check, Bot, ArrowUp, Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createProject, listProjects, deleteProject, updateProjectTimestamp,
  saveFiles, loadFiles, saveChatMessage, loadChatHistory, clearChatHistory,
  type Project,
} from "@/lib/supabase";

const suggestions = [
  { icon: Coffee, text: "Landing page pentru o cafenea", color: "#f59e0b" },
  { icon: CheckSquare, text: "Aplicație Todo cu categorii", color: "#3b82f6" },
  { icon: ShoppingBag, text: "Pagină de produs magazin", color: "#10b981" },
  { icon: User, text: "Portofoliu personal", color: "#a855f7" },
];

const getFileColor = (ext: string) => ({ tsx: "#3b82f6", ts: "#3b82f6", jsx: "#f59e0b", js: "#f59e0b", css: "#a855f7", html: "#ef4444", json: "#10b981" }[ext] || "#64748b");

function getTextFromMessage(message: UIMessage): string {
  return message.parts.filter((p): p is { type: "text"; text: string } => p.type === "text").map((p) => p.text).join("");
}

const LANG_TO_FILE: Record<string, string> = {
  html: "index.html", css: "styles.css", javascript: "script.js", js: "script.js",
  jsx: "App.jsx", tsx: "App.tsx", typescript: "App.ts", ts: "App.ts", json: "package.json",
};

function parseCodeBlocks(content: string): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];
  const regex = /```(\S+)\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const tag = match[1];
    const code = match[2].trim();
    const filename = tag.includes(".") || tag.includes("/") ? tag : LANG_TO_FILE[tag.toLowerCase()];
    if (filename) files.push({ path: filename, content: code });
  }
  return files;
}

function stripModuleSyntax(code: string): string {
  return code
    .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, "")
    .replace(/^import\s+['"].*?['"];?\s*$/gm, "")
    .replace(/^export\s+default\s+/gm, "")
    .replace(/^export\s+/gm, "")
    .replace(/module\.exports\s*=\s*/g, "");
}

function buildPreviewHtml(files: { path: string; content: string }[]): string {
  const htmlFile = files.find((f) => f.path.endsWith(".html"));
  if (htmlFile) return htmlFile.content;

  const cssFile = files.find((f) => f.path.endsWith(".css"));
  const jsxFile = files.find((f) => f.path.endsWith(".jsx") || f.path.endsWith(".tsx") || f.path.endsWith(".js"));
  if (!jsxFile) return "";

  const cleanCode = stripModuleSyntax(jsxFile.content);

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <script src="https://cdn.tailwindcss.com"><\/script>
  ${cssFile ? `<style>${cssFile.content}</style>` : ""}
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module">
    ${cleanCode}
    const rootEl = document.getElementById('root');
    if (typeof App !== 'undefined') {
      ReactDOM.createRoot(rootEl).render(React.createElement(App));
    }
  <\/script>
</body>
</html>`;
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); }} className="absolute top-2 right-2 p-1 rounded bg-white/5 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
      {ok ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5 text-[#64748b]" />}
    </button>
  );
}

function openPreviewInNewTab(html: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

// Download ZIP
async function downloadZip(files: { path: string; content: string }[]) {
  // Dynamic import to avoid loading JSZip until needed
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const f of files) {
    zip.file(f.path, f.content);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "creazaapp-project.zip";
  a.click();
  URL.revokeObjectURL(url);
}

export default function WorkspacePage() {
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [selectedModel, setSelectedModel] = useState("qwen/qwen3.6-plus-preview:free");
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<{ path: string; content: string }[]>([]);
  const [activeFile, setActiveFile] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [previewKey, setPreviewKey] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Project state
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjects, setShowProjects] = useState(false);
  const [projectName, setProjectName] = useState("");

  // Load projects list on mount
  useEffect(() => {
    listProjects().then(setProjects);
    // Restore last project from localStorage
    const lastId = localStorage.getItem("creazaapp_last_project");
    if (lastId) openProject(lastId);
  }, []);

  // Open a project — load files and chat from Supabase
  const openProject = useCallback(async (projectId: string) => {
    const proj = (await listProjects()).find((p) => p.id === projectId);
    if (!proj) return;
    setCurrentProject(proj);
    setSelectedModel(proj.model);
    localStorage.setItem("creazaapp_last_project", proj.id);

    const savedFiles = await loadFiles(proj.id);
    if (savedFiles.length > 0) {
      setFiles(savedFiles);
      setActiveFile(savedFiles[0].path);
      const html = buildPreviewHtml(savedFiles);
      if (html) {
        setPreviewHtml(html);
        setPreviewUrl("preview.creazaapp.local");
      }
    }
    setShowProjects(false);
    setProjects(await listProjects());
  }, []);

  // Create new project
  const handleNewProject = useCallback(async () => {
    const name = projectName.trim() || "Proiect nou";
    const proj = await createProject(name, selectedModel);
    if (proj) {
      setCurrentProject(proj);
      setFiles([]);
      setActiveFile("");
      setPreviewHtml(null);
      setPreviewUrl(null);
      setTerminalLogs([]);
      localStorage.setItem("creazaapp_last_project", proj.id);
      setProjects(await listProjects());
      setShowProjects(false);
      setProjectName("");
    }
  }, [projectName, selectedModel]);

  // Auto-save files to Supabase when they change
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!currentProject || files.length === 0) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveFiles(currentProject.id, files);
      updateProjectTimestamp(currentProject.id);
    }, 2000);
  }, [files, currentProject]);

  const addLog = useCallback((msg: string) => setTerminalLogs((p) => [...p, msg]), []);

  const { messages, sendMessage, stop, status } = useChat({
    onFinish: useCallback(({ message }: { message: UIMessage }) => {
      if (message.role === "assistant") {
        const text = getTextFromMessage(message);
        const parsed = parseCodeBlocks(text);
        if (parsed.length > 0) {
          setFiles(parsed);
          setActiveFile(parsed[0].path);
          addLog(`[AI] ${parsed.length} fișier(e) generate`);

          // Auto-preview
          const html = buildPreviewHtml(parsed);
          if (html) {
            setPreviewHtml(html);
            setPreviewUrl("preview.creazaapp.local");
            setActiveTab("preview");
            addLog("[OK] Preview generat automat");
          }

          // Save AI response to Supabase
          if (currentProject) {
            saveChatMessage(currentProject.id, "assistant", text);
          }
        }
      }
    }, [addLog, currentProject]),
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 120) + "px"; }
  }, [input]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    // Auto-create project on first message
    let proj = currentProject;
    if (!proj) {
      const name = input.trim().slice(0, 50);
      proj = await createProject(name, selectedModel);
      if (proj) {
        setCurrentProject(proj);
        localStorage.setItem("creazaapp_last_project", proj.id);
        setProjects(await listProjects());
      }
    }
    if (proj) saveChatMessage(proj.id, "user", input);
    sendMessage({ text: input }, { body: { model: selectedModel, currentFiles: files } });
    setInput("");
  }, [input, isLoading, sendMessage, selectedModel, files, currentProject]);

  const handleSuggestion = useCallback((text: string) => {
    if (isLoading) return;
    if (currentProject) saveChatMessage(currentProject.id, "user", text);
    sendMessage({ text }, { body: { model: selectedModel, currentFiles: files } });
  }, [isLoading, sendMessage, selectedModel]);

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const handleRun = useCallback(() => {
    if (files.length === 0) return;
    setIsTerminalOpen(true);
    addLog("[preview] Se construiește preview-ul...");
    const html = buildPreviewHtml(files);
    if (!html) {
      addLog("[ERR] Nu s-a găsit fișier HTML sau JSX pentru preview");
      return;
    }
    addLog(`[preview] ${files.length} fișier(e): ${files.map((f) => f.path).join(", ")}`);
    addLog("[OK] Preview gata!");
    setPreviewHtml(html);
    setPreviewUrl("preview.creazaapp.local");
    setActiveTab("preview");
  }, [files, addLog]);

  const activeContent = files.find((f) => f.path === activeFile)?.content || "";
  const hasCode = files.length > 0;
  const isEmpty = messages.length === 0;
  const currentModelLabel = models.find((m) => m.value === selectedModel)?.label || selectedModel;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] overflow-hidden" data-workspace>
      {/* Header */}
      <header className="h-12 flex-shrink-0 glass-header border-b border-[rgba(30,30,46,0.8)] flex items-center justify-between px-3">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#6366f1]" />
          <span className="text-base font-bold"><span className="gradient-text">Creaza</span><span className="text-[#e2e8f0]">App</span></span>
        </Link>

        {/* Model Selector */}
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="h-8 w-[280px] bg-[#111118] border border-[rgba(30,30,46,0.8)] text-[#e2e8f0] text-sm rounded-lg px-3 outline-none focus:border-[#6366f1] cursor-pointer"
        >
          {MODEL_CATEGORIES.map((cat) => (
            <optgroup key={cat.key} label={cat.label}>
              {models.filter((m) => m.category === cat.key).map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label} — {m.price}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <div className="flex items-center gap-2">
          {/* Project selector */}
          <div className="relative">
            <button onClick={() => setShowProjects(!showProjects)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#e2e8f0] bg-[#111118] border border-[rgba(30,30,46,0.8)] rounded-lg hover:border-[#6366f1] max-w-[200px]">
              <FolderTree className="w-4 h-4 text-[#6366f1] shrink-0" />
              <span className="truncate">{currentProject?.name || "Niciun proiect"}</span>
            </button>
            {showProjects && (
              <div className="absolute right-0 top-full mt-1 w-[280px] bg-[#111118] border border-[rgba(30,30,46,0.8)] rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="p-2 border-b border-[rgba(30,30,46,0.8)]">
                  <div className="flex gap-1">
                    <input value={projectName} onChange={(e) => setProjectName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleNewProject()} placeholder="Nume proiect nou..." className="flex-1 bg-[#0a0a0f] border border-[rgba(30,30,46,0.8)] rounded px-2 py-1 text-xs text-[#e2e8f0] placeholder:text-[#64748b] outline-none focus:border-[#6366f1]" />
                    <button onClick={handleNewProject} className="bg-[#6366f1] text-white px-2 py-1 rounded text-xs"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>
                <ScrollArea className="max-h-[200px]">
                  {projects.length === 0 ? (
                    <p className="text-xs text-[#64748b] p-3 text-center">Niciun proiect încă</p>
                  ) : (
                    projects.map((p) => (
                      <button key={p.id} onClick={() => openProject(p.id)} className={cn("w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[#1e1e2e] transition-colors", currentProject?.id === p.id && "bg-[#6366f1]/10")}>
                        <div>
                          <p className="text-xs text-[#e2e8f0] font-medium">{p.name}</p>
                          <p className="text-[10px] text-[#64748b]">{new Date(p.updated_at).toLocaleDateString("ro-RO")}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id).then(() => listProjects().then(setProjects)); }} className="p-1 hover:bg-red-500/20 rounded opacity-0 group-hover:opacity-100"><X className="w-3 h-3 text-[#64748b]" /></button>
                      </button>
                    ))
                  )}
                </ScrollArea>
              </div>
            )}
          </div>
          <button onClick={() => files.length > 0 && downloadZip(files)} disabled={!hasCode} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#111118] rounded-lg disabled:opacity-30">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={handleRun} disabled={!hasCode} className="flex items-center gap-1.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white px-3 py-1.5 rounded-lg text-xs font-medium btn-primary-glow disabled:opacity-40">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Sidebar */}
        <div className={cn("flex-shrink-0 bg-[#0a0a0f] border-r border-[rgba(30,30,46,0.8)] flex flex-col transition-all duration-200 overflow-hidden", isChatOpen ? "w-[320px]" : "w-0")}>
          <div className="h-10 flex items-center px-3 border-b border-[rgba(30,30,46,0.8)]">
            <Sparkles className="w-4 h-4 text-[#6366f1] mr-2" />
            <span className="text-sm text-[#e2e8f0] font-medium">Chat AI</span>
            {isLoading && <span className="ml-auto text-[10px] text-[#6366f1] animate-pulse">generare...</span>}
          </div>

          <ScrollArea className="flex-1">
            {isEmpty ? (
              <div className="p-4 flex flex-col items-center">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#6366f1]/20 to-[#a855f7]/20 flex items-center justify-center mb-4 mt-8">
                  <Sparkles className="w-7 h-7 text-[#6366f1]" />
                </div>
                <h3 className="text-base font-semibold text-[#e2e8f0] mb-1">Ce vrei să construiești?</h3>
                <p className="text-xs text-[#64748b] mb-4 text-center">Descrie aplicația și o generez instant</p>
                <div className="w-full space-y-2">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => handleSuggestion(s.text)} className="w-full bg-[#111118] hover:bg-[#1e1e2e] border border-[rgba(30,30,46,0.8)] rounded-lg p-3 flex items-center gap-2 text-left transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.color}20` }}>
                        <s.icon className="w-4 h-4" style={{ color: s.color }} />
                      </div>
                      <span className="text-xs text-[#e2e8f0]">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {messages.map((msg) => {
                  const text = getTextFromMessage(msg);
                  if (!text) return null;
                  const isUser = msg.role === "user";
                  return (
                    <div key={msg.id} className={cn("rounded-lg p-3 border animate-fade-in-up", isUser ? "bg-[#111118] border-[rgba(30,30,46,0.8)]" : "bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 border-[#6366f1]/30")}>
                      {!isUser && (
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-[#6366f1]" />
                          <span className="text-xs font-medium text-[#e2e8f0]">CreazaApp AI</span>
                        </div>
                      )}
                      <p className="text-sm text-[#e2e8f0] whitespace-pre-wrap break-words">{text.length > 500 ? text.slice(0, 500) + "..." : text}</p>
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="rounded-lg p-3 bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 border border-[#6366f1]/30">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#6366f1]" />
                      <span className="text-xs text-[#e2e8f0] animate-pulse">Se generează...</span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </ScrollArea>

          {/* Chat Input */}
          <div className="p-3 border-t border-[rgba(30,30,46,0.8)]">
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                placeholder="Descrie ce vrei să construiești..."
                className="w-full bg-[#111118] border border-[rgba(30,30,46,0.8)] rounded-lg px-3 py-2 pr-10 text-sm text-[#e2e8f0] placeholder:text-[#64748b] resize-none focus:outline-none focus:border-[#6366f1] min-h-[60px]"
                rows={2}
              />
              {isLoading ? (
                <button type="button" onClick={stop} className="absolute right-2 bottom-2 w-7 h-7 bg-red-500/20 hover:bg-red-500/30 rounded-lg flex items-center justify-center transition-colors">
                  <Square className="w-3 h-3 text-red-400" fill="currentColor" />
                </button>
              ) : (
                <button type="submit" disabled={!input.trim()} className="absolute right-2 bottom-2 w-7 h-7 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-lg flex items-center justify-center disabled:opacity-30">
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              )}
            </form>
            <p className="text-[9px] text-[#64748b]/50 text-center mt-1">Enter trimite · Shift+Enter linie nouă</p>
          </div>
        </div>

        {/* Main Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="h-10 flex items-center justify-between px-3 border-b border-[rgba(30,30,46,0.8)] bg-[#0a0a0f]">
            <div className="flex items-center gap-2">
              <button onClick={() => setIsChatOpen(!isChatOpen)} className="p-1.5 rounded hover:bg-[#111118]">
                {isChatOpen ? <PanelLeftClose className="w-4 h-4 text-[#64748b]" /> : <PanelLeftOpen className="w-4 h-4 text-[#64748b]" />}
              </button>
              <div className="flex bg-[#111118] border border-[rgba(30,30,46,0.8)] rounded-lg h-8">
                <button onClick={() => setActiveTab("code")} className={cn("flex items-center gap-1.5 px-3 text-xs rounded-lg transition-colors", activeTab === "code" ? "bg-[#1e1e2e] text-[#e2e8f0]" : "text-[#64748b]")}>
                  <Code className="w-3.5 h-3.5" />Cod
                  {hasCode && <span className="bg-[#6366f1]/20 text-[#6366f1] text-[10px] px-1 rounded">{files.length}</span>}
                </button>
                <button onClick={() => setActiveTab("preview")} className={cn("flex items-center gap-1.5 px-3 text-xs rounded-lg transition-colors", activeTab === "preview" ? "bg-[#1e1e2e] text-[#e2e8f0]" : "text-[#64748b]")}>
                  <Eye className="w-3.5 h-3.5" />Preview
                  {previewUrl && <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsTerminalOpen(!isTerminalOpen)} className={cn("p-1.5 rounded", isTerminalOpen ? "bg-[#111118] text-[#e2e8f0]" : "text-[#64748b]")}>
                <TerminalIcon className="w-4 h-4" />
              </button>
              <button onClick={handleRun} disabled={!hasCode} className="flex items-center gap-1.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white px-3 py-1.5 rounded-lg text-xs font-medium btn-primary-glow disabled:opacity-40">
                <RefreshCw className="w-3.5 h-3.5" />
                Reîncarcă
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === "code" ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* File tabs */}
                {hasCode && (
                  <div className="h-9 flex items-center gap-0.5 px-2 bg-[#0a0a0f] border-b border-[rgba(30,30,46,0.8)]">
                    {files.map((f) => {
                      const name = f.path.split("/").pop() || f.path;
                      const ext = name.split(".").pop() || "";
                      const isActive = f.path === activeFile;
                      return (
                        <button key={f.path} onClick={() => setActiveFile(f.path)} className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-t border border-b-0 transition-colors", isActive ? "bg-[#111118] text-[#e2e8f0] border-[rgba(30,30,46,0.8)]" : "text-[#64748b] border-transparent hover:text-[#e2e8f0]")}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getFileColor(ext) }} />
                          {name}
                        </button>
                      );
                    })}
                  </div>
                )}
                {hasCode ? (
                  <div className="flex-1 min-h-0">
                    <CodeEditor code={activeContent} filename={activeFile} onChange={(c) => setFiles((p) => p.map((f) => f.path === activeFile ? { ...f, content: c } : f))} />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <Code className="w-12 h-12 text-[#64748b]/20 mb-3" />
                    <p className="text-sm text-[#64748b]">Codul generat de AI va apărea aici</p>
                  </div>
                )}
              </div>
            ) : (
              /* Preview */
              <div className="flex-1 flex flex-col overflow-hidden">
                {previewUrl ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-[rgba(30,30,46,0.8)] bg-[#0a0a0f]">
                      <div className="flex gap-1.5 mr-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                      </div>
                      <div className="flex-1 flex items-center gap-1.5 bg-[#111118] rounded-md px-2.5 py-1 text-[11px] border border-[rgba(30,30,46,0.8)]">
                        <Globe className="w-3 h-3 text-[#10b981] shrink-0" />
                        <span className="truncate text-[#64748b] font-mono">{previewUrl}</span>
                      </div>
                      <button onClick={() => setViewMode(viewMode === "desktop" ? "mobile" : "desktop")} className="p-1 rounded hover:bg-[#111118]">
                        {viewMode === "desktop" ? <Monitor className="w-4 h-4 text-[#64748b]" /> : <Smartphone className="w-4 h-4 text-[#6366f1]" />}
                      </button>
                      <button onClick={() => setPreviewKey((k) => k + 1)} className="p-1 rounded hover:bg-[#111118]">
                        <RefreshCw className="w-4 h-4 text-[#64748b]" />
                      </button>
                      <button onClick={() => previewHtml && openPreviewInNewTab(previewHtml)} className="p-1 rounded hover:bg-[#111118]">
                        <ExternalLink className="w-4 h-4 text-[#64748b]" />
                      </button>
                    </div>
                    <div className="flex-1 flex items-start justify-center bg-[#111118] overflow-hidden">
                      <iframe key={previewKey} srcDoc={previewHtml || ""} className={cn("h-full border-0 bg-white transition-all", viewMode === "mobile" ? "w-[375px] rounded-xl shadow-2xl my-3" : "w-full")} title="Preview" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <Globe className="w-12 h-12 text-[#64748b]/20 mb-3" />
                    <p className="text-sm text-[#64748b]">{isLoading ? "AI-ul generează codul..." : "Scrie un prompt și preview-ul apare automat"}</p>
                    {isLoading && <Loader2 className="w-5 h-5 text-[#6366f1] animate-spin mt-2" />}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Terminal */}
          {isTerminalOpen && (
            <div className="h-[180px] border-t border-[rgba(30,30,46,0.8)] flex-shrink-0">
              <Terminal logs={terminalLogs} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
