export const DEFAULT_FETCH_TIMEOUT_MS = 8_000;

export type TimeoutRequestInit = RequestInit & {
  timeoutMs?: number;
};

type FetchLike = (input: string, init?: TimeoutRequestInit) => Promise<Response>;

export class FetchTimeoutError extends Error {
  timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = 'FetchTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

export function createFetchWithTimeout(fetchFn: FetchLike, timeoutMs = DEFAULT_FETCH_TIMEOUT_MS): FetchLike {
  return async (input, init) => {
    const abortController = new AbortController();
    const upstreamSignal = init?.signal;
    const resolvedTimeoutMs = init?.timeoutMs ?? timeoutMs;
    const { timeoutMs: _timeoutMs, ...fetchInit } = init ?? {};
    let didTimeout = false;

    const forwardAbort = () => {
      abortController.abort();
    };

    if (upstreamSignal) {
      if (upstreamSignal.aborted) {
        abortController.abort();
      } else {
        upstreamSignal.addEventListener('abort', forwardAbort, { once: true });
      }
    }

    const timeoutId = setTimeout(() => {
      didTimeout = true;
      abortController.abort();
    }, resolvedTimeoutMs);

    try {
      return await fetchFn(input, {
        ...fetchInit,
        signal: abortController.signal,
      });
    } catch (error) {
      if (didTimeout) {
        throw new FetchTimeoutError(resolvedTimeoutMs);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
      upstreamSignal?.removeEventListener('abort', forwardAbort);
    }
  };
}
