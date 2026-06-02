/**
 * withTimeout — Global async timeout wrapper for Supabase calls.
 *
 * Wraps any Promise in a race against a timeout. If the timeout fires first,
 * the promise is considered abandoned and a typed TIMEOUT error is thrown.
 * The original promise continues running in the background but its result
 * is discarded — this is acceptable for read queries. For mutations (insert,
 * update, rpc), the DB operation may still complete server-side; the timeout
 * only controls what the UI does.
 *
 * Usage:
 *   const { data, error } = await withTimeout(
 *     supabase.from('orders').select('*'),
 *     13000,
 *     'fetch-orders'
 *   );
 */

export const DEFAULT_TIMEOUT_MS = 13_000;

export interface TimeoutError {
  code: 'TIMEOUT';
  message: string;
  label?: string;
}

export function isTimeoutError(error: unknown): error is TimeoutError {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as TimeoutError).code === 'TIMEOUT'
  );
}

export function withTimeout<T>(
  promise: Promise<T> | PromiseLike<T>,
  ms: number = DEFAULT_TIMEOUT_MS,
  label?: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject({
        code: 'TIMEOUT',
        message: 'Request timed out. Please check your connection and try again.',
        label,
      } satisfies TimeoutError);
    }, ms);
  });

  return Promise.race([promise, timeout]);
}
