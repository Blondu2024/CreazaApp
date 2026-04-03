-- ============================================
-- CreazaApp — Soft Delete Projects (48h retention)
-- Rulează în Supabase SQL Editor
-- ============================================

-- Add deleted_at column to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for finding deleted projects to clean up
CREATE INDEX IF NOT EXISTS idx_projects_deleted
  ON projects(deleted_at)
  WHERE deleted_at IS NOT NULL;
