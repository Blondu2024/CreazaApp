import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Types
export interface Project {
  id: string;
  name: string;
  description: string;
  model: string;
  context_summary: string | null;
  created_at: string;
  updated_at: string;
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

// Auth
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { user: null, error: error.message };
  return { user: data.user, error: null };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: error.message };
  return { user: data.user, error: null };
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/workspace` },
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

export function onAuthChange(callback: (user: unknown) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
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
  let query = supabase.from("projects").select("*").order("updated_at", { ascending: false });
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) { console.error("listProjects:", error); return []; }
  return data || [];
}

export async function deleteProject(id: string): Promise<boolean> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) { console.error("deleteProject:", error); return false; }
  return true;
}

export async function updateProjectTimestamp(id: string) {
  await supabase.from("projects").update({ updated_at: new Date().toISOString() }).eq("id", id);
}

// Files
export async function saveFiles(projectId: string, files: { path: string; content: string }[]) {
  // Delete old files, insert new ones
  await supabase.from("project_files").delete().eq("project_id", projectId);
  if (files.length === 0) return;
  const rows = files.map((f) => ({ project_id: projectId, path: f.path, content: f.content }));
  const { error } = await supabase.from("project_files").insert(rows);
  if (error) console.error("saveFiles:", error);
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
