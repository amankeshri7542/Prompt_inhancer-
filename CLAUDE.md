# CLAUDE.md — agent guide

Read this first. For product/why, see `CONTEXT.md`. For user-facing docs, see `README.md`.

## What this is
A personal **prompt-engineering studio**: takes a rough idea and returns a production-grade prompt (CO-STAR framework, persona, delimiters, explicit output spec), tuned for a target LLM, task type, technique, and **length**. Next.js 16 (App Router) + OpenAI. Deployed to Vercel, used mainly on iPhone as an installed PWA.

## Stack
Next.js 16 (Turbopack) · React 19 · TypeScript · Tailwind v4 · framer-motion · lucide-react · `openai` SDK. Model: **`gpt-5-mini`**.

## Commands
- `npm run dev` — local dev (http://localhost:3000)
- `npm run build` / `npx eslint .` — verify before committing
- `node scripts/generate-icons.mjs` — regenerate PWA icons (uses `sharp`) after any palette/brand change

## Layout
```
app/api/enhance-fast|enhance-pro|generate-questions/route.ts  # 3 OpenAI routes
app/layout.tsx          # fonts, PWA metadata, viewport (safe-area), themeColor
app/manifest.ts         # web manifest (served at /manifest.webmanifest)
app/page.tsx            # whole studio UI + state (localStorage)
components/             # Toolbar, LengthSelector, ResultDisplay, QuestionsForm,
                        # HistoryPanel, ProfilePanel, InstallHint
lib/openai.ts           # shared client + MODEL constant
lib/prompt-templates.ts # CO-STAR system prompts; LLM/task/technique/LENGTH guidance
lib/types.ts            # shared types
scripts/generate-icons.mjs
```

## Gotchas (important)
- **Model:** `gpt-5-mini` is a reasoning model. Do **not** pass `temperature` (only default is allowed — it 400s otherwise). Use `reasoning_effort` (`low` for fast/questions, `medium` for pro). Routes echo `completion.model` so the live model is verifiable.
- **API key env:** read as `OPENAI_API` first, then `OPENAI_API_KEY` (see `lib/openai.ts`). Set `OPENAI_API` in Vercel project env. Key must have `gpt-5-mini` access.
- **Length control:** word bands live in `LENGTH_GUIDANCE`/`LENGTH_HINTS` in `lib/prompt-templates.ts`. Compact (≤150w) is a **hard cap that intentionally overrides** the "cover all six CO-STAR dimensions" mandate — if you re-tighten the CO-STAR rules, keep that override or Compact bloats again. Targets: Compact ≤150, Standard ~350, Comprehensive 600+.
- **Design tokens:** all colors are CSS variables in `app/globals.css` (`--accent`, `--accent-2`, `--accent-deep`, `--on-accent`, `--bg`, etc.). Restyle via tokens, not hardcoded hex. Current theme = green→teal→blue "ocean". If you change the palette, also update `scripts/generate-icons.mjs`, `themeColor` in `layout.tsx`, and `theme_color`/`background_color` in `manifest.ts`, then rerun the icon script.
- **No backend storage:** profile, prefs, and last-5 history are all `localStorage` (keys `prompt-enhancer:*`). Nothing is persisted server-side.
- **Deploy:** GitHub → Vercel auto-deploy on push to `main` (project `prompt-inhancer`, team `amankeshri7542s-projects`). `.env*` is gitignored — never stage it.

## Conventions
Match surrounding style. Mobile-first; respect iPhone safe areas (`.safe-*` utils). Two modes: **Fast** (one-shot) and **Pro** (clarifying questions → final).
