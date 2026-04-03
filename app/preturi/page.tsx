"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, Zap, ChevronDown } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

const plans = [
  {
    id: "free", name: "Gratuit", description: "Explorează platforma gratuit",
    price: 0, period: "/lună", credits: 10, defaultModel: "Sonnet 4",
    features: ["10 credite gratuite/lună", "Acces la toate modelele AI", "Modele gratuite nelimitate", "Preview instant", "Download ZIP"],
    cta: "Începe gratuit", ctaStyle: "outline" as const, highlighted: false,
  },
  {
    id: "starter", name: "Starter", description: "Perfect pentru proiecte personale",
    price: 69, period: "/lună", credits: 300, badge: "Popular", defaultModel: "Haiku 4.5",
    features: ["300 credite/lună (~400 generări)", "Default: Haiku 4.5 (rapid)", "Acces la toate modelele", "Credite top-up disponibile", "Proiecte nelimitate"],
    cta: "Începe Starter →", ctaStyle: "gradient" as const, highlighted: true,
  },
  {
    id: "pro", name: "Pro", description: "Pentru creatori serioși",
    price: 149, period: "/lună", credits: 400, badge: "Avansat", defaultModel: "Sonnet 4",
    features: ["400 credite/lună (~97 generări)", "Default: Sonnet 4 (puternic)", "Context extins 1M tokeni", "Credite top-up disponibile", "Suport prioritar"],
    cta: "Începe Pro →", ctaStyle: "gradient" as const, highlighted: false,
  },
  {
    id: "ultra", name: "Ultra", description: "Performanță maximă",
    price: 299, period: "/lună", credits: 500, defaultModel: "Opus 4.6",
    features: ["500 credite/lună (~44 generări)", "Default: Opus 4.6 (cel mai bun)", "Acces premium la toate modelele", "Credite top-up disponibile", "Suport dedicat"],
    cta: "Începe Ultra →", ctaStyle: "gradient" as const, highlighted: false,
  },
];

const topups = [
  { name: "Mini", price: 9, credits: 30 },
  { name: "Mediu", price: 19, credits: 70 },
  { name: "Mare", price: 49, credits: 200 },
  { name: "XL", price: 99, credits: 450 },
];

const costExamples = [
  { model: "Opus 4.6", cost: "~11 cr", desc: "Cel mai complet, ~19K tokeni output" },
  { model: "Sonnet 4", cost: "~4 cr", desc: "Puternic, ~11K tokeni output" },
  { model: "Haiku 4.5", cost: "~0.7 cr", desc: "Rapid și eficient, ~6K tokeni output" },
  { model: "GPT-4.1", cost: "~0.7 cr", desc: "Alternativă rapidă, ~3K tokeni output" },
  { model: "Gemini 2.5 Flash", cost: "~0.6 cr", desc: "Rapid, output bun, ~10K tokeni" },
  { model: "Modele gratuite", cost: "0 cr", desc: "Qwen, Llama, DeepSeek — nelimitate" },
];

const faqs = [
  { q: "Ce este un credit și cum se consumă?", a: "1 credit = 0.20 RON. Creditele se consumă proporțional cu tokenii folosiți de modelul AI. Modelele gratuite (Qwen, Llama, DeepSeek) nu consumă credite deloc. Modelele premium consumă în funcție de complexitate — de la 0.7 credite (Haiku) la 11 credite (Opus) per generare." },
  { q: "Ce se întâmplă cu creditele nefolosite?", a: "Creditele lunare se resetează la începutul fiecărei luni. Creditele cumpărate prin top-up NU expiră niciodată — se consumă după creditele lunare." },
  { q: "Pot folosi orice model pe orice plan?", a: "Da! Toate planurile au acces la toate modelele. Diferența e doar numărul de credite incluse. Modelele gratuite funcționează nelimitat pe orice plan." },
  { q: "Pot schimba planul oricând?", a: "Da, poți face upgrade sau downgrade în orice moment. Modificările se aplică imediat." },
  { q: "Pot cumpăra top-up fără abonament?", a: "Top-up-urile sunt disponibile doar cu un abonament activ (inclusiv Gratuit). Creditele top-up nu expiră niciodată." },
  { q: "Oferiți factură pentru firme?", a: "Da, oferim facturi fiscale pentru toate planurile plătite. La checkout poți introduce datele companiei." },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />

      {/* Header */}
      <section className="pt-20 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#e2e8f0] mb-4">
            Prețuri simple, fără surprize
          </h1>
          <p className="text-lg text-[#64748b] mb-4">
            Plătești doar cât folosești. Modelele gratuite sunt nelimitate.
          </p>
          <p className="text-sm text-[#6366f1]">1 credit = 0.20 RON</p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className={`relative rounded-2xl p-6 flex flex-col transition-all duration-300 ${plan.highlighted ? "bg-gradient-to-b from-[#6366f1]/15 to-[#a855f7]/15 border-2 border-[#6366f1] scale-105 shadow-2xl shadow-[#6366f1]/20" : "bg-[#111118] border border-[rgba(30,30,46,0.8)] hover:border-[#6366f1]/30"}`}>
              {plan.badge && (
                <span className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-semibold ${plan.highlighted ? "bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white" : "bg-[#6366f1]/20 text-[#6366f1]"}`}>
                  {plan.badge}
                </span>
              )}
              <h3 className="text-xl font-semibold text-[#e2e8f0] mt-2 mb-1">{plan.name}</h3>
              <p className="text-sm text-[#64748b] mb-4">{plan.description}</p>
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[#e2e8f0]">{plan.price}</span>
                  <span className="text-[#64748b]"> RON{plan.period}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4 p-3 bg-[#0a0a0f] rounded-xl">
                <Zap className="w-5 h-5 text-[#f59e0b]" />
                <span className="text-sm text-[#e2e8f0]"><span className="font-semibold">{plan.credits}</span> credite/lună</span>
              </div>
              <p className="text-[10px] text-[#64748b] mb-4">Default: {plan.defaultModel}</p>
              <ul className="space-y-3 mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[#e2e8f0]">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/workspace" className={`w-full py-3 rounded-xl text-center font-semibold block ${plan.ctaStyle === "gradient" ? "bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white btn-primary-glow" : "bg-transparent border border-[rgba(30,30,46,0.8)] text-[#e2e8f0] hover:bg-[#1e1e2e] transition-colors duration-200"}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Top-up Packages */}
      <section className="pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-[#e2e8f0] text-center mb-2">Credite Top-up</h2>
          <p className="text-sm text-[#64748b] text-center mb-8">Cumpără credite extra. Nu expiră niciodată.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {topups.map((t) => (
              <div key={t.name} className="bg-[#111118] border border-[rgba(30,30,46,0.8)] rounded-xl p-4 text-center hover:border-[#6366f1]/30 transition-colors">
                <p className="text-lg font-bold text-[#e2e8f0]">{t.credits}</p>
                <p className="text-xs text-[#64748b] mb-2">credite</p>
                <p className="text-sm font-semibold text-[#f59e0b]">{t.price} RON</p>
                <p className="text-[10px] text-[#64748b] mt-1">{(t.price / t.credits).toFixed(2)} RON/credit</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cost Examples */}
      <section className="pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-[#e2e8f0] text-center mb-2">Cât costă o generare?</h2>
          <p className="text-sm text-[#64748b] text-center mb-8">Estimări pentru un prompt complex (site complet)</p>
          <div className="bg-[#111118] border border-[rgba(30,30,46,0.8)] rounded-xl overflow-hidden">
            {costExamples.map((ex, i) => (
              <div key={i} className={`flex items-center justify-between px-5 py-3 ${i < costExamples.length - 1 ? "border-b border-[rgba(30,30,46,0.8)]" : ""}`}>
                <div>
                  <p className="text-sm font-medium text-[#e2e8f0]">{ex.model}</p>
                  <p className="text-[11px] text-[#64748b]">{ex.desc}</p>
                </div>
                <span className={`text-sm font-bold ${ex.cost === "0 cr" ? "text-[#10b981]" : "text-[#f59e0b]"}`}>{ex.cost}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#e2e8f0] text-center mb-12">Întrebări frecvente</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className={`bg-[#111118] border rounded-xl px-6 ${openFaq === i ? "border-[#6366f1]/50" : "border-[rgba(30,30,46,0.8)]"}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between py-4 text-left text-[#e2e8f0] font-medium">
                  {faq.q}
                  <ChevronDown className={`w-5 h-5 text-[#64748b] transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <p className="text-[#64748b] pb-4 leading-relaxed text-sm">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 rounded-2xl border border-[rgba(30,30,46,0.8)] p-12">
            <Sparkles className="w-12 h-12 text-[#6366f1] mx-auto mb-6" />
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#e2e8f0] mb-4">Gata să construiești?</h2>
            <p className="text-[#64748b] mb-8">Creează prima ta aplicație în mai puțin de 5 minute. Fără card bancar.</p>
            <Link href="/workspace" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white px-8 py-4 rounded-xl font-semibold btn-primary-glow">
              Începe gratuit →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
