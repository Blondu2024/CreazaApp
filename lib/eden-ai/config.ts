// ============================================
// Eden AI — Capabilities, Providers & Pricing
// ============================================
// Eden AI fee: 5.5% on top of provider cost
// Our markup: 40% on top of Eden AI cost
// 1 credit = $0.043

import { CREDIT_VALUE_USD } from "../credits";

export const EDEN_AI_FEE = 0.055;   // 5.5%
export const OUR_MARKUP = 0.40;      // 40%
export const EDEN_API_BASE = "https://api.edenai.run/v2";

// ============================================
// Provider tiers — mapped to user plans
// ============================================

export type ProviderTier = "basic" | "premium";

export interface EdenProvider {
  id: string;             // Eden AI provider name (e.g., "google", "elevenlabs")
  label: string;          // Display name for user
  costUsd: number;        // Raw provider cost per unit (before fees)
  tier: ProviderTier;
}

export interface EdenCapability {
  id: string;                        // URL slug: "tts", "stt", etc.
  name: string;                      // Romanian display name
  description: string;               // What it does
  unit: string;                      // "1000 caractere" | "minut" | "imagine" | "pagina" | "secunda"
  edenEndpoint: string;              // Eden AI API path (e.g., "/audio/text_to_speech")
  edenMethod: "POST";
  providers: EdenProvider[];
  rateLimit: number;                 // Max requests per minute per user
  warningThreshold: number;          // Warn agent if cost > this many credits
  requiresAuth: true;
}

// ============================================
// All 8 capabilities
// ============================================

export const EDEN_CAPABILITIES: Record<string, EdenCapability> = {

  // ─── AUDIO ───────────────────────────────

  tts: {
    id: "tts",
    name: "Text-in-Voce",
    description: "Converteste text in voce audio. Suporta romana.",
    unit: "1000 caractere",
    edenEndpoint: "/audio/text_to_speech",
    edenMethod: "POST",
    providers: [
      { id: "google",      label: "Standard",                costUsd: 0.004,  tier: "basic" },
      { id: "amazon",      label: "Amazon Polly",            costUsd: 0.004,  tier: "basic" },
      { id: "microsoft",   label: "Microsoft Azure",         costUsd: 0.016,  tier: "basic" },
      { id: "openai",      label: "OpenAI TTS",              costUsd: 0.015,  tier: "premium" },
      { id: "elevenlabs",  label: "Premium (ElevenLabs)",    costUsd: 0.060,  tier: "premium" },
    ],
    rateLimit: 10,
    warningThreshold: 2,
    requiresAuth: true,
  },

  stt: {
    id: "stt",
    name: "Voce-in-Text",
    description: "Transcrie audio in text. Suporta romana.",
    unit: "minut",
    edenEndpoint: "/audio/speech_to_text_async",
    edenMethod: "POST",
    providers: [
      { id: "google",      label: "Standard",               costUsd: 0.003,   tier: "basic" },
      { id: "deepgram",    label: "Deepgram Nova-3",        costUsd: 0.0043,  tier: "basic" },
      { id: "assemblyai",  label: "AssemblyAI",             costUsd: 0.0045,  tier: "premium" },
      { id: "openai",      label: "OpenAI Whisper",         costUsd: 0.006,   tier: "premium" },
    ],
    rateLimit: 10,
    warningThreshold: 2,
    requiresAuth: true,
  },

  // ─── IMAGINE ─────────────────────────────

  "image-generate": {
    id: "image-generate",
    name: "Generare Imagine",
    description: "Genereaza imagini din text.",
    unit: "imagine",
    edenEndpoint: "/image/generation",
    edenMethod: "POST",
    providers: [
      { id: "stabilityai", label: "Standard (Stability)",    costUsd: 0.004,  tier: "basic" },
      { id: "amazon",      label: "Amazon Titan",            costUsd: 0.010,  tier: "basic" },
      { id: "stabilityai", label: "Stability Core",          costUsd: 0.030,  tier: "premium" },
      { id: "openai",      label: "Premium (DALL-E 3)",      costUsd: 0.040,  tier: "premium" },
    ],
    rateLimit: 10,
    warningThreshold: 3,
    requiresAuth: true,
  },

  "background-removal": {
    id: "background-removal",
    name: "Stergere Fundal",
    description: "Sterge fundalul din imagini.",
    unit: "imagine",
    edenEndpoint: "/image/background_removal",
    edenMethod: "POST",
    providers: [
      { id: "sentisight",  label: "Standard",               costUsd: 0.00075, tier: "basic" },
      { id: "photoroom",   label: "Premium (PhotoRoom)",    costUsd: 0.020,   tier: "premium" },
    ],
    rateLimit: 10,
    warningThreshold: 2,
    requiresAuth: true,
  },

  // ─── TEXT / NLP ──────────────────────────

  translate: {
    id: "translate",
    name: "Traducere",
    description: "Traduce text intre limbi. Suporta romana.",
    unit: "1000 caractere",
    edenEndpoint: "/translation/automatic_translation",
    edenMethod: "POST",
    providers: [
      { id: "lingvanex",   label: "Standard",               costUsd: 0.005,  tier: "basic" },
      { id: "google",      label: "Google Translate",        costUsd: 0.020,  tier: "basic" },
      { id: "deepl",       label: "Premium (DeepL)",        costUsd: 0.025,  tier: "premium" },
    ],
    rateLimit: 20,
    warningThreshold: 2,
    requiresAuth: true,
  },

  ocr: {
    id: "ocr",
    name: "OCR — Text din Imagini",
    description: "Extrage text din imagini si documente scanate.",
    unit: "pagina",
    edenEndpoint: "/ocr/ocr",
    edenMethod: "POST",
    providers: [
      { id: "google",      label: "Standard (Google)",      costUsd: 0.0015, tier: "basic" },
      { id: "amazon",      label: "Amazon Textract",        costUsd: 0.0015, tier: "basic" },
      { id: "microsoft",   label: "Premium (Azure)",        costUsd: 0.0015, tier: "premium" },
    ],
    rateLimit: 15,
    warningThreshold: 2,
    requiresAuth: true,
  },

  "document-parse": {
    id: "document-parse",
    name: "Parsare Documente",
    description: "Extrage text structurat din PDF, DOCX, XLSX, PPTX, imagini.",
    unit: "pagina",
    edenEndpoint: "/ocr/ocr",
    edenMethod: "POST",
    providers: [
      { id: "amazon",      label: "Standard (Textract)",    costUsd: 0.0015, tier: "basic" },
      { id: "microsoft",   label: "Premium (Azure)",        costUsd: 0.0015, tier: "premium" },
      { id: "google",      label: "Google Doc AI",          costUsd: 0.0015, tier: "premium" },
    ],
    rateLimit: 10,
    warningThreshold: 2,
    requiresAuth: true,
  },

  // ─── DETECTARE ───────────────────────────

  "object-detection": {
    id: "object-detection",
    name: "Detectare Obiecte",
    description: "Detecteaza si identifica obiecte in imagini.",
    unit: "imagine",
    edenEndpoint: "/image/object_detection",
    edenMethod: "POST",
    providers: [
      { id: "google",      label: "Standard (Google)",      costUsd: 0.002,  tier: "basic" },
      { id: "amazon",      label: "Amazon Rekognition",     costUsd: 0.002,  tier: "basic" },
    ],
    rateLimit: 15,
    warningThreshold: 2,
    requiresAuth: true,
  },

  // ─── VIDEO ───────────────────────────────

  "video-generate": {
    id: "video-generate",
    name: "Generare Video",
    description: "Genereaza video din text. SCUMP — avertizeaza userul.",
    unit: "secunda",
    edenEndpoint: "/video/generation",
    edenMethod: "POST",
    providers: [
      { id: "google",       label: "Standard (Veo 3)",      costUsd: 0.050,  tier: "basic" },
      { id: "amazon",       label: "Amazon Nova Reel",      costUsd: 0.080,  tier: "premium" },
      { id: "runway",       label: "Premium (Runway)",      costUsd: 0.100,  tier: "premium" },
    ],
    rateLimit: 3,
    warningThreshold: 5,
    requiresAuth: true,
  },
};

// ============================================
// Minimum credit charge — for very cheap APIs
// ============================================

export const MIN_CREDIT_CHARGE = 0.10;

// ============================================
// Cost calculation helpers
// ============================================

/**
 * Calculate credit cost for a provider's raw USD price.
 * Applies Eden AI 5.5% fee + our 40% markup, converts to credits.
 * Enforces minimum charge.
 */
export function providerCostToCredits(costUsd: number): number {
  const withFees = costUsd * (1 + EDEN_AI_FEE) * (1 + OUR_MARKUP);
  const credits = withFees / CREDIT_VALUE_USD;
  return Math.max(MIN_CREDIT_CHARGE, Math.round(credits * 100) / 100);
}

/**
 * Get all valid capability IDs.
 */
export function getCapabilityIds(): string[] {
  return Object.keys(EDEN_CAPABILITIES);
}

/**
 * Get capability by ID or null if invalid.
 */
export function getCapability(id: string): EdenCapability | null {
  return EDEN_CAPABILITIES[id] ?? null;
}
