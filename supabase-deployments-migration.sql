-- ============================================
-- Deployments table — tracking deploy history + content hash caching
-- ============================================

CREATE TABLE IF NOT EXISTS deployments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  -- Vercel integration
  vercel_project_id TEXT,         -- Vercel project ID (reused across redeploys)
  vercel_deployment_id TEXT,      -- Unique per deployment

  -- URLs
  subdomain TEXT NOT NULL,        -- e.g. "my-app" → my-app.creazaapp.com
  url TEXT,                       -- Full deployment URL

  -- Caching
  content_hash TEXT NOT NULL,     -- SHA-256 of all project files — skip redeploy if unchanged

  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, building, ready, error
  error_message TEXT,

  -- Credits
  credits_charged NUMERIC(10,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_deployments_project ON deployments(project_id);
CREATE INDEX idx_deployments_user ON deployments(user_id);
CREATE INDEX idx_deployments_subdomain ON deployments(subdomain);

-- Unique subdomain constraint
CREATE UNIQUE INDEX idx_deployments_subdomain_unique
  ON deployments(subdomain)
  WHERE status != 'error';

-- RLS
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deployments"
  ON deployments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deployments"
  ON deployments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deployments"
  ON deployments FOR UPDATE
  USING (auth.uid() = user_id);
