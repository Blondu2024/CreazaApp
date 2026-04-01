import Link from "next/link";
import { Sparkles, Play, Layers, Code, Terminal, Download, ArrowRight } from "lucide-react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

const features = [
  { icon: Sparkles, title: "AI care scrie cod", description: "Descrii în română, primești cod React + Tailwind complet", color: "#a855f7" },
  { icon: Play, title: "Preview instant", description: "Sandbox cloud E2B — vezi rezultatul live în secunde", color: "#10b981" },
  { icon: Layers, title: "Orice model AI", description: "Gemini, Claude, GPT, Llama, DeepSeek — tu alegi", color: "#6366f1" },
  { icon: Code, title: "Editor profesional", description: "CodeMirror cu evidențiere sintaxă și auto-complete", color: "#f59e0b" },
  { icon: Terminal, title: "Terminal integrat", description: "Vezi logurile și erorile în timp real", color: "#ef4444" },
  { icon: Download, title: "Export și Deploy", description: "Descarcă ZIP sau deploy direct pe Vercel/Netlify", color: "#3b82f6" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-[#6366f1]/10 via-[#a855f7]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#e2e8f0] mb-6">
            Creează aplicații web cu <span className="gradient-text">AI</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#64748b] mb-10 max-w-2xl mx-auto leading-relaxed">
            Descrie ce vrei. AI-ul scrie codul. Preview-ul apare instant.
          </p>
          <Link href="/workspace" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white px-8 py-4 rounded-xl text-lg font-semibold btn-primary-glow group">
            Începe gratuit
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Workspace Mockup */}
          <div className="mt-16 relative">
            <div className="bg-[#111118] rounded-2xl border border-[rgba(30,30,46,0.8)] p-1 shadow-2xl shadow-[#6366f1]/10">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(30,30,46,0.8)]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                  <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                  <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-[#0a0a0f] px-4 py-1 rounded-md text-xs text-[#64748b]">creazaapp.ro/workspace</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 p-1 h-[300px] sm:h-[350px]">
                <div className="bg-[#0a0a0f] rounded-lg p-4 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-[#6366f1]" />
                    <span className="text-xs text-[#64748b]">Chat</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="bg-[#111118] rounded-lg p-2 text-xs text-[#e2e8f0]">Creează un landing page pentru o cafenea</div>
                    <div className="bg-gradient-to-r from-[#6366f1]/20 to-[#a855f7]/20 rounded-lg p-2 text-xs text-[#e2e8f0]">Generez codul acum...</div>
                  </div>
                </div>
                <div className="bg-[#0a0a0f] rounded-lg p-4 col-span-2 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-[#111118] px-3 py-1 rounded text-xs text-[#e2e8f0] border border-[rgba(30,30,46,0.8)]"><span className="text-[#3b82f6]">●</span> App.tsx</div>
                    <div className="px-3 py-1 rounded text-xs text-[#64748b]"><span className="text-[#10b981]">●</span> style.css</div>
                  </div>
                  <div className="flex-1 font-mono text-xs text-[#64748b] space-y-1 overflow-hidden">
                    <p><span className="text-[#a855f7]">import</span> <span className="text-[#e2e8f0]">React</span> <span className="text-[#a855f7]">from</span> <span className="text-[#10b981]">&apos;react&apos;</span>;</p>
                    <p></p>
                    <p><span className="text-[#a855f7]">export const</span> <span className="text-[#f59e0b]">CafeLanding</span> = () =&gt; {"{"}</p>
                    <p className="pl-4"><span className="text-[#a855f7]">return</span> (</p>
                    <p className="pl-8 text-[#64748b]">&lt;<span className="text-[#3b82f6]">div</span> <span className="text-[#e2e8f0]">className</span>=<span className="text-[#10b981]">&quot;...&quot;</span>&gt;</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 px-6 border-y border-[rgba(30,30,46,0.8)]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex -space-x-3">
            {[1,2,3,4].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0a0a0f] bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center text-white text-xs font-bold">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <p className="text-[#64748b] text-sm">
            Folosit de <span className="text-[#e2e8f0] font-semibold">500+</span> developeri din România
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="functionalitati" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#e2e8f0] mb-4">Tot ce ai nevoie într-un singur loc</h2>
            <p className="text-[#64748b] max-w-xl mx-auto">De la idee la aplicație funcțională în minute, nu în zile</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-[#111118] rounded-xl border border-[rgba(30,30,46,0.8)] p-6 hover:border-[#6366f1]/50 transition-all duration-200 group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${feature.color}20` }}>
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3 className="text-lg font-semibold text-[#e2e8f0] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#64748b] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 rounded-2xl border border-[rgba(30,30,46,0.8)] p-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#e2e8f0] mb-4">Gata să începi?</h2>
            <p className="text-[#64748b] mb-8">Creează prima ta aplicație în mai puțin de 5 minute. Gratuit.</p>
            <Link href="/workspace" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white px-8 py-4 rounded-xl text-lg font-semibold btn-primary-glow group">
              Începe gratuit
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
