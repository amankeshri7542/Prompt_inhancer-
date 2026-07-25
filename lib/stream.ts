import type { ChatMeta } from './ai';

/**
 * Wire protocol between our route handlers and the browser.
 *
 * `stage` exists because length enforcement can't be streamed: the repair pass
 * only knows the draft is too long once the draft is complete. Rather than
 * silently swapping text the user just watched appear, the route announces the
 * second pass and sends the corrected text in `done`.
 */
export type WireEvent =
  | { t: 'delta'; v: string }
  | { t: 'stage'; v: 'drafting' | 'tightening' }
  | { t: 'done'; text: string; meta: ChatMeta }
  | { t: 'error'; v: string };

const encoder = new TextEncoder();

export function sseFrame(event: WireEvent): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

export function sseResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Vercel/nginx must not buffer, or the stream arrives all at once.
      'X-Accel-Buffering': 'no',
    },
  });
}

/** Parses an SSE byte stream into WireEvents. Used by the browser. */
export async function* readWireEvents(
  res: Response,
): AsyncGenerator<WireEvent> {
  if (!res.body) throw new Error('The server returned no response body.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      try {
        yield JSON.parse(trimmed.slice(5).trim()) as WireEvent;
      } catch {
        // ignore keep-alive comments / partial frames
      }
    }
  }
}
