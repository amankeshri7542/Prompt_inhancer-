# Prompt Studio

A personal studio with two surfaces:

**Enhance** — turn a rough idea into a production-grade prompt, structured with the **CO-STAR** framework, a strong persona, explicit delimiters, and an exact output spec, tuned for a specific target LLM, task type, technique, and length.

**Handoff** — paste a long Claude Code, Codex, or Cursor session and get a structured brief you can drop into a fresh session to pick up exactly where you left off.

**Live:** https://prompt-inhancer.vercel.app/

Built with Next.js 16 (App Router) and **GLM 5.2** via OpenRouter. Installs to your iPhone home screen as a full-screen PWA.

## Enhance

- **Two modes**
  - **Fast** — one-shot enhancement from your idea.
  - **Pro** — the model asks 3–4 clarifying questions, then folds your answers into the final prompt.
- **Target-LLM tuning** — ChatGPT, Claude, Gemini, or Grok (XML for Claude, Markdown for GPT, numbered for Gemini, lean for Grok).
- **Task scaffolding** — Coding, Writing, Image, Video, Research, Agent/Tool-use, SQL/Data.
- **Technique** — Auto, Zero-shot, Chain-of-Thought, Few-shot, ReAct, Tree-of-Thought, Role-based.
- **Prompt length** — Compact / Standard / Comprehensive, enforced as a real word band rather than a suggestion.
- **Style profile** — save your tone, audience, identity, preferred output format, and things to always avoid.

## Handoff

Ran out of context mid-session? Copy the whole conversation out of your terminal and paste it in.

- **Eight fixed sections** — Mission, Current state, Key decisions, Layout, Conventions & gotchas, Open problems, Next steps, and **Dead ends** (approaches already tried and rejected, so the next session doesn't repeat them).
- **Evidence vs. assertion** — work is marked "verified" only when the transcript shows proof, otherwise "claimed, unverified".
- **Formatted for where it's going** — XML sections for Claude Code, Markdown for Codex and Cursor.
- **Secrets scrubbed before sending** — API keys, tokens, JWTs, and `KEY=value` lines are stripped in your browser, with a count of what was removed so you can check it.
- **Compression readout** — see how many tokens went in, how many came out, and the ratio.
- **Focus steer** — optionally tell it which thread of the session to weight.

## Shared by both

- **Live cost** — actual USD and token counts per run, plus a session total. No estimates.
- **Streaming** — output appears as it's written. When a prompt lands outside its word band you'll see a `Tightening` stage rather than text silently changing under you.
- **History** — last 5 of each, restorable in one tap.
- **Copy, Share, Download** — clipboard, native share sheet, or `.md` file.
- **PWA / iOS** — installable, full-screen, safe-area aware.

All personal data (profile, prefs, both histories) lives in `localStorage` — nothing is stored server-side.

## Setup

Requires Node 18+ and an [OpenRouter](https://openrouter.ai) API key.

```bash
npm install
```

Create `.env.local`:

```bash
# OPENROUTER is read first, then OPENROUTER_API_KEY.
OPENROUTER=sk-or-v1-...
```

Run the dev server:

```bash
npm run dev
```

Open http://localhost:3000.

## Add to your iPhone home screen

1. Open the live URL in **Safari**.
2. Tap **Share** → **Add to Home Screen**.
3. Launch from the icon — it opens full-screen like a native app.

## Sharing with a few people

Built for personal use or a small group (2–5 people). Deploy to Vercel, set `OPENROUTER` in the project's environment variables, and share the URL. Each person's data stays on their own device.

Every request hits your OpenRouter key, so only share with people you trust. There's no login — spend is bounded by transcript size caps (400,000 characters, or 2.8M with "Long session" enabled), which cap a single Handoff at roughly $0.10 and $0.55 respectively. Watch usage in the OpenRouter dashboard.

## Project layout

```
app/
  api/enhance-fast/        one-shot enhancement (streaming, reasoning off)
  api/enhance-pro/         final enhancement after clarifying answers (reasoning high)
  api/generate-questions/  clarifying questions for Pro mode (JSON, not streamed)
  api/handoff/             session transcript → handoff brief (streaming, reasoning high)
  layout.tsx               fonts, PWA metadata, viewport (safe-area)
  page.tsx                 shell: surface tabs, hero, profile, session spend
components/                EnhanceSurface, HandoffSurface, HandoffForm,
                           CompressionReadout, CostMeter, ResultDisplay, ui primitives
lib/
  ai.ts                    OpenRouter client (chatComplete, chatStream, provider routing)
  stream.ts                SSE wire protocol; client-stream.ts, route-stream.ts
  redact.ts                client-side secret scrubbing
  handoff-templates.ts     handoff system prompt
  prompt-templates.ts      CO-STAR system prompts
scripts/generate-icons.mjs one-off PWA icon generator
```

## Notes on the model

`z-ai/glm-5.2` has a **1M-token context window**, which is what makes single-pass session summarisation possible — no chunking, even for very long sessions.

Two things worth knowing if you fork this:

- **Provider routing is pinned** in `lib/ai.ts`. That 1M window is per-provider, and OpenRouter's auto-routing will happily serve you from a 96k-context provider that would silently truncate your transcript. The pinned set also holds the ~$0.77/M price floor and excludes providers that collect data.
- **Reasoning is on by default** and only supports `high`/`xhigh`, so short calls explicitly disable it. Leaving it on makes Fast mode slower than Pro.
