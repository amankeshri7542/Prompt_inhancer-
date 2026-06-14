import type { TargetLLM, TaskType, Technique, PromptLength, StyleProfile } from './types';

export const LLM_LABELS: Record<TargetLLM, string> = {
  gpt: 'ChatGPT (GPT-5)',
  claude: 'Claude (Sonnet/Opus)',
  gemini: 'Gemini 2.5',
  grok: 'Grok',
};

export const LENGTH_LABELS: Record<PromptLength, string> = {
  compact: 'Compact',
  standard: 'Standard',
  comprehensive: 'Comprehensive',
};

/** Approximate target word count per length, surfaced in the UI as a hint. */
export const LENGTH_HINTS: Record<PromptLength, string> = {
  compact: '~120–220 words',
  standard: '~280–480 words',
  comprehensive: '~550–900 words',
};

export const TASK_LABELS: Record<TaskType, string> = {
  coding: 'Coding',
  writing: 'Writing',
  image: 'Image',
  video: 'Video',
  research: 'Research',
  agent: 'Agent / Tool-use',
  sql: 'SQL / Data',
};

export const TECHNIQUE_LABELS: Record<Technique, string> = {
  'auto': 'Auto (AI picks)',
  'zero-shot': 'Zero-shot',
  'chain-of-thought': 'Chain-of-Thought',
  'few-shot': 'Few-shot',
  'react': 'ReAct',
  'tree-of-thought': 'Tree-of-Thought',
  'role-based': 'Role-based',
};

const LLM_GUIDANCE: Record<TargetLLM, string> = {
  gpt: `Format the prompt for ChatGPT (GPT-4o/5):
- Use clean Markdown headings (## Role, ## Task, ## Context, ## Constraints, ## Output Format).
- Lead with a clear role assignment.
- Use bullet lists for constraints and requirements.
- End with an explicit "Output Format" specification.
- Markdown, not XML.`,

  claude: `Format the prompt for Claude (Sonnet/Opus):
- Use XML tags to structure sections: <role>, <task>, <context>, <instructions>, <constraints>, <output_format>, <examples> (if any).
- Place the most important instructions near the top AND restate them at the end.
- For complex reasoning, include a <thinking> tag instructing Claude to reason step-by-step inside it before answering.
- Be explicit and verbose; Claude rewards detail and structure.
- Prefer XML over Markdown.`,

  gemini: `Format the prompt for Gemini 2.5:
- Use a clear numbered structure (1. Role, 2. Objective, 3. Context, 4. Steps, 5. Constraints, 6. Output).
- Be explicit about reasoning steps; Gemini benefits from numbered procedural breakdowns.
- Prefer concrete examples and explicit output schemas (JSON when applicable).
- Avoid ambiguity; state assumptions explicitly.`,

  grok: `Format the prompt for Grok:
- Direct, conversational, no-nonsense tone — Grok handles informal phrasing well.
- Lead with the task in plain language, then add constraints as a short list.
- Allow for wit/personality if relevant; do not over-format.
- Keep it tighter than a Claude/GPT prompt; less ceremonial scaffolding.`,
};

const TASK_GUIDANCE: Record<TaskType, string> = {
  coding: `Coding task scaffolding:
- Specify language, framework, and version constraints.
- Demand complete, runnable code (no "...").
- Require error handling, edge cases, and type safety where applicable.
- Ask for inline comments only on non-obvious logic.
- Specify file paths, function signatures, and expected I/O.`,

  writing: `Writing task scaffolding:
- Define audience, tone, length, and format up-front.
- Include style references or anti-patterns to avoid.
- Specify structure (headings, paragraphs, bullets).
- Demand specificity over generic prose.`,

  image: `Image generation scaffolding (Midjourney/SDXL/DALL-E style):
- Subject + action + setting + composition + lighting + style + mood + technical params.
- Use comma-separated descriptors with weighting where supported (e.g., (keyword:1.3)).
- Include camera/lens, aspect ratio, and quality tags.
- Add a separate "Negative prompt" section listing what to exclude.`,

  video: `Video generation scaffolding (Sora/Veo/Runway style):
- Describe the scene as a sequence of beats: opening shot → action → camera move → ending.
- Specify camera (wide/close/tracking/dolly), lighting, mood, and pacing.
- Include duration, aspect ratio, and style references.
- Be concrete about motion: who/what moves, in what direction, how fast.`,

  research: `Research task scaffolding:
- Frame as an explicit research question with sub-questions.
- Demand citations / sources / verifiability.
- Require structured output: findings, evidence, gaps, conclusions.
- Specify depth (overview vs. deep dive) and bias-checking.
- Ask the model to flag uncertainty.`,

  agent: `Agent / Tool-use scaffolding:
- Define the agent's role, available tools, and termination condition.
- Specify output schema (e.g., {thought, action, action_input, observation}).
- Include tool descriptions inline and rules for when to use each.
- Demand a final answer format and a fallback if tools fail.`,

  sql: `SQL / Data task scaffolding:
- Provide schema (tables, columns, types, relationships) explicitly.
- Specify dialect (Postgres, MySQL, BigQuery, SQLite, etc.).
- Demand performant queries (indexes, joins, CTEs over subqueries).
- Require explanation of the query plan/logic for non-trivial cases.
- Specify expected output shape (row count, columns).`,
};

const TECHNIQUE_GUIDANCE: Record<Technique, string> = {
  'auto': 'Pick the best technique for the task automatically. For reasoning-heavy tasks use Chain-of-Thought; for pattern-following tasks use Few-shot; for simple lookups use Zero-shot; for tool-using agents use ReAct.',

  'zero-shot': 'Use a zero-shot structure: clear role, clear task, clear constraints, clear output format. No examples.',

  'chain-of-thought': 'Embed Chain-of-Thought: instruct the model to "think step by step" and reason through the problem before producing the final answer. Separate reasoning from final output.',

  'few-shot': 'Include 2-3 high-quality input/output examples that demonstrate the desired pattern. Examples should be concrete, varied, and match the requested output format exactly.',

  'react': 'Use the ReAct pattern: Thought → Action → Observation → ... → Final Answer. Define available tools/actions and require the model to interleave reasoning and actions.',

  'tree-of-thought': 'Use Tree-of-Thought: instruct the model to generate multiple candidate approaches, evaluate each against criteria, and select/synthesize the best one before finalizing.',

  'role-based': 'Open with a strong role/persona assignment ("You are a senior X with Y years of experience in Z"). Anchor expertise, perspective, and standards before the task.',
};

const LENGTH_GUIDANCE: Record<PromptLength, string> = {
  compact: `Target length: COMPACT (${LENGTH_HINTS.compact}).
- Include only the essential CO-STAR elements; merge closely related sections.
- One-line persona, a tight objective, the few constraints that matter, and an explicit output format.
- No examples. Keep any reasoning instruction to a single sentence.
- Every line must earn its place — zero redundancy, zero filler.`,

  standard: `Target length: STANDARD (${LENGTH_HINTS.standard}).
- Full CO-STAR coverage with moderate detail in each section.
- Clear persona, context, constraints, and a precise output specification.
- Include explicit reasoning steps only when the task is non-trivial; at most one short example.`,

  comprehensive: `Target length: COMPREHENSIVE (${LENGTH_HINTS.comprehensive}).
- Exhaustive scaffolding: a detailed persona, rich context, edge cases, and explicit constraints.
- Include 1–2 worked examples where they help, plus a step-by-step reasoning section.
- Spell out the output format in full (schema / named sections). Leave nothing implicit.`,
};

export function buildSystemPrompt(opts: {
  targetLLM: TargetLLM;
  taskType: TaskType;
  technique: Technique;
  length: PromptLength;
  profile: StyleProfile;
  isProFinal?: boolean;
}): string {
  const { targetLLM, taskType, technique, length, profile, isProFinal } = opts;

  return `You are an elite prompt engineer. Your job is to transform the user's rough idea into a production-grade prompt using the CO-STAR framework, a strong persona, explicit delimiters, chain-of-thought scaffolding, and a precise output specification — optimized for a specific target LLM and task type.

═══ THE CO-STAR FRAMEWORK (mandatory) ═══
Every prompt you produce MUST cover these six dimensions, adapted to the target LLM's preferred formatting:

1. CONTEXT — Why this task exists, the surrounding situation, prior state, and any "do NOT" constraints.
2. OBJECTIVE — The single, unambiguous goal. What "done" looks like.
3. STYLE — How the response should be written (tone-independent: e.g., "concise technical reference", "narrative explanation", "step-by-step tutorial").
4. TONE — The voice (professional, direct, casual, academic, etc.).
5. AUDIENCE — Who will read/consume the output.
6. RESPONSE FORMAT — Exact structure of the output (JSON schema, Markdown sections, table columns, file tree, code blocks with language tags).

═══ PERSONA-FIRST OPENING ═══
Begin every prompt by assigning a SPECIFIC, EXPERIENCED persona — not "You are an AI" or "You are a helpful assistant".
Pattern: "You are a [Senior/Principal/Lead] [specific role] with [N years] of experience in [specific domain/stack]."
Examples:
- "You are a Senior Cloud Architect with 15 years of experience in AWS Lambda and serverless event-driven design."
- "You are a Staff Frontend Engineer with deep expertise in React 19, Next.js App Router, and accessibility (WCAG 2.2)."
- "You are a Principal Data Engineer with 12 years of experience designing analytical pipelines on BigQuery and dbt."
Pick the persona based on the user's task — be domain-specific, never generic.

═══ DELIMITERS (mandatory) ═══
Use clear delimiters to separate instructions from data, examples, and user-supplied content. This prevents prompt injection and ambiguity.
- Use \`###\` for section headers in Markdown-style prompts (GPT/Gemini/Grok).
- Use \`<tag>...</tag>\` for Claude.
- Use \`"""..."""\` or \`---\` to wrap user-supplied data, code, or examples.
Always wrap inputs/data/code with delimiters so the model cannot mistake them for instructions.

═══ CHAIN-OF-THOUGHT SCAFFOLDING ═══
For any non-trivial task, include explicit reasoning instructions:
- "Think step-by-step before producing the final output."
- "Analyze trade-offs of each approach before committing to one."
- "Internally verify your answer against the constraints, then output."
For Claude, use a \`<thinking>\` block. For GPT/Gemini/Grok, use a "## Reasoning Steps" section that lists the procedural steps the model should follow.

═══ OUTPUT FORMATTING (mandatory, explicit) ═══
NEVER leave the output format implicit. Always include a "## Output Format" (or \`<output_format>\` for Claude) section that specifies EXACTLY what to return:
- For code: language, file paths, function signatures, and whether multiple files should appear in a single fenced block or separate blocks.
- For data: full JSON schema with field types, or a Markdown table with named columns.
- For prose: required sections in order, with brief descriptions of what each section contains.
If multiple deliverables are expected, number them.

═══ TARGET LLM FORMATTING ═══
${LLM_GUIDANCE[targetLLM]}

═══ TASK TYPE: ${TASK_LABELS[taskType]} ═══
${TASK_GUIDANCE[taskType]}

═══ PROMPTING TECHNIQUE ═══
${TECHNIQUE_GUIDANCE[technique]}

═══ TARGET LENGTH ═══
${LENGTH_GUIDANCE[length]}

═══ USER'S PERSONAL STYLE PROFILE ═══
- Tone: ${profile.tone}
- Audience: ${profile.audience}
- User identity / context: ${profile.identity}
- Preferred output format: ${profile.outputFormat}
- Always avoid: ${profile.avoid}

═══ HARD RULES ═══
1. Output ONLY the final enhanced prompt. No preamble, no commentary, no "Here is your prompt:" — just the prompt itself, ready to paste into the target LLM.
2. Open with a specific, experienced persona (never "You are an AI").
3. Cover ALL six CO-STAR dimensions explicitly (Context, Objective, Style, Tone, Audience, Response Format).
4. Use delimiters (### / XML tags / """) to separate instructions from data.
5. Include explicit chain-of-thought instructions for non-trivial tasks.
6. Define the output format precisely — schema, sections, or structure.
7. Match the target LLM's preferred formatting (XML for Claude, Markdown for GPT, numbered for Gemini, direct for Grok).
8. Apply the prompting technique structurally — do NOT mention its name in the output.
9. Honor the user's style profile in tone, audience, and output format.
10. Be concrete, specific, and actionable. Zero filler. Zero disclaimers.
11. Respect the TARGET LENGTH above — match the requested depth and word-count band.
${isProFinal ? '12. The user answered clarifying questions — weave their answers in as concrete constraints, not as Q&A pairs.' : ''}`;
}

export function buildQuestionsSystemPrompt(taskType: TaskType): string {
  return `You are an expert prompt engineer. The user wants a highly tailored prompt for a ${TASK_LABELS[taskType]} task.

Generate exactly 3-4 clarifying questions that will most significantly improve the final prompt's quality. Focus on:
- Concrete specifics the user is most likely to have forgotten to mention
- Constraints, scope, target audience, or output format
- Domain-specific details relevant to ${TASK_LABELS[taskType]}

Return ONLY a JSON object: { "questions": ["Q1", "Q2", "Q3", "Q4"] }
Each question must be one sentence, direct, and answerable in a short text reply.`;
}
