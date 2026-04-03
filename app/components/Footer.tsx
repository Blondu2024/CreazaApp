import Link from "next/link";
import { Sparkles } from "lucide-react";


export function Footer() {
  return (
    <footer className="bg-background border-t border-border py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-[#6366f1]" />
              <span className="text-lg font-bold">
                <span className="gradient-text">Creaza</span>
                <span className="text-foreground">App</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm">Creează aplicații web cu AI. În română.</p>
          </div>
          <div>
            <h4 className="text-foreground font-semibold mb-4 text-sm">Produs</h4>
            <ul className="space-y-2">
              <li><Link href="/#functionalitati" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Funcționalități</Link></li>
              <li><Link href="/preturi" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Prețuri</Link></li>
              <li><Link href="/workspace" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Demo</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-foreground font-semibold mb-4 text-sm">Companie</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Despre noi</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Blog</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-foreground font-semibold mb-4 text-sm">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/confidentialitate" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Politica de confidențialitate</Link></li>
              <li><Link href="/termeni" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Termeni și condiții</Link></li>
              <li><Link href="/cookies" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Cookie-uri</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8 text-center">
          <p className="text-muted-foreground text-sm">© 2026 CreazaApp. Toate drepturile rezervate.</p>
        </div>
      </div>
    </footer>
  );
}
