# Prompt Enhancer

A personal prompt-engineering studio. Turn a rough idea into a production-grade prompt — structured with the **CO-STAR** framework, a strong persona, explicit delimiters, and an exact output spec — tuned for a specific target LLM, task type, technique, and length.

**Live:** https://prompt-inhancer.vercel.app/

Built with Next.js 16 (App Router) + OpenAI **gpt-5-mini**. Installs to your iPhone home screen as a full-screen PWA.

## Features

- **Two modes**
  - **Fast** — one-shot enhancement from your idea.
  - **Pro** — the model first asks 3–4 clarifying questions, then folds your answers into the final prompt.
- **Target-LLM tuning** — formats for ChatGPT (GPT-5), Claude, Gemini, or Grok (XML for Claude, Markdown for GPT, numbered for Gemini, lean for Grok).
- **Task scaffolding** — Coding, Writing, Image, Video, Research, Agent/Tool-use, SQL/Data.
- **Technique** — Auto, Zero-shot, Chain-of-Thought, Few-shot, ReAct, Tree-of-Thought, Role-based.
- **Prompt length** — pick **Compact / Standard / Comprehensive** before generating; the chooser shows a quick visualizer and steers the model's depth and word count.
- **Style profile** — save your tone, audience, identity, preferred output format, and things to always avoid; applied to every prompt and stored locally.
- **History** — your last 5 prompts, restorable with one tap.
- **Copy & Share** — copy to clipboard or use the native share sheet (great on mobile).
- **PWA / iOS** — installable, full-screen, safe-area aware, with an Add-to-Home-Screen hint on iOS Safari.

All personal data (profile, prefs, history) lives in `localStorage` — nothing is stored server-side.

## Setup

Requires Node 18+ and an OpenAI API key with access to `gpt-5-mini`.

```bash
npm install
```

Create `.env.local`:

```bash
# Either name works — OPENAI_API is read first, then OPENAI_API_KEY.
OPENAI_API=sk-...
```

Run the dev server:

```bash
npm run dev
```

Open http://localhost:3000.

## Add to your iPhone home screen

1. Open the live URL (or your deployment) in **Safari**.
2. Tap the **Share** button → **Add to Home Screen**.
3. Launch it from the icon — it opens full-screen like a native app.

## Sharing with a few people

This is built for personal use or a small group (2–5 people). Deploy to Vercel, set `OPENAI_API` in the project's environment variables, and share the URL. Each person's profile, prefs, and history stay on their own device. Since every request hits your OpenAI key, only share with people you trust, and watch your usage in the OpenAI dashboard.

## Project layout

```
app/
  api/enhance-fast/        one-shot enhancement (reasoning_effort: low)
  api/enhance-pro/         final enhancement after clarifying answers (medium)
  api/generate-questions/  clarifying questions for Pro mode (JSON, low)
  layout.tsx               fonts, PWA metadata, viewport (safe-area)
  manifest.ts              web app manifest
  page.tsx                 main studio UI
components/                Toolbar, LengthSelector, ResultDisplay, QuestionsForm,
                           HistoryPanel, ProfilePanel, InstallHint
lib/
  openai.ts                shared OpenAI client + model constant
  prompt-templates.ts      CO-STAR system prompts, LLM/task/technique/length guidance
  types.ts                 shared types
scripts/generate-icons.mjs one-off PWA icon generator (run with: node scripts/generate-icons.mjs)
```

## Notes on the model

`gpt-5-mini` is a reasoning model: it doesn't accept a custom `temperature`, and instead uses `reasoning_effort` (set to `low` for fast paths, `medium` for the Pro final pass). Length is steered primarily through the system prompt's target-length guidance.
