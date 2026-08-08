// ============================================================
// Adapters: UNDIP IRS Adapter
//
// Target: siap.undip.ac.id/irs/mhs/irs
// DOM verified: 2026-08-08 (actual outerHTML confirmed by user)
//
// ── Selection flow ────────────────────────────────────────
// 1. detectCourses()  → scan all div[class*="makul_"] in calendar
// 2. detectAvailability() → check CSS class + cursor style
// 3. selectCourse()   → click div.btn_unirs (the clickable block)
// 4. detectConfirmationModal() → wait for .modal.show
// 5. confirm()        → click "Ya" button
// 6. verifySelection() → check ft-check-circle appears on block
// ============================================================

import type { IRSAdapter } from '../adapter';
import type { DetectedCourse } from '../../types/course';
import type { Availability } from '../../types/availability';
import type { ConfirmationModal } from '../../types/confirmation';
import {
  UNDIP_SELECTORS,
  UNDIP_MODAL_TEXTS,
  parseUndipQuotaFromPopover,
} from './selectors';
import { normalizeText, courseNameSimilarity } from '../../utils/normalize';
import { waitForCondition } from '../../utils/sleep';
import Logger from '../../utils/logger';

// ── Helpers ────────────────────────────────────────────────────────────────

function getText(el: Element | null): string {
  return el?.textContent?.trim() ?? '';
}

/**
 * Strip "(GABUNGAN)", "(REGULER)" etc from course name to get clean name.
 */
function cleanCourseName(raw: string): string {
  return raw
    .replace(/\s*\(GABUNGAN\)/gi, '')
    .replace(/\s*\(REGULER\)/gi, '')
    .trim();
}

/**
 * Extract class letter from text like "A 3/3 sks" → "A"
 * Or "B 3/3 sks" → "B"
 */
function extractClassLetter(text: string): string {
  const m = text.trim().match(/^([A-Z])\s/i) ?? text.trim().match(/^([A-Z])$/i);
  return m ? m[1].toUpperCase() : '';
}

/**
 * Find a button inside a container by its text content.
 */
function findButtonByText(container: HTMLElement, text: string): HTMLElement | null {
  const buttons = container.querySelectorAll<HTMLElement>('button, a.btn, input[type="button"]');
  const target = normalizeText(text);
  for (const btn of buttons) {
    if (normalizeText(btn.textContent ?? '') === target) return btn;
  }
  return null;
}

/**
 * Find the visible Bootstrap modal.
 */
function findVisibleModal(): HTMLElement | null {
  // .modal.show — Bootstrap 4/5 standard
  const byShow = document.querySelector<HTMLElement>('.modal.show');
  if (byShow) return byShow;

  // Fallback: any .modal with display != none
  for (const m of document.querySelectorAll<HTMLElement>('.modal')) {
    if (window.getComputedStyle(m).display !== 'none') return m;
  }

  return null;
}

// ── UndipIRSAdapter ────────────────────────────────────────────────────────

export class UndipIRSAdapter implements IRSAdapter {
  readonly name = 'UndipIRSAdapter';

  // ── Course Detection ──────────────────────────────────────────────────────

  detectCourses(): DetectedCourse[] {
    const courses: DetectedCourse[] = [];

    // All course blocks on the page (any state)
    const blocks = document.querySelectorAll<HTMLElement>(UNDIP_SELECTORS.COURSE_BLOCK);

    Logger.debug(`UndipAdapter: Found ${blocks.length} makul blocks on page`);

    blocks.forEach((block) => {
      // ── Extract course name ──────────────────────────────────────────────
      // Primary: data-original-title (e.g. " Pembelajaran Mesin (GABUNGAN)")
      const titleAttr = block.getAttribute(UNDIP_SELECTORS.COURSE_NAME_ATTR) ?? '';
      const nameFromAttr = cleanCourseName(titleAttr);

      // Fallback: <strong> element text
      const nameFromEl = cleanCourseName(getText(block.querySelector(UNDIP_SELECTORS.COURSE_NAME_EL)));

      const name = nameFromAttr || nameFromEl;
      if (!name || name.length < 3) return;

      // ── Extract class letter ─────────────────────────────────────────────
      // <b class="orange">A 3/3 sks</b> → "A"
      const classEl = block.querySelector<HTMLElement>(UNDIP_SELECTORS.COURSE_CLASS_EL);
      const classText = getText(classEl);
      const className = extractClassLetter(classText);
      if (!className) return;

      // ── Build unique key ─────────────────────────────────────────────────
      // data-id-mk-smt is the IRS session ID (non-empty for selectable courses)
      const mkSmt = block.getAttribute(UNDIP_SELECTORS.COURSE_ID_ATTR) ?? '';
      // makul_XXXXX class gives us the course ID
      const makul = [...block.classList].find((c) => c.startsWith('makul_')) ?? '';
      const domKey = mkSmt
        ? `undip-${mkSmt}`
        : `undip-${makul}-${className}`;

      // ── Extract quota from popover (optional) ────────────────────────────
      const popoverData = block.getAttribute(UNDIP_SELECTORS.COURSE_POPOVER_ATTR) ?? '';
      const quota = parseUndipQuotaFromPopover(popoverData);

      const quotaText = quota
        ? `${quota.current}/${quota.capacity}`
        : undefined;

      courses.push({
        domKey,
        element: block,
        name,
        className,
        quotaText,
      });
    });

    Logger.debug(`UndipAdapter: Parsed ${courses.length} valid course entries`);
    return courses;
  }

  // ── Availability Detection ────────────────────────────────────────────────

  detectAvailability(course: DetectedCourse): Availability {
    const el = course.element as HTMLElement;
    const rawText = el.textContent ?? '';

    // ── SELECTED: has ft-check-circle icon ────────────────────────────────
    if (el.querySelector(UNDIP_SELECTORS.SELECTED_INDICATOR)) {
      Logger.debug(`UndipAdapter: "${course.name}" Kelas ${course.className} → SELECTED`);
      return { status: 'SELECTED', available: false, rawText };
    }

    // ── NOT AVAILABLE: grey + cursor:not-allowed ──────────────────────────
    const style = el.getAttribute('style') ?? '';
    const isNotAllowed = style.includes('cursor: not-allowed') || style.includes('cursor:not-allowed');
    const isGrey = el.classList.contains('bs-callout-grey') || el.classList.contains('grey');

    if (isNotAllowed || (isGrey && !el.classList.contains('btn_unirs'))) {
      // Parse popover for more detail (PENUH vs TIDAK TERSEDIA)
      const popoverData = el.getAttribute(UNDIP_SELECTORS.COURSE_POPOVER_ATTR) ?? '';
      const quota = parseUndipQuotaFromPopover(popoverData);

      const status = quota?.status === 'NOT_AVAILABLE' ? 'CLOSED' : 'FULL';
      Logger.debug(`UndipAdapter: "${course.name}" Kelas ${course.className} → ${status}`);
      return {
        status,
        available: false,
        current: quota?.current,
        capacity: quota?.capacity,
        rawText,
      };
    }

    // ── AVAILABLE: has btn_unirs + cursor:pointer + no checkmark ─────────
    if (el.classList.contains('btn_unirs')) {
      const popoverData = el.getAttribute(UNDIP_SELECTORS.COURSE_POPOVER_ATTR) ?? '';
      const quota = parseUndipQuotaFromPopover(popoverData);

      Logger.debug(
        `UndipAdapter: "${course.name}" Kelas ${course.className} → AVAILABLE` +
        (quota ? ` (${quota.current}/${quota.capacity})` : '')
      );
      return {
        status: 'AVAILABLE',
        available: true,
        current: quota?.current,
        capacity: quota?.capacity,
        rawText,
      };
    }

    Logger.debug(`UndipAdapter: "${course.name}" Kelas ${course.className} → UNKNOWN`);
    return { status: 'UNKNOWN', available: false, rawText };
  }

  // ── Selected Check ────────────────────────────────────────────────────────

  isAlreadySelected(course: DetectedCourse): boolean {
    const el = course.element as HTMLElement;
    // Green checkmark = dipilih
    return !!el.querySelector(UNDIP_SELECTORS.SELECTED_INDICATOR);
  }

  // ── Selection ─────────────────────────────────────────────────────────────

  async selectCourse(course: DetectedCourse): Promise<boolean> {
    const el = course.element as HTMLElement;

    // Safety: must have btn_unirs class (clickable)
    if (!el.classList.contains('btn_unirs')) {
      Logger.warn(
        `UndipAdapter: "${course.name}" Kelas ${course.className} is NOT btn_unirs — refusing to click`
      );
      return false;
    }

    // Safety: must not have cursor:not-allowed
    const style = el.getAttribute('style') ?? '';
    if (style.includes('not-allowed')) {
      Logger.warn(
        `UndipAdapter: "${course.name}" Kelas ${course.className} has cursor:not-allowed — refusing to click`
      );
      return false;
    }

    // Safety: must not already be selected
    if (this.isAlreadySelected(course)) {
      Logger.warn(`UndipAdapter: "${course.name}" Kelas ${course.className} is already selected — skip`);
      return false;
    }

    Logger.debug(`UndipAdapter: Clicking block for "${course.name}" Kelas ${course.className}`);
    el.click();
    return true;
  }

  // ── Confirmation Modal ────────────────────────────────────────────────────

  detectConfirmationModal(): ConfirmationModal | null {
    const modal = findVisibleModal();
    if (!modal) return null;

    // Verify it's the IRS confirmation modal
    const titleText = normalizeText(getText(modal.querySelector(UNDIP_SELECTORS.MODAL_TITLE)));
    const bodyText  = normalizeText(getText(modal.querySelector(UNDIP_SELECTORS.MODAL_BODY)));

    const isTitleMatch = titleText.includes(normalizeText(UNDIP_MODAL_TEXTS.TITLE));
    const isBodyMatch  = bodyText.includes(normalizeText(UNDIP_MODAL_TEXTS.BODY_KEYWORD));

    if (!isTitleMatch && !isBodyMatch) {
      Logger.debug(`UndipAdapter: Modal visible but not IRS modal (title="${titleText}")`);
      return null;
    }

    // Find Ya / Tidak buttons by text
    const confirmBtn = findButtonByText(modal, UNDIP_MODAL_TEXTS.CONFIRM);
    const cancelBtn  = findButtonByText(modal, UNDIP_MODAL_TEXTS.CANCEL);

    Logger.debug(
      `UndipAdapter: IRS modal confirmed — ` +
      `confirm=${confirmBtn ? 'FOUND' : 'MISSING'} cancel=${cancelBtn ? 'FOUND' : 'MISSING'}`
    );

    return {
      element: modal,
      title: getText(modal.querySelector(UNDIP_SELECTORS.MODAL_TITLE)),
      message: getText(modal.querySelector(UNDIP_SELECTORS.MODAL_BODY)),
      confirmButton: confirmBtn ?? undefined,
      cancelButton: cancelBtn ?? undefined,
      // UNDIP modal body does NOT contain course name/class
      // Safety relies on timing: modal only appears after clicking a specific block
      detectedCourseName: undefined,
      detectedClassName: undefined,
    };
  }

  async confirm(modal: ConfirmationModal): Promise<boolean> {
    if (!modal.confirmButton) {
      Logger.warn('UndipAdapter: No "Ya" button found in modal');
      return false;
    }

    Logger.debug('UndipAdapter: Clicking "Ya" button');
    modal.confirmButton.click();
    return true;
  }

  // ── Verification ──────────────────────────────────────────────────────────

  async verifySelection(course: DetectedCourse): Promise<boolean> {
    // After confirming, the block should gain the ft-check-circle icon
    // and transform into the "DIPILIH" green card with media layout
    const verified = await waitForCondition(
      () => {
        // Check the original element reference
        if (this.isAlreadySelected(course)) return true;

        // UNDIP may re-render the DOM — scan for any block matching the course
        // that now has the checkmark
        const allSelected = document.querySelectorAll<HTMLElement>(
          `${UNDIP_SELECTORS.COURSE_BLOCK}:has(${UNDIP_SELECTORS.SELECTED_INDICATOR})`
        );
        for (const sel of allSelected) {
          const selName = cleanCourseName(
            sel.getAttribute(UNDIP_SELECTORS.COURSE_NAME_ATTR) ??
            getText(sel.querySelector(UNDIP_SELECTORS.COURSE_NAME_EL))
          );
          const selClass = extractClassLetter(
            getText(sel.querySelector(UNDIP_SELECTORS.COURSE_CLASS_EL))
          );
          if (
            courseNameSimilarity(selName, course.name) >= 0.7 &&
            selClass === course.className
          ) {
            Logger.debug(`UndipAdapter: Found newly selected block matching "${course.name}" Kelas ${course.className}`);
            return true;
          }
        }
        return false;
      },
      5000,
      300
    );

    Logger.debug(
      `UndipAdapter: Verification ${verified ? '✓ PASSED' : '✗ FAILED'} ` +
      `for "${course.name}" Kelas ${course.className}`
    );
    return verified;
  }

  detectFinalSubmitButton(): HTMLElement | null {
    return document.querySelector<HTMLElement>(UNDIP_SELECTORS.FINAL_SUBMIT);
  }
}
