"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, Zap, ChevronDown } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

const plans = [
  {
    id: "free", name: "Gratuit", description: "Începe cu funcționalitățile esențiale gratuit",
    price: 0, period: "/lună", credits: 10,
    features: ["10 credite gratuite/lună", "Toate funcționalitățile de bază", "Aplicații web și mobile", "Acces la modele AI avansate", "Integrare LLM cu un click"],
    cta: "Începe gratuit", ctaStyle: "outline" as const, highlighted: false,
  },
  {
    id: "standard", name: "Standard", description: "Perfect pentru primii constructori",
    price: 20, priceAnnual: 17, period: "/lună", credits: 100, badge: "Popular",
    features: ["Tot ce include Gratuit, plus:", "Aplicații web & mobile", "Găzduire proiecte private", "100 credite/lună", "Cumpără credite extra la nevoie", "Integrare GitHub", "Fork tasks"],
    cta: "Începe Standard →", ctaStyle: "gradient" as const, highlighted: true,
  },
  {
    id: "pro", name: "Pro", description: "Creat pentru creatori serioși și branduri",
    price: 200, priceAnnual: 170, period: "/lună", credits: 750, badge: "Avansat",
    features: ["Tot ce include Standard, plus:", "Context window 1M tokeni", "Ultra thinking", "Editare System Prompt", "Creează agenți AI custom", "Computing de înaltă performanță", "750 credite/lună", "Suport prioritar"],
    cta: "Începe Pro →", ctaStyle: "gradient" as const, highlighted: false,
  },
];

const faqs = [
  { q: "Ce este un credit și cum se consumă?", a: "Un credit reprezintă o unitate de utilizare a AI-ului. Fiecare mesaj trimis consumă credite în funcție de complexitatea răspunsului și modelul AI folosit. Modelele gratuite consumă mai puține credite, iar cele premium (GPT-4, Claude) consumă mai multe." },
  { q: "Pot schimba planul oricând?", a: "Da, poți face upgrade sau downgrade în orice moment. Modificările se aplică imediat, iar diferența de preț se calculează proporțional." },
  { q: "Ce modele AI sunt incluse?", a: "Toate planurile includ acces la modele gratuite: Gemini 2.0 Flash, Llama 3.3 70B și Qwen 3.6. Planurile plătite includ și acces la modele premium: GPT-4, Claude Sonnet, DeepSeek." },
  { q: "Cum funcționează deploy-ul?", a: "Cu un singur click poți publica aplicația pe Vercel, Netlify sau Railway. CreazaApp se ocupă de configurarea build-ului și generează automat un URL public." },
  { q: "Datele mele sunt în siguranță?", a: "Absolut. Toate datele sunt criptate în tranzit și în repaus. Serverele noastre sunt în UE, conform GDPR." },
  { q: "Oferiți factură pentru firme?", a: "Da, oferim facturi fiscale pentru toate planurile plătite. La checkout poți introduce datele companiei, inclusiv CIF-ul." },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />

      {/* Header */}
      <section className="pt-20 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#e2e8f0] mb-4">
            Prețuri transparente pentru fiecare constructor
          </h1>
          <p className="text-lg text-[#64748b] mb-8">
            Alege planul potrivit ambițiilor tale. De la proiecte de weekend la aplicații enterprise.
          </p>
          <div className="inline-flex items-center gap-3 bg-[#111118] rounded-xl p-1.5 border border-[rgba(30,30,46,0.8)]">
            <button onClick={() => setIsAnnual(false)} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${!isAnnual ? "bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white shadow-lg" : "text-[#64748b] hover:text-[#e2e8f0]"}`}>
              Lunar
            </button>
            <button onClick={() => setIsAnnual(true)} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isAnnual ? "bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white shadow-lg" : "text-[#64748b] hover:text-[#e2e8f0]"}`}>
              Anual
              <span className={`text-xs px-2 py-0.5 rounded-full ${isAnnual ? "bg-white/20" : "bg-[#10b981]/20 text-[#10b981]"}`}>-15%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const displayPrice = isAnnual && plan.priceAnnual ? plan.priceAnnual : plan.price;
            return (
              <div key={plan.id} className={`relative rounded-2xl p-6 flex flex-col transition-all duration-300 ${plan.highlighted ? "bg-gradient-to-b from-[#6366f1]/15 to-[#a855f7]/15 border-2 border-[#6366f1] scale-105 shadow-2xl shadow-[#6366f1]/20" : "bg-[#111118] border border-[rgba(30,30,46,0.8)] hover:border-[#6366f1]/30"}`}>
                {plan.badge && (
                  <span className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-semibold ${plan.highlighted ? "bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white" : "bg-[#6366f1]/20 text-[#6366f1]"}`}>
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-xl font-semibold text-[#e2e8f0] mt-2 mb-1">{plan.name}</h3>
                <p className="text-sm text-[#64748b] mb-4">{plan.description}</p>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-[#e2e8f0]">{displayPrice}€</span>
                    <span className="text-[#64748b]">{plan.period}</span>
                  </div>
                  {isAnnual && plan.priceAnnual && (
                    <p className="text-xs text-[#10b981] mt-1">Economisești {(plan.price - plan.priceAnnual) * 12}€/an</p>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-6 p-3 bg-[#0a0a0f] rounded-xl">
                  <Zap className="w-5 h-5 text-[#f59e0b]" />
                  <span className="text-sm text-[#e2e8f0]"><span className="font-semibold">{plan.credits}</span> credite/lună</span>
                </div>
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
            );
          })}
        </div>

        {/* Enterprise */}
        <div className="max-w-5xl mx-auto mt-8">
          <div className="bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 rounded-2xl border border-[rgba(30,30,46,0.8)] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-semibold text-[#e2e8f0] mb-2">Enterprise</h3>
              <p className="text-[#64748b]">Soluții personalizate pentru echipe mari. SSO, SLA garantat, suport dedicat.</p>
            </div>
            <a href="#" className="flex-shrink-0 bg-transparent border border-[rgba(30,30,46,0.8)] text-[#e2e8f0] px-6 py-3 rounded-xl font-semibold hover:bg-[#1e1e2e] transition-colors">
              Contactează vânzări
            </a>
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
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#e2e8f0] mb-4">Gata să începi să construiești?</h2>
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
