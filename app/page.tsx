import Link from "next/link";
import {
  Sparkles, Layers, Code, Terminal, Download, ArrowRight, Zap,
  Globe, Shield, Clock, MousePointerClick, Bot, Eye,
} from "lucide-react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

const features = [
  { icon: Bot, title: "Agent AI avansat", description: "Descrii ce vrei in romana. Agentul analizeaza, scrie cod, si repara erorile automat.", color: "#a855f7" },
  { icon: Eye, title: "Preview instant", description: "Vezi rezultatul live in browser. Fiecare modificare apare imediat.", color: "#10b981" },
  { icon: Layers, title: "AI puternic", description: "Claude Sonnet 4, Opus 4.6, GPT-4.1, Gemini 2.5 Pro — platforma alege cel mai bun AI pentru tine.", color: "#6366f1" },
  { icon: Code, title: "Editor profesional", description: "CodeMirror cu evidentierea sintaxei. Editezi manual sau lasi AI-ul sa scrie.", color: "#f59e0b" },
  { icon: Terminal, title: "Terminal integrat", description: "Loguri, erori, si status in timp real. Agentul le vede si le repara.", color: "#ef4444" },
  { icon: Download, title: "Download ZIP", description: "Descarci proiectul complet si il folosesti oriunde.", color: "#3b82f6" },
];

const steps = [
  { step: "01", title: "Descrie", description: "Spune-i AI-ului ce aplicatie vrei. In romana, natural, ca intr-o conversatie.", icon: MousePointerClick },
  { step: "02", title: "Genereaza", description: "Agentul scrie codul, preview-ul apare automat. Iterezi pana e perfect.", icon: Sparkles },
  { step: "03", title: "Lanseaza", description: "Descarci proiectul sau il publici online. Gata — ai o aplicatie.", icon: Globe },
];

const models = [
  { name: "Claude Opus 4.6", badge: "Cel mai puternic", color: "#a855f7" },
  { name: "Claude Sonnet 4", badge: "Rapid + inteligent", color: "#6366f1" },
  { name: "GPT-4.1", badge: "Alternativa solida", color: "#10b981" },
  { name: "Gemini 2.5 Pro", badge: "Context mare", color: "#3b82f6" },
  { name: "Gemini 2.5 Flash", badge: "Ultra-rapid", color: "#f59e0b" },
  { name: "DeepSeek R1", badge: "Reasoning", color: "#ef4444" },
];

const plans = [
  { name: "Gratuit", price: "0", credits: "50", desc: "Agent AI (Sonnet 4)" },
  { name: "Starter", price: "69", credits: "300", desc: "Agent AI rapid + Deploy", popular: true },
  { name: "Pro", price: "149", credits: "400", desc: "Alegi modelul AI" },
  { name: "Ultra", price: "299", credits: "500", desc: "Modele premium + 1M context" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-[#6366f1]/10 via-[#a855f7]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-full px-4 py-1.5 mb-6">
            <Zap className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span className="text-xs text-[#a78bfa] font-medium">50 credite gratuite la inregistrare</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-[#e2e8f0] mb-6 leading-[1.1]">
            Construieste aplicatii web{" "}
            <span className="gradient-text">cu AI</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#64748b] mb-10 max-w-2xl mx-auto leading-relaxed">
            Descrii ce vrei in limba romana. AI-ul scrie codul. Preview-ul apare instant.
            De la idee la aplicatie in minute.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/workspace" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white px-8 py-4 rounded-xl text-lg font-semibold btn-primary-glow group">
              Incepe gratuit
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/preturi" className="inline-flex items-center gap-2 text-[#64748b] hover:text-[#e2e8f0] px-6 py-4 rounded-xl text-sm font-medium transition-colors">
              Vezi preturile →
            </Link>
          </div>

          {/* Workspace Mockup */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#6366f1]/20 to-[#a855f7]/20 rounded-2xl blur-xl -m-4" />
            <div className="relative bg-[#111118] rounded-2xl border border-[rgba(30,30,46,0.8)] p-1 shadow-2xl shadow-[#6366f1]/10">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(30,30,46,0.8)]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                  <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                  <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-[#0a0a0f] px-4 py-1 rounded-md text-xs text-[#64748b]">creazaapp.com/workspace</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 p-1 h-[300px] sm:h-[380px]">
                {/* Chat panel */}
                <div className="bg-[#0a0a0f] rounded-lg p-4 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-[#6366f1]" />
                    <span className="text-xs text-[#64748b]">Chat</span>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    <div className="bg-[#111118] rounded-lg p-2.5 text-[11px] text-[#e2e8f0]">Fa-mi un landing page pentru o cafenea cu meniu si galerie</div>
                    <div className="bg-gradient-to-r from-[#6366f1]/20 to-[#a855f7]/20 rounded-lg p-2.5 text-[11px] text-[#e2e8f0]">
                      <p className="font-medium text-[#a78bfa] mb-1">CreazaApp AI</p>
                      Analizez cererea. Generez un hero cu imagine, sectiunea de meniu cu categorii si o galerie foto...
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#6366f1]/10 border border-[#6366f1]/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-pulse" />
                      <span className="text-[10px] text-[#a78bfa]">Se scrie codul...</span>
                    </div>
                  </div>
                </div>
                {/* Code + Preview panel */}
                <div className="bg-[#0a0a0f] rounded-lg p-4 col-span-2 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-[#111118] px-3 py-1 rounded text-[11px] text-[#e2e8f0] border border-[rgba(30,30,46,0.8)]"><span className="text-[#3b82f6] mr-1">&#9679;</span>App.jsx</div>
                    <div className="px-3 py-1 rounded text-[11px] text-[#64748b]"><span className="text-[#a855f7] mr-1">&#9679;</span>styles.css</div>
                    <div className="ml-auto px-3 py-1 rounded text-[11px] bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">Preview</div>
                  </div>
                  <div className="flex-1 font-mono text-[11px] text-[#64748b] space-y-1 overflow-hidden">
                    <p><span className="text-[#c084fc]">const</span> {"{"} <span className="text-[#e2e8f0]">useState</span> {"}"} = <span className="text-[#e2e8f0]">React</span>;</p>
                    <p></p>
                    <p><span className="text-[#c084fc]">function</span> <span className="text-[#f59e0b]">App</span>() {"{"}</p>
                    <p className="pl-4"><span className="text-[#c084fc]">const</span> [<span className="text-[#e2e8f0]">menu</span>, <span className="text-[#e2e8f0]">setMenu</span>] = <span className="text-[#f59e0b]">useState</span>(<span className="text-[#10b981]">&apos;cafea&apos;</span>);</p>
                    <p className="pl-4"><span className="text-[#c084fc]">return</span> (</p>
                    <p className="pl-8">&lt;<span className="text-[#3b82f6]">div</span> <span className="text-[#e2e8f0]">className</span>=<span className="text-[#10b981]">&quot;min-h-screen&quot;</span>&gt;</p>
                    <p className="pl-12">&lt;<span className="text-[#3b82f6]">nav</span> <span className="text-[#e2e8f0]">className</span>=<span className="text-[#10b981]">&quot;flex...&quot;</span>&gt;</p>
                    <p className="pl-12 text-[#4a4a6a]">...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-[rgba(30,30,46,0.8)]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-[#e2e8f0]">25+</p>
            <p className="text-sm text-[#64748b] mt-1">Modele AI</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#e2e8f0]">50</p>
            <p className="text-sm text-[#64748b] mt-1">Credite gratuite</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#e2e8f0]">&lt;30s</p>
            <p className="text-sm text-[#64748b] mt-1">Prima generare</p>
          </div>
          <div>
            <p className="text-3xl font-bold gradient-text">100%</p>
            <p className="text-sm text-[#64748b] mt-1">In limba romana</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#e2e8f0] mb-4">Cum functioneaza</h2>
            <p className="text-[#64748b]">Trei pasi. Zero configurare. Zero experienta necesara.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="relative text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6366f1]/20 to-[#a855f7]/20 flex items-center justify-center mx-auto mb-4 border border-[#6366f1]/20 group-hover:border-[#6366f1]/50 transition-colors">
                  <s.icon className="w-7 h-7 text-[#6366f1]" />
                </div>
                <span className="text-xs font-bold text-[#6366f1] tracking-widest">PASUL {s.step}</span>
                <h3 className="text-xl font-semibold text-[#e2e8f0] mt-2 mb-2">{s.title}</h3>
                <p className="text-sm text-[#64748b] leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="functionalitati" className="py-24 px-6 bg-[#070710]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#e2e8f0] mb-4">Tot ce ai nevoie intr-un singur loc</h2>
            <p className="text-[#64748b] max-w-xl mx-auto">De la idee la aplicatie functionala in minute, nu in zile</p>
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

      {/* Models */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#e2e8f0] mb-4">Alege modelul potrivit</h2>
            <p className="text-[#64748b]">Cele mai puternice AI-uri, selectate automat pentru planul tau</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {models.map((m) => (
              <div key={m.name} className="bg-[#111118] rounded-xl border border-[rgba(30,30,46,0.8)] p-4 hover:border-[#6366f1]/30 transition-colors text-center">
                <p className="text-sm font-semibold text-[#e2e8f0] mb-1">{m.name}</p>
                <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${m.color}20`, color: m.color }}>
                  {m.badge}
                </span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-[#64748b] mt-6">+ Llama, DeepSeek, Mistral, si multe altele</p>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-24 px-6 bg-[#070710]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#e2e8f0] mb-4">Preturi simple</h2>
            <p className="text-[#64748b]">Platesti doar cat folosesti. 50 credite gratuite la start.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {plans.map((p) => (
              <div key={p.name} className={`rounded-xl p-5 text-center ${p.popular ? "bg-gradient-to-b from-[#6366f1]/15 to-[#a855f7]/15 border-2 border-[#6366f1]" : "bg-[#111118] border border-[rgba(30,30,46,0.8)]"}`}>
                {p.popular && <span className="text-[10px] font-bold text-[#6366f1] tracking-wider">POPULAR</span>}
                <p className="text-lg font-semibold text-[#e2e8f0] mt-1">{p.name}</p>
                <p className="text-2xl font-bold text-[#e2e8f0] my-2">{p.price} <span className="text-sm font-normal text-[#64748b]">RON</span></p>
                <div className="flex items-center justify-center gap-1 text-[#f59e0b] text-xs font-medium">
                  <Zap className="w-3 h-3" />
                  {p.credits} credite/luna
                </div>
                <p className="text-[10px] text-[#64748b] mt-2">{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/preturi" className="inline-flex items-center gap-2 text-[#6366f1] hover:text-[#a855f7] font-medium transition-colors">
              Vezi toate detaliile
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#e2e8f0] mb-4">De ce CreazaApp</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-xl bg-[#10b981]/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-[#10b981]" />
              </div>
              <h3 className="font-semibold text-[#e2e8f0] mb-2">Fara surprize</h3>
              <p className="text-sm text-[#64748b]">Preturi transparente. 50 credite gratuite la inregistrare, apoi platesti cat folosesti.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-xl bg-[#6366f1]/10 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-[#6366f1]" />
              </div>
              <h3 className="font-semibold text-[#e2e8f0] mb-2">In limba romana</h3>
              <p className="text-sm text-[#64748b]">Interfata, agentul AI, si suportul — totul in romana. Fara bariere de limba.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-[#f59e0b]" />
              </div>
              <h3 className="font-semibold text-[#e2e8f0] mb-2">Rapid</h3>
              <p className="text-sm text-[#64748b]">De la descriere la aplicatie functionala in sub 5 minute. Fara setup, fara configurare.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 rounded-2xl border border-[rgba(30,30,46,0.8)] p-12">
            <Sparkles className="w-12 h-12 text-[#6366f1] mx-auto mb-6" />
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#e2e8f0] mb-4">Gata sa construiesti?</h2>
            <p className="text-[#64748b] mb-8">Creeaza prima ta aplicatie in mai putin de 5 minute. Fara card bancar.</p>
            <Link href="/workspace" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white px-8 py-4 rounded-xl text-lg font-semibold btn-primary-glow group">
              Incepe gratuit
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
