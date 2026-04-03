"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, Sun, Moon, Menu, X, LogOut } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "./AuthProvider";
import { signOut } from "@/lib/supabase";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setMobileOpen(false);
    router.push("/");
  };

  const navLinks = [
    { href: "/#functionalitati", label: "Funcționalități" },
    { href: "/preturi", label: "Prețuri" },
    { href: "/projects", label: "Proiecte" },
    { href: "/cont", label: "Cont" },
  ];

  return (
    <>
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

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors duration-200 text-sm font-medium ${
                pathname === link.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-card transition-colors duration-200">
            {theme === "dark" ? <Sun className="w-5 h-5 text-muted-foreground hover:text-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground hover:text-foreground" />}
          </button>

          {/* Desktop: sign out or CTA */}
          {user ? (
            <button
              onClick={handleSignOut}
              className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-card"
            >
              <LogOut className="w-4 h-4" />
              Deconectare
            </button>
          ) : (
            <Link href="/workspace" className="hidden md:block bg-gradient-to-r from-primary to-[#a855f7] text-white px-5 py-2.5 rounded-lg text-sm font-semibold btn-primary-glow">
              Începe gratuit
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-card transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-background/95 backdrop-blur-sm animate-fade-in-up">
          <nav className="flex flex-col p-6 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`py-3 px-4 rounded-xl text-base font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-[#6366f1]/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-card"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="h-px bg-border my-3" />

            {user ? (
              <>
                <Link
                  href="/workspace"
                  onClick={() => setMobileOpen(false)}
                  className="py-3 px-4 rounded-xl text-base font-semibold bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white text-center btn-primary-glow"
                >
                  Workspace
                </Link>
                <button
                  onClick={handleSignOut}
                  className="py-3 px-4 rounded-xl text-base font-medium text-muted-foreground hover:text-foreground hover:bg-card flex items-center gap-3 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Deconectare
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="py-3 px-4 rounded-xl text-base font-medium text-muted-foreground hover:text-foreground hover:bg-card"
                >
                  Autentificare
                </Link>
                <Link
                  href="/workspace"
                  onClick={() => setMobileOpen(false)}
                  className="py-3 px-4 rounded-xl text-base font-semibold bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white text-center btn-primary-glow"
                >
                  Începe gratuit
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
