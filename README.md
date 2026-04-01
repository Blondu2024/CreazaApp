# CreazaApp v2

Creează aplicații web cu AI. În română.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS 4** + shadcn/ui
- **OpenRouter** (Vercel AI SDK v6) — LLM streaming
- **E2B** — Cloud code sandbox + live preview
- **CodeMirror 6** — Editor cod
- **xterm.js** — Terminal integrat

## Setup local

```bash
npm install
cp .env.example .env.local
# Completează cheile API în .env.local
npm run dev
```

## Deploy

Push pe `main` → Railway auto-deploy.
