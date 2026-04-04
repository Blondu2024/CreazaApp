"use client";

import { useEffect, useState, useCallback, useMemo, startTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Folder, Plus, Trash2, Undo2, Clock, Code, Sparkles, AlertTriangle } from "lucide-react";
import { useAuth } from "@/app/components/AuthProvider";
import { useToast } from "@/app/components/Toast";
import { Navbar } from "@/app/components/Navbar";
import { listProjects, listDeletedProjects, deleteProject, restoreProject } from "@/lib/supabase";
import type { Project } from "@/lib/supabase";

export default function ProjectsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Project | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const { toast } = useToast();

  // Refresh "now" every 60s for time display
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [active, deleted] = await Promise.all([
      listProjects(user.id),
      listDeletedProjects(user.id),
    ]);
    setProjects(active);
    setDeletedProjects(deleted);
    setNow(Date.now());
    setLoadingProjects(false);
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    startTransition(() => { refresh(); });
  }, [user, loading, router, refresh]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteProject(deleteConfirm.id);
    toast(`"${deleteConfirm.name}" mutat în coș. Poți restaura în 48h.`, "success");
    setDeleteConfirm(null);
    refresh();
  };

  const handleRestore = async (id: string) => {
    await restoreProject(id);
    toast("Proiect restaurat cu succes", "success");
    refresh();
  };

  const openProject = (id: string) => {
    localStorage.setItem("creazaapp_last_project", id);
    router.push("/workspace");
  };

  const timeAgo = (date: string) => {
    const diff = now - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}z`;
  };

  const hoursLeft = (deletedAt: string) => {
    const diff = 48 * 60 * 60 * 1000 - (now - new Date(deletedAt).getTime());
    return Math.max(0, Math.ceil(diff / (60 * 60 * 1000)));
  };

  // Filter deleted projects that are still within 48h window
  const visibleDeletedProjects = useMemo(() =>
    deletedProjects.filter(p => {
      const deletedAt = new Date(p.deleted_at || 0).getTime();
      return now - deletedAt < 48 * 60 * 60 * 1000;
    }), [deletedProjects, now]);

  if (loading || loadingProjects) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <Sparkles className="w-6 h-6 text-primary animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Proiectele mele</h1>
            <p className="text-sm text-muted-foreground mt-1">{projects.length} proiecte active</p>
          </div>
          <div className="flex items-center gap-3">
            {visibleDeletedProjects.length > 0 && (
              <button
                onClick={() => setShowDeleted(!showDeleted)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-card transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Șterse ({visibleDeletedProjects.length})
              </button>
            )}
            <Link
              href="/workspace"
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-[#a855f7] text-white px-4 py-2 rounded-lg text-sm font-semibold btn-primary-glow"
            >
              <Plus className="w-4 h-4" />
              Proiect nou
            </Link>
          </div>
        </div>

        {/* Deleted projects banner */}
        {showDeleted && visibleDeletedProjects.length > 0 && (
          <div className="mb-8 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h3 className="text-sm font-semibold text-foreground">Proiecte șterse</h3>
              <span className="text-xs text-muted-foreground">Se șterg permanent după 48h</span>
            </div>
            <div className="space-y-2">
              {visibleDeletedProjects.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                  <div>
                    <p className="text-sm text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {hoursLeft(p.deleted_at!)}h rămase
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestore(p.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    Restaurează
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects grid */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-4">
              <Folder className="w-7 h-7 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Nu ai proiecte încă</h2>
            <p className="text-sm text-muted-foreground mb-6">Creează primul tău proiect și lasă AI-ul să scrie codul</p>
            <Link
              href="/workspace"
              className="bg-gradient-to-r from-primary to-[#a855f7] text-white px-5 py-2.5 rounded-lg text-sm font-semibold btn-primary-glow"
            >
              Creează primul proiect
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => openProject(p.id)}
                className="group text-left p-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Code className="w-5 h-5 text-primary" />
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(p); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1 truncate">{p.name}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(p.updated_at)}
                  </span>
                  <span className="truncate">{p.model?.split("/").pop()}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Șterge proiectul</h3>
                <p className="text-xs text-muted-foreground">{deleteConfirm.name}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Proiectul va fi mutat în coșul de gunoi. Datele rămân <strong className="text-foreground">48 de ore</strong> și pot fi restaurate. După 48h, ștergerea devine permanentă.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors">
                Anulează
              </button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-destructive rounded-lg hover:bg-destructive/90 transition-colors">
                Șterge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
