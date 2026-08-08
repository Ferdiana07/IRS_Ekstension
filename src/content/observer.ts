// ============================================================
// Content: MutationObserver manager
// ============================================================

import Logger from '../utils/logger';
import { debounce } from '../utils/debounce';

type ObserverCallback = (mutations: MutationRecord[]) => void;

interface ObserverEntry {
  id: string;
  observer: MutationObserver;
  target: Node;
}

const _observers: Map<string, ObserverEntry> = new Map();

/**
 * Register a MutationObserver with a named ID.
 * If an observer with the same ID already exists, it is disconnected first.
 */
export function registerObserver(
  id: string,
  target: Node,
  callback: ObserverCallback,
  options: MutationObserverInit = { childList: true, subtree: true, attributes: true, characterData: true },
  debounceMs = 0
): void {
  disconnectObserver(id);

  const effectiveCb = debounceMs > 0 ? debounce(callback as (...args: unknown[]) => void, debounceMs) as ObserverCallback : callback;
  const observer = new MutationObserver(effectiveCb);
  observer.observe(target, options);

  _observers.set(id, { id, observer, target });
  Logger.debug(`Observer: Registered '${id}'`);
}

/**
 * Disconnect and remove a named observer.
 */
export function disconnectObserver(id: string): void {
  const entry = _observers.get(id);
  if (entry) {
    entry.observer.disconnect();
    _observers.delete(id);
    Logger.debug(`Observer: Disconnected '${id}'`);
  }
}

/**
 * Disconnect ALL observers. Called on STOP.
 */
export function disconnectAllObservers(): void {
  _observers.forEach((entry, id) => {
    entry.observer.disconnect();
    Logger.debug(`Observer: Disconnected '${id}'`);
  });
  _observers.clear();
  Logger.info('Observer: All observers disconnected');
}

// ── Named observers used by the war engine ─────────────────────────────────

export const OBSERVER_IDS = {
  QUOTA_WATCHER: 'quota-watcher',
  MODAL_WATCHER: 'modal-watcher',
  SELECTION_WATCHER: 'selection-watcher',
  COURSE_TABLE_WATCHER: 'course-table-watcher',
} as const;

/**
 * Watch for a modal to appear. Calls `onModal` when modal element is visible.
 * Uses MutationObserver (not setTimeout).
 *
 * Returns a cleanup function.
 */
export function watchForModal(
  detectModalFn: () => boolean,
  onModal: () => void,
  timeoutMs: number
): Promise<boolean> {
  return new Promise((resolve) => {
    // Check immediately
    if (detectModalFn()) {
      onModal();
      resolve(true);
      return;
    }

    let timer: ReturnType<typeof setTimeout>;

    const observer = new MutationObserver(() => {
      if (detectModalFn()) {
        observer.disconnect();
        clearTimeout(timer);
        onModal();
        resolve(true);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden', 'aria-hidden'],
    });

    timer = setTimeout(() => {
      observer.disconnect();
      Logger.warn('Observer: Modal watch timed out');
      resolve(false);
    }, timeoutMs);
  });
}
