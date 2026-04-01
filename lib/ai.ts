import { createOpenAI } from "@ai-sdk/openai";

export const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export const DEFAULT_MODEL = "google/gemini-2.0-flash-exp";

export const AVAILABLE_MODELS = [
  { id: "google/gemini-2.0-flash-exp", name: "Gemini 2.0 Flash", tier: "free" },
  { id: "qwen/qwen3-coder", name: "Qwen3 Coder", tier: "free" },
  { id: "deepseek/deepseek-r1", name: "DeepSeek R1", tier: "free" },
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", tier: "pro" },
  { id: "openai/gpt-4.1", name: "GPT-4.1", tier: "pro" },
] as const;

export const SYSTEM_PROMPT = `Ești un asistent AI expert în crearea aplicațiilor web.
Răspunzi în limba română, dar scrii codul în engleză.
Când utilizatorul cere o aplicație sau o pagină web, generezi codul complet.

Reguli:
- Folosește React + Tailwind CSS pentru componente
- Generează fișiere complete, nu fragmente
- Pune codul în blocuri \`\`\`filename.ext pentru fiecare fișier
- Dacă trebuie package.json, include-l
- Explică pe scurt ce ai creat după cod`;
