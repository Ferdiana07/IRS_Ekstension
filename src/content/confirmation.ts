// ============================================================
// Content: Confirmation Engine
// Detect → Validate → Click Confirm
// ============================================================

import type { IRSAdapter } from '../adapters/adapter';
import type { ConfirmationModal } from '../types/confirmation';
import type { ModalValidationResult } from '../types/confirmation';
import type { DetectedCourse } from '../types/course';
import type { WarSettings } from '../types/config';
import { watchForModal } from './observer';
import { isStopped } from './safety';
import { courseNameSimilarity, classMatches } from '../utils/normalize';
import Logger from '../utils/logger';

const COURSE_SIMILARITY_THRESHOLD = 0.6;

// ── Modal Validation ───────────────────────────────────────────────────────

/**
 * Validate that the detected modal matches the intended course and class.
 *
 * Rules:
 * - If modal has course name text, it must match the target (similarity ≥ 0.6)
 * - If modal has class text, it must match the target class
 * - If modal has NEITHER (e.g. UNDIP generic modal): treat as VALID if confirm button found.
 *   UNDIP modal body = "Apakah anda yakin ingin memilih mata kuliah ini?" — no course details.
 *   Safety is guaranteed by: only calling this AFTER we clicked the specific course row.
 */
export function validateModal(
  modal: ConfirmationModal,
  targetCourse: DetectedCourse
): ModalValidationResult {
  if (!modal.confirmButton) {
    Logger.warn('Confirmation: Modal found but no confirm button');
    return 'NO_BUTTON';
  }

  const hasCourseName = !!modal.detectedCourseName;
  const hasClassName  = !!modal.detectedClassName;

  // UNDIP case: modal body is generic — neither course name nor class is in the modal.
  // Since we only call handleConfirmation() right after clicking the target course,
  // the modal MUST be for that course. Treat as VALID if confirm button is present.
  if (!hasCourseName && !hasClassName) {
    Logger.warn(
      'Confirmation: Modal has no course/class info (likely UNDIP generic modal) — ' +
      'treating as VALID because confirm button is present and modal appeared after select click'
    );
    return 'VALID';
  }

  // Validate course name if present
  if (hasCourseName) {
    const similarity = courseNameSimilarity(modal.detectedCourseName!, targetCourse.name);
    Logger.debug(`Confirmation: Modal course "${modal.detectedCourseName}" vs target "${targetCourse.name}" = ${similarity.toFixed(2)}`);
    if (similarity < COURSE_SIMILARITY_THRESHOLD) {
      Logger.warn(
        `Confirmation: MISMATCH — Modal is for "${modal.detectedCourseName}" ` +
        `but target is "${targetCourse.name}" — DO NOT CLICK`
      );
      return 'MISMATCH';
    }
  }

  // Validate class if present
  if (hasClassName) {
    const matches = classMatches(modal.detectedClassName!, targetCourse.className);
    Logger.debug(`Confirmation: Modal class "${modal.detectedClassName}" vs target "${targetCourse.className}" = ${matches}`);
    if (!matches) {
      Logger.warn(
        `Confirmation: MISMATCH — Modal class "${modal.detectedClassName}" ` +
        `but target class "${targetCourse.className}" — DO NOT CLICK`
      );
      return 'MISMATCH';
    }
  }

  Logger.success(`Confirmation: Modal validated for "${targetCourse.name}" Kelas ${targetCourse.className}`);
  return 'VALID';
}


// ── Confirmation Flow ──────────────────────────────────────────────────────

export interface ConfirmationResult {
  outcome: 'CONFIRMED' | 'NOT_FOUND' | 'MISMATCH' | 'UNREADABLE' | 'NO_BUTTON' | 'CLICK_FAILED' | 'STOPPED';
}

/**
 * Wait for the confirmation modal to appear (event-driven via MutationObserver),
 * validate it, and click confirm.
 *
 * Returns a ConfirmationResult describing the outcome.
 */
export async function handleConfirmation(
  adapter: IRSAdapter,
  targetCourse: DetectedCourse,
  settings: WarSettings
): Promise<ConfirmationResult> {
  if (isStopped()) return { outcome: 'STOPPED' };

  Logger.info('Confirmation: Waiting for modal...');

  // Use MutationObserver to detect modal appearance (not setTimeout loop)
  let detectedModal: ConfirmationModal | null = null;

  const modalFound = await watchForModal(
    () => {
      const modal = adapter.detectConfirmationModal();
      if (modal) {
        detectedModal = modal;
        return true;
      }
      return false;
    },
    () => {
      Logger.info('Confirmation: Modal detected');
    },
    settings.confirmationTimeout
  );

  if (!modalFound || !detectedModal) {
    Logger.error(`Confirmation: Modal not detected within ${settings.confirmationTimeout}ms`);
    return { outcome: 'NOT_FOUND' };
  }

  if (isStopped()) return { outcome: 'STOPPED' };

  // Validate modal
  const validation = validateModal(detectedModal, targetCourse);

  if (validation !== 'VALID') {
    return {
      outcome: validation as 'MISMATCH' | 'UNREADABLE' | 'NO_BUTTON',
    };
  }

  // Click confirm — only once
  Logger.info('Confirmation: Clicking confirm button');
  const clicked = await adapter.confirm(detectedModal);

  if (!clicked) {
    Logger.error('Confirmation: Failed to click confirm button');
    return { outcome: 'CLICK_FAILED' };
  }

  Logger.success('Confirmation: Confirm button clicked');
  return { outcome: 'CONFIRMED' };
}
