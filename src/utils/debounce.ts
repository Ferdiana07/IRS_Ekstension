// ============================================================
// Utils: Debounce
// ============================================================

/**
 * Returns a debounced version of `fn` that delays invocation
 * until after `waitMs` milliseconds have elapsed since the last call.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, waitMs);
  };
}

/**
 * Returns a throttled version of `fn` that is called at most once per `intervalMs`.
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  intervalMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= intervalMs) {
      lastCall = now;
      fn(...args);
    }
  };
}
