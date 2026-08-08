// ============================================================
// Adapters: IRS Adapter Interface
// ============================================================

import type { DetectedCourse } from '../../types/course';
import type { Availability } from '../../types/availability';
import type { ConfirmationModal } from '../../types/confirmation';

/**
 * IRSAdapter abstracts all DOM interactions from the core engine.
 * The engine calls these methods; adapters handle site-specific selectors.
 *
 * Two implementations:
 *  - MockIRSAdapter    → for development and testing
 *  - UndipIRSAdapter   → for the real IRS UNDIP page (requires DOM inspection)
 */
export interface IRSAdapter {
  /** Adapter name for logging */
  readonly name: string;

  /**
   * Scan the page and return all detected course rows.
   * Each row represents one course+class combination.
   */
  detectCourses(): DetectedCourse[];

  /**
   * Determine the availability of a specific detected course row.
   */
  detectAvailability(course: DetectedCourse): Availability;

  /**
   * Check whether this course row already shows as "selected" by the user.
   */
  isAlreadySelected(course: DetectedCourse): boolean;

  /**
   * Click the "Pilih / Select" button for the given course row.
   * Returns true if click was dispatched (not whether it succeeded).
   */
  selectCourse(course: DetectedCourse): Promise<boolean>;

  /**
   * Scan the page for a currently visible confirmation modal.
   * Returns the modal if found, null otherwise.
   */
  detectConfirmationModal(): ConfirmationModal | null;

  /**
   * Click the confirm button inside the validated modal.
   * Returns true if click was dispatched.
   */
  confirm(modal: ConfirmationModal): Promise<boolean>;

  /**
   * After confirmation, verify that the course row now shows as selected.
   */
  verifySelection(course: DetectedCourse): Promise<boolean>;

  /**
   * Detect the final IRS submission button (Simpan/Submit/Finalisasi IRS).
   * Returns null if not found or if this adapter does not support it.
   */
  detectFinalSubmitButton(): HTMLElement | null;
}
