import { chatStream, MISSING_API_KEY, type ChatMessage, type Reasoning } from './ai';
import { enforcePromptLength, needsLengthRepair } from './prompt-output';
import { sseFrame, sseResponse } from './stream';
import type { PromptLength, RunCost } from './types';

/** Sums the draft call and any repair calls into one figure for the UI. */
function totalCost(parts: RunCost[]): RunCost | null {
  if (parts.length === 0) return null;
  return parts.reduce((acc, part) => ({
    promptTokens: acc.promptTokens + part.promptTokens,
    completionTokens: acc.completionTokens + part.completionTokens,
    costUsd: acc.costUsd + part.costUsd,
    model: part.model,
    provider: part.provider,
  }));
}

/**
 * Streams a generation to the browser, optionally enforcing a word band.
 *
 * When `length` is supplied and the finished draft falls outside its band, this
 * emits a `tightening` stage and runs the repair pass, sending the corrected
 * text in the `done` event. The client shows the two stages rather than silently
 * swapping text the user already watched arrive.
 */
export function streamGeneration(opts: {
  messages: ChatMessage[];
  reasoning: Reasoning;
  maxTokens: number;
  model?: string;
  temperature?: number;
  length?: PromptLength;
  label: string;
}): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const costs: RunCost[] = [];
      let draft = '';

      try {
        controller.enqueue(sseFrame({ t: 'stage', v: 'drafting' }));

        for await (const event of chatStream({
          messages: opts.messages,
          reasoning: opts.reasoning,
          maxTokens: opts.maxTokens,
          temperature: opts.temperature,
          model: opts.model,
        })) {
          if (event.type === 'delta') {
            draft += event.text;
            controller.enqueue(sseFrame({ t: 'delta', v: event.text }));
            continue;
          }

          // done
          if (event.meta.usage) {
            costs.push({
              ...event.meta.usage,
              model: event.meta.model,
              provider: event.meta.provider,
            });
          }

          let finalText = draft.trim();
          if (!finalText) {
            controller.enqueue(
              sseFrame({ t: 'error', v: 'The model returned nothing. Try again.' }),
            );
            break;
          }

          if (opts.length && needsLengthRepair(finalText, opts.length)) {
            controller.enqueue(sseFrame({ t: 'stage', v: 'tightening' }));
            const repaired = await enforcePromptLength({
              prompt: finalText,
              length: opts.length,
              model: opts.model,
            });
            finalText = repaired.text;
            costs.push(...repaired.extra);
          }

          const summed = totalCost(costs);
          controller.enqueue(
            sseFrame({
              t: 'done',
              text: finalText,
              meta: {
                model: summed?.model ?? event.meta.model,
                provider: summed?.provider ?? event.meta.provider,
                usage: summed
                  ? {
                      promptTokens: summed.promptTokens,
                      completionTokens: summed.completionTokens,
                      costUsd: summed.costUsd,
                    }
                  : null,
              },
            }),
          );
        }
      } catch (error) {
        const message =
          error instanceof Error && error.message === MISSING_API_KEY
            ? 'OPENROUTER is not set on the server.'
            : 'The model request failed. Try again.';
        console.error(`${opts.label} error:`, error);
        controller.enqueue(sseFrame({ t: 'error', v: message }));
      } finally {
        controller.close();
      }
    },
  });

  return sseResponse(stream);
}
