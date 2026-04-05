"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Loader2, AlertCircle, Monitor, Smartphone } from "lucide-react";
import { detectLibraries, generateCdnTags, CDN_LIBRARIES } from "@/lib/cdn-libraries";

const ESM_PACKAGES = new Set(
  CDN_LIBRARIES.flatMap(lib => lib.esm ? Object.keys(lib.esm) : [])
);

function stripModuleSyntax(code: string): string {
  return code
    .replace(/^import\s+.*?from\s+['"](.*?)['"];?\s*$/gm, (match, pkg) => {
      return ESM_PACKAGES.has(pkg) ? match : "";
    })
    .replace(/^import\s+['"].*?['"];?\s*$/gm, "")
    .replace(/^export\s+default\s+/gm, "")
    .replace(/^export\s+/gm, "")
    .replace(/module\.exports\s*=\s*/g, "");
}

function buildPreviewHtml(files: { path: string; content: string }[], projectId?: string): string {
  const pidScript = projectId ? `<script>var PROJECT_ID="${projectId}";</script>` : "";
  const cdnLibs = detectLibraries(files);
  const cdn = generateCdnTags(cdnLibs);

  const htmlFile = files.find((f) => f.path.endsWith(".html"));
  if (htmlFile) {
    let html = htmlFile.content;
    if (pidScript || cdn.styles || cdn.scripts || cdn.importMap) {
      html = html.replace("<head>", `<head>\n  ${pidScript}\n  ${cdn.importMap}\n  ${cdn.styles}`);
      html = html.replace("</head>", `  ${cdn.scripts}\n</head>`);
    }
    for (const f of files) {
      if (f.path === htmlFile.path) continue;
      if (f.path.endsWith(".css")) {
        const linkRegex = new RegExp(`<link[^>]*href=["']${f.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*/?>`, "gi");
        html = html.replace(linkRegex, `<style>${f.content}</style>`);
      }
      if (f.path.endsWith(".js") || f.path.endsWith(".jsx") || f.path.endsWith(".tsx")) {
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
  ${pidScript}
  ${cdn.importMap}
  ${cdn.styles}
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <script src="https://cdn.tailwindcss.com"><\/script>
  ${cdn.scripts}
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

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`/api/share/${token}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Link invalid");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setProjectName(data.name);
        const html = buildPreviewHtml(data.files, data.projectId);
        setPreviewHtml(html);
      } catch {
        setError("Eroare la incarcarea proiectului");
      }
      setLoading(false);
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin" />
        <p className="text-sm text-muted-foreground">Se incarca proiectul...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <h1 className="text-xl font-semibold text-foreground">{error}</h1>
        <p className="text-sm text-muted-foreground">Acest link nu este valid sau a fost dezactivat.</p>
        <Link href="/" className="mt-4 inline-flex items-center gap-2 bg-[#6366f1] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90">
          <Sparkles className="w-4 h-4" />
          Creeaza propria aplicatie
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-11 flex-shrink-0 border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#6366f1]" />
            <span className="text-sm font-bold"><span className="gradient-text">Creaza</span><span className="text-foreground">App</span></span>
          </Link>
          <span className="text-xs text-muted-foreground">|</span>
          <span className="text-sm text-foreground font-medium truncate max-w-[300px]">{projectName}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-card border border-border rounded-lg p-0.5">
            <button onClick={() => setViewMode("desktop")} className={`p-1.5 rounded ${viewMode === "desktop" ? "bg-[#6366f1]/20 text-[#6366f1]" : "text-muted-foreground"}`}>
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode("mobile")} className={`p-1.5 rounded ${viewMode === "mobile" ? "bg-[#6366f1]/20 text-[#6366f1]" : "text-muted-foreground"}`}>
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
          <Link href="/login" className="inline-flex items-center gap-1.5 bg-[#6366f1] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90">
            <Sparkles className="w-3 h-3" />
            Creeaza si tu
          </Link>
        </div>
      </header>

      {/* Preview */}
      <div className="flex-1 flex items-center justify-center bg-[#0a0a14] p-2">
        {previewHtml ? (
          <iframe
            srcDoc={previewHtml}
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
            className={`bg-white rounded-lg shadow-2xl transition-all duration-300 ${
              viewMode === "mobile" ? "w-[375px] h-[667px]" : "w-full h-full"
            }`}
            title={projectName}
          />
        ) : (
          <p className="text-muted-foreground">Acest proiect nu are continut de afisat.</p>
        )}
      </div>
    </div>
  );
}
