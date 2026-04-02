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

// Project CRUD
export async function createProject(name: string, model: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .insert({ name, model })
    .select()
    .single();
  if (error) { console.error("createProject:", error); return null; }
  return data;
}

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });
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
