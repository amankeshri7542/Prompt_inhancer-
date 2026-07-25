import { readWireEvents } from './stream';
import type { RunCost } from './types';

export interface StreamHandlers {
  onStage: (stage: 'drafting' | 'tightening') => void;
  onDelta: (text: string) => void;
  onDone: (text: string, cost: RunCost | null) => void;
  onError: (message: string) => void;
}

/**
 * POSTs to a streaming route and dispatches wire events.
 *
 * Routes reject invalid input with plain JSON before the stream starts, so a
 * non-OK response is read as JSON rather than parsed as SSE.
 */
export async function runStream(
  url: string,
  body: unknown,
  handlers: StreamHandlers,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    handlers.onError('Could not reach the server.');
    return;
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    handlers.onError(data?.error ?? 'Something went wrong.');
    return;
  }

  try {
    for await (const event of readWireEvents(res)) {
      if (event.t === 'stage') handlers.onStage(event.v);
      else if (event.t === 'delta') handlers.onDelta(event.v);
      else if (event.t === 'error') handlers.onError(event.v);
      else if (event.t === 'done') {
        const usage = event.meta.usage;
        handlers.onDone(
          event.text,
          usage
            ? { ...usage, model: event.meta.model, provider: event.meta.provider }
            : null,
        );
      }
    }
  } catch {
    handlers.onError('The connection dropped mid-generation.');
  }
}
