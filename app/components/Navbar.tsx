"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Sun, Moon } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);

  return (
    <header className="w-full h-16 glass-header border-b border-[rgba(30,30,46,0.8)] sticky top-0 z-50 flex items-center justify-between px-6">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="relative">
          <Sparkles className="w-7 h-7 text-[#6366f1] group-hover:text-[#a855f7] transition-colors duration-200" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#6366f1] to-[#a855f7] opacity-30 blur-lg" />
        </div>
        <span className="text-xl font-bold">
          <span className="gradient-text">Creaza</span>
          <span className="text-[#e2e8f0]">App</span>
        </span>
      </Link>

      <nav className="hidden md:flex items-center gap-8">
        <Link href="/#functionalitati" className="text-[#64748b] hover:text-[#e2e8f0] transition-colors duration-200 text-sm font-medium">
          Funcționalități
        </Link>
        <Link href="/preturi" className={`transition-colors duration-200 text-sm font-medium ${pathname === "/preturi" ? "text-[#e2e8f0]" : "text-[#64748b] hover:text-[#e2e8f0]"}`}>
          Prețuri
        </Link>
        <Link href="/workspace" className="text-[#64748b] hover:text-[#e2e8f0] transition-colors duration-200 text-sm font-medium">
          Demo
        </Link>
      </nav>

      <div className="flex items-center gap-4">
        <button onClick={() => { setIsDark(!isDark); document.documentElement.classList.toggle("dark"); }} className="p-2 rounded-lg hover:bg-[#111118] transition-colors duration-200">
          {isDark ? <Sun className="w-5 h-5 text-[#64748b] hover:text-[#e2e8f0]" /> : <Moon className="w-5 h-5 text-[#64748b] hover:text-[#e2e8f0]" />}
        </button>
        <Link href="/workspace" className="bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white px-5 py-2.5 rounded-lg text-sm font-semibold btn-primary-glow">
          Începe gratuit
        </Link>
      </div>
    </header>
  );
}
