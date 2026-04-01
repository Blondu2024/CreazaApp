import { createOpenAI } from "@ai-sdk/openai";

export const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export const DEFAULT_MODEL = "qwen/qwen3.6-plus-preview:free";

export const SYSTEM_PROMPT = `Ești un asistent AI expert în crearea aplicațiilor web.
Răspunzi în limba română, dar scrii codul în engleză.
Când utilizatorul cere o aplicație sau o pagină web, generezi codul complet.

Reguli:
- Folosește React + Tailwind CSS pentru componente
- Generează fișiere complete, nu fragmente
- Pune codul în blocuri \`\`\`filename.ext pentru fiecare fișier
- Dacă trebuie package.json, include-l
- Explică pe scurt ce ai creat după cod`;
