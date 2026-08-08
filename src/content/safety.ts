// ============================================================
// Content: Safety — Action lock, duplicate prevention, stop signal
// ============================================================

import Logger from '../utils/logger';

// ── Stop signal ────────────────────────────────────────────────────────────

let _stopped = false;
let _abortController: AbortController | null = null;

export function initStop(): AbortController {
  _stopped = false;
  _abortController = new AbortController();
  return _abortController;
}

export function triggerStop(): void {
  _stopped = true;
  _abortController?.abort();
  Logger.warn('Safety: Stop signal triggered');
}

export function isStopped(): boolean {
  return _stopped;
}

export function getAbortSignal(): AbortSignal | undefined {
  return _abortController?.signal;
}

// ── Global action lock ─────────────────────────────────────────────────────

/** Prevents any concurrent action while SELECT → CONFIRM → VERIFY is in progress */
let _actionInProgress = false;

export function isActionInProgress(): boolean {
  return _actionInProgress;
}

export function acquireActionLock(): boolean {
  if (_actionInProgress) return false;
  _actionInProgress = true;
  Logger.debug('Safety: Action lock acquired');
  return true;
}

export function releaseActionLock(): void {
  _actionInProgress = false;
  Logger.debug('Safety: Action lock released');
}

// ── Per-course lock (unique key = courseId:className) ─────────────────────

const _lockedCourses = new Set<string>();

export function lockCourse(courseKey: string): boolean {
  if (_lockedCourses.has(courseKey)) {
    Logger.debug(`Safety: Course already locked: ${courseKey}`);
    return false;
  }
  _lockedCourses.add(courseKey);
  Logger.debug(`Safety: Course locked: ${courseKey}`);
  return true;
}

export function unlockCourse(courseKey: string): void {
  _lockedCourses.delete(courseKey);
  Logger.debug(`Safety: Course unlocked: ${courseKey}`);
}

export function isCourseLockedKey(courseKey: string): boolean {
  return _lockedCourses.has(courseKey);
}

export function buildCourseKey(courseName: string, className: string): string {
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '-');
  return `${normalize(courseName)}:${normalize(className)}`;
}

export function clearAllLocks(): void {
  _lockedCourses.clear();
  _actionInProgress = false;
  Logger.debug('Safety: All locks cleared');
}

// ── Identity validation guards ─────────────────────────────────────────────

/**
 * Returns true only when all required identifiers are non-empty strings.
 * UNKNOWN = DO NOTHING is enforced here.
 */
export function validateIdentity(fields: {
  courseName?: string;
  className?: string;
}): boolean {
  if (!fields.courseName || fields.courseName.trim() === '') {
    Logger.warn('Safety: Course identity unknown — action blocked');
    return false;
  }
  if (!fields.className || fields.className.trim() === '') {
    Logger.warn('Safety: Class identity unknown — action blocked');
    return false;
  }
  return true;
}
