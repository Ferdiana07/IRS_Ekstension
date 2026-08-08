// ============================================================
// Types: Course
// ============================================================

/** A user-configured course target */
export interface CourseTarget {
  id: string;
  code?: string;
  name: string;
  /** Ordered list of preferred class labels, e.g. ["A", "B", "C"] */
  preferredClasses: string[];
  /** Lower number = higher priority (1 is highest) */
  priority: number;
  enabled: boolean;
}

/** A course row detected live on the IRS page */
export interface DetectedCourse {
  /** Unique key derived from the DOM element, e.g. "krs-row-123" */
  domKey: string;
  /** The container DOM element for this course row */
  element: HTMLElement;
  code?: string;
  name: string;
  /** Class label, e.g. "A" */
  className: string;
  /** Raw quota text from DOM, e.g. "29/30" */
  quotaText?: string;
}

/** Result of a war attempt on a single course */
export type AttemptResult =
  | 'SUCCESS'
  | 'FAILED'
  | 'SKIPPED'
  | 'UNAVAILABLE'
  | 'ALREADY_SELECTED'
  | 'MODAL_NOT_FOUND'
  | 'MODAL_MISMATCH'
  | 'CONFIRM_BUTTON_NOT_FOUND'
  | 'VERIFICATION_FAILED'
  | 'STOPPED'
  | 'UNKNOWN';

export interface AttemptRecord {
  courseTarget: CourseTarget;
  selectedClass?: string;
  result: AttemptResult;
  timestamp: number;
  retryCount: number;
}
