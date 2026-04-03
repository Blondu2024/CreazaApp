-- ============================================
-- CreazaApp — Monthly Credit Reset (Vercel Cron)
-- Rulează în Supabase SQL Editor
-- ============================================

-- Index pentru reset-uri rapide (cron caută users cu credits_reset_at <= now())
CREATE INDEX IF NOT EXISTS idx_user_profiles_reset
  ON user_profiles(credits_reset_at);
