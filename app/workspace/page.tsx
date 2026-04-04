"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { useAuth } from "../components/AuthProvider";
import { signOut, getAccessToken } from "@/lib/supabase";
import type { UIMessage } from "ai";
import { CodeEditor } from "../components/editor/CodeEditor";
import { Terminal } from "../components/terminal/Terminal";
import { models, MODEL_CATEGORIES } from "../components/models";
import { estimateTokens } from "@/lib/ai";
import { isModelFree, PLANS } from "@/lib/credits";
import { SummaryModal } from "../components/workspace/SummaryModal";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles, PanelLeftClose, PanelLeftOpen, Code, Eye,
  Terminal as TerminalIcon, Play, RefreshCw, ExternalLink,
  Monitor, Smartphone, Coffee, CheckSquare, ShoppingBag,
  User, FolderTree, Plus, X, Loader2, Globe, Download,
  Rocket, Copy, Check, Undo2, Trash2, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessages } from "../components/workspace/ChatMessages";
import { ChatInput } from "../components/workspace/ChatInput";
import { useToast } from "../components/Toast";

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
  // Remove completed code blocks
  let cleaned = text.replace(/```\S*\n([\s\S]*?)```/g, "");
  // Remove unclosed code block at the end (streaming — cod care se scrie)
  cleaned = cleaned.replace(/```[\s\S]*$/, "");
  return cleaned.replace(/\n{3,}/g, "\n\n").trim();
}

function isWritingCode(text: string): boolean {
  // Detect if streaming text is currently inside an unclosed code block
  const opens = (text.match(/```/g) || []).length;
  return opens % 2 !== 0;
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
    if (trimmed.startsWith("### ")) { flushList(); elements.push(<h3 key={key++} className="text-[1.15em] font-bold text-foreground mt-3 mb-1">{renderInline(trimmed.slice(4))}</h3>); continue; }
    if (trimmed.startsWith("## ")) { flushList(); elements.push(<h2 key={key++} className="text-[1.35em] font-bold text-white mt-4 mb-2">{renderInline(trimmed.slice(3))}</h2>); continue; }
    if (trimmed.startsWith("# ")) { flushList(); elements.push(<h1 key={key++} className="text-[1.6em] font-extrabold text-white mt-4 mb-2">{renderInline(trimmed.slice(2))}</h1>); continue; }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) { flushList(); elements.push(<hr key={key++} className="border-[#6366f1]/20 my-3" />); continue; }

    // Blockquote
    if (trimmed.startsWith("> ")) { flushList(); elements.push(<blockquote key={key++} className="border-l-3 border-[#6366f1] pl-3 text-muted-foreground italic my-2">{renderInline(trimmed.slice(2))}</blockquote>); continue; }

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
  if (htmlFile) {
    // Inline external JS/CSS references — srcdoc can't load separate files
    let html = htmlFile.content;
    for (const f of files) {
      if (f.path === htmlFile.path) continue;
      if (f.path.endsWith(".css")) {
        // Replace <link href="file.css"> with inline <style>
        const linkRegex = new RegExp(`<link[^>]*href=["']${f.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*/?>`, "gi");
        html = html.replace(linkRegex, `<style>${f.content}</style>`);
      }
      if (f.path.endsWith(".js") || f.path.endsWith(".jsx") || f.path.endsWith(".tsx")) {
        // Replace <script src="file.js"> with inline <script>
        const scriptRegex = new RegExp(`<script[^>]*src=["']${f.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>\\s*</script>`, "gi");
        html = html.replace(scriptRegex, `<script>${f.content}<\/script>`);
      }
    }
    return html;
  }

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
      {ok ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
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
  const { user, loading: authLoading, profile, refreshCredits } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  const [lastCreditCost, setLastCreditCost] = useState<number | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
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

  // Deploy state
  const [deploying, setDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);

  // Custom domain state
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [domainInput, setDomainInput] = useState("");
  const [domainLoading, setDomainLoading] = useState(false);
  const [domainInfo, setDomainInfo] = useState<{ domain: string; verified: boolean; dnsRecords?: { type: string; name: string; value: string }[] } | null>(null);
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
  const refreshCreditsRef = useRef(refreshCredits);
  refreshCreditsRef.current = refreshCredits;
  const profileRef = useRef(profile);
  profileRef.current = profile;

  // Track all chat messages locally (restored + new)
  const [allChatMessages, setAllChatMessages] = useState<{ role: string; content: string }[]>([]);

  const { messages, sendMessage, stop, status, setMessages, error } = useChat({
    id: "workspace-chat",
    onFinish: useCallback(async ({ message }: { message: UIMessage }) => {
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

      // Refresh credit balance and show real cost
      const balanceBefore = profileRef.current?.totalCredits ?? 0;
      const newProfile = await refreshCreditsRef.current?.();
      if (newProfile && !isModelFree(modelRef.current)) {
        const realCost = Math.round((balanceBefore - newProfile.totalCredits) * 100) / 100;
        if (realCost > 0) {
          setLastCreditCost(realCost);
          setTimeout(() => setLastCreditCost(null), 5000);
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

  const sendWithContext = useCallback(async (text: string) => {
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

    // Get auth token for server-side verification
    const token = await getAccessToken();

    sendMessage({ text }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: {
        model: modelRef.current, currentFiles, chatHistory, summary, errors,
        images: images.length > 0 ? images : undefined,
        documents: documents.length > 0 ? documents : undefined,
      },
    });
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

  // Trigger summary when context hits 90%
  const triggerSummary = useCallback(async () => {
    if (summaryLoading || showSummaryModal) return;
    setSummaryLoading(true);
    setShowSummaryModal(true);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          chatHistory: allChatMessages.slice(-30),
          files: filesRef.current.map(f => ({ path: f.path, content: f.content.slice(0, 2000) })),
          projectName: currentProjectRef.current?.name || "Proiect",
        }),
      });
      const data = await res.json();
      setSummaryText(data.summary || "Rezumatul nu a putut fi generat.");
    } catch {
      setSummaryText("Eroare la generarea rezumatului. Continuă oricum.");
    }
    setSummaryLoading(false);
  }, [allChatMessages, summaryLoading, showSummaryModal]);

  // Continue after summary — clear chat, save summary, keep files
  const handleContinueAfterSummary = useCallback(async () => {
    const proj = currentProjectRef.current;
    if (proj && summaryText) {
      await saveContextSummary(proj.id, summaryText);
      await clearChatHistory(proj.id);
    }
    setAllChatMessages([]);
    setMessages([]);
    setShowSummaryModal(false);
    setSummaryText("");
    addLog("[REZUMAT] Conversație reîmprospătată. Proiectul continuă.");
  }, [summaryText, setMessages, addLog]);

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

  // Deploy handler
  const handleDeployClick = useCallback(async () => {
    if (!currentProjectRef.current || files.length === 0 || deploying) return;
    setDeploying(true);
    setDeployError(null);
    toast("Se publică proiectul...", "info");
    addLog("[DEPLOY] Se publică proiectul...");

    try {
      const token = await getAccessToken();
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId: currentProjectRef.current.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setDeployError(data.error || "Eroare la deploy");
        toast(data.error || "Eroare la publicare", "error");
        addLog(`[ERR] Deploy eșuat: ${data.error}`);
        return;
      }

      setDeployUrl(data.url);
      if (data.cached) {
        toast("Site-ul e deja la zi! Nicio modificare detectată.", "success");
        addLog("[DEPLOY] Nicio modificare — site-ul e deja la zi!");
      } else {
        toast(`Publicat cu succes! ${data.url}`, "success");
        addLog(`[DEPLOY] Publicat! ${data.url}`);
        if (data.creditsCost > 0) {
          addLog(`[DEPLOY] Cost: ${data.creditsCost} credite`);
          refreshCreditsRef.current?.();
        }
      }
    } catch {
      setDeployError("Eroare de conexiune");
      toast("Eroare de conexiune la serverele de deploy", "error");
      addLog("[ERR] Deploy eșuat — verifică conexiunea");
    } finally {
      setDeploying(false);
    }
  }, [files, deploying, addLog, toast]);

  // Load deploy status + custom domain when project opens
  useEffect(() => {
    if (!currentProject || !user) return;
    (async () => {
      const token = await getAccessToken();
      const [deployRes, domainRes] = await Promise.all([
        fetch(`/api/deploy?projectId=${currentProject.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`/api/deploy/domain?projectId=${currentProject.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ]);
      const deployData = await deployRes.json();
      if (deployData.deployment?.url) setDeployUrl(deployData.deployment.url);
      else setDeployUrl(null);

      const domainData = await domainRes.json();
      if (domainData.domain) {
        setDomainInfo({ domain: domainData.domain, verified: domainData.verified, dnsRecords: domainData.dnsRecords });
      } else {
        setDomainInfo(null);
      }
    })();
  }, [currentProject, user]);

  // Connect custom domain handler
  const handleConnectDomain = useCallback(async () => {
    if (!currentProjectRef.current || !domainInput.trim() || domainLoading) return;
    setDomainLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/deploy/domain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId: currentProjectRef.current.id, domain: domainInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Eroare la conectarea domeniului", "error");
        addLog(`[DOMENIU] Eroare: ${data.error}`);
        return;
      }
      setDomainInfo({ domain: data.domain, verified: data.verified, dnsRecords: data.dnsRecords });
      toast(`${data.domain} adăugat! Configurează DNS-ul.`, "success");
      addLog(`[DOMENIU] ${data.domain} adăugat! Configurează DNS-ul.`);
      refreshCreditsRef.current?.();
      setDomainInput("");
    } catch {
      toast("Eroare de conexiune", "error");
      addLog("[DOMENIU] Eroare de conexiune");
    } finally {
      setDomainLoading(false);
    }
  }, [domainInput, domainLoading, addLog, toast]);

  // Check domain verification
  const handleCheckDomain = useCallback(async () => {
    if (!currentProjectRef.current) return;
    const token = await getAccessToken();
    const res = await fetch(`/api/deploy/domain?projectId=${currentProjectRef.current.id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await res.json();
    if (data.domain) {
      setDomainInfo({ domain: data.domain, verified: data.verified, dnsRecords: data.dnsRecords });
      addLog(data.verified ? `[DOMENIU] ${data.domain} verificat!` : `[DOMENIU] ${data.domain} — DNS nu e configurat încă`);
    }
  }, [addLog]);

  const activeContent = files.find((f) => f.path === activeFile)?.content || "";
  const hasCode = files.length > 0;
  const isEmpty = messages.length === 0 && allChatMessages.length === 0;
  const currentModelLabel = models.find((m) => m.value === selectedModel)?.label || selectedModel;

  // Token usage tracking — budget from user's plan
  const userPlan = PLANS[profile?.plan || "free"] || PLANS.free;
  const contextTokens = allChatMessages.reduce((sum, m) => sum + estimateTokens(m.content), 0)
    + files.reduce((sum, f) => sum + estimateTokens(f.content), 0);
  const contextBudget = userPlan.contextBudget;
  const contextPercent = Math.min(100, Math.round((contextTokens / contextBudget) * 100));
  const contextNearLimit = contextPercent > 80;
  const contextAtLimit = contextPercent >= 90;

  // Auto-trigger summary at 90% context
  useEffect(() => {
    if (contextAtLimit && !showSummaryModal && !summaryLoading && allChatMessages.length > 4) {
      triggerSummary();
    }
  }, [contextAtLimit, showSummaryModal, summaryLoading, allChatMessages.length, triggerSummary]);

  // Auth loading / redirect
  if (authLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-[#6366f1] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" data-workspace>
      {/* Header */}
      <header className="h-12 flex-shrink-0 glass-header border-b border-border flex items-center justify-between px-3 gap-2">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Sparkles className="w-5 h-5 text-[#6366f1]" />
          <span className="text-base font-bold"><span className="gradient-text">Creaza</span><span className="text-foreground">App</span></span>
        </Link>

        {/* Model indicator or selector based on plan */}
        {profile?.plan === "pro" || profile?.plan === "ultra" ? (
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="hidden md:block h-8 w-[240px] bg-card border border-border text-foreground text-sm rounded-lg px-3 outline-none focus:border-[#6366f1] cursor-pointer"
          >
            {(profile.plan === "ultra"
              ? models.filter((m) => ["anthropic/claude-opus-4-6","anthropic/claude-sonnet-4","openai/gpt-4.1","google/gemini-2.5-pro-preview","deepseek/deepseek-r1"].includes(m.value))
              : models.filter((m) => ["anthropic/claude-sonnet-4","anthropic/claude-3.5-sonnet","openai/gpt-4.1","google/gemini-2.5-pro-preview","deepseek/deepseek-r1"].includes(m.value))
            ).map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        ) : (
          <div className="hidden md:flex items-center gap-2 h-8 bg-card border border-border text-foreground text-sm rounded-lg px-3">
            <Sparkles className="w-3.5 h-3.5 text-[#6366f1]" />
            <span className="text-xs text-muted-foreground">{profile?.plan === "starter" ? "Haiku 4.5" : "Sonnet 4"}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Project selector — hidden on mobile */}
          <div className="relative hidden md:block">
            <button onClick={() => setShowProjects(!showProjects)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-foreground bg-card border border-border rounded-lg hover:border-[#6366f1] max-w-[200px]">
              <FolderTree className="w-4 h-4 text-[#6366f1] shrink-0" />
              <span className="truncate">{currentProject?.name || "Niciun proiect"}</span>
            </button>
            {showProjects && (
              <div className="absolute right-0 top-full mt-1 w-[280px] bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="p-2 border-b border-border">
                  <div className="flex gap-1">
                    <input value={projectName} onChange={(e) => setProjectName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleNewProject()} placeholder="Nume proiect nou..." className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-[#6366f1]" />
                    <button onClick={handleNewProject} className="bg-[#6366f1] text-white px-2 py-1 rounded text-xs"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>
                <ScrollArea className="max-h-[200px]">
                  {projects.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-3 text-center">Niciun proiect încă</p>
                  ) : (
                    projects.map((p) => (
                      <button key={p.id} onClick={() => openProject(p.id)} className={cn("w-full flex items-center justify-between px-3 py-2 text-left hover:bg-accent transition-colors", currentProject?.id === p.id && "bg-[#6366f1]/10")}>
                        <div>
                          <p className="text-xs text-foreground font-medium">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(p.updated_at).toLocaleDateString("ro-RO")}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id).then(() => listProjects(userRef.current?.id).then(setProjects)); }} className="p-1 hover:bg-red-500/20 rounded opacity-0 group-hover:opacity-100"><X className="w-3 h-3 text-muted-foreground" /></button>
                      </button>
                    ))
                  )}
                </ScrollArea>
              </div>
            )}
          </div>
          <button onClick={() => files.length > 0 && downloadZip(files)} disabled={!hasCode} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-card rounded-lg disabled:opacity-30">
            <Download className="w-4 h-4" />
          </button>
          {/* Deploy button */}
          <button
            onClick={handleDeployClick}
            disabled={!hasCode || deploying}
            className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-[#10b981] to-[#059669] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {deploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">{deploying ? "Se publică..." : "Publică"}</span>
          </button>
          {/* Deploy URL indicator + Domain button */}
          {deployUrl && !deploying && (
            <>
              <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#10b981] hover:text-[#34d399] bg-[#10b981]/10 rounded-lg transition-colors" title={deployUrl}>
                <Globe className="w-3.5 h-3.5" />
                <span className="max-w-[120px] truncate">Live</span>
              </a>
              <div className="relative hidden md:block">
                <button
                  onClick={() => setShowDomainModal(!showDomainModal)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors", domainInfo?.verified ? "text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30" : "text-foreground bg-card border-border hover:border-[#6366f1]")}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{domainInfo?.domain || "Domeniu"}</span>
                </button>
                {showDomainModal && (
                  <div className="absolute right-0 top-full mt-1 w-[340px] bg-card border border-border rounded-lg shadow-xl z-50 p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Domeniu custom</h3>
                    {domainInfo ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2.5 h-2.5 rounded-full", domainInfo.verified ? "bg-[#10b981]" : "bg-amber-500 animate-pulse")} />
                          <span className="text-sm text-foreground font-medium">{domainInfo.domain}</span>
                          <span className={cn("text-xs", domainInfo.verified ? "text-[#10b981]" : "text-amber-500")}>
                            {domainInfo.verified ? "Conectat" : "DNS neconfigurat"}
                          </span>
                        </div>
                        {!domainInfo.verified && domainInfo.dnsRecords && (
                          <div className="bg-background rounded-lg p-3 space-y-2">
                            <p className="text-xs text-muted-foreground mb-2">Adaugă în DNS-ul domeniului tău:</p>
                            {domainInfo.dnsRecords.map((r, i) => (
                              <div key={i} className="flex gap-3 text-xs font-mono">
                                <span className="text-[#6366f1] font-bold">{r.type}</span>
                                <span className="text-foreground">{r.name}</span>
                                <span className="text-muted-foreground">→</span>
                                <span className="text-foreground">{r.value}</span>
                              </div>
                            ))}
                            <button onClick={handleCheckDomain} className="mt-2 text-xs text-[#6366f1] hover:underline font-medium">Verifică acum</button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">Conectează propriul domeniu (50 credite)</p>
                        <div className="flex gap-2">
                          <input
                            value={domainInput}
                            onChange={(e) => setDomainInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleConnectDomain()}
                            placeholder="mysite.ro"
                            className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#6366f1]"
                          />
                          <button
                            onClick={handleConnectDomain}
                            disabled={!domainInput.trim() || domainLoading}
                            className="bg-[#6366f1] text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
                          >
                            {domainLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Conectează"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
          <button onClick={handleRun} disabled={!hasCode} className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white px-3 py-1.5 rounded-lg text-xs font-medium btn-primary-glow disabled:opacity-40">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <div className="hidden md:flex items-center gap-2 ml-2 pl-2 border-l border-border">
            {profile && (
              <Link href="/preturi" className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[18px] font-bold hover:opacity-80 transition-opacity", profile.totalCredits <= 5 ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-card border-border text-[#f59e0b]")}>
                <Zap className="w-4 h-4" />
                {Number.isInteger(profile.totalCredits) ? profile.totalCredits : profile.totalCredits.toFixed(1)}
              </Link>
            )}
            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{user.email}</span>
            <button onClick={() => signOut().then(() => router.push("/login"))} className="text-[10px] text-muted-foreground hover:text-red-400 transition-colors">Ieși</button>
          </div>
        </div>
      </header>

      {/* ===== MOBILE LAYOUT ===== */}
      <div className="flex-1 flex flex-col overflow-hidden md:hidden">
        {/* Mobile content — one view at a time */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat view */}
          {mobileTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-background">
              {/* Model indicator or selector */}
              <div className="shrink-0 px-3 py-2 border-b border-border">
                {profile?.plan === "pro" || profile?.plan === "ultra" ? (
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full h-9 bg-card border border-border text-foreground text-sm rounded-lg px-3 outline-none focus:border-[#6366f1]"
                >
                  {(profile.plan === "ultra"
                    ? models.filter((m) => ["anthropic/claude-opus-4-6","anthropic/claude-sonnet-4","openai/gpt-4.1","google/gemini-2.5-pro-preview","deepseek/deepseek-r1"].includes(m.value))
                    : models.filter((m) => ["anthropic/claude-sonnet-4","anthropic/claude-haiku-4.5","openai/gpt-4.1","google/gemini-2.5-pro-preview","google/gemini-2.5-flash","deepseek/deepseek-r1"].includes(m.value))
                  ).map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                ) : (
                <div className="flex items-center gap-2 h-9 bg-card border border-border text-foreground text-sm rounded-lg px-3">
                  <Sparkles className="w-3.5 h-3.5 text-[#6366f1]" />
                  <span className="text-xs text-muted-foreground">{profile?.plan === "starter" ? "Haiku 4.5" : "Sonnet 4"}</span>
                </div>
                )}
              </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {isEmpty ? (
              <div className="p-4 flex flex-col items-center">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#6366f1]/20 to-[#a855f7]/20 flex items-center justify-center mb-4 mt-8">
                  <Sparkles className="w-7 h-7 text-[#6366f1]" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">Ce vrei să construiești?</h3>
                <p className="text-xs text-muted-foreground mb-4 text-center">Descrie aplicația și o generez instant</p>
                <div className="w-full space-y-2">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => handleSuggestion(s.text)} className="w-full bg-card hover:bg-accent border border-border rounded-lg p-3 flex items-center gap-2 text-left transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.color}20` }}>
                        <s.icon className="w-4 h-4" style={{ color: s.color }} />
                      </div>
                      <span className="text-xs text-foreground">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ChatMessages
                allChatMessages={allChatMessages}
                streamingMessages={messages}
                isLoading={isLoading}
                status={status}
                lastCreditCost={lastCreditCost}
                error={error}
                onSwitchFreeModel={() => {}}
                bottomRef={bottomRef}
              />
            )}
          </div>

          {/* Chat Input */}
          <ChatInput
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            attachments={attachments}
            onSubmit={handleSubmit}
            onStop={stop}
            onFileUpload={handleFileUpload}
            onRemoveAttachment={removeAttachment}
            textareaRef={textareaRef}
          />
            </div>
          )}

          {/* Mobile Code view */}
          {mobileTab === "code" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-background">
              {hasCode && (
                <div className="h-9 flex items-center gap-0.5 px-2 bg-background border-b border-border overflow-x-auto">
                  {files.map((f) => {
                    const name = f.path.split("/").pop() || f.path;
                    const ext = name.split(".").pop() || "";
                    const isActive = f.path === activeFile;
                    return (
                      <button key={f.path} onClick={() => setActiveFile(f.path)} className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-t border border-b-0 whitespace-nowrap transition-colors", isActive ? "bg-card text-foreground border-border" : "text-muted-foreground border-transparent")}>
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
                  <Code className="w-12 h-12 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">Codul generat de AI va apărea aici</p>
                </div>
              )}
            </div>
          )}

          {/* Mobile Preview view */}
          {mobileTab === "preview" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-background">
              {previewUrl ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                    <div className="flex-1 flex items-center gap-1.5 bg-card rounded-md px-2.5 py-1 text-[11px] border border-border">
                      <Globe className="w-3 h-3 text-[#10b981] shrink-0" />
                      <span className="truncate text-muted-foreground font-mono">{previewUrl}</span>
                    </div>
                    <button onClick={() => setPreviewKey((k) => k + 1)} className="p-1.5 rounded hover:bg-card">
                      <RefreshCw className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => previewHtml && openPreviewInNewTab(previewHtml)} className="p-1.5 rounded hover:bg-card">
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <iframe key={previewKey} srcDoc={previewHtml || ""} className="w-full h-full border-0 bg-white" title="Preview" sandbox="allow-scripts allow-forms" />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <Globe className="w-12 h-12 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">{isLoading ? "AI-ul generează codul..." : "Scrie un prompt și preview-ul apare automat"}</p>
                  {isLoading && <Loader2 className="w-5 h-5 text-[#6366f1] animate-spin mt-2" />}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Bottom Nav */}
        <div className="shrink-0 flex border-t border-border bg-background safe-area-bottom">
          <button onClick={() => setMobileTab("chat")} className={cn("flex-1 flex flex-col items-center gap-0.5 py-2.5", mobileTab === "chat" ? "text-[#6366f1]" : "text-muted-foreground")}>
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium">Chat</span>
          </button>
          <button onClick={() => setMobileTab("code")} className={cn("flex-1 flex flex-col items-center gap-0.5 py-2.5 relative", mobileTab === "code" ? "text-[#6366f1]" : "text-muted-foreground")}>
            <Code className="w-5 h-5" />
            <span className="text-[10px] font-medium">Cod</span>
            {hasCode && <span className="absolute top-1.5 right-[calc(50%-2px)] translate-x-3 w-1.5 h-1.5 rounded-full bg-[#6366f1]" />}
          </button>
          <button onClick={() => setMobileTab("preview")} className={cn("flex-1 flex flex-col items-center gap-0.5 py-2.5 relative", mobileTab === "preview" ? "text-[#6366f1]" : "text-muted-foreground")}>
            <Eye className="w-5 h-5" />
            <span className="text-[10px] font-medium">Preview</span>
            {previewUrl && <span className="absolute top-1.5 right-[calc(50%-2px)] translate-x-3 w-1.5 h-1.5 rounded-full bg-[#10b981]" />}
          </button>
          <button onClick={handleDeployClick} disabled={!hasCode || deploying} className={cn("flex-1 flex flex-col items-center gap-0.5 py-2.5 relative", deployUrl ? "text-[#10b981]" : "text-muted-foreground", "disabled:opacity-30")}>
            {deploying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
            <span className="text-[10px] font-medium">{deploying ? "..." : "Publică"}</span>
            {deployUrl && <span className="absolute top-1.5 right-[calc(50%-2px)] translate-x-3 w-1.5 h-1.5 rounded-full bg-[#10b981]" />}
          </button>
        </div>
      </div>

      {/* ===== DESKTOP LAYOUT (unchanged) ===== */}
      <div className="flex-1 hidden md:flex overflow-hidden">
        {/* Chat Sidebar */}
        <div className={cn("bg-background border-r border-border flex flex-col transition-all duration-200 overflow-hidden min-w-0", isChatOpen ? "flex-1" : "w-0")}>
          <div className="h-10 flex items-center px-3 border-b border-border shrink-0">
            <Sparkles className="w-4 h-4 text-[#6366f1] mr-2" />
            <span className="text-sm text-foreground font-medium">Chat AI</span>
            <div className="ml-auto flex items-center gap-2">
              {isLoading && <span className="text-[10px] text-[#6366f1] animate-pulse">generare...</span>}
              {!isEmpty && (
                <div className="flex items-center gap-1.5" title={`${contextTokens.toLocaleString()} / ${(contextBudget / 1000).toFixed(0)}K tokeni`}>
                  <div className="w-16 h-1.5 bg-card rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", contextNearLimit ? "bg-amber-500" : "bg-[#6366f1]")} style={{ width: `${contextPercent}%` }} />
                  </div>
                  <span className={cn("text-[9px]", contextNearLimit ? "text-amber-500" : "text-muted-foreground")}>{contextPercent}%</span>
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
                <h3 className="text-base font-semibold text-foreground mb-1">Ce vrei să construiești?</h3>
                <p className="text-xs text-muted-foreground mb-4 text-center">Descrie aplicația și o generez instant</p>
                <div className="w-full space-y-2">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => handleSuggestion(s.text)} className="w-full bg-card hover:bg-accent border border-border rounded-lg p-3 flex items-center gap-2 text-left transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.color}20` }}>
                        <s.icon className="w-4 h-4" style={{ color: s.color }} />
                      </div>
                      <span className="text-xs text-foreground">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ChatMessages
                allChatMessages={allChatMessages}
                streamingMessages={messages}
                isLoading={isLoading}
                status={status}
                lastCreditCost={lastCreditCost}
                error={error}
                onSwitchFreeModel={() => {}}
                bottomRef={bottomRef}
              />
            )}
          </div>

          <ChatInput
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            attachments={attachments}
            onSubmit={handleSubmit}
            onStop={stop}
            onFileUpload={handleFileUpload}
            onRemoveAttachment={removeAttachment}
          />
        </div>

        {/* Main Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-10 flex items-center justify-between px-3 border-b border-border bg-background">
            <div className="flex items-center gap-2">
              <button onClick={() => setIsChatOpen(!isChatOpen)} className="p-1.5 rounded hover:bg-card">
                {isChatOpen ? <PanelLeftClose className="w-4 h-4 text-muted-foreground" /> : <PanelLeftOpen className="w-4 h-4 text-muted-foreground" />}
              </button>
              <div className="flex bg-card border border-border rounded-lg h-8">
                <button onClick={() => setActiveTab("code")} className={cn("flex items-center gap-1.5 px-3 text-xs rounded-lg transition-colors", activeTab === "code" ? "bg-accent text-foreground" : "text-muted-foreground")}>
                  <Code className="w-3.5 h-3.5" />Cod
                  {hasCode && <span className="bg-[#6366f1]/20 text-[#6366f1] text-[10px] px-1 rounded">{files.length}</span>}
                </button>
                <button onClick={() => setActiveTab("preview")} className={cn("flex items-center gap-1.5 px-3 text-xs rounded-lg transition-colors", activeTab === "preview" ? "bg-accent text-foreground" : "text-muted-foreground")}>
                  <Eye className="w-3.5 h-3.5" />Preview
                  {previewUrl && <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsTerminalOpen(!isTerminalOpen)} className={cn("p-1.5 rounded", isTerminalOpen ? "bg-card text-foreground" : "text-muted-foreground")}>
                <TerminalIcon className="w-4 h-4" />
              </button>
              <button onClick={handleUndo} disabled={fileHistory.length === 0} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-card disabled:opacity-30 transition-colors" title="Undo">
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
                  <div className="h-9 flex items-center gap-0.5 px-2 bg-background border-b border-border">
                    {files.map((f) => {
                      const name = f.path.split("/").pop() || f.path;
                      const ext = name.split(".").pop() || "";
                      const isActive = f.path === activeFile;
                      return (
                        <button key={f.path} onClick={() => setActiveFile(f.path)} className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-t border border-b-0 transition-colors", isActive ? "bg-card text-foreground border-border" : "text-muted-foreground border-transparent hover:text-foreground")}>
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
                    <Code className="w-12 h-12 text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground">Codul generat de AI va apărea aici</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {previewUrl ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-background">
                      <div className="flex gap-1.5 mr-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                      </div>
                      <div className="flex-1 flex items-center gap-1.5 bg-card rounded-md px-2.5 py-1 text-[11px] border border-border">
                        <Globe className="w-3 h-3 text-[#10b981] shrink-0" />
                        <span className="truncate text-muted-foreground font-mono">{previewUrl}</span>
                      </div>
                      <button onClick={() => setViewMode(viewMode === "desktop" ? "mobile" : "desktop")} className="p-1 rounded hover:bg-card">
                        {viewMode === "desktop" ? <Monitor className="w-4 h-4 text-muted-foreground" /> : <Smartphone className="w-4 h-4 text-[#6366f1]" />}
                      </button>
                      <button onClick={() => setPreviewKey((k) => k + 1)} className="p-1 rounded hover:bg-card">
                        <RefreshCw className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => previewHtml && openPreviewInNewTab(previewHtml)} className="p-1 rounded hover:bg-card">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="flex-1 flex items-start justify-center bg-card overflow-hidden">
                      <iframe key={previewKey} srcDoc={previewHtml || ""} className={cn("h-full border-0 bg-white transition-all", viewMode === "mobile" ? "w-[375px] rounded-xl shadow-2xl my-3" : "w-full")} title="Preview" sandbox="allow-scripts allow-forms" />
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <Globe className="w-12 h-12 text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground">{isLoading ? "AI-ul generează codul..." : "Scrie un prompt și preview-ul apare automat"}</p>
                    {isLoading && <Loader2 className="w-5 h-5 text-[#6366f1] animate-spin mt-2" />}
                  </div>
                )}
              </div>
            )}
          </div>

          {isTerminalOpen && (
            <div className="h-[180px] border-t border-border flex-shrink-0">
              <Terminal logs={terminalLogs} />
            </div>
          )}
        </div>
      </div>

      {/* Summary Modal */}
      {showSummaryModal && (
        <SummaryModal
          summary={summaryText}
          isLoading={summaryLoading}
          canChooseModel={userPlan.canChooseModel}
          plan={profile?.plan || "free"}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onContinue={handleContinueAfterSummary}
        />
      )}
    </div>
  );
}
