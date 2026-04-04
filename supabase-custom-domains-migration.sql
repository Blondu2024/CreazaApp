-- ============================================
-- Custom domains — users connect their own domain
-- ============================================

ALTER TABLE deployments
  ADD COLUMN IF NOT EXISTS custom_domain TEXT,
  ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT false;

CREATE INDEX idx_deployments_custom_domain ON deployments(custom_domain)
  WHERE custom_domain IS NOT NULL;
