"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="w-full h-16 glass-header border-b border-border sticky top-0 z-50 flex items-center justify-between px-6">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="relative">
          <Sparkles className="w-7 h-7 text-primary group-hover:text-[#a855f7] transition-colors duration-200" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-[#a855f7] opacity-30 blur-lg" />
        </div>
        <span className="text-xl font-bold">
          <span className="gradient-text">Creaza</span>
          <span className="text-foreground">App</span>
        </span>
      </Link>

      <nav className="hidden md:flex items-center gap-8">
        <Link href="/#functionalitati" className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm font-medium">
          Funcționalități
        </Link>
        <Link href="/preturi" className={`transition-colors duration-200 text-sm font-medium ${pathname === "/preturi" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          Prețuri
        </Link>
        <Link href="/projects" className={`transition-colors duration-200 text-sm font-medium ${pathname === "/projects" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          Proiecte
        </Link>
        <Link href="/cont" className={`transition-colors duration-200 text-sm font-medium ${pathname === "/cont" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          Cont
        </Link>
      </nav>

      <div className="flex items-center gap-4">
        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-card transition-colors duration-200">
          {theme === "dark" ? <Sun className="w-5 h-5 text-muted-foreground hover:text-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground hover:text-foreground" />}
        </button>
        <Link href="/workspace" className="bg-gradient-to-r from-primary to-[#a855f7] text-white px-5 py-2.5 rounded-lg text-sm font-semibold btn-primary-glow">
          Începe gratuit
        </Link>
      </div>
    </header>
  );
}
