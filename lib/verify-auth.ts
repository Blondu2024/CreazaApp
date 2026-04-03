import { supabaseAdmin } from "./supabase-admin";

/**
 * Verify Supabase auth token server-side.
 * Returns verified userId or null if invalid/missing.
 */
export async function verifyAuth(req: Request): Promise<string | null> {
  if (!supabaseAdmin) return null;

  // Check Authorization header first, then body fallback
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return null;

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch {
    return null;
  }
}
