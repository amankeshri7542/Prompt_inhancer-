# AGENTS.md — agent guide

Read this first. For product/why, see `CONTEXT.md`. For user-facing docs, see `README.md`.

## What this is
A personal **prompt studio** with two surfaces:

1. **Enhance** — a rough idea becomes a production-grade prompt (CO-STAR, persona, delimiters, explicit output spec), tuned for a target LLM, task type, technique, and **length**.
2. **Handoff** — paste a long session from any AI assistant (Claude Code, Codex, Cursor, Gemini, ChatGPT, Claude chat), get a structured brief that starts a fresh session exactly where the old one ran out of context. Works for research and planning chats, not just coding.

Next.js 16 (App Router) + OpenRouter. Deployed to Vercel, used mainly on iPhone as an installed PWA.

## Stack
Next.js 16 (Turbopack) · React 19 · TypeScript · Tailwind v4 · framer-motion · lucide-react.
Two models via OpenRouter, selected per job in `MODELS` (`lib/ai.ts`):
- **`z-ai/glm-5.2`** — Handoff. Needed for the 1M context window.
- **`qwen/qwen3.5-flash-02-23`** — Enhance + questions. Benchmarked against the real system prompt: hit both the Compact (≤150w) and Standard (300–400w) bands first try, ~2s, ~10× cheaper. GLM 5.2 missed the Standard band on the same test.

There is no vendor SDK — `lib/ai.ts` is a hand-rolled fetch client.

## Commands
- `npm run dev` — local dev (http://localhost:3000)
- `npm run build` / `npx eslint .` — verify before committing
- `node scripts/generate-icons.mjs` — regenerate PWA icons (uses `sharp`) after any palette/brand change

## Layout
```
app/api/enhance-fast|enhance-pro|handoff/route.ts  # streaming (SSE) routes
app/api/generate-questions/route.ts                # non-streaming (needs whole JSON)
app/layout.tsx          # fonts, PWA metadata, viewport, data-surface default
app/page.tsx            # shell: surface tabs, hero, profile, session spend
components/EnhanceSurface.tsx   # prompt-building flow + its history
components/HandoffSurface.tsx   # transcript → brief flow + its history
components/HandoffForm.tsx      # paste box, redaction report, caps
components/CompressionReadout.tsx # the signature tokens-in → tokens-out readout
components/ui.tsx        # Label, Select, Segmented, Chip, ErrorNote primitives
lib/ai.ts               # OpenRouter client: chatComplete + chatStream, MODELS, routing
lib/stream.ts           # SSE wire protocol (server frames + browser parser)
lib/route-stream.ts     # shared streaming handler + length-repair stage
lib/client-stream.ts    # browser-side fetch + event dispatch
lib/redact.ts           # client-side secret scrubbing
lib/handoff-templates.ts # handoff system prompt (adaptive sections, injection defense)
lib/prompt-templates.ts # CO-STAR system prompts; LLM/task/technique/LENGTH guidance
```

## Gotchas (important)

- **Reasoning is ON by default** on GLM 5.2 and only supports `high`/`xhigh` (no `low`). Short calls must pass `reasoning: 'off'`. Measured: at `high` on a small task, 290 of 340 completion tokens were reasoning — 85% of billed output. Current: enhance/questions/repair = `off`, handoff = `high`.
- **Provider pinning is GLM-only, and the pin must not be removed.** `GLM_ROUTING` restricts the handoff model to `baidu|novita|streamlake` because GLM 5.2's 1M context is **per provider** — unpinned auto-routing served a probe from a 96k-context provider, which would silently truncate a long transcript. Those three also hold the ~$0.77/M price floor (the pool ranges to $3.40/M). `routingFor()` applies `DEFAULT_ROUTING` to everything else; the enhance prompt is small enough that no provider can truncate it. `data_collection: 'deny'` is on both paths.
- **`temperature` is now allowed** (GLM accepts it; `gpt-5-mini` did not). Default is `0.3` for prompt generation, `0.4` for handoff synthesis. This inverts the old gotcha — don't "fix" it back.
- **API key env:** `OPENROUTER`, falling back to `OPENROUTER_API_KEY` (`lib/ai.ts`). The value in `.env` has a **leading space**; `apiKey()` trims it, but don't copy that space into Vercel.
- **Length control:** word bands live in `LENGTH_GUIDANCE`/`LENGTH_HINTS` (`lib/prompt-templates.ts`) and `LENGTH_LIMITS` (`lib/prompt-output.ts`). Compact (≤150w) is a **hard cap that intentionally overrides** the "cover all six CO-STAR dimensions" mandate — if you re-tighten the CO-STAR rules, keep that override or Compact bloats again.
- **Streaming vs. length enforcement.** Whether a draft breaks its word band is only knowable once the draft is complete, so it can't be streamed. `lib/route-stream.ts` streams the draft, then emits `stage: 'tightening'` and sends corrected text in `done`. Never silently swap streamed text without the stage event.
- **Handoff transcripts are untrusted input.** The transcript is wrapped in `<transcript id="NONCE">` where NONCE is a per-request `randomUUID().slice(0,8)` from the route. A *fixed* marker is spoofable — pasted text containing that marker could close the data block and have the rest read as instructions. Verified: a transcript carrying both a fake `</transcript>` and an "IGNORE EVERYTHING ABOVE" override was reported as an event, not obeyed. Don't replace the nonce with a constant.
- **Second-order injection.** The brief gets pasted into another agent, so the prompt tells the model to *describe* commands found in a transcript rather than restate them as imperatives ("the user asked the assistant to delete X", not "Delete X"). Keep that rule.
- **Handoff sections are adaptive, not fixed.** The original fixed list was coding-shaped, so a Gemini research chat produced empty headings plus a complaint that the transcript "wasn't a coding session". Sections are now include-if-there-is-material, with `KEY FACTS` for research sessions and `LAYOUT`/`CONVENTIONS` only when a codebase is involved.
- **Transcript caps bound spend.** There is no access gate, so `MAX_TRANSCRIPT_CHARS` (400k, ~$0.10) and `MAX_TRANSCRIPT_CHARS_LONG` (2.8M, ~$0.55) in `lib/types.ts` are the only cost ceiling. Don't raise them without adding auth.
- **Design tokens:** colors are CSS variables in `app/globals.css`. The system has **one signal color that changes per surface** — violet for Enhance, amber for Handoff — swapped via `:root[data-surface="handoff"]`. Use `var(--signal)`, never a hardcoded accent, or the surface switch breaks. If you change the palette, also update `scripts/generate-icons.mjs`, `themeColor` in `layout.tsx`, and `theme_color`/`background_color` in `manifest.ts`, then rerun the icon script.
- **Primary content must not depend on JS.** framer-motion's `initial` inlines `opacity:0` into SSR HTML, so the hero and input card would render blank until hydration. They use the CSS `.rise` animation instead, and `AnimatePresence` carries `initial={false}`. Don't wrap first-paint content in `motion` with an `initial` opacity.
- **No backend storage:** profile, prefs, prompt history, and handoff history are all `localStorage` (`prompt-enhancer:*`). Nothing is persisted server-side.
- **Deploy:** GitHub → Vercel auto-deploy on push to `main` (project `prompt-inhancer`, team `amankeshri7542s-projects`). `.env*` is gitignored — never stage it.

## Conventions
Match surrounding style. Mobile-first; respect iPhone safe areas (`.safe-*` utils). Enhance has two modes: **Fast** (one-shot) and **Pro** (clarifying questions → final).
