import { generateText } from "ai";
import { openrouter } from "@/lib/ai";

// Uses Haiku — cheap, fast, on our cost (not user credits)
const SUMMARIZE_MODEL = "anthropic/claude-haiku-4.5";

const SUMMARIZE_PROMPT = `Ești un asistent care creează rezumate concise ale proiectelor.
Primești istoricul conversației și fișierele unui proiect. Creează un REZUMAT STRUCTURAT care va fi folosit ca context pentru continuarea lucrului.

FORMATUL REZUMATULUI:

**Proiect:** [Numele/tipul proiectului]

**Ce s-a construit:**
- [Feature 1]
- [Feature 2]
- [etc.]

**Fișiere existente:**
- [fisier.ext] — [ce conține pe scurt]

**Ultimele modificări:**
- [Ce s-a schimbat recent]

**De reținut:**
- [Decizii de design importante]
- [Preferințe ale utilizatorului]
- [Probleme rezolvate]

Rezumatul trebuie să fie sub 500 de cuvinte, în română, fără cod — doar descrieri.
Scopul e ca un alt agent AI să poată continua lucrul exact de unde a rămas.`;

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { chatHistory, files, projectName } = await req.json();

    const fileList = (files || []).map((f: { path: string; content: string }) => {
      const lines = f.content.split("\n").length;
      return `- ${f.path} (${lines} linii)`;
    }).join("\n");

    const recentMessages = (chatHistory || []).slice(-20).map((m: { role: string; content: string }) => {
      const label = m.role === "user" ? "UTILIZATOR" : "AI";
      // Strip code blocks from messages to save tokens
      const text = m.content.replace(/```\S*\n[\s\S]*?```/g, "[cod generat]").slice(0, 500);
      return `${label}: ${text}`;
    }).join("\n\n");

    const userPrompt = `PROIECT: ${projectName || "Proiect"}

FIȘIERE (${(files || []).length}):
${fileList || "Niciun fișier"}

CONVERSAȚIA (ultimele ${Math.min((chatHistory || []).length, 20)} mesaje):
${recentMessages || "Nicio conversație"}`;

    const result = await generateText({
      model: openrouter(SUMMARIZE_MODEL),
      system: SUMMARIZE_PROMPT,
      prompt: userPrompt,
    });

    return Response.json({ summary: result.text });
  } catch (error) {
    console.error("[summarize] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Summarize error" },
      { status: 500 }
    );
  }
}
