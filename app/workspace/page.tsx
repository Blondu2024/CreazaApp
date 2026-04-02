"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { useAuth } from "../components/AuthProvider";
import { signOut } from "@/lib/supabase";
import type { UIMessage } from "ai";
import { CodeEditor } from "../components/editor/CodeEditor";
import { Terminal } from "../components/terminal/Terminal";
import { models, MODEL_CATEGORIES } from "../components/models";
import { estimateTokens, CONTEXT_BUDGETS } from "@/lib/ai";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles, PanelLeftClose, PanelLeftOpen, Code, Eye,
  Terminal as TerminalIcon, Play, RefreshCw, ExternalLink,
  Monitor, Smartphone, Send, Coffee, CheckSquare, ShoppingBag,
  User, FolderTree, Plus, X, Loader2, Globe, Download,
  Rocket, Copy, Check, Bot, ArrowUp, Square, Undo2, Trash2, Paperclip, Image, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  createProject, listProjects, deleteProject, updateProjectTimestamp,
  saveFiles, loadFiles, saveChatMessage, loadChatHistory, clearChatHistory,
  saveContextSummary, buildContextSummary,
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

function parseDeleteCommands(content: string): string[] {
  const deletes: string[] = [];
  const regex = /\[DELETE:\s*(\S+)\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    deletes.push(match[1]);
  }
  return deletes;
}

const LANG_LABELS: Record<string, string> = {
  html: "HTML", css: "CSS", js: "JavaScript", jsx: "React JSX", tsx: "React TSX",
  typescript: "TypeScript", json: "JSON", python: "Python",
};

function stripCodeBlocks(text: string): string {
  return text.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang: string) => {
    const label = LANG_LABELS[lang?.toLowerCase()] || lang || "Cod";
    return `[${label} generat]`;
  }).trim();
}

function ChatMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;
  let inList = false;
  let listItems: React.ReactNode[] = [];
  let listType: "ul" | "ol" = "ul";

  const flushList = () => {
    if (listItems.length > 0) {
      if (listType === "ol") {
        elements.push(<ol key={key++} className="list-decimal pl-6 my-2 space-y-1">{listItems}</ol>);
      } else {
        elements.push(<ul key={key++} className="list-disc pl-6 my-2 space-y-1">{listItems}</ul>);
      }
      listItems = [];
      inList = false;
    }
  };

  const renderInline = (str: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    // Bold, italic, inline code, links
    const rx = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
    let last = 0;
    let m;
    let k = 0;
    while ((m = rx.exec(str)) !== null) {
      if (m.index > last) parts.push(<span key={k++}>{str.slice(last, m.index)}</span>);
      if (m[2]) parts.push(<strong key={k++} className="text-white font-bold">{m[2]}</strong>);
      else if (m[4]) parts.push(<em key={k++} className="text-[#a78bfa] italic">{m[4]}</em>);
      else if (m[6]) parts.push(<code key={k++} className="bg-[#6366f1]/15 text-[#a78bfa] px-1.5 py-0.5 rounded text-[0.85em] font-mono">{m[6]}</code>);
      else if (m[8]) parts.push(<a key={k++} href={m[9]} target="_blank" rel="noopener noreferrer" className="text-[#818cf8] underline underline-offset-2 hover:text-[#a78bfa]">{m[8]}</a>);
      last = m.index + m[0].length;
    }
    if (last < str.length) parts.push(<span key={k++}>{str.slice(last)}</span>);
    return parts;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Headings
    if (trimmed.startsWith("### ")) { flushList(); elements.push(<h3 key={key++} className="text-[1.15em] font-bold text-[#e2e8f0] mt-3 mb-1">{renderInline(trimmed.slice(4))}</h3>); continue; }
    if (trimmed.startsWith("## ")) { flushList(); elements.push(<h2 key={key++} className="text-[1.35em] font-bold text-white mt-4 mb-2">{renderInline(trimmed.slice(3))}</h2>); continue; }
    if (trimmed.startsWith("# ")) { flushList(); elements.push(<h1 key={key++} className="text-[1.6em] font-extrabold text-white mt-4 mb-2">{renderInline(trimmed.slice(2))}</h1>); continue; }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) { flushList(); elements.push(<hr key={key++} className="border-[#6366f1]/20 my-3" />); continue; }

    // Blockquote
    if (trimmed.startsWith("> ")) { flushList(); elements.push(<blockquote key={key++} className="border-l-3 border-[#6366f1] pl-3 text-[#94a3b8] italic my-2">{renderInline(trimmed.slice(2))}</blockquote>); continue; }

    // Unordered list
    if (/^[-*+]\s/.test(trimmed)) {
      if (!inList) { flushList(); inList = true; listType = "ul"; }
      listItems.push(<li key={key++}>{renderInline(trimmed.replace(/^[-*+]\s/, ""))}</li>);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      if (!inList) { flushList(); inList = true; listType = "ol"; }
      listItems.push(<li key={key++}>{renderInline(trimmed.replace(/^\d+\.\s/, ""))}</li>);
      continue;
    }

    // Empty line
    if (!trimmed) { flushList(); continue; }

    // Regular paragraph
    flushList();
    elements.push(<p key={key++} className="mb-2 last:mb-0">{renderInline(trimmed)}</p>);
  }
  flushList();

  return <>{elements}</>;
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
  <script>
    // Capture errors and send to parent
    window.onerror = function(msg, url, line, col, error) {
      window.parent.postMessage({ type: 'preview-error', error: msg + ' (linia ' + line + ')' }, '*');
    };
    window.addEventListener('unhandledrejection', function(e) {
      window.parent.postMessage({ type: 'preview-error', error: 'Promise: ' + (e.reason?.message || e.reason) }, '*');
    });
  <\/script>
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
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [mobileTab, setMobileTab] = useState<"chat" | "code" | "preview">("chat");
  const [selectedModel, setSelectedModel] = useState("qwen/qwen3.6-plus-preview:free");
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<{ path: string; content: string }[]>([]);
  const [activeFile, setActiveFile] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [previewKey, setPreviewKey] = useState(0);
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  const [fileHistory, setFileHistory] = useState<{ path: string; content: string }[][]>([]); // Undo stack
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Attachments (images + documents)
  interface Attachment {
    type: "image" | "document";
    name: string;
    base64: string; // data URL for images, text content for documents
    mimeType: string;
  }
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
        // Images → base64 data URL
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          setAttachments((prev) => [...prev, {
            type: "image",
            name: file.name,
            base64,
            mimeType: file.type,
          }]);
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf" || file.type === "text/plain" || file.name.endsWith(".md") || file.name.endsWith(".csv")) {
        // Text documents → extract text
        const text = await file.text();
        setAttachments((prev) => [...prev, {
          type: "document",
          name: file.name,
          base64: text,
          mimeType: file.type,
        }]);
      }
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removeAttachment = useCallback((idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // Listen for preview iframe errors
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "preview-error") {
        setPreviewErrors((prev) => {
          const err = e.data.error;
          if (prev.includes(err)) return prev;
          return [...prev, err].slice(-5); // Keep last 5 errors
        });
        setTerminalLogs((p) => [...p, `[ERR] Preview: ${e.data.error}`]);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Project state
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjects, setShowProjects] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [restoredMessages, setRestoredMessages] = useState<{ role: string; content: string }[]>([]);

  // Placeholder — defined after useChat
  const openProjectRef = useRef<((id: string) => Promise<void>) | undefined>(undefined);

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

  // Use refs in callbacks to avoid re-creating useChat on state changes
  const currentProjectRef = useRef(currentProject);
  currentProjectRef.current = currentProject;
  const filesRef = useRef(files);
  filesRef.current = files;
  const restoredRef = useRef(restoredMessages);
  restoredRef.current = restoredMessages;
  const modelRef = useRef(selectedModel);
  modelRef.current = selectedModel;
  const userRef = useRef(user);
  userRef.current = user;

  // Track all chat messages locally (restored + new)
  const [allChatMessages, setAllChatMessages] = useState<{ role: string; content: string }[]>([]);

  const { messages, sendMessage, stop, status, setMessages, error } = useChat({
    id: "workspace-chat",
    onFinish: useCallback(({ message }: { message: UIMessage }) => {
      if (message.role === "assistant") {
        const text = getTextFromMessage(message);

        // Save to local display list
        setAllChatMessages((prev) => [...prev, { role: "assistant", content: text }]);

        const parsed = parseCodeBlocks(text);
        if (parsed.length > 0) {
          // Save snapshot for undo BEFORE modifying
          if (filesRef.current.length > 0) {
            setFileHistory((prev) => [...prev.slice(-9), filesRef.current]); // Keep last 10
          }

          // Merge: update existing files, add new ones, keep untouched files
          setFiles((prev) => {
            if (prev.length === 0) return parsed; // First generation — use all
            const merged = [...prev];
            for (const newFile of parsed) {
              const idx = merged.findIndex((f) => f.path === newFile.path);
              if (idx >= 0) {
                merged[idx] = newFile; // Update existing file
              } else {
                merged.push(newFile); // Add new file
              }
            }
            return merged;
          });
          if (parsed.length > 0) setActiveFile(parsed[0].path);
          setTerminalLogs((p) => [...p, `[AI] ${parsed.length} fișier(e) ${filesRef.current.length > 0 ? "modificate" : "generate"}`]);

          // Handle file deletions
          const toDelete = parseDeleteCommands(text);
          if (toDelete.length > 0) {
            setFiles((prev) => prev.filter((f) => !toDelete.includes(f.path)));
            setTerminalLogs((p) => [...p, `[AI] ${toDelete.length} fișier(e) șterse: ${toDelete.join(", ")}`]);
          }

          // Clear preview errors on new code
          setPreviewErrors([]);

          // Build preview from ALL files (existing + new merged - deleted)
          const allFiles = [...filesRef.current].filter((f) => !toDelete.includes(f.path));
          for (const newFile of parsed) {
            const idx = allFiles.findIndex((f) => f.path === newFile.path);
            if (idx >= 0) allFiles[idx] = newFile;
            else allFiles.push(newFile);
          }
          const html = buildPreviewHtml(allFiles);
          if (html) {
            setPreviewHtml(html);
            setPreviewUrl("preview.creazaapp.local");
            setActiveTab("preview");
            setMobileTab("preview");
            setTerminalLogs((p) => [...p, "[OK] Preview generat automat"]);
          } else {
            setTerminalLogs((p) => [...p, `[WARN] Preview gol — fișiere: ${allFiles.map(f => f.path).join(", ") || "niciun fișier"}`]);
          }
        }

        // Save to Supabase
        const proj = currentProjectRef.current;
        if (proj) {
          saveChatMessage(proj.id, "assistant", text);

          // Auto-update context summary
          const allMsgs = [...(allChatRef.current || []), { role: "assistant" as const, content: text }];
          const allFiles = [...filesRef.current];
          for (const newFile of parsed) {
            const idx = allFiles.findIndex((f) => f.path === newFile.path);
            if (idx >= 0) allFiles[idx] = newFile;
            else allFiles.push(newFile);
          }
          const summary = buildContextSummary(proj.name, allFiles, allMsgs);
          saveContextSummary(proj.id, summary);
        }
      }
    }, []),
  });

  // Clear useChat messages after response is done so next request is clean
  useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      const timer = setTimeout(() => setMessages([]), 200);
      return () => clearTimeout(timer);
    }
  }, [status, messages.length, setMessages]);

  const isLoading = status === "streaming" || status === "submitted";

  // Open a project — load files and chat from Supabase
  const openProject = useCallback(async (projectId: string) => {
    const allProjects = await listProjects(userRef.current?.id);
    // Also check projects without user_id (legacy)
    let proj = allProjects.find((p) => p.id === projectId);
    if (!proj) {
      const legacyProjects = await listProjects();
      proj = legacyProjects.find((p) => p.id === projectId);
    }
    if (!proj) return;
    setCurrentProject(proj);
    setSelectedModel(proj.model);
    localStorage.setItem("creazaapp_last_project", proj.id);

    const savedFiles = await loadFiles(proj.id);
    if (savedFiles.length > 0) {
      setFiles(savedFiles);
      setActiveFile(savedFiles[0].path);
      const html = buildPreviewHtml(savedFiles);
      if (html) { setPreviewHtml(html); setPreviewUrl("preview.creazaapp.local"); }
    } else {
      setFiles([]); setActiveFile(""); setPreviewHtml(null); setPreviewUrl(null);
    }

    const chatHistory = await loadChatHistory(proj.id);
    setAllChatMessages(chatHistory.map((m) => ({ role: m.role, content: m.content })));
    setMessages([]);
    setShowProjects(false);
    setProjects(await listProjects(userRef.current?.id));
  }, [setMessages]);

  // Store ref for use in mount effect
  openProjectRef.current = openProject;

  // Create new project
  const handleNewProject = useCallback(async () => {
    const name = projectName.trim() || "Proiect nou";
    const proj = await createProject(name, selectedModel, userRef.current?.id);
    if (proj) {
      setCurrentProject(proj); setFiles([]); setActiveFile("");
      setPreviewHtml(null); setPreviewUrl(null); setTerminalLogs([]);
      setMessages([]); setAllChatMessages([]);
      localStorage.setItem("creazaapp_last_project", proj.id);
      setProjects(await listProjects(userRef.current?.id));
      setShowProjects(false); setProjectName("");
    }
  }, [projectName, selectedModel, setMessages]);

  // Load projects list when user is available
  useEffect(() => {
    if (!user) return;
    listProjects(user.id).then(setProjects);
    const lastId = localStorage.getItem("creazaapp_last_project");
    if (lastId) openProjectRef.current?.(lastId);
  }, [user]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "instant" }); }, [messages, isLoading, allChatMessages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 120) + "px"; }
  }, [input]);

  const allChatRef = useRef(allChatMessages);
  allChatRef.current = allChatMessages;

  const sendWithContext = useCallback((text: string) => {
    const proj = currentProjectRef.current;
    if (proj) saveChatMessage(proj.id, "user", text);

    // Build display text with attachment indicators
    const displayText = attachments.length > 0
      ? `${text}\n[${attachments.map(a => a.type === "image" ? `📷 ${a.name}` : `📄 ${a.name}`).join(", ")}]`
      : text;

    // Add user message to local display
    setAllChatMessages((prev) => [...prev, { role: "user", content: displayText }]);

    // Send ALL messages + full files + context summary + preview errors + attachments
    const currentFiles = filesRef.current.map(f => ({ path: f.path, content: f.content }));
    const chatHistory = allChatRef.current.map(m => ({ role: m.role, content: m.content }));
    const summary = currentProjectRef.current?.context_summary || undefined;
    const errors = previewErrors.length > 0 ? previewErrors : undefined;

    // Build multimodal attachments for the API
    const images = attachments.filter(a => a.type === "image").map(a => a.base64);
    const documents = attachments.filter(a => a.type === "document").map(a => ({ name: a.name, content: a.base64 }));

    sendMessage({ text }, { body: {
      model: modelRef.current, currentFiles, chatHistory, summary, errors,
      images: images.length > 0 ? images : undefined,
      documents: documents.length > 0 ? documents : undefined,
    }});
    if (previewErrors.length > 0) setPreviewErrors([]);
    setAttachments([]); // Clear attachments after sending
  }, [sendMessage]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    // Auto-create project on first message
    if (!currentProjectRef.current) {
      const proj = await createProject(input.trim().slice(0, 50), modelRef.current, userRef.current?.id);
      if (proj) {
        setCurrentProject(proj);
        localStorage.setItem("creazaapp_last_project", proj.id);
        setProjects(await listProjects(userRef.current?.id));
      }
    }
    sendWithContext(input);
    setInput("");
  }, [input, isLoading, sendWithContext]);

  const handleSuggestion = useCallback((text: string) => {
    if (isLoading) return;
    sendWithContext(text);
  }, [isLoading, sendWithContext]);

  const handleUndo = useCallback(() => {
    if (fileHistory.length === 0) return;
    const previous = fileHistory[fileHistory.length - 1];
    setFileHistory((prev) => prev.slice(0, -1));
    setFiles(previous);
    if (previous.length > 0) setActiveFile(previous[0].path);
    const html = buildPreviewHtml(previous);
    if (html) { setPreviewHtml(html); setPreviewUrl("preview.creazaapp.local"); }
    addLog("[UNDO] Revenit la versiunea anterioară");
  }, [fileHistory, addLog]);

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
  const isEmpty = messages.length === 0 && allChatMessages.length === 0;
  const currentModelLabel = models.find((m) => m.value === selectedModel)?.label || selectedModel;

  // Token usage tracking
  const contextTokens = allChatMessages.reduce((sum, m) => sum + estimateTokens(m.content), 0)
    + files.reduce((sum, f) => sum + estimateTokens(f.content), 0);
  const contextBudget = CONTEXT_BUDGETS.free; // TODO: use user tier
  const contextPercent = Math.min(100, Math.round((contextTokens / contextBudget) * 100));
  const contextNearLimit = contextPercent > 80;

  // Auth loading / redirect
  if (authLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0f]">
        <Loader2 className="w-6 h-6 text-[#6366f1] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] overflow-hidden" data-workspace>
      {/* Header */}
      <header className="h-12 flex-shrink-0 glass-header border-b border-[rgba(30,30,46,0.8)] flex items-center justify-between px-3 gap-2">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Sparkles className="w-5 h-5 text-[#6366f1]" />
          <span className="text-base font-bold"><span className="gradient-text">Creaza</span><span className="text-[#e2e8f0]">App</span></span>
        </Link>

        {/* Model Selector — hidden on mobile, shown in chat header instead */}
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="hidden md:block h-8 w-[280px] bg-[#111118] border border-[rgba(30,30,46,0.8)] text-[#e2e8f0] text-sm rounded-lg px-3 outline-none focus:border-[#6366f1] cursor-pointer"
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
          {/* Project selector — hidden on mobile */}
          <div className="relative hidden md:block">
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
                        <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id).then(() => listProjects(userRef.current?.id).then(setProjects)); }} className="p-1 hover:bg-red-500/20 rounded opacity-0 group-hover:opacity-100"><X className="w-3 h-3 text-[#64748b]" /></button>
                      </button>
                    ))
                  )}
                </ScrollArea>
              </div>
            )}
          </div>
          <button onClick={() => files.length > 0 && downloadZip(files)} disabled={!hasCode} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#111118] rounded-lg disabled:opacity-30">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={handleRun} disabled={!hasCode} className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white px-3 py-1.5 rounded-lg text-xs font-medium btn-primary-glow disabled:opacity-40">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <div className="hidden md:flex items-center gap-2 ml-2 pl-2 border-l border-[rgba(30,30,46,0.8)]">
            <span className="text-[10px] text-[#64748b] truncate max-w-[120px]">{user.email}</span>
            <button onClick={() => signOut().then(() => router.push("/login"))} className="text-[10px] text-[#64748b] hover:text-red-400 transition-colors">Ieși</button>
          </div>
        </div>
      </header>

      {/* ===== MOBILE LAYOUT ===== */}
      <div className="flex-1 flex flex-col overflow-hidden md:hidden">
        {/* Mobile content — one view at a time */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat view */}
          {mobileTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0f]">
              {/* Model selector */}
              <div className="shrink-0 px-3 py-2 border-b border-[rgba(30,30,46,0.8)]">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full h-9 bg-[#111118] border border-[rgba(30,30,46,0.8)] text-[#e2e8f0] text-sm rounded-lg px-3 outline-none focus:border-[#6366f1]"
                >
                  {MODEL_CATEGORIES.map((cat) => (
                    <optgroup key={cat.key} label={cat.label}>
                      {models.filter((m) => m.category === cat.key).map((m) => (
                        <option key={m.value} value={m.value}>{m.label} — {m.price}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
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
                {/* All chat messages (restored + completed) */}
                {allChatMessages.map((msg, i) => {
                  const isUser = msg.role === "user";
                  return (
                    <div key={`chat-${i}`} className={cn("rounded-lg p-3 border", isUser ? "bg-[#111118] border-[rgba(30,30,46,0.8)]" : "bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 border-[#6366f1]/30")}>
                      {!isUser && (
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-[#6366f1]" />
                          <span className="text-xs font-medium text-[#e2e8f0]">CreazaApp AI</span>
                        </div>
                      )}
                      <div className="chat-markdown text-[#e2e8f0] break-words">
                        {isUser
                          ? <p className="text-[25px] leading-relaxed">{msg.content}</p>
                          : <ChatMarkdown text={stripCodeBlocks(msg.content)} />
                        }
                      </div>
                    </div>
                  );
                })}
                {/* Live streaming message from useChat */}
                {messages.filter(m => m.role === "assistant").map((msg) => {
                  const text = getTextFromMessage(msg);
                  if (!text) return null;
                  return (
                    <div key={msg.id} className="rounded-lg p-3 border bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 border-[#6366f1]/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-[#6366f1]" />
                        <span className="text-xs font-medium text-[#e2e8f0]">CreazaApp AI</span>
                      </div>
                      <div className="chat-markdown text-[#e2e8f0] break-words">
                        <ChatMarkdown text={stripCodeBlocks(text)} />
                      </div>
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="rounded-lg p-3 bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 border border-[#6366f1]/30">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#6366f1]" />
                      <span className="text-xs text-[#e2e8f0] animate-pulse">Se generează... ({status})</span>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/30">
                    <p className="text-xs text-red-400">Eroare: {error.message}</p>
                    <p className="text-[10px] text-red-400/60 mt-1">Status: {status}</p>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-[rgba(30,30,46,0.8)]">
            {/* Attachment previews */}
            {attachments.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {attachments.map((att, i) => (
                  <div key={i} className="relative flex items-center gap-1.5 bg-[#111118] border border-[rgba(30,30,46,0.8)] rounded-lg px-2 py-1.5">
                    {att.type === "image" ? (
                      <img src={att.base64} alt={att.name} className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <FileText className="w-4 h-4 text-[#6366f1]" />
                    )}
                    <span className="text-[11px] text-[#e2e8f0] max-w-[100px] truncate">{att.name}</span>
                    <button onClick={() => removeAttachment(i)} className="ml-1 text-[#64748b] hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                placeholder="Descrie ce vrei să construiești..."
                className="w-full bg-[#111118] border border-[rgba(30,30,46,0.8)] rounded-lg px-3 py-2 pr-20 text-[25px] text-[#e2e8f0] placeholder:text-[#64748b] resize-none focus:outline-none focus:border-[#6366f1] min-h-[60px]"
                rows={2}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt,.md,.csv" multiple onChange={handleFileUpload} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#111118] transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
                {isLoading ? (
                  <button type="button" onClick={stop} className="w-7 h-7 bg-red-500/20 hover:bg-red-500/30 rounded-lg flex items-center justify-center transition-colors">
                    <Square className="w-3 h-3 text-red-400" fill="currentColor" />
                  </button>
                ) : (
                  <button type="submit" disabled={!input.trim() && attachments.length === 0} className="w-7 h-7 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-lg flex items-center justify-center disabled:opacity-30">
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                )}
              </div>
            </form>
            <p className="text-[9px] text-[#64748b]/50 text-center mt-1">Enter trimite · Shift+Enter linie nouă · 📎 atașează imagini/documente</p>
          </div>
            </div>
          )}

          {/* Mobile Code view */}
          {mobileTab === "code" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0f]">
              {hasCode && (
                <div className="h-9 flex items-center gap-0.5 px-2 bg-[#0a0a0f] border-b border-[rgba(30,30,46,0.8)] overflow-x-auto">
                  {files.map((f) => {
                    const name = f.path.split("/").pop() || f.path;
                    const ext = name.split(".").pop() || "";
                    const isActive = f.path === activeFile;
                    return (
                      <button key={f.path} onClick={() => setActiveFile(f.path)} className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-t border border-b-0 whitespace-nowrap transition-colors", isActive ? "bg-[#111118] text-[#e2e8f0] border-[rgba(30,30,46,0.8)]" : "text-[#64748b] border-transparent")}>
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
          )}

          {/* Mobile Preview view */}
          {mobileTab === "preview" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0f]">
              {previewUrl ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-[rgba(30,30,46,0.8)]">
                    <div className="flex-1 flex items-center gap-1.5 bg-[#111118] rounded-md px-2.5 py-1 text-[11px] border border-[rgba(30,30,46,0.8)]">
                      <Globe className="w-3 h-3 text-[#10b981] shrink-0" />
                      <span className="truncate text-[#64748b] font-mono">{previewUrl}</span>
                    </div>
                    <button onClick={() => setPreviewKey((k) => k + 1)} className="p-1.5 rounded hover:bg-[#111118]">
                      <RefreshCw className="w-4 h-4 text-[#64748b]" />
                    </button>
                    <button onClick={() => previewHtml && openPreviewInNewTab(previewHtml)} className="p-1.5 rounded hover:bg-[#111118]">
                      <ExternalLink className="w-4 h-4 text-[#64748b]" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <iframe key={previewKey} srcDoc={previewHtml || ""} className="w-full h-full border-0 bg-white" title="Preview" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
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

        {/* Mobile Bottom Nav */}
        <div className="shrink-0 flex border-t border-[rgba(30,30,46,0.8)] bg-[#0a0a0f] safe-area-bottom">
          <button onClick={() => setMobileTab("chat")} className={cn("flex-1 flex flex-col items-center gap-0.5 py-2.5", mobileTab === "chat" ? "text-[#6366f1]" : "text-[#64748b]")}>
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium">Chat</span>
          </button>
          <button onClick={() => setMobileTab("code")} className={cn("flex-1 flex flex-col items-center gap-0.5 py-2.5 relative", mobileTab === "code" ? "text-[#6366f1]" : "text-[#64748b]")}>
            <Code className="w-5 h-5" />
            <span className="text-[10px] font-medium">Cod</span>
            {hasCode && <span className="absolute top-1.5 right-[calc(50%-2px)] translate-x-3 w-1.5 h-1.5 rounded-full bg-[#6366f1]" />}
          </button>
          <button onClick={() => setMobileTab("preview")} className={cn("flex-1 flex flex-col items-center gap-0.5 py-2.5 relative", mobileTab === "preview" ? "text-[#6366f1]" : "text-[#64748b]")}>
            <Eye className="w-5 h-5" />
            <span className="text-[10px] font-medium">Preview</span>
            {previewUrl && <span className="absolute top-1.5 right-[calc(50%-2px)] translate-x-3 w-1.5 h-1.5 rounded-full bg-[#10b981]" />}
          </button>
        </div>
      </div>

      {/* ===== DESKTOP LAYOUT (unchanged) ===== */}
      <div className="flex-1 hidden md:flex overflow-hidden">
        {/* Chat Sidebar */}
        <div className={cn("bg-[#0a0a0f] border-r border-[rgba(30,30,46,0.8)] flex flex-col transition-all duration-200 overflow-hidden min-w-0", isChatOpen ? "flex-1" : "w-0")}>
          <div className="h-10 flex items-center px-3 border-b border-[rgba(30,30,46,0.8)] shrink-0">
            <Sparkles className="w-4 h-4 text-[#6366f1] mr-2" />
            <span className="text-sm text-[#e2e8f0] font-medium">Chat AI</span>
            <div className="ml-auto flex items-center gap-2">
              {isLoading && <span className="text-[10px] text-[#6366f1] animate-pulse">generare...</span>}
              {!isEmpty && (
                <div className="flex items-center gap-1.5" title={`${contextTokens.toLocaleString()} / ${(contextBudget / 1000).toFixed(0)}K tokeni`}>
                  <div className="w-16 h-1.5 bg-[#111118] rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", contextNearLimit ? "bg-amber-500" : "bg-[#6366f1]")} style={{ width: `${contextPercent}%` }} />
                  </div>
                  <span className={cn("text-[9px]", contextNearLimit ? "text-amber-500" : "text-[#64748b]")}>{contextPercent}%</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
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
                {allChatMessages.map((msg, i) => {
                  const isUser = msg.role === "user";
                  return (
                    <div key={`chat-${i}`} className={cn("rounded-lg p-3 border", isUser ? "bg-[#111118] border-[rgba(30,30,46,0.8)]" : "bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 border-[#6366f1]/30")}>
                      {!isUser && (
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-[#6366f1]" />
                          <span className="text-xs font-medium text-[#e2e8f0]">CreazaApp AI</span>
                        </div>
                      )}
                      <div className="chat-markdown text-[#e2e8f0] break-words">
                        {isUser
                          ? <p className="text-[25px] leading-relaxed">{msg.content}</p>
                          : <ChatMarkdown text={stripCodeBlocks(msg.content)} />
                        }
                      </div>
                    </div>
                  );
                })}
                {messages.filter(m => m.role === "assistant").map((msg) => {
                  const text = getTextFromMessage(msg);
                  if (!text) return null;
                  return (
                    <div key={msg.id} className="rounded-lg p-3 border bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 border-[#6366f1]/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-[#6366f1]" />
                        <span className="text-xs font-medium text-[#e2e8f0]">CreazaApp AI</span>
                      </div>
                      <div className="chat-markdown text-[#e2e8f0] break-words">
                        <ChatMarkdown text={stripCodeBlocks(text)} />
                      </div>
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="rounded-lg p-3 bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 border border-[#6366f1]/30">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#6366f1]" />
                      <span className="text-xs text-[#e2e8f0] animate-pulse">Se generează... ({status})</span>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/30">
                    <p className="text-xs text-red-400">Eroare: {error.message}</p>
                    <p className="text-[10px] text-red-400/60 mt-1">Status: {status}</p>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div className="p-3 border-t border-[rgba(30,30,46,0.8)] shrink-0">
            {attachments.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {attachments.map((att, i) => (
                  <div key={i} className="relative flex items-center gap-1.5 bg-[#111118] border border-[rgba(30,30,46,0.8)] rounded-lg px-2 py-1.5">
                    {att.type === "image" ? (
                      <img src={att.base64} alt={att.name} className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <FileText className="w-4 h-4 text-[#6366f1]" />
                    )}
                    <span className="text-[11px] text-[#e2e8f0] max-w-[100px] truncate">{att.name}</span>
                    <button onClick={() => removeAttachment(i)} className="ml-1 text-[#64748b] hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                placeholder="Descrie ce vrei să construiești..."
                className="w-full bg-[#111118] border border-[rgba(30,30,46,0.8)] rounded-lg px-3 py-2 pr-20 text-[25px] text-[#e2e8f0] placeholder:text-[#64748b] resize-none focus:outline-none focus:border-[#6366f1] min-h-[60px]"
                rows={2}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#111118] transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
                {isLoading ? (
                  <button type="button" onClick={stop} className="w-7 h-7 bg-red-500/20 hover:bg-red-500/30 rounded-lg flex items-center justify-center transition-colors">
                    <Square className="w-3 h-3 text-red-400" fill="currentColor" />
                  </button>
                ) : (
                  <button type="submit" disabled={!input.trim() && attachments.length === 0} className="w-7 h-7 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-lg flex items-center justify-center disabled:opacity-30">
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                )}
              </div>
            </form>
            <p className="text-[9px] text-[#64748b]/50 text-center mt-1">Enter trimite · Shift+Enter linie nouă · 📎 atașează imagini/documente</p>
          </div>
        </div>

        {/* Main Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
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
              <button onClick={handleUndo} disabled={fileHistory.length === 0} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#111118] disabled:opacity-30 transition-colors" title="Undo">
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleRun} disabled={!hasCode} className="flex items-center gap-1.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white px-3 py-1.5 rounded-lg text-xs font-medium btn-primary-glow disabled:opacity-40">
                <RefreshCw className="w-3.5 h-3.5" />
                Reîncarcă
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === "code" ? (
              <div className="flex-1 flex flex-col overflow-hidden">
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
