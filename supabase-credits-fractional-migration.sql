-- ============================================
-- CreazaApp — Migrație credite fracționare
-- Rulează în Supabase SQL Editor
-- ============================================
-- Schimbă creditele din INTEGER în NUMERIC(10,2)
-- Elimină CEIL — costul real se deduce exact (2 zecimale)
-- Fix: 50 credite la signup (nu 10)
-- ============================================

-- 1. Schimbă coloanele din user_profiles: INTEGER → NUMERIC(10,2)
ALTER TABLE public.user_profiles
  ALTER COLUMN credits_monthly TYPE NUMERIC(10,2),
  ALTER COLUMN credits_topup TYPE NUMERIC(10,2);

-- 2. Schimbă default-ul la 50 (nu 10)
ALTER TABLE public.user_profiles
  ALTER COLUMN credits_monthly SET DEFAULT 50;

-- 3. Schimbă coloanele din credit_transactions: INTEGER → NUMERIC(10,2)
ALTER TABLE public.credit_transactions
  ALTER COLUMN balance_after_monthly TYPE NUMERIC(10,2),
  ALTER COLUMN balance_after_topup TYPE NUMERIC(10,2);

-- 4. Actualizează trigger-ul — 50 credite la signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, plan, credits_monthly, credits_topup)
  VALUES (NEW.id, 'free', 50, 0)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 5. Actualizează deduct_credits — ROUND(x, 2) în loc de CEIL
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
  v_monthly NUMERIC(10,2);
  v_topup NUMERIC(10,2);
  v_cost NUMERIC(10,2);
  v_remainder NUMERIC(10,2);
BEGIN
  -- Rotunjire la 2 zecimale, nu CEIL la integer
  v_cost := ROUND(p_cost_raw, 2);

  SELECT credits_monthly, credits_topup
  INTO v_monthly, v_topup
  FROM user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO user_profiles (id, plan, credits_monthly, credits_topup)
    VALUES (p_user_id, 'free', 50, 0);
    v_monthly := 50;
    v_topup := 0;
  END IF;

  IF v_monthly + v_topup < v_cost THEN
    RETURN json_build_object('success', false, 'monthly', v_monthly, 'topup', v_topup);
  END IF;

  -- Consumă lunar mai întâi, apoi topup
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
  VALUES (p_user_id, -v_cost, v_monthly, v_topup, 'usage', p_description, p_model, p_input_tokens, p_output_tokens);

  RETURN json_build_object('success', true, 'monthly', v_monthly, 'topup', v_topup);
END;
$$;

-- 6. Fix userii existenți care au 10 credite din trigger-ul vechi
-- (doar cei care au exact 10 și nu au consumat nimic)
UPDATE public.user_profiles
SET credits_monthly = 50
WHERE plan = 'free' AND credits_monthly = 10
  AND id NOT IN (
    SELECT DISTINCT user_id FROM credit_transactions WHERE type = 'usage'
  );
