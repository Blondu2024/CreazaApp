import { verifyAuth } from "@/lib/verify-auth";
import { getRecentTransactions } from "@/lib/credits";

export async function GET(req: Request) {
  const userId = await verifyAuth(req);
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const transactions = await getRecentTransactions(userId, 50);
  return Response.json(transactions);
}
