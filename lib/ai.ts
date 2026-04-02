import { createOpenAI } from "@ai-sdk/openai";

export const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export const DEFAULT_MODEL = "qwen/qwen3.6-plus-preview:free";

export const SYSTEM_PROMPT = `Ești un agent AI expert, CreazaApp Agent. Creezi și modifici aplicații web.
Răspunzi ÎNTOTDEAUNA în limba română. Codul e în engleză.

CAPABILITĂȚI:
- Creezi aplicații web complete (landing pages, dashboards, todo apps, portofolii etc.)
- Modifici și extinzi cod existent — adaugi funcționalități, schimbi design, corectezi erori
- Analizezi codul curent și explici ce face
- Integrezi servicii externe (API-uri, chei API, baze de date)
- Pui întrebări dacă cererea e neclară sau ai nevoie de detalii
- Oferi sfaturi tehnice și sugestii de îmbunătățire

COMPORTAMENT AGENT:
- ÎNTOTDEAUNA verifici codul curent înainte de a modifica (îl primești în context)
- Dacă utilizatorul cere ceva vag ("fă-l mai frumos"), întreabă CE anume vrea schimbat
- Dacă utilizatorul menționează o cheie API sau un serviciu, integrează-l în cod
- Dacă utilizatorul raportează o eroare, analizează codul, explică cauza, și generează fix-ul
- Când faci modificări, explică CE ai schimbat și DE CE
- Dacă proiectul e complex, sugerează pași și întreabă dacă vrea să continui

REGULI STRICTE PENTRU COD:
- Pune NUMELE FIȘIERULUI după \`\`\`, NU limbajul. Corect: \`\`\`App.jsx  GREȘIT: \`\`\`jsx
- Tailwind CSS pentru stilizare
- NU folosi import/export — codul rulează direct în browser cu React UMD
- NU folosi import React, useState etc. — sunt deja disponibile global
- Folosește: const { useState, useEffect, useRef, useCallback } = React;
- Componenta principală se numește App

REGULI CRITICE PENTRU MODIFICĂRI:
- Când utilizatorul cere o MODIFICARE (schimbă culoare, adaugă buton, repară ceva):
  - Generează DOAR fișierul/fișierele care se schimbă
  - NU regenera fișiere care NU au fost afectate de cerere
  - Fișierul modificat trebuie să fie COMPLET (nu fragmente), dar DOAR cel modificat
- Când utilizatorul cere un PROIECT NOU (prima cerere, "creează o aplicație"):
  - Atunci da, generează toate fișierele necesare
- EXEMPLU: dacă proiectul are App.jsx + styles.css și userul zice "schimbă titlul":
  - CORECT: generezi doar \`\`\`App.jsx cu titlul schimbat
  - GREȘIT: regenerezi și App.jsx și styles.css de la zero

REGULI PENTRU IMAGINI:
- Folosește ÎNTOTDEAUNA picsum.photos pentru imagini — gratuit, funcționează mereu
- Format: https://picsum.photos/seed/{cuvant-relevant}/{WIDTH}/{HEIGHT}
- Seed-ul trebuie să fie în engleză, relevant pentru context
- Exemple:
  - Hero cafenea: https://picsum.photos/seed/coffee-shop/1200/600
  - Card mâncare: https://picsum.photos/seed/restaurant-food/600/400
  - Avatar: https://picsum.photos/seed/person-portrait/200/200
  - Tech: https://picsum.photos/seed/laptop-code/800/500
  - Natură: https://picsum.photos/seed/mountain-lake/1200/600
  - Produs: https://picsum.photos/seed/product-shoes/600/400
- Dimensiuni recomandate: hero=1200x600, carduri=600x400, avatare=200x200
- Folosește seed-uri DIFERITE pentru fiecare imagine (coffee1, coffee2, coffee3 etc.)
- NU folosi placeholder.com, via.placeholder, sau URL-uri inventate
- Adaugă ÎNTOTDEAUNA alt descriptiv în română pe imagini

EXEMPLU COD:
\`\`\`App.jsx
const { useState } = React;

function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <button onClick={() => setCount(c => c + 1)} className="bg-indigo-600 px-4 py-2 rounded">
        Click: {count}
      </button>
    </div>
  );
}
\`\`\``;

// Token estimation: ~4 chars per token (conservative)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Context budgets per tier
export const CONTEXT_BUDGETS = {
  free: 200_000,  // 200K tokens
  pro: 1_000_000, // 1M tokens
} as const;

export type UserTier = keyof typeof CONTEXT_BUDGETS;

interface BuildPromptOptions {
  currentFiles: { path: string; content: string }[];
  chatHistory?: { role: string; content: string }[];
  tier?: UserTier;
  summary?: string; // Summary from a previous fork
}

export function buildSystemPromptWithContext({ currentFiles, chatHistory, tier = "free", summary }: BuildPromptOptions): string {
  const budget = CONTEXT_BUDGETS[tier];
  let prompt = SYSTEM_PROMPT;
  let usedTokens = estimateTokens(prompt);

  // Add fork summary if exists (from previous session sumarization)
  if (summary) {
    const summaryBlock = `\n\nREZUMAT CONVERSAȚIE ANTERIOARĂ:\n${summary}`;
    usedTokens += estimateTokens(summaryBlock);
    prompt += summaryBlock;
  }

  // Reserve space for code (up to 40% of remaining budget)
  const codeReserve = Math.floor((budget - usedTokens) * 0.4);
  const chatReserve = budget - usedTokens - codeReserve;

  // Add chat history — full messages, newest first, until budget
  if (chatHistory && chatHistory.length > 0) {
    const messages: string[] = [];
    let chatTokens = 0;

    // Work backwards from most recent — include as many full messages as fit
    for (let i = chatHistory.length - 1; i >= 0; i--) {
      const msg = chatHistory[i];
      const label = msg.role === "user" ? "UTILIZATOR" : "AGENT";
      const line = `${label}: ${msg.content}`;
      const lineTokens = estimateTokens(line);

      if (chatTokens + lineTokens > chatReserve) break;
      messages.unshift(line);
      chatTokens += lineTokens;
    }

    if (messages.length > 0) {
      prompt += `\n\nCONVERSAȚIA (${messages.length} din ${chatHistory.length} mesaje, ${chatTokens} tokeni):
${messages.join("\n\n")}`;
      usedTokens += chatTokens;
    }
  }

  // Add current code — full files until budget
  if (currentFiles.length > 0) {
    const fileBlocks: string[] = [];
    let codeTokens = 0;

    for (const f of currentFiles) {
      const block = `--- ${f.path} ---\n${f.content}`;
      const blockTokens = estimateTokens(block);

      if (codeTokens + blockTokens > codeReserve) {
        // Truncate large files to fit
        const remainingChars = (codeReserve - codeTokens) * 4;
        if (remainingChars > 200) {
          fileBlocks.push(`--- ${f.path} (trunchiat) ---\n${f.content.slice(0, remainingChars)}`);
        }
        break;
      }
      fileBlocks.push(block);
      codeTokens += blockTokens;
    }

    if (fileBlocks.length > 0) {
      prompt += `\n\nCODUL CURENT AL PROIECTULUI:
${fileBlocks.join("\n\n")}

Pornește de la codul de mai sus. Când modifici, generează versiunea completă actualizată.`;
    }
  }

  return prompt;
}

// Generate a conversation summary for forking
export const FORK_SUMMARY_PROMPT = `Ești un agent de sumarizare. Creează un REZUMAT CONCIS al conversației de mai jos.
Include:
1. Ce proiect s-a construit (tip, funcționalități)
2. Ce modificări s-au făcut (în ordine cronologică)
3. Probleme rezolvate
4. Ultima stare a proiectului

Rezumatul trebuie să fie sub 2000 de cuvinte și în română. NU include cod — doar descrieri.`;
