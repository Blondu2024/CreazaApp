"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check, X, Minus, Sparkles, Zap, ChevronDown, Globe, Rocket, RefreshCw,
  Crown, Shield, Mail, Headphones, Users, GitBranch,
  Volume2, Mic, ImagePlus, Eraser, Languages, ScanText, FileText,
  ScanSearch, Video, AlertTriangle, Clock, Star,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { getAccessToken } from "@/lib/supabase";

// Icon aliases (reuse existing icons for categories)
const Cpu = Sparkles;
const Layers = Zap;

// ============================================
// Data
// ============================================

const plans = [
  {
    id: "free", name: "Gratuit", description: "Explorează platforma",
    price: 0, credits: 50,
    model: "Auto (performant)", context: "200K", apiTier: "Standard",
    support: "Comunitate", supportTime: "—",
    features: [
      "50 credite/lună",
      "Agent AI performant",
      "Preview instant + Auto-save",
      "8 API-uri AI standard",
      "Download ZIP",
      "Deploy cu un click",
      "Subdomain gratuit",
    ],
    limitations: ["Watermark pe site publicat", "Fără top-up credite", "Fără export GitHub"],
    cta: "Începe gratuit", highlighted: false, accent: "border-border",
  },
  {
    id: "starter", name: "Starter", description: "Proiecte personale",
    price: 69, credits: 300, badge: "Popular",
    model: "Auto (rapid)", context: "200K", apiTier: "Standard",
    support: "Email", supportTime: "48h",
    features: [
      "300 credite/lună",
      "Agent AI rapid",
      "Preview instant + Auto-save",
      "8 API-uri AI standard",
      "Top-up credite (nu expiră)",
      "Deploy fără watermark",
      "Export GitHub",
      "Download ZIP",
      "Suport email (48h)",
    ],
    limitations: [],
    cta: "Începe Starter →", highlighted: true, accent: "border-[#6366f1]",
  },
  {
    id: "pro", name: "Pro", description: "Creatori serioși",
    price: 149, credits: 400, badge: "Avansat",
    model: "Alegi modelul AI", context: "200K", apiTier: "Standard + Premium",
    support: "Prioritar", supportTime: "24h",
    features: [
      "400 credite/lună",
      "Alegi modelul AI (5 modele)",
      "API-uri premium (DALL-E 3, DeepL, ElevenLabs)",
      "Generare Video AI",
      "Top-up credite (nu expiră)",
      "Deploy fără watermark",
      "Domeniu custom",
      "Export GitHub",
      "Suport prioritar (24h)",
    ],
    limitations: [],
    cta: "Începe Pro →", highlighted: false, accent: "border-[#a855f7]/40",
  },
  {
    id: "ultra", name: "Ultra", description: "Performanță maximă",
    price: 299, credits: 500, badge: "Premium",
    model: "Modele premium", context: "1M tokeni", apiTier: "Premium",
    support: "Dedicat", supportTime: "4h",
    features: [
      "500 credite/lună",
      "Modele AI premium (Claude Opus, GPT-4.1)",
      "Context extins 1M tokeni",
      "API-uri premium (toate)",
      "Generare Video AI",
      "Top-up credite (nu expiră)",
      "Deploy fără watermark",
      "Domeniu custom",
      "Export GitHub",
      "Manager suport dedicat (4h)",
    ],
    limitations: [],
    cta: "Începe Ultra →", highlighted: false, accent: "border-[#f59e0b]/40",
  },
];

const topups = [
  { name: "Mini", price: 9, credits: 30, savings: 0 },
  { name: "Mediu", price: 19, credits: 70, savings: 10 },
  { name: "Mare", price: 49, credits: 200, savings: 18 },
  { name: "XL", price: 99, credits: 450, savings: 27, best: true },
];

const hostingPrices = [
  { action: "Deploy inițial", credits: 10, desc: "Publici proiectul online", icon: Rocket },
  { action: "Redeploy", credits: 3, desc: "Actualizezi site-ul publicat", icon: RefreshCw },
  { action: "Subdomain gratuit", credits: 0, desc: "proiect.creazaapp.com", icon: Globe },
  { action: "Domeniu custom", credits: 50, desc: "Conectezi propriul domeniu", icon: Globe },
  { action: "Export GitHub", credits: 0, desc: "Creează repo + push fișiere (Starter+)", icon: GitBranch },
];

// ─── Feature comparison table ────────────────

type CellValue = boolean | string;

interface FeatureRow {
  name: string;
  free: CellValue;
  starter: CellValue;
  pro: CellValue;
  ultra: CellValue;
}

interface FeatureCategory {
  name: string;
  icon: React.ElementType;
  rows: FeatureRow[];
}

const featureCategories: FeatureCategory[] = [
  {
    name: "Bază", icon: Layers,
    rows: [
      { name: "Credite lunare", free: "50", starter: "300", pro: "400", ultra: "500" },
      { name: "Top-up credite", free: false, starter: true, pro: true, ultra: true },
      { name: "Creditele expiră?", free: "Nu", starter: "Nu", pro: "Nu", ultra: "Nu" },
      { name: "Preview instant", free: true, starter: true, pro: true, ultra: true },
      { name: "Auto-save (2s)", free: true, starter: true, pro: true, ultra: true },
      { name: "Undo (10 versiuni)", free: true, starter: true, pro: true, ultra: true },
      { name: "Upload imagini", free: true, starter: true, pro: true, ultra: true },
      { name: "Upload documente", free: true, starter: true, pro: true, ultra: true },
    ],
  },
  {
    name: "Modele AI", icon: Cpu,
    rows: [
      { name: "Selecție model", free: "Auto", starter: "Auto", pro: "Manual", ultra: "Manual" },
      { name: "Context maxim", free: "200K", starter: "200K", pro: "200K", ultra: "1M tokeni" },
      { name: "Modele disponibile", free: "1", starter: "1", pro: "5 modele", ultra: "6+ modele" },
      { name: "Acces modele premium", free: false, starter: false, pro: true, ultra: true },
    ],
  },
  {
    name: "API-uri AI integrate", icon: Sparkles, isNew: true,
    rows: [
      { name: "Text-în-Voce (TTS)", free: "Standard", starter: "Standard", pro: "Std + Premium", ultra: "Premium" },
      { name: "Voce-în-Text (STT)", free: "Standard", starter: "Standard", pro: "Std + Premium", ultra: "Premium" },
      { name: "Generare Imagine", free: "Standard", starter: "Standard", pro: "Std + Premium", ultra: "Premium" },
      { name: "Ștergere Fundal", free: "Standard", starter: "Standard", pro: "Std + Premium", ultra: "Premium" },
      { name: "Traducere", free: "Standard", starter: "Standard", pro: "Std + Premium", ultra: "Premium" },
      { name: "OCR", free: true, starter: true, pro: true, ultra: true },
      { name: "Parsare Documente", free: true, starter: true, pro: true, ultra: true },
      { name: "Detectare Obiecte", free: true, starter: true, pro: true, ultra: true },
      { name: "Generare Video", free: false, starter: "Standard", pro: "Std + Premium", ultra: "Premium" },
    ],
  },
  {
    name: "Hosting & Export", icon: Rocket,
    rows: [
      { name: "Deploy cu un click", free: true, starter: true, pro: true, ultra: true },
      { name: "Subdomain gratuit", free: true, starter: true, pro: true, ultra: true },
      { name: "Export GitHub", free: false, starter: true, pro: true, ultra: true },
      { name: "Domeniu custom", free: false, starter: false, pro: true, ultra: true },
      { name: "Fără watermark", free: false, starter: true, pro: true, ultra: true },
      { name: "Download ZIP", free: true, starter: true, pro: true, ultra: true },
    ],
  },
  {
    name: "Suport", icon: Headphones,
    rows: [
      { name: "Nivel suport", free: "Comunitate", starter: "Email", pro: "Prioritar", ultra: "Dedicat" },
      { name: "Timp răspuns", free: "—", starter: "48h", pro: "24h", ultra: "4h" },
      { name: "Chat suport", free: false, starter: false, pro: true, ultra: true },
    ],
  },
] as (FeatureCategory & { isNew?: boolean })[];

// ─── Eden AI capabilities showcase ──────────

const edenCapabilities = [
  { id: "tts", name: "Text-în-Voce", icon: Volume2, desc: "Convertește text în voce naturală", cost: "0.14", costPremium: "2.06", unit: "/1K car.", providers: ["Google", "Amazon", "Microsoft", "OpenAI", "ElevenLabs"] },
  { id: "stt", name: "Voce-în-Text", icon: Mic, desc: "Transcrie audio în text", cost: "0.10", costPremium: "0.21", unit: "/min", providers: ["Google", "Deepgram", "AssemblyAI", "Whisper"] },
  { id: "image", name: "Generare Imagine", icon: ImagePlus, desc: "Creează imagini din text", cost: "0.14", costPremium: "1.37", unit: "/img", providers: ["Stability AI", "Amazon Titan", "DALL-E 3"] },
  { id: "bg", name: "Ștergere Fundal", icon: Eraser, desc: "Elimină fundalul din imagini", cost: "0.10", costPremium: "0.69", unit: "/img", providers: ["SentiSight", "PhotoRoom"] },
  { id: "translate", name: "Traducere", icon: Languages, desc: "Traducere în 130+ limbi", cost: "0.17", costPremium: "0.86", unit: "/1K car.", providers: ["Lingvanex", "Google", "DeepL"] },
  { id: "ocr", name: "OCR", icon: ScanText, desc: "Extrage text din imagini", cost: "0.10", costPremium: null, unit: "/pag.", providers: ["Google", "Amazon", "Microsoft"] },
  { id: "doc", name: "Parsare Documente", icon: FileText, desc: "PDF, DOCX, XLSX, PPTX", cost: "0.10", costPremium: null, unit: "/pag.", providers: ["Amazon", "Microsoft", "Google"] },
  { id: "detect", name: "Detectare Obiecte", icon: ScanSearch, desc: "Identifică obiecte în imagini", cost: "0.10", costPremium: null, unit: "/img", providers: ["Google Vision", "Amazon Rekognition"] },
  { id: "video", name: "Generare Video", icon: Video, desc: "Creează video din text", cost: "1.72", costPremium: "3.44", unit: "/sec", warning: true, providers: ["Google Veo 3", "Amazon Nova", "Runway"] },
];

// ─── Support tiers ──────────────────────────

const supportTiers = [
  { name: "Comunitate", plan: "Gratuit", icon: Users, time: "—", color: "text-muted-foreground", desc: "Forum și documentație" },
  { name: "Email", plan: "Starter", icon: Mail, time: "48h", color: "text-[#6366f1]", desc: "Suport prin email" },
  { name: "Prioritar", plan: "Pro", icon: Headphones, time: "24h", color: "text-[#a855f7]", desc: "Email prioritar + chat" },
  { name: "Dedicat", plan: "Ultra", icon: Shield, time: "4h", color: "text-[#f59e0b]", desc: "Manager dedicat" },
];

// ─── FAQ ────────────────────────────────────

const faqs = [
  { q: "Ce este un credit și cum se consumă?", a: "1 credit = 0.20 RON. Creditele se consumă automat la fiecare mesaj trimis agentului AI și la fiecare apel API (generare imagine, TTS, traducere etc.), proporțional cu complexitatea operației." },
  { q: "Ce se întâmplă cu creditele nefolosite?", a: "Creditele lunare se adaugă la începutul fiecărei luni. Creditele cumpărate prin top-up NU expiră niciodată — se consumă după creditele lunare." },
  { q: "Ce sunt API-urile AI integrate?", a: "Aplicațiile tale generate au acces direct la API-uri puternice: generare imagini, text-to-speech, traducere, OCR și multe altele. Nu ai nevoie de conturi sau chei externe — totul se consumă din creditele tale CreazaApp." },
  { q: "Cât costă API-urile AI?", a: "Fiecare API are un cost per operație în credite. De exemplu: generare imagine de la 0.14 credite, traducere 1000 caractere de la 0.17 credite, text-to-speech de la 0.14 credite. Planurile Pro și Ultra au acces la provideri premium (ElevenLabs, DALL-E 3, DeepL) la costuri mai mari dar calitate superioară." },
  { q: "De ce nu pot alege modelul AI?", a: "Pe planurile Gratuit și Starter, platforma alege automat cel mai bun model pentru tine. Pe Pro și Ultra, poți alege modelul la începutul fiecărui proiect." },
  { q: "Cum funcționează suportul?", a: "Gratuit: acces la documentație și comunitate. Starter: suport email cu răspuns în 48h. Pro: suport prioritar cu răspuns în 24h + chat. Ultra: manager dedicat cu răspuns în 4h." },
  { q: "Cum funcționează hostingul?", a: "După ce proiectul e gata, dai deploy cu un click. Primești un subdomain gratuit (proiect.creazaapp.com). Hostingul sleep mode pornește site-ul la cerere. Hostingul 24/7 ține site-ul mereu activ." },
  { q: "Pot cumpăra top-up fără abonament?", a: "Top-up-urile sunt disponibile doar cu un abonament activ (inclusiv Gratuit). Creditele top-up nu expiră niciodată." },
  { q: "Pot schimba planul oricând?", a: "Da, poți face upgrade sau downgrade în orice moment. Creditele rămase se păstrează." },
  { q: "Oferiți factură pentru firme?", a: "Da, oferim facturi fiscale pentru toate planurile plătite." },
];

// ============================================
// Component helpers
// ============================================

function CellDisplay({ value }: { value: CellValue }) {
  if (value === true) return <Check className="w-5 h-5 text-[#10b981]" />;
  if (value === false) return <Minus className="w-4 h-4 text-muted-foreground/40" />;
  return <span className="text-sm text-foreground">{value}</span>;
}

// ============================================
// Page
// ============================================

async function handleCheckout(type: "subscription" | "topup", id: string, token: string | null) {
  if (!token) {
    window.location.href = "/login";
    return;
  }
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ type, id }),
  });
  const data = await res.json();
  if (data.url) window.location.href = data.url;
  else alert(data.error || "Eroare la checkout");
}

export default function PricingPage() {
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());
  const [expandedApi, setExpandedApi] = useState<string | null>(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const toggleFaq = (i: number) => {
    setOpenFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const visibleCategories = showAllFeatures ? featureCategories : featureCategories.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ─── Hero ─────────────────────────────── */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-[#6366f1]/15 via-[#a855f7]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <span className="inline-flex items-center gap-2 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-full px-4 py-1.5 text-sm text-[#6366f1] font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Prețuri simple, putere maximă
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            Construiește aplicații{" "}
            <span className="gradient-text">cu AI</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-3 max-w-2xl mx-auto">
            Agent AI, API-uri integrate, hosting — totul într-un singur loc. Plătești doar ce folosești.
          </p>
          <p className="text-sm text-[#6366f1] font-medium">1 credit = 0.20 RON</p>
        </div>
      </section>

      {/* ─── Plan Cards ───────────────────────── */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 flex flex-col transition-all duration-300 bg-card border-2 ${
                plan.highlighted
                  ? "border-[#6366f1] scale-[1.03] shadow-2xl shadow-[#6366f1]/15"
                  : `${plan.accent} hover:border-[#6366f1]/30`
              }`}
            >
              {plan.badge && (
                <span className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-semibold ${
                  plan.highlighted
                    ? "bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white"
                    : plan.id === "ultra"
                    ? "bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30"
                    : "bg-[#6366f1]/10 text-[#6366f1]"
                }`}>
                  {plan.id === "ultra" && <Crown className="w-3 h-3 inline mr-1 -mt-0.5" />}
                  {plan.badge}
                </span>
              )}

              <h3 className="text-xl font-semibold text-foreground mt-2 mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-5">{plan.description}</p>

              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm"> RON/lună</span>
                </div>
              </div>

              {/* Credits badge */}
              <div className="flex items-center gap-2 mb-2 p-3 bg-background rounded-xl">
                <Zap className="w-5 h-5 text-[#f59e0b]" />
                <span className="text-sm text-foreground"><span className="font-bold">{plan.credits}</span> credite/lună</span>
              </div>

              {/* Key info rows */}
              <div className="space-y-2 mb-5 text-sm">
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Model AI</span>
                  <span className="text-foreground font-medium">{plan.model}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">API-uri</span>
                  <span className="text-foreground font-medium">{plan.apiTier}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Context</span>
                  <span className="text-foreground font-medium">{plan.context}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Suport</span>
                  <span className="text-foreground font-medium">{plan.support}</span>
                </div>
              </div>

              {/* Feature list */}
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10b981] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{f}</span>
                  </li>
                ))}
                {plan.limitations.map((l, i) => (
                  <li key={`lim-${i}`} className="flex items-start gap-2.5">
                    <X className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{l}</span>
                  </li>
                ))}
              </ul>

              {plan.price > 0 ? (
                <button
                  onClick={async () => {
                    setCheckoutLoading(plan.id);
                    const token = await getAccessToken();
                    await handleCheckout("subscription", plan.id, token);
                    setCheckoutLoading(null);
                  }}
                  disabled={checkoutLoading === plan.id}
                  className="w-full py-3 rounded-xl text-center font-semibold transition-all duration-200 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white btn-primary-glow disabled:opacity-50"
                >
                  {checkoutLoading === plan.id ? "Se încarcă..." : plan.cta}
                </button>
              ) : (
                <Link
                  href="/workspace"
                  className="w-full py-3 rounded-xl text-center font-semibold block transition-all duration-200 bg-transparent border border-border text-foreground hover:bg-card"
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── Feature Comparison Table ─────────── */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-2">Compară planurile</h2>
          <p className="text-sm text-muted-foreground text-center mb-10">Toate funcționalitățile, detaliate.</p>

          {/* Desktop table */}
          <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-5 border-b border-border">
              <div className="p-4" />
              {plans.map((p) => (
                <div key={p.id} className={`p-4 text-center ${p.highlighted ? "bg-[#6366f1]/5" : ""}`}>
                  <p className="font-semibold text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.price > 0 ? `${p.price} RON/lună` : "Gratuit"}</p>
                </div>
              ))}
            </div>

            {/* Categories & rows */}
            {visibleCategories.map((cat, ci) => (
              <div key={ci}>
                {/* Category header */}
                <div className="grid grid-cols-5 bg-muted/40">
                  <div className="col-span-5 p-3 px-4 flex items-center gap-2">
                    <cat.icon className="w-4 h-4 text-[#6366f1]" />
                    <span className="text-sm font-semibold text-foreground">{cat.name}</span>
                    {(cat as FeatureCategory & { isNew?: boolean }).isNew && (
                      <span className="text-[10px] font-bold bg-[#10b981]/15 text-[#10b981] px-2 py-0.5 rounded-full">NOU</span>
                    )}
                  </div>
                </div>
                {/* Feature rows */}
                {cat.rows.map((row, ri) => (
                  <div key={ri} className="grid grid-cols-5 border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <div className="p-3 px-4 text-sm text-muted-foreground">{row.name}</div>
                    {(["free", "starter", "pro", "ultra"] as const).map((planId) => (
                      <div key={planId} className={`p-3 flex justify-center items-center ${plans.find(p => p.id === planId)?.highlighted ? "bg-[#6366f1]/5" : ""}`}>
                        <CellDisplay value={row[planId]} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Mobile comparison — single plan view */}
          <MobileComparison categories={visibleCategories} />

          {/* Show all button */}
          {!showAllFeatures && (
            <div className="text-center mt-6">
              <button
                onClick={() => setShowAllFeatures(true)}
                className="text-sm text-[#6366f1] hover:text-[#a855f7] font-medium transition-colors inline-flex items-center gap-1"
              >
                Arată toate funcționalitățile
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ─── Eden AI API Showcase ─────────────── */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 bg-[#10b981]/10 text-[#10b981] text-xs font-bold px-3 py-1 rounded-full mb-4">
              <Star className="w-3 h-3" /> NOU
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              API-uri AI <span className="gradient-text">integrate</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Aplicațiile tale au acces la cele mai puternice API-uri AI. Fără conturi externe, fără chei — totul din creditele tale.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {edenCapabilities.map((cap) => {
              const isOpen = expandedApi === cap.id;
              return (
                <div
                  key={cap.id}
                  className={`bg-card border rounded-xl transition-all duration-200 cursor-pointer ${
                    isOpen ? "border-[#6366f1]/50 shadow-lg shadow-[#6366f1]/5" : "border-border hover:border-[#6366f1]/30"
                  }`}
                  onClick={() => setExpandedApi(isOpen ? null : cap.id)}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#6366f1]/10 flex items-center justify-center">
                          <cap.icon className="w-5 h-5 text-[#6366f1]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">{cap.name}</h3>
                          <p className="text-xs text-muted-foreground">{cap.desc}</p>
                        </div>
                      </div>
                      {cap.warning && <AlertTriangle className="w-4 h-4 text-[#f59e0b] flex-shrink-0" />}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[#10b981]">
                        {cap.cost} cr
                      </span>
                      {cap.costPremium && (
                        <>
                          <span className="text-muted-foreground/40">→</span>
                          <span className={`text-sm font-bold ${cap.warning ? "text-[#f59e0b]" : "text-[#a855f7]"}`}>
                            {cap.costPremium} cr
                          </span>
                        </>
                      )}
                      <span className="text-xs text-muted-foreground">{cap.unit}</span>
                    </div>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div className="mt-4 pt-4 border-t border-border/50 animate-fade-in-up">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">Provideri disponibili:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {cap.providers.map((p) => (
                            <span key={p} className="text-xs bg-muted px-2 py-1 rounded-md text-foreground">{p}</span>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                          {cap.warning
                            ? "⚠️ Cost ridicat — video 6 secunde = 10-20 credite"
                            : "Gratuit/Starter: provider standard. Pro/Ultra: alegi providerul."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Support Tiers ────────────────────── */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-2">Suport</h2>
          <p className="text-sm text-muted-foreground text-center mb-10">Fiecare plan vine cu nivelul potrivit de asistență.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {supportTiers.map((tier) => (
              <div key={tier.name} className="bg-card border border-border rounded-xl p-5 text-center hover:border-[#6366f1]/30 transition-colors">
                <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${
                  tier.name === "Dedicat" ? "bg-[#f59e0b]/10" : "bg-[#6366f1]/10"
                }`}>
                  <tier.icon className={`w-6 h-6 ${tier.color}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{tier.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{tier.desc}</p>
                <div className="text-xs">
                  <span className="text-muted-foreground">Timp răspuns: </span>
                  <span className={`font-bold ${tier.color}`}>{tier.time}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Plan {tier.plan}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Hosting & Deploy ─────────────────── */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Rocket className="w-5 h-5 text-[#6366f1]" />
              <h2 className="text-2xl font-bold text-foreground">Hosting, Deploy & Export</h2>
            </div>
            <p className="text-sm text-muted-foreground">Publică online, exportă pe GitHub sau descarcă ZIP. Totul din workspace.</p>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {hostingPrices.map((h, i) => (
              <div key={i} className={`flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors ${
                i < hostingPrices.length - 1 ? "border-b border-border/50" : ""
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    h.credits === 0 ? "bg-[#10b981]/10" : "bg-[#6366f1]/10"
                  }`}>
                    <h.icon className={`w-4 h-4 ${h.credits === 0 ? "text-[#10b981]" : "text-[#6366f1]"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{h.action}</p>
                    <p className="text-[11px] text-muted-foreground">{h.desc}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${h.credits === 0 ? "text-[#10b981]" : "text-[#f59e0b]"}`}>
                  {h.credits === 0 ? "GRATUIT" : `${h.credits} cr`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Top-up Credits ───────────────────── */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-2">Credite Top-up</h2>
          <p className="text-sm text-muted-foreground text-center mb-2">Cumpără credite extra când ai nevoie de mai mult.</p>
          <div className="flex items-center justify-center gap-1.5 mb-8">
            <Clock className="w-3.5 h-3.5 text-[#10b981]" />
            <p className="text-xs text-[#10b981] font-medium">Creditele top-up nu expiră niciodată</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {topups.map((t) => (
              <div key={t.name} className={`relative bg-card border rounded-xl p-5 text-center transition-all duration-200 ${
                t.best
                  ? "border-[#f59e0b]/50 shadow-lg shadow-[#f59e0b]/10"
                  : "border-border hover:border-[#6366f1]/30"
              }`}>
                {t.best && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#f59e0b] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    Cel mai bun preț
                  </span>
                )}
                <p className="text-3xl font-bold text-foreground">{t.credits}</p>
                <p className="text-xs text-muted-foreground mb-3">credite</p>
                <p className="text-lg font-bold text-[#f59e0b]">{t.price} RON</p>
                <p className="text-[11px] text-muted-foreground mt-1">{(t.price / t.credits).toFixed(2)} RON/credit</p>
                {t.savings > 0 && (
                  <p className="text-[10px] text-[#10b981] font-medium mt-1.5">Economisești {t.savings}%</p>
                )}
                <button
                  onClick={async () => {
                    setCheckoutLoading(`topup-${t.name.toLowerCase()}`);
                    const token = await getAccessToken();
                    await handleCheckout("topup", t.name.toLowerCase(), token);
                    setCheckoutLoading(null);
                  }}
                  disabled={checkoutLoading === `topup-${t.name.toLowerCase()}`}
                  className="mt-3 w-full py-2 rounded-lg text-xs font-semibold transition-all bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20 border border-[#f59e0b]/30 disabled:opacity-50"
                >
                  {checkoutLoading === `topup-${t.name.toLowerCase()}` ? "..." : "Cumpără"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────── */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">Întrebări frecvente</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`bg-card border rounded-xl transition-colors ${
                  openFaqs.has(i) ? "border-[#6366f1]/40" : "border-border"
                }`}
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="text-sm font-medium text-foreground pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                    openFaqs.has(i) ? "rotate-180" : ""
                  }`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${
                  openFaqs.has(i) ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                }`}>
                  <p className="text-muted-foreground px-6 pb-4 leading-relaxed text-sm">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────── */}
      <section className="pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-[#6366f1]/10 via-[#a855f7]/10 to-[#6366f1]/5 rounded-2xl border border-[#6366f1]/20 p-12 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#a855f7]/10 rounded-full blur-3xl pointer-events-none" />
            <Sparkles className="w-12 h-12 text-[#6366f1] mx-auto mb-6 relative" />
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 relative">Gata să construiești?</h2>
            <p className="text-muted-foreground mb-8 relative max-w-md mx-auto">
              Agent AI, API-uri integrate, hosting — totul într-un singur loc. Începe în mai puțin de 5 minute.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative">
              <Link href="/workspace" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white px-8 py-4 rounded-xl font-semibold btn-primary-glow">
                Începe gratuit →
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-4 relative">Fără card bancar. 50 credite gratuite.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ─── Mobile comparison component ─────────────

function MobileComparison({ categories }: { categories: FeatureCategory[] }) {
  const [selected, setSelected] = useState("starter");

  return (
    <div className="md:hidden">
      {/* Plan tabs */}
      <div className="flex gap-1 mb-4 bg-muted rounded-xl p-1">
        {plans.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              selected === p.id
                ? "bg-[#6366f1] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Single plan features */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {categories.map((cat, ci) => (
          <div key={ci}>
            <div className="bg-muted/40 px-4 py-2.5 flex items-center gap-2">
              <cat.icon className="w-3.5 h-3.5 text-[#6366f1]" />
              <span className="text-xs font-semibold text-foreground">{cat.name}</span>
              {(cat as FeatureCategory & { isNew?: boolean }).isNew && (
                <span className="text-[9px] font-bold bg-[#10b981]/15 text-[#10b981] px-1.5 py-0.5 rounded-full">NOU</span>
              )}
            </div>
            {cat.rows.map((row, ri) => (
              <div key={ri} className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
                <span className="text-xs text-muted-foreground">{row.name}</span>
                <CellDisplay value={row[selected as keyof FeatureRow] as CellValue} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
