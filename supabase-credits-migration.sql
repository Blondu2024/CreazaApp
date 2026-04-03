-- ============================================
-- CreazaApp — Credit System Migration
-- Rulează în Supabase SQL Editor
-- ============================================

-- 1. User profiles — plan + credite
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'starter', 'pro', 'ultra')),
  credits_monthly INTEGER NOT NULL DEFAULT 10,
  credits_topup INTEGER NOT NULL DEFAULT 0,
  credits_reset_at TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Credit transactions — log imutabil
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,4) NOT NULL,
  balance_after_monthly INTEGER NOT NULL,
  balance_after_topup INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('usage', 'topup', 'monthly_reset', 'plan_change')),
  description TEXT,
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user
  ON credit_transactions(user_id, created_at DESC);

-- 3. RLS — users citesc doar propriile date
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_read_own_transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Trigger — auto-creează profil la signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, plan, credits_monthly, credits_topup)
  VALUES (NEW.id, 'free', 10, 0)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. RPC — deducere atomică cu row lock
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_cost_raw NUMERIC,
  p_model TEXT,
  p_input_tokens INTEGER,
  p_output_tokens INTEGER,
  p_description TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_monthly INTEGER;
  v_topup INTEGER;
  v_cost INTEGER;
  v_remainder INTEGER;
BEGIN
  v_cost := CEIL(p_cost_raw);

  SELECT credits_monthly, credits_topup
  INTO v_monthly, v_topup
  FROM user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Auto-create profile for existing users
    INSERT INTO user_profiles (id, plan, credits_monthly, credits_topup)
    VALUES (p_user_id, 'free', 10, 0);
    v_monthly := 10;
    v_topup := 0;
  END IF;

  IF v_monthly + v_topup < v_cost THEN
    RETURN json_build_object('success', false, 'monthly', v_monthly, 'topup', v_topup);
  END IF;

  -- Consume monthly first, then topup
  IF v_monthly >= v_cost THEN
    v_monthly := v_monthly - v_cost;
  ELSE
    v_remainder := v_cost - v_monthly;
    v_monthly := 0;
    v_topup := v_topup - v_remainder;
  END IF;

  UPDATE user_profiles
  SET credits_monthly = v_monthly, credits_topup = v_topup, updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO credit_transactions (user_id, amount, balance_after_monthly, balance_after_topup, type, description, model, input_tokens, output_tokens)
  VALUES (p_user_id, -p_cost_raw, v_monthly, v_topup, 'usage', p_description, p_model, p_input_tokens, p_output_tokens);

  RETURN json_build_object('success', true, 'monthly', v_monthly, 'topup', v_topup);
END;
$$;

-- 6. Creează profiluri pentru userii existenți
INSERT INTO user_profiles (id, plan, credits_monthly, credits_topup)
SELECT id, 'free', 10, 0
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;
