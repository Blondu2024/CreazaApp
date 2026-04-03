"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, Zap, ChevronDown, Globe, Rocket, Server } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

const plans = [
  {
    id: "free", name: "Gratuit", description: "Explorează platforma",
    price: 0, period: "/lună", credits: 50,
    features: ["50 credite/lună", "Agent AI performant", "Preview instant", "Download ZIP", "Subdomain gratuit"],
    cta: "Începe gratuit", ctaStyle: "outline" as const, highlighted: false,
  },
  {
    id: "starter", name: "Starter", description: "Proiecte personale",
    price: 69, period: "/lună", credits: 300, badge: "Popular",
    features: ["300 credite/lună", "Agent AI rapid", "Preview instant", "Download ZIP", "Subdomain gratuit", "Top-up credite disponibil"],
    cta: "Începe Starter →", ctaStyle: "gradient" as const, highlighted: true,
  },
  {
    id: "pro", name: "Pro", description: "Creatori serioși",
    price: 149, period: "/lună", credits: 400, badge: "Avansat",
    features: ["400 credite/lună", "Alegi modelul AI", "Modele puternice disponibile", "Context 200K tokeni", "Deploy + Hosting (pe credite)", "Top-up credite disponibil"],
    cta: "Începe Pro →", ctaStyle: "gradient" as const, highlighted: false,
  },
  {
    id: "ultra", name: "Ultra", description: "Performanță maximă",
    price: 299, period: "/lună", credits: 500,
    features: ["500 credite/lună", "Alegi modelul AI premium", "Cele mai puternice modele", "Context 1M tokeni", "Deploy + Hosting (pe credite)", "Top-up credite disponibil"],
    cta: "Începe Ultra →", ctaStyle: "gradient" as const, highlighted: false,
  },
];

const topups = [
  { name: "Mini", price: 9, credits: 30 },
  { name: "Mediu", price: 19, credits: 70 },
  { name: "Mare", price: 49, credits: 200 },
  { name: "XL", price: 99, credits: 450 },
];

const hostingPrices = [
  { action: "Deploy inițial", credits: 10, desc: "Publici proiectul online" },
  { action: "Subdomain gratuit", credits: 0, desc: "proiect.creazaapp.com" },
  { action: "Hosting sleep mode", credits: 25, desc: "Se trezește la request (2-3s delay)", perMonth: true },
  { action: "Hosting 24/7", credits: 60, desc: "Always on, fără delay", perMonth: true },
  { action: "Domeniu custom (conectare)", credits: 50, desc: "Conectezi propriul domeniu" },
];

const faqs = [
  { q: "Ce este un credit și cum se consumă?", a: "1 credit = 0.20 RON. Creditele se consumă automat la fiecare mesaj trimis agentului AI, proporțional cu complexitatea răspunsului. Nu alegi tu modelul — platforma folosește cel mai potrivit AI pentru planul tău." },
  { q: "Ce se întâmplă cu creditele nefolosite?", a: "Creditele lunare se resetează la începutul fiecărei luni. Creditele cumpărate prin top-up NU expiră niciodată — se consumă după creditele lunare." },
  { q: "De ce nu pot alege modelul AI?", a: "Pe planurile Gratuit și Starter, platforma alege automat cel mai bun model pentru tine. Asta simplifică experiența și garantează calitate. Pe Pro și Ultra, poți alege modelul la începutul fiecărui proiect." },
  { q: "Cum funcționează hostingul?", a: "După ce proiectul e gata, dai deploy cu un click. Primești un subdomain gratuit (proiect.creazaapp.com). Hostingul sleep mode pornește site-ul la cerere. Hostingul 24/7 ține site-ul mereu activ." },
  { q: "Pot cumpăra top-up fără abonament?", a: "Top-up-urile sunt disponibile doar cu un abonament activ (inclusiv Gratuit). Creditele top-up nu expiră niciodată." },
  { q: "Pot schimba planul oricând?", a: "Da, poți face upgrade sau downgrade în orice moment. Modificările se aplică imediat." },
  { q: "Oferiți factură pentru firme?", a: "Da, oferim facturi fiscale pentru toate planurile plătite." },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-20 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Prețuri simple, fără surprize
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Platforma alege cel mai bun AI pentru tine. Tu doar construiești.
          </p>
          <p className="text-sm text-[#6366f1]">1 credit = 0.20 RON</p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className={`relative rounded-2xl p-6 flex flex-col transition-all duration-300 ${plan.highlighted ? "bg-gradient-to-b from-[#6366f1]/15 to-[#a855f7]/15 border-2 border-[#6366f1] scale-105 shadow-2xl shadow-[#6366f1]/20" : "bg-card border border-border hover:border-[#6366f1]/30"}`}>
              {plan.badge && (
                <span className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-semibold ${plan.highlighted ? "bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white" : "bg-[#6366f1]/20 text-[#6366f1]"}`}>
                  {plan.badge}
                </span>
              )}
              <h3 className="text-xl font-semibold text-foreground mt-2 mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground"> RON{plan.period}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4 p-3 bg-background rounded-xl">
                <Zap className="w-5 h-5 text-[#f59e0b]" />
                <span className="text-sm text-foreground"><span className="font-semibold">{plan.credits}</span> credite/lună</span>
              </div>
              <ul className="space-y-3 mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/workspace" className={`w-full py-3 rounded-xl text-center font-semibold block ${plan.ctaStyle === "gradient" ? "bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white btn-primary-glow" : "bg-transparent border border-border text-foreground hover:bg-[#1e1e2e] transition-colors duration-200"}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Hosting & Deploy */}
      <section className="pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Rocket className="w-5 h-5 text-[#6366f1]" />
              <h2 className="text-2xl font-semibold text-foreground">Hosting & Deploy</h2>
            </div>
            <p className="text-sm text-muted-foreground">Publică proiectul online cu un click. Creditele se consumă din balanța ta.</p>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {hostingPrices.map((h, i) => (
              <div key={i} className={`flex items-center justify-between px-5 py-4 ${i < hostingPrices.length - 1 ? "border-b border-border" : ""}`}>
                <div className="flex items-center gap-3">
                  {h.credits === 0 ? <Globe className="w-4 h-4 text-[#10b981]" /> : <Server className="w-4 h-4 text-[#6366f1]" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">{h.action}</p>
                    <p className="text-[11px] text-muted-foreground">{h.desc}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${h.credits === 0 ? "text-[#10b981]" : "text-[#f59e0b]"}`}>
                  {h.credits === 0 ? "GRATUIT" : `${h.credits} cr${h.perMonth ? "/lună" : ""}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top-up */}
      <section className="pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-foreground text-center mb-2">Credite Top-up</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">Cumpără credite extra. Nu expiră niciodată.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {topups.map((t) => (
              <div key={t.name} className="bg-card border border-border rounded-xl p-4 text-center hover:border-[#6366f1]/30 transition-colors">
                <p className="text-lg font-bold text-foreground">{t.credits}</p>
                <p className="text-xs text-muted-foreground mb-2">credite</p>
                <p className="text-sm font-semibold text-[#f59e0b]">{t.price} RON</p>
                <p className="text-[10px] text-muted-foreground mt-1">{(t.price / t.credits).toFixed(2)} RON/credit</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground text-center mb-12">Întrebări frecvente</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className={`bg-card border rounded-xl px-6 ${openFaq === i ? "border-[#6366f1]/50" : "border-border"}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between py-4 text-left text-foreground font-medium">
                  {faq.q}
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <p className="text-muted-foreground pb-4 leading-relaxed text-sm">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10 rounded-2xl border border-border p-12">
            <Sparkles className="w-12 h-12 text-[#6366f1] mx-auto mb-6" />
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4">Gata să construiești?</h2>
            <p className="text-muted-foreground mb-8">Creează prima ta aplicație în mai puțin de 5 minute. Fără card bancar.</p>
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
