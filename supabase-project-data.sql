-- CreazaApp: project_data table for persistent database per deployed project
-- Run this in Supabase SQL Editor: https://rzqwrrxgkxysagadampd.supabase.co

CREATE TABLE IF NOT EXISTS project_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  collection TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by project + collection
CREATE INDEX IF NOT EXISTS idx_project_data_lookup ON project_data(project_id, collection);

-- Enable RLS (block all direct client access — only service role via API)
ALTER TABLE project_data ENABLE ROW LEVEL SECURITY;

-- No RLS policies = only service_role can access (our API route uses service_role key)
-- This is intentional: all access goes through /api/db which validates project_id
