// ============================================================
// Adapters: Mock IRS Adapter
// Targets mock-irs/index.html for development & testing.
// ============================================================

import type { IRSAdapter } from '../adapter';
import type { DetectedCourse } from '../../types/course';
import type { Availability } from '../../types/availability';
import type { ConfirmationModal } from '../../types/confirmation';
import { parseQuota, normalizeText } from '../../utils/normalize';
import { sleep, waitForCondition } from '../../utils/sleep';
import Logger from '../../utils/logger';

// ── Selectors for mock-irs/index.html ──────────────────────────────────────
const MOCK_SELECTORS = {
  COURSE_ROW: '[data-mock-course-row]',
  COURSE_NAME: '[data-mock-course-name]',
  COURSE_CLASS: '[data-mock-course-class]',
  COURSE_QUOTA: '[data-mock-course-quota]',
  COURSE_STATUS: '[data-mock-course-status]',
  SELECT_BUTTON: '[data-mock-select-btn]',
  SELECTED_BADGE: '[data-mock-selected]',

  // Confirmation modal
  MODAL: '[data-mock-modal]',
  MODAL_TITLE: '[data-mock-modal-title]',
  MODAL_BODY: '[data-mock-modal-body]',
  MODAL_CONFIRM: '[data-mock-modal-confirm]',
  MODAL_CANCEL: '[data-mock-modal-cancel]',

  // Final submission
  FINAL_SUBMIT: '[data-mock-final-submit]',
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────

function parseAvailabilityFromRow(row: HTMLElement): Availability {
  const quotaEl = row.querySelector<HTMLElement>(MOCK_SELECTORS.COURSE_QUOTA);
  const statusEl = row.querySelector<HTMLElement>(MOCK_SELECTORS.COURSE_STATUS);

  const rawText = [quotaEl?.textContent, statusEl?.textContent]
    .filter(Boolean)
    .join(' ')
    .trim();

  // 1. Check explicit status text
  const statusText = normalizeText(statusEl?.textContent ?? '');
  if (['tersedia', 'available', 'open'].includes(statusText)) {
    const quota = quotaEl ? parseQuota(quotaEl.textContent ?? '') : null;
    return {
      status: 'AVAILABLE',
      available: true,
      current: quota?.current,
      capacity: quota?.capacity,
      rawText,
    };
  }
  if (['penuh', 'full', 'closed', 'tutup'].includes(statusText)) {
    const quota = quotaEl ? parseQuota(quotaEl.textContent ?? '') : null;
    return {
      status: 'FULL',
      available: false,
      current: quota?.current,
      capacity: quota?.capacity,
      rawText,
    };
  }

  // 2. Parse quota x/y
  if (quotaEl) {
    const quota = parseQuota(quotaEl.textContent ?? '');
    if (quota) {
      const available = quota.current < quota.capacity;
      return {
        status: available ? 'AVAILABLE' : 'FULL',
        available,
        current: quota.current,
        capacity: quota.capacity,
        rawText,
      };
    }
  }

  // 3. Cannot determine
  return { status: 'UNKNOWN', available: false, rawText };
}

// ── MockIRSAdapter ─────────────────────────────────────────────────────────

export class MockIRSAdapter implements IRSAdapter {
  readonly name = 'MockIRSAdapter';

  detectCourses(): DetectedCourse[] {
    const rows = document.querySelectorAll<HTMLElement>(MOCK_SELECTORS.COURSE_ROW);
    const courses: DetectedCourse[] = [];

    rows.forEach((row, index) => {
      const nameEl = row.querySelector<HTMLElement>(MOCK_SELECTORS.COURSE_NAME);
      const classEl = row.querySelector<HTMLElement>(MOCK_SELECTORS.COURSE_CLASS);

      if (!nameEl || !classEl) {
        Logger.debug(`MockAdapter: Skipping row ${index} — missing name or class element`);
        return;
      }

      const name = nameEl.textContent?.trim() ?? '';
      const className = classEl.textContent?.trim() ?? '';

      if (!name || !className) return;

      const domKey = row.dataset['mockCourseRow'] ?? `mock-row-${index}`;

      courses.push({
        domKey,
        element: row,
        name,
        className,
        quotaText: row.querySelector<HTMLElement>(MOCK_SELECTORS.COURSE_QUOTA)?.textContent?.trim(),
      });
    });

    Logger.debug(`MockAdapter: Detected ${courses.length} course rows`);
    return courses;
  }

  detectAvailability(course: DetectedCourse): Availability {
    return parseAvailabilityFromRow(course.element);
  }

  isAlreadySelected(course: DetectedCourse): boolean {
    const badge = course.element.querySelector(MOCK_SELECTORS.SELECTED_BADGE);
    if (badge) return true;

    // Check data attribute
    return course.element.dataset['mockSelected'] === 'true';
  }

  async selectCourse(course: DetectedCourse): Promise<boolean> {
    const btn = course.element.querySelector<HTMLElement>(MOCK_SELECTORS.SELECT_BUTTON);
    if (!btn) {
      Logger.warn(`MockAdapter: Select button not found for ${course.name} - ${course.className}`);
      return false;
    }

    Logger.debug(`MockAdapter: Clicking select for ${course.name} - ${course.className}`);
    btn.click();
    return true;
  }

  detectConfirmationModal(): ConfirmationModal | null {
    const modal = document.querySelector<HTMLElement>(MOCK_SELECTORS.MODAL);
    if (!modal) return null;

    // Check visibility
    const style = window.getComputedStyle(modal);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return null;
    }

    const titleEl = modal.querySelector<HTMLElement>(MOCK_SELECTORS.MODAL_TITLE);
    const bodyEl = modal.querySelector<HTMLElement>(MOCK_SELECTORS.MODAL_BODY);
    const confirmBtn = modal.querySelector<HTMLElement>(MOCK_SELECTORS.MODAL_CONFIRM);
    const cancelBtn = modal.querySelector<HTMLElement>(MOCK_SELECTORS.MODAL_CANCEL);

    const message = bodyEl?.textContent?.trim() ?? '';

    // Extract course name and class from modal body
    const courseNameMatch = message.match(/(?:mata kuliah|kode|pilih)?\s*:?\s*(.+?)[\n\r,]/i);
    const classMatch = message.match(/kelas\s*:?\s*([A-Z])/i)
      ?? message.match(/[-–]\s*([A-Z])\s*[?]?/i);

    return {
      element: modal,
      title: titleEl?.textContent?.trim(),
      message,
      confirmButton: confirmBtn ?? undefined,
      cancelButton: cancelBtn ?? undefined,
      detectedCourseName: courseNameMatch?.[1]?.trim(),
      detectedClassName: classMatch?.[1]?.trim(),
    };
  }

  async confirm(modal: ConfirmationModal): Promise<boolean> {
    if (!modal.confirmButton) {
      Logger.warn('MockAdapter: No confirm button in modal');
      return false;
    }
    Logger.debug('MockAdapter: Clicking confirm button');
    modal.confirmButton.click();
    return true;
  }

  async verifySelection(course: DetectedCourse): Promise<boolean> {
    const verified = await waitForCondition(
      () => this.isAlreadySelected(course),
      3000,
      200
    );
    Logger.debug(`MockAdapter: Verification ${verified ? 'SUCCESS' : 'FAILED'} for ${course.name}`);
    return verified;
  }

  detectFinalSubmitButton(): HTMLElement | null {
    return document.querySelector<HTMLElement>(MOCK_SELECTORS.FINAL_SUBMIT);
  }
}
