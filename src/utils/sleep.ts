// ============================================================
// Utils: Sleep / Wait helpers
// ============================================================

/**
 * Promise-based sleep.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for a DOM element matching `selector` to appear within `timeoutMs`.
 * Uses MutationObserver for efficiency instead of polling.
 *
 * Returns the element if found, or null on timeout.
 */
export function waitForElement(
  selector: string,
  timeoutMs = 5000,
  root: ParentNode = document
): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    // Check immediately
    const existing = root.querySelector<HTMLElement>(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    let timer: ReturnType<typeof setTimeout>;
    const observer = new MutationObserver(() => {
      const el = root.querySelector<HTMLElement>(selector);
      if (el) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(el);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    timer = setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeoutMs);
  });
}

/**
 * Wait for a condition function to return true, checking on each DOM mutation
 * or after a fallback interval. Returns true if condition met, false on timeout.
 */
export function waitForCondition(
  condition: () => boolean,
  timeoutMs = 5000,
  fallbackIntervalMs = 200
): Promise<boolean> {
  return new Promise((resolve) => {
    if (condition()) {
      resolve(true);
      return;
    }

    let timer: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;

    const check = () => {
      if (condition()) {
        cleanup();
        resolve(true);
      }
    };

    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    interval = setInterval(check, fallbackIntervalMs);

    const cleanup = () => {
      observer.disconnect();
      clearInterval(interval);
      clearTimeout(timer);
    };

    timer = setTimeout(() => {
      cleanup();
      resolve(false);
    }, timeoutMs);
  });
}
