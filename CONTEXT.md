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

**Handoff.** Paste a session transcript from any assistant, pick where it came from and where it's going, choose brief length, optionally add a focus steer.

Sections are **adaptive**: Mission, Current state, and Next steps always appear; Key decisions, Key facts, Open questions, Dead ends, Layout, and Conventions appear only where the transcript has material for them. A research chat gets Key facts and no file layout; a coding session gets the reverse. An early fixed, coding-shaped section list caused a Gemini hosting chat to come back with empty headings and a complaint that the transcript "wasn't a coding session" — that was a prompt design bug, now fixed.

State (profile, prefs, both histories) is local-only (`localStorage`). The server is four thin OpenRouter proxy routes.

## Key decisions
- **Two models, chosen per job** (both via OpenRouter, replacing `gpt-5-mini` in v6). Handoff runs **`z-ai/glm-5.2`** for its 1M-token context, which summarises a whole session in one pass with no chunking (~$0.77/M in, $2.42/M out). Enhance runs **`qwen/qwen3.5-flash-02-23`** (~$0.07/$0.26), picked by benchmarking six Chinese models against the real system prompt: it was the only fast model to hit both the Compact and Standard word bands first try, at ~10× lower cost. GLM 5.2 itself missed the Standard band.
- **Provider routing is pinned** to `baidu|novita|streamlake`. The 1M window is per-provider — unpinned auto-routing served a test from a 96k-context provider. Pinning also holds the price floor and denies data collection.
- **Length is a hard constraint**, not a hint — Compact deliberately overrides CO-STAR completeness to stay short. This was a real bug (prompts came out far too long), fixed in v5 and still enforced.
- **Streaming with a visible second stage.** Length enforcement can't stream, so the UI shows `Drafting → Tightening` rather than silently replacing text.
- **Secrets are scrubbed client-side** before a transcript is sent, with a visible count so over-redaction is catchable.
- **Injection defense uses a per-request nonce.** The transcript is wrapped in `<transcript id="NONCE">`; a fixed marker would be spoofable by pasted text. The prompt also tells the model to describe commands rather than restate them, since the brief gets pasted into another agent.
- **No auth; size caps instead.** Transcript caps (400k chars, 2.8M with "Long session") are the only thing bounding worst-case spend.
- **Design**: "console editorial" — terminal typography (IBM Plex Mono as a display face) set like a print journal, on cool graphite. One signal colour that changes per surface: violet for Enhance, amber for Handoff.

## Current state (v6)
Live at https://prompt-inhancer.vercel.app/ · repo `amankeshri7542/Prompt_inhancer-` · deploys from `main` via Vercel.

Verified end-to-end: streaming on all three generation routes, cost/usage reporting, handoff brief quality (correctly separated verified vs. claimed work and captured a rejected approach), prompt-injection resistance, secret redaction with no leaks and no over-redaction, and no horizontal overflow at a 375px viewport.

## Possible next steps (not done)
Prompt Critique mode (score an existing prompt against CO-STAR) · Model A/B comparison · a searchable prompt library with `{{variable}}` templating · an access gate + rate limit if shared more widely · an iOS Shortcut that POSTs a transcript straight to `/api/handoff`.
