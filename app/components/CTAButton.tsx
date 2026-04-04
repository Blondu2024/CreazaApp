"use client";

import Link from "next/link";
import { ArrowRight, Rocket } from "lucide-react";
import { useAuth } from "./AuthProvider";

export function CTAButton({ className = "" }: { className?: string }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Link
        href="/workspace"
        className={`inline-flex items-center gap-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white px-8 py-4 rounded-xl text-lg font-semibold btn-primary-glow group ${className}`}
      >
        Incepe gratuit
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </Link>
    );
  }

  if (user) {
    return (
      <Link
        href="/workspace"
        className={`inline-flex items-center gap-2 bg-gradient-to-r from-[#10b981] to-[#059669] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:opacity-90 transition-opacity group ${className}`}
      >
        <Rocket className="w-5 h-5" />
        Construieste acum
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </Link>
    );
  }

  return (
    <Link
      href="/workspace"
      className={`inline-flex items-center gap-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white px-8 py-4 rounded-xl text-lg font-semibold btn-primary-glow group ${className}`}
    >
      Incepe gratuit
      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
    </Link>
  );
}
