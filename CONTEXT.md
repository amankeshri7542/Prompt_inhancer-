# CONTEXT.md — project snapshot

## In one line
A personal/small-group **prompt enhancer**: turn a rough idea into a polished, production-grade prompt for GPT, Claude, Gemini, or Grok — installable as an iPhone PWA.

## Who & why
Built by the owner for personal use and sharing with 2–5 trusted people. Primary surface is **mobile/iPhone** (Share → Add to Home Screen). All API calls hit the owner's single OpenAI key, so it's not meant to be public.

## How it works
1. User types an idea and picks: **target LLM**, **task type**, **technique**, **prompt length**, and **mode**.
2. **Fast mode** → one OpenAI call returns the enhanced prompt.
   **Pro mode** → first generates 3–4 clarifying questions, the user answers, then a second call folds those answers in.
3. Every prompt is built from the **CO-STAR** framework (Context, Objective, Style, Tone, Audience, Response format) + a specific persona + delimiters + an explicit output spec, formatted per target LLM (XML for Claude, Markdown for GPT, numbered for Gemini, lean for Grok).
4. A saved **style profile** (tone/audience/identity/format/avoid) personalizes every generation. Last 5 results are kept in history. Copy or native Share.

State (profile, prefs, history) is local-only (`localStorage`). The server is just three thin OpenAI proxy routes.

## Key decisions
- **Model = `gpt-5-mini`** (reasoning model; no custom temperature, uses `reasoning_effort`). Chosen for quality/cost on a personal tool.
- **Length is a hard constraint**, not a hint — Compact deliberately overrides CO-STAR completeness to stay short. This was a real bug (prompts came out far too long) that's now fixed and verified (≈115/387/775 words for Compact/Standard/Comprehensive).
- **Design**: deliberately non-generic. Current identity is a green→teal→blue "ocean depth" palette (owner-supplied shades) with an editorial serif (Fraunces) brand; everything driven by CSS variables. Built mobile-first as a real PWA (manifest, apple-touch icon, safe areas, iOS install hint).

## Current state (v4)
Live at https://prompt-inhancer.vercel.app/ · repo `amankeshri7542/Prompt_inhancer-` · deploys from `main` via Vercel.
Working: model migration, length presets, PWA/iOS, ocean redesign, model echo for verification.

## Possible next steps (not done)
Streaming responses for faster perceived mobile output · light rate-limiting / access gate if shared more widely · export/share of full history · more task presets.
