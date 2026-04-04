"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getUser, onAuthChange, getAccessToken, supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  plan: string;
  creditsMonthly: number;
  creditsTopup: number;
  totalCredits: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: UserProfile | null;
  refreshCredits: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, profile: null, refreshCredits: async () => null });

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from("user_profiles")
    .select("plan, credits_monthly, credits_topup")
    .eq("id", userId)
    .single();
  if (!data) return null;
  return {
    plan: data.plan,
    creditsMonthly: data.credits_monthly,
    creditsTopup: data.credits_topup,
    totalCredits: data.credits_monthly + data.credits_topup,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const refreshCredits = useCallback(async () => {
    if (!user) return null;
    const p = await fetchProfile(user.id);
    if (p) setProfile(p);
    return p;
  }, [user]);

  useEffect(() => {
    // Try session first (instant, from cookies), then verify with getUser
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setLoading(false);
        const p = await fetchProfile(session.user.id);
        if (p) setProfile(p);
      }
      // Always verify server-side (refreshes token if needed)
      const u = await getUser();
      if (u) {
        setUser(u);
        if (!session?.user) {
          const p = await fetchProfile(u.id);
          if (p) setProfile(p);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = onAuthChange(async (u, event) => {
      const typedUser = u as User | null;
      setUser(typedUser);
      setLoading(false);
      if (typedUser) {
        const p = await fetchProfile(typedUser.id);
        if (p) setProfile(p);
        // Send welcome email on first OAuth sign-in
        if (event === "SIGNED_IN" && typedUser.app_metadata?.provider !== "email") {
          const created = new Date(typedUser.created_at);
          const isNew = Date.now() - created.getTime() < 300_000; // within 5 minutes
          if (isNew) {
            getAccessToken().then(token => {
              if (token) fetch("/api/email/welcome", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
            });
          }
        }
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, profile, refreshCredits }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
