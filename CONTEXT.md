# CONTEXT.md — project snapshot

## In one line
A personal **prompt studio** with two jobs: turn a rough idea into a production-grade prompt, and compress a long AI-coding session into a brief that starts the next session where the last one stopped — installable as an iPhone PWA.

## Who & why
Built by the owner for personal use and sharing with 2–5 trusted people. Primary surface is **mobile/iPhone** (Share → Add to Home Screen). All API calls hit the owner's single OpenRouter key, so it's not meant to be public.

The Handoff surface exists because the owner works daily in Claude Code, Codex, and Cursor, and long sessions run out of context. Copying the transcript in and pasting the brief into a fresh session preserves continuity without re-explaining the project.

## How it works

**Enhance.** Pick target LLM, task type, technique, prompt length, and mode.
- *Fast* → one streamed call returns the enhanced prompt.
- *Pro* → 3–4 clarifying questions first, then a second call folds the answers in.

Every prompt is built from **CO-STAR** (Context, Objective, Style, Tone, Audience, Response format) + a specific persona + delimiters + an explicit output spec, formatted per target LLM (XML for Claude, Markdown for GPT, numbered for Gemini, lean for Grok).

**Handoff.** Paste a session transcript, pick where it came from and where it's going, choose brief length, optionally add a focus steer. The brief always has the same eight sections: Mission, Current state, Key decisions, Layout, Conventions & gotchas, Open problems, Next steps, Dead ends.

State (profile, prefs, both histories) is local-only (`localStorage`). The server is four thin OpenRouter proxy routes.

## Key decisions
- **Model = `z-ai/glm-5.2` via OpenRouter** (replaced `gpt-5-mini` in v6). Chosen for its 1M-token context, which lets a whole session be summarised in one pass with no chunking. ~$0.77/M in, $2.42/M out.
- **Provider routing is pinned** to `baidu|novita|streamlake`. The 1M window is per-provider — unpinned auto-routing served a test from a 96k-context provider. Pinning also holds the price floor and denies data collection.
- **Length is a hard constraint**, not a hint — Compact deliberately overrides CO-STAR completeness to stay short. This was a real bug (prompts came out far too long), fixed in v5 and still enforced.
- **Streaming with a visible second stage.** Length enforcement can't stream, so the UI shows `Drafting → Tightening` rather than silently replacing text.
- **Secrets are scrubbed client-side** before a transcript is sent, with a visible count so over-redaction is catchable.
- **No auth; size caps instead.** Transcript caps (400k chars, 2.8M with "Long session") are the only thing bounding worst-case spend.
- **Design**: "console editorial" — terminal typography (IBM Plex Mono as a display face) set like a print journal, on cool graphite. One signal colour that changes per surface: violet for Enhance, amber for Handoff.

## Current state (v6)
Live at https://prompt-inhancer.vercel.app/ · repo `amankeshri7542/Prompt_inhancer-` · deploys from `main` via Vercel.

Verified end-to-end: streaming on all three generation routes, cost/usage reporting, handoff brief quality (correctly separated verified vs. claimed work and captured a rejected approach), prompt-injection resistance, secret redaction with no leaks and no over-redaction, and no horizontal overflow at a 375px viewport.

## Possible next steps (not done)
Prompt Critique mode (score an existing prompt against CO-STAR) · Model A/B comparison · a searchable prompt library with `{{variable}}` templating · an access gate + rate limit if shared more widely · an iOS Shortcut that POSTs a transcript straight to `/api/handoff`.
