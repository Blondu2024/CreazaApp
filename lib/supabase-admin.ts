import { createClient } from "@supabase/supabase-js";

// Server-side only — bypasses RLS. Never import from client components.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabaseAdmin = url && key ? createClient(url, key) : null;
