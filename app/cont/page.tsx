"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Zap, CreditCard, Clock, ArrowUpRight, ArrowDownRight, RefreshCw, Sparkles } from "lucide-react";
import { useAuth } from "@/app/components/AuthProvider";
import { Navbar } from "@/app/components/Navbar";
import { getAccessToken } from "@/lib/supabase";
import { PLANS, TOPUP_PACKAGES } from "@/lib/credits";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  balance_after_monthly: number;
  balance_after_topup: number;
  created_at: string;
}

export default function AccountPage() {
  const { user, loading, profile } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }

    (async () => {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch("/api/account/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setTransactions(await res.json());
      setLoadingTx(false);
    })();
  }, [user, loading, router]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <Sparkles className="w-6 h-6 text-primary animate-pulse" />
        </div>
      </div>
    );
  }

  const plan = PLANS[profile.plan] || PLANS.free;
  const usageToday = transactions
    .filter(t => t.type === "usage" && new Date(t.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-8">Contul meu</h1>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Plan */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Plan</span>
            </div>
            <p className="text-lg font-bold text-foreground">{plan.name}</p>
            <p className="text-xs text-muted-foreground">{plan.priceRON > 0 ? `${plan.priceRON} RON/lună` : "Gratuit"}</p>
          </div>

          {/* Credits */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#f59e0b]" />
              </div>
              <span className="text-xs text-muted-foreground">Credite totale</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {Number.isInteger(profile.totalCredits) ? profile.totalCredits : profile.totalCredits.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile.creditsMonthly.toFixed(1)} lunare + {profile.creditsTopup.toFixed(1)} top-up
            </p>
          </div>

          {/* Usage today */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#a855f7]/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-[#a855f7]" />
              </div>
              <span className="text-xs text-muted-foreground">Consum azi</span>
            </div>
            <p className="text-lg font-bold text-foreground">{usageToday.toFixed(1)} cr</p>
            <p className="text-xs text-muted-foreground">{transactions.filter(t => t.type === "usage" && new Date(t.created_at).toDateString() === new Date().toDateString()).length} mesaje</p>
          </div>

          {/* Email */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-xs text-muted-foreground">Email</span>
            </div>
            <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Membru din {new Date(user?.created_at || "").toLocaleDateString("ro-RO")}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-8">
          <Link href="/preturi" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-[#a855f7] text-white rounded-lg text-sm font-medium btn-primary-glow">
            <ArrowUpRight className="w-4 h-4" />
            {plan.priceRON === 0 ? "Upgrade plan" : "Cumpără credite"}
          </Link>
          <Link href="/projects" className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-card transition-colors">
            Proiectele mele
          </Link>
        </div>

        {/* Transaction history */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Istoric tranzacții</h2>
            <span className="text-xs text-muted-foreground">Ultimele {transactions.length}</span>
          </div>

          {loadingTx ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-muted-foreground">Nicio tranzacție încă</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      tx.type === "usage" ? "bg-red-500/10" :
                      tx.type === "topup" ? "bg-emerald-500/10" :
                      "bg-primary/10"
                    }`}>
                      {tx.type === "usage" ? <ArrowDownRight className="w-4 h-4 text-red-400" /> :
                       tx.type === "topup" ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> :
                       <RefreshCw className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">
                        {tx.type === "usage" ? (tx.model?.split("/").pop() || "Generare") :
                         tx.type === "topup" ? "Top-up credite" :
                         tx.type === "monthly_reset" ? "Credite lunare" : tx.description || tx.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString("ro-RO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {tx.input_tokens ? ` · ${tx.input_tokens} in / ${tx.output_tokens} out` : ""}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium shrink-0 ${tx.amount < 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {tx.amount > 0 ? "+" : ""}{Number(tx.amount).toFixed(2)} cr
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
