import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendWelcomeEmail } from "@/lib/resend";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!auth || !supabaseAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the user's token
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(auth);
  if (error || !user?.email) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  await sendWelcomeEmail(user.email, user.user_metadata?.full_name || user.user_metadata?.name);

  return NextResponse.json({ sent: true });
}
