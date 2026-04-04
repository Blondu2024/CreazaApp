import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 400, // 400 days
  path: "/",
  sameSite: "lax" as const,
  secure: true,
};

export function createSupabaseMiddleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookies on request (for SSR)
          cookiesToSet.forEach(({ name, value }) => {
            req.cookies.set(name, value);
          });
          // Re-create response with updated request
          res = NextResponse.next({ request: req });
          // Set cookies on response (for browser) with persistent options
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, { ...COOKIE_OPTIONS, ...options });
          });
        },
      },
    }
  );

  return { supabase, res };
}
