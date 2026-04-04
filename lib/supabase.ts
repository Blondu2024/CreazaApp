import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  cookieOptions: {
    maxAge: 60 * 60 * 24 * 400, // 400 days (max allowed by browsers)
    path: "/",
    sameSite: "lax",
    secure: true,
  },
});

// Types
export interface Project {
  id: string;
  name: string;
  description: string;
  model: string;
  context_summary: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  path: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  project_id: string;
  role: string;
  content: string;
  created_at: string;
}

// Get current access token for API calls
export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// Get GitHub provider token (for GitHub API calls like repo export)
export async function getGitHubToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.provider_token || null;
}

// Auth (OAuth only)
export async function signInWithGoogle() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=/workspace` },
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function signInWithGitHub() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: `${origin}/auth/callback?next=/workspace` },
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function onAuthChange(callback: (user: unknown, event?: string) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null, event);
  });
}

// Project CRUD
export async function createProject(name: string, model: string, userId?: string): Promise<Project | null> {
  const row: Record<string, string> = { name, model };
  if (userId) row.user_id = userId;
  const { data, error } = await supabase
    .from("projects")
    .insert(row)
    .select()
    .single();
  if (error) { console.error("createProject:", error); return null; }
  return data;
}

export async function listProjects(userId?: string): Promise<Project[]> {
  let query = supabase.from("projects").select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) { console.error("listProjects:", error); return []; }
  return data || [];
}

export async function deleteProject(id: string): Promise<boolean> {
  // Soft delete — marcăm deleted_at, datele rămân 48h
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) { console.error("deleteProject:", error); return false; }
  return true;
}

export async function restoreProject(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) { console.error("restoreProject:", error); return false; }
  return true;
}

export async function listDeletedProjects(userId?: string): Promise<Project[]> {
  let query = supabase.from("projects").select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) { console.error("listDeletedProjects:", error); return []; }
  return data || [];
}

export async function updateProjectTimestamp(id: string) {
  await supabase.from("projects").update({ updated_at: new Date().toISOString() }).eq("id", id);
}

export async function renameProject(id: string, name: string) {
  await supabase.from("projects").update({ name, updated_at: new Date().toISOString() }).eq("id", id);
}

// Files
export async function saveFiles(projectId: string, files: { path: string; content: string }[]) {
  if (files.length === 0) {
    await supabase.from("project_files").delete().eq("project_id", projectId);
    return;
  }
  // Delete old files first, then insert new ones
  // If insert fails, we retry once — avoids permanent data loss
  await supabase.from("project_files").delete().eq("project_id", projectId);
  const rows = files.map((f) => ({ project_id: projectId, path: f.path, content: f.content }));
  const { error } = await supabase.from("project_files").insert(rows);
  if (error) {
    console.error("saveFiles insert failed, retrying:", error);
    const { error: retryError } = await supabase.from("project_files").insert(rows);
    if (retryError) console.error("saveFiles retry failed:", retryError);
  }
}

export async function loadFiles(projectId: string): Promise<{ path: string; content: string }[]> {
  const { data, error } = await supabase
    .from("project_files")
    .select("path, content")
    .eq("project_id", projectId);
  if (error) { console.error("loadFiles:", error); return []; }
  return data || [];
}

// Chat messages
export async function saveChatMessage(projectId: string, role: string, content: string) {
  const { error } = await supabase
    .from("chat_messages")
    .insert({ project_id: projectId, role, content });
  if (error) console.error("saveChatMessage:", error);
}

export async function loadChatHistory(projectId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) { console.error("loadChatHistory:", error); return []; }
  return data || [];
}

export async function clearChatHistory(projectId: string) {
  await supabase.from("chat_messages").delete().eq("project_id", projectId);
}

// Context summary
export async function saveContextSummary(projectId: string, summary: string) {
  const { error } = await supabase
    .from("projects")
    .update({ context_summary: summary })
    .eq("id", projectId);
  if (error) console.error("saveContextSummary:", error);
}

// Auto-build context summary from current state (no AI needed, instant)
export function buildContextSummary(
  projectName: string,
  files: { path: string; content: string }[],
  recentMessages: { role: string; content: string }[]
): string {
  const fileList = files.map((f) => {
    const lines = f.content.split("\n").length;
    return `- ${f.path} (${lines} linii)`;
  }).join("\n");

  // Extract last 5 user requests as "history"
  const userRequests = recentMessages
    .filter((m) => m.role === "user")
    .slice(-5)
    .map((m) => `- ${m.content.slice(0, 150)}`)
    .join("\n");

  // Extract last AI action
  const lastAiMsg = [...recentMessages].reverse().find((m) => m.role === "assistant");
  const lastAction = lastAiMsg
    ? lastAiMsg.content.replace(/```[\s\S]*?```/g, "[cod]").slice(0, 300)
    : "Proiect nou";

  return `PROIECT: ${projectName}
FIȘIERE:
${fileList || "- niciun fișier încă"}
ULTIMELE CERERI:
${userRequests || "- nicio cerere încă"}
ULTIMA ACȚIUNE AI:
${lastAction}
TOTAL: ${files.length} fișiere, ${recentMessages.length} mesaje`;
}

export async function loadContextSummary(projectId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("context_summary")
    .eq("id", projectId)
    .single();
  if (error) { console.error("loadContextSummary:", error); return null; }
  return data?.context_summary || null;
}
