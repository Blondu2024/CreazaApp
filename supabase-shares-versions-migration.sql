-- ============================================
-- Project Shares — share link public read-only
-- ============================================

CREATE TABLE IF NOT EXISTS project_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_shares_project ON project_shares(project_id);
CREATE INDEX idx_shares_token ON project_shares(share_token) WHERE active = true;

ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shares"
  ON project_shares FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own shares"
  ON project_shares FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own shares"
  ON project_shares FOR UPDATE
  USING (auth.uid() = created_by);

-- ============================================
-- Project Versions — snapshot history
-- ============================================

CREATE TABLE IF NOT EXISTS project_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  files JSONB NOT NULL,            -- [{path, content}]
  label TEXT,                       -- auto from user's last message
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_versions_project ON project_versions(project_id, version_number DESC);

ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;

-- Versions inherit project access — users can see versions of their own projects
CREATE POLICY "Users can view own project versions"
  ON project_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own project versions"
  ON project_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Cleanup: max 50 versions per project (run periodically or via trigger)
CREATE OR REPLACE FUNCTION cleanup_old_versions() RETURNS trigger AS $$
BEGIN
  DELETE FROM project_versions
  WHERE id IN (
    SELECT id FROM project_versions
    WHERE project_id = NEW.project_id
    ORDER BY version_number DESC
    OFFSET 50
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_versions
  AFTER INSERT ON project_versions
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_versions();
