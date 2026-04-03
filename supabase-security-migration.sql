-- ============================================
-- CreazaApp — Security: RLS policies
-- Rulează în Supabase SQL Editor
-- ============================================
-- Userii pot doar CITI propriul profil
-- Doar serverul (service role) poate modifica credite/plan
-- ============================================

-- user_profiles: BLOCK client INSERT/UPDATE/DELETE
-- (SELECT policy already exists)
DROP POLICY IF EXISTS "block_client_insert_profile" ON user_profiles;
DROP POLICY IF EXISTS "block_client_update_profile" ON user_profiles;
DROP POLICY IF EXISTS "block_client_delete_profile" ON user_profiles;

CREATE POLICY "block_client_insert_profile"
  ON user_profiles FOR INSERT
  WITH CHECK (false);

CREATE POLICY "block_client_update_profile"
  ON user_profiles FOR UPDATE
  USING (false);

CREATE POLICY "block_client_delete_profile"
  ON user_profiles FOR DELETE
  USING (false);

-- credit_transactions: BLOCK client INSERT/UPDATE/DELETE
-- (SELECT policy already exists)
DROP POLICY IF EXISTS "block_client_insert_transactions" ON credit_transactions;
DROP POLICY IF EXISTS "block_client_update_transactions" ON credit_transactions;
DROP POLICY IF EXISTS "block_client_delete_transactions" ON credit_transactions;

CREATE POLICY "block_client_insert_transactions"
  ON credit_transactions FOR INSERT
  WITH CHECK (false);

CREATE POLICY "block_client_update_transactions"
  ON credit_transactions FOR UPDATE
  USING (false);

CREATE POLICY "block_client_delete_transactions"
  ON credit_transactions FOR DELETE
  USING (false);
