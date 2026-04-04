import { NextRequest } from "next/server";
import { createSupabaseMiddleware } from "@/lib/supabase-middleware";

export async function middleware(req: NextRequest) {
  const { supabase, res } = createSupabaseMiddleware(req);

  // Refresh session — this keeps the user logged in
  await supabase.auth.getUser();

  return res;
}

export const config = {
  matcher: [
    // Run on all routes except static files and API routes that handle their own auth
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
