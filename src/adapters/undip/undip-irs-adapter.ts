// ============================================================
// Adapters: UNDIP IRS Adapter
//
// Target: siap.undip.ac.id/irs/mhs/irs
// DOM inspection: 2026-08-08 (screenshots + HTML)
//
// CONFIRMED from screenshots:
//   - Modal: Bootstrap .modal.show, title "Konfirmasi IRS"
//   - Confirm button: "Ya" (blue), Cancel: "Tidak" (red)
//   - Left sidebar: "Matakuliah Ditampilkan" course list
//   - Calendar view: course cells with class + SKS info
//   - Selected courses: shown with green checkmark in sidebar
//
// NEEDS VERIFICATION (right-click → Inspect on UNDIP IRS page):
//   - Exact selectors for course calendar cells
//   - How to extract course name + class from cells
//   - Click target (cell itself or inner button)
// ============================================================

import type { IRSAdapter } from '../adapter';
import type { DetectedCourse } from '../../types/course';
import type { Availability } from '../../types/availability';
import type { ConfirmationModal } from '../../types/confirmation';
import { UNDIP_SELECTORS, UNDIP_CONFIRMATION_TEXTS } from './selectors';
import { normalizeText, parseQuota, courseNameSimilarity, classMatches } from '../../utils/normalize';
import { waitForCondition } from '../../utils/sleep';
import Logger from '../../utils/logger';

// ── Course extraction helpers ──────────────────────────────────────────────

/**
 * Extract all text content from an element, stripping HTML.
 */
function getText(el: Element | null): string {
  return el?.textContent?.trim() ?? '';
}

/**
 * Try multiple selectors and return the first matching element.
 */
function queryFirst(root: ParentNode, ...selectors: string[]): HTMLElement | null {
  for (const sel of selectors) {
    try {
      const el = root.querySelector<HTMLElement>(sel);
      if (el) return el;
    } catch { /* invalid selector — skip */ }
  }
  return null;
}

/**
 * Extract class label from text like "Kelas: A 3/3 sks" or "Kelas A" or just "A".
 */
function extractClassLabel(text: string): string {
  const normalized = normalizeText(text);
  // Match patterns: "kelas: a", "kelas a", standalone single letter
  const m = normalized.match(/kelas[:\s]+([a-z])/i)
    ?? normalized.match(/\bkelas\s([a-z])\b/i)
    ?? normalized.match(/^([a-z])$/i)
    ?? normalized.match(/\s([a-z])\s+\d+\/\d+/i);
  return m ? m[1].toUpperCase() : '';
}

/**
 * Extract quota from text like "3/3 sks", "29/30", "0/30".
 */
function extractQuota(text: string): { current: number; capacity: number } | null {
  return parseQuota(text);
}

// ── Modal helpers (CONFIRMED approach) ────────────────────────────────────

/**
 * Find a visible Bootstrap modal.
 * Tries multiple detection strategies in priority order.
 */
function findVisibleModal(): HTMLElement | null {
  // Strategy 1: .modal.show (Bootstrap 4/5 standard)
  const byShow = document.querySelector<HTMLElement>('.modal.show');
  if (byShow) return byShow;

  // Strategy 2: display:block inline style
  const allModals = document.querySelectorAll<HTMLElement>('.modal');
  for (const modal of allModals) {
    const style = window.getComputedStyle(modal);
    if (style.display !== 'none' && style.visibility !== 'hidden') {
      return modal;
    }
  }

  // Strategy 3: role="dialog" that is visible
  const byRole = document.querySelector<HTMLElement>('[role="dialog"]:not([aria-hidden="true"])');
  if (byRole) return byRole;

  return null;
}

/**
 * Find the confirm button (text "Ya") inside the modal.
 * UNDIP IRS modal has blue "Ya" and red "Tidak" buttons (CONFIRMED).
 */
function findConfirmButton(modal: HTMLElement): HTMLElement | null {
  // Try CSS selectors first
  for (const sel of [UNDIP_SELECTORS.MODAL_CONFIRM]) {
    try {
      const el = modal.querySelector<HTMLElement>(sel);
      if (el) return el;
    } catch { /* skip invalid */ }
  }

  // Fallback: find by text "ya" (case-insensitive)
  const buttons = modal.querySelectorAll<HTMLElement>('button, a.btn, input[type="button"], input[type="submit"]');
  for (const btn of buttons) {
    if (normalizeText(btn.textContent ?? '') === UNDIP_CONFIRMATION_TEXTS.CONFIRM_BUTTON_TEXT) {
      return btn;
    }
  }

  return null;
}

/**
 * Find the cancel button (text "Tidak") inside the modal.
 */
function findCancelButton(modal: HTMLElement): HTMLElement | null {
  const buttons = modal.querySelectorAll<HTMLElement>('button, a.btn');
  for (const btn of buttons) {
    if (normalizeText(btn.textContent ?? '') === UNDIP_CONFIRMATION_TEXTS.CANCEL_BUTTON_TEXT) {
      return btn;
    }
  }
  return null;
}

/**
 * Validate that the visible modal is an IRS course confirmation modal.
 * CONFIRMED: title = "Konfirmasi IRS", body contains "ingin memilih mata kuliah"
 */
function isIRSConfirmationModal(modal: HTMLElement): boolean {
  const title = normalizeText(getText(modal.querySelector('.modal-title, .modal-header h4, .modal-header h5')));
  const body  = normalizeText(getText(modal.querySelector('.modal-body')));

  const titleMatch = title.includes(normalizeText(UNDIP_CONFIRMATION_TEXTS.MODAL_TITLE));
  const bodyMatch  = body.includes(normalizeText(UNDIP_CONFIRMATION_TEXTS.MODAL_BODY_KEYWORD));

  Logger.debug(`UndipAdapter: Modal title="${title}" body="${body.slice(0, 60)}"`);
  Logger.debug(`UndipAdapter: titleMatch=${titleMatch} bodyMatch=${bodyMatch}`);

  return titleMatch || bodyMatch;
}

// ── UndipIRSAdapter ────────────────────────────────────────────────────────

export class UndipIRSAdapter implements IRSAdapter {
  readonly name = 'UndipIRSAdapter';

  // ── Course detection ─────────────────────────────────────────────────────

  detectCourses(): DetectedCourse[] {
    const courses: DetectedCourse[] = [];

    // Strategy A: Detect from left sidebar list (most reliable)
    // Sidebar shows "Matakuliah Ditampilkan" with each course item
    courses.push(...this.detectFromSidebar());

    // Strategy B: Detect from calendar cells (if sidebar detection fails)
    if (courses.length === 0) {
      courses.push(...this.detectFromCalendar());
    }

    Logger.debug(`UndipAdapter: Detected ${courses.length} course entries`);
    return courses;
  }

  /**
   * Strategy A: Parse courses from the left sidebar list.
   * Each sidebar item shows: eye icon | course name | label (WAJIB/PILIHAN) + class info
   */
  private detectFromSidebar(): DetectedCourse[] {
    const courses: DetectedCourse[] = [];

    // Try multiple possible sidebar selectors
    const sidebarItems = document.querySelectorAll<HTMLElement>(
      '.col-md-3 .list-group-item, ' +
      '.sidebar-kiri .item, ' +
      '[class*="matakuliah"] .item, ' +
      '.krs-sidebar li, ' +
      '.panel-mkkrs .list-group-item'
    );

    sidebarItems.forEach((item, i) => {
      const fullText = getText(item);
      if (!fullText || fullText.length < 5) return;

      // Extract course name: first bold/strong element or first line of text
      const nameEl = item.querySelector<HTMLElement>('strong, b, .nama-mk, .course-name');
      const name = nameEl ? getText(nameEl) : fullText.split('\n')[0].trim();

      if (!name || name.length < 3) return;

      // Extract class from text like "(K2024) (SMT 5) (3 SKS)" or "Kelas: A"
      // From screenshot: items show labels like "WAJIB (K2024) (SMT 5) (3 SKS)"
      // Class info might come from clicking or hovering — we try to extract from text
      const classLabel = extractClassLabel(fullText);

      // Without explicit class — add an item for each possible class in the text
      // The sidebar seems to show one entry per course (not per class)
      // Multiple classes (A, B, C...) appear in the calendar view

      const domKey = `undip-sidebar-${i}`;

      courses.push({
        domKey,
        element: item,
        name,
        className: classLabel || 'A', // Default to A if not extractable
        quotaText: undefined,
      });
    });

    return courses;
  }

  /**
   * Strategy B: Parse courses from the calendar/schedule grid.
   * Calendar cells contain: course name, class label, quota like "3/3 sks"
   * From screenshot: cells show "Komputasi Tersebar dan Pararel (GABUNGAN)
   *   WAJIB (K2024) (SMT 5) (3 SKS)  Kelas: A 3/3 sks  07:00:00 - 09:30:00"
   */
  private detectFromCalendar(): DetectedCourse[] {
    const courses: DetectedCourse[] = [];

    // Calendar cells: try FC (FullCalendar) and table-based layouts
    const cells = document.querySelectorAll<HTMLElement>(
      'td[data-mkkrs], div[data-mkkrs], ' +
      '.fc-event, .fc-event-container, ' +
      '.jadwal-cell, .krs-cell, ' +
      'td.slot-mk, div.slot-mk'
    );

    cells.forEach((cell, i) => {
      const fullText = getText(cell);
      if (!fullText || fullText.length < 5) return;

      // Extract course name: usually first line or largest text
      const lines = fullText.split('\n').map((l) => l.trim()).filter(Boolean);
      const name = lines[0] ?? '';
      if (!name || name.length < 3) return;

      // Extract class from cell text
      const classLabel = extractClassLabel(fullText);
      if (!classLabel) return;

      // Extract quota
      const quotaText = fullText.match(/(\d+\/\d+)\s*sks/i)?.[1];

      const domKey = cell.dataset['mkkrs'] ?? `undip-cell-${i}-${classLabel}`;

      courses.push({
        domKey,
        element: cell,
        name,
        className: classLabel,
        quotaText,
      });
    });

    return courses;
  }

  // ── Availability ─────────────────────────────────────────────────────────

  detectAvailability(course: DetectedCourse): Availability {
    const el = course.element;
    const fullText = getText(el);

    // From screenshot: "Kelas: A 3/3 sks" — 3/3 means full (3 out of 3 SKS slots taken)
    // BUT on UNDIP IRS, the x/y might represent SKS not quota count
    // Wait — looking more carefully: "Kelas: D 4/4 sks" in green, others struck through
    // Green text = available, struck-through/dimmed = full

    // Check for already-selected (green checkmark)
    if (this.isAlreadySelected(course)) {
      return { status: 'SELECTED', available: false, rawText: fullText };
    }

    // Check visual indicators: green = available, red/strikethrough = full
    const style = window.getComputedStyle(el);
    const isStrikethrough = style.textDecoration.includes('line-through');
    if (isStrikethrough) {
      return { status: 'FULL', available: false, rawText: fullText };
    }

    // Check data attributes
    const dataStatus = (el.dataset['status'] ?? el.dataset['available'] ?? '').toLowerCase();
    if (dataStatus === 'full' || dataStatus === '0') {
      return { status: 'FULL', available: false, rawText: fullText };
    }
    if (dataStatus === 'available' || dataStatus === '1') {
      return { status: 'AVAILABLE', available: true, rawText: fullText };
    }

    // Parse quota: on UNDIP "3/3 sks" — if current === capacity it's the SKS count, not a full indicator
    // The actual quota needs inspection — for now, check color-based availability
    // Green colored cells/text = available based on screenshots
    const color = style.color;
    // Green-ish colors (rgb values)
    const isGreen = color.includes('rgb(') && (() => {
      const m = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (!m) return false;
      const [, r, g, b] = m.map(Number);
      return (g ?? 0) > (r ?? 255) && (g ?? 0) > (b ?? 0); // green dominant
    })();

    if (isGreen) {
      const quota = parseQuota(fullText);
      return {
        status: 'AVAILABLE',
        available: true,
        current: quota?.current,
        capacity: quota?.capacity,
        rawText: fullText,
      };
    }

    // Default: check the quota pattern
    const quota = parseQuota(fullText);
    if (quota) {
      // On UNDIP IRS, if the element is not struck through and clickable, assume available
      // This needs verification with actual quota data
      const canClick = el.style.pointerEvents !== 'none' && !el.hasAttribute('disabled');
      if (canClick) {
        return {
          status: 'AVAILABLE',
          available: true,
          current: quota.current,
          capacity: quota.capacity,
          rawText: fullText,
        };
      }
      return {
        status: quota.current >= quota.capacity ? 'FULL' : 'AVAILABLE',
        available: quota.current < quota.capacity,
        current: quota.current,
        capacity: quota.capacity,
        rawText: fullText,
      };
    }

    // Cannot determine
    Logger.debug(`UndipAdapter: Availability UNKNOWN for "${course.name}" Kelas ${course.className}`);
    return { status: 'UNKNOWN', available: false, rawText: fullText };
  }

  // ── Selected state ────────────────────────────────────────────────────────

  isAlreadySelected(course: DetectedCourse): boolean {
    const el = course.element;

    // From screenshot: selected courses have a green checkmark icon in sidebar
    const hasCheck = !!el.querySelector('.fa-check, .fa-check-circle, .icon-check, svg[data-icon="check"]');
    if (hasCheck) return true;

    // Check data attributes
    if (el.dataset['selected'] === 'true' || el.dataset['terpilih'] === '1') return true;

    // Check class names
    if (el.classList.contains('terpilih') || el.classList.contains('selected') || el.classList.contains('dipilih')) return true;

    // Check for struck-through text with selected class
    // From screenshot: green rows in calendar = selected
    // Actually from screenshot: there's a checkmark (✓) overlay on selected courses
    const parentRow = el.closest('tr, li, div[class*="item"]');
    if (parentRow?.querySelector('.fa-check, .fa-check-circle')) return true;

    return false;
  }

  // ── Selection ─────────────────────────────────────────────────────────────

  async selectCourse(course: DetectedCourse): Promise<boolean> {
    const el = course.element;

    // Check if there's an explicit button inside the element
    const btn = queryFirst(el,
      'button.btn-pilih',
      'a.btn-pilih',
      'button[onclick]',
      'a[onclick]',
      '.btn-primary',
      '.pilih-mk'
    );

    const target = btn ?? el;

    if (!target) {
      Logger.warn(`UndipAdapter: No clickable target for ${course.name} Kelas ${course.className}`);
      return false;
    }

    Logger.debug(`UndipAdapter: Clicking ${target.tagName} for "${course.name}" Kelas ${course.className}`);
    target.click();
    return true;
  }

  // ── Confirmation Modal (FULLY IMPLEMENTED — confirmed from screenshot) ───

  detectConfirmationModal(): ConfirmationModal | null {
    const modal = findVisibleModal();
    if (!modal) return null;

    // Verify it's the IRS confirmation modal (not some other modal)
    if (!isIRSConfirmationModal(modal)) {
      Logger.debug('UndipAdapter: Visible modal is not an IRS confirmation modal');
      return null;
    }

    const titleEl   = modal.querySelector<HTMLElement>('.modal-title, .modal-header h4, .modal-header h5');
    const bodyEl    = modal.querySelector<HTMLElement>('.modal-body');
    const confirmEl = findConfirmButton(modal);
    const cancelEl  = findCancelButton(modal);

    Logger.debug(
      `UndipAdapter: Modal detected — title="${getText(titleEl)}" ` +
      `confirm="${confirmEl ? 'FOUND' : 'NOT FOUND'}" cancel="${cancelEl ? 'FOUND' : 'NOT FOUND'}"`
    );

    // On UNDIP IRS, the modal body is generic ("Apakah anda yakin ingin memilih mata kuliah ini?")
    // It does NOT contain the specific course name/class — so we cannot validate by content.
    // We rely on timing: modal appears only after clicking a specific course.
    // The core engine's SELECTING → WAITING_CONFIRMATION flow ensures correctness.
    return {
      element: modal,
      title: getText(titleEl),
      message: getText(bodyEl),
      confirmButton: confirmEl ?? undefined,
      cancelButton: cancelEl ?? undefined,
      // UNDIP modal body does not contain course name — set to undefined
      // The engine will use 'UNREADABLE' validation bypass for this case
      detectedCourseName: undefined,
      detectedClassName: undefined,
    };
  }

  async confirm(modal: ConfirmationModal): Promise<boolean> {
    if (!modal.confirmButton) {
      Logger.warn('UndipAdapter: No confirm button found in modal');
      return false;
    }

    Logger.debug(`UndipAdapter: Clicking "Ya" button`);
    modal.confirmButton.click();
    return true;
  }

  // ── Verification ─────────────────────────────────────────────────────────

  async verifySelection(course: DetectedCourse): Promise<boolean> {
    // Wait for either: checkmark appears on course, or course moves to "selected" state
    const verified = await waitForCondition(
      () => {
        // Re-check the element
        if (this.isAlreadySelected(course)) return true;

        // Also check if the sidebar now shows this course as selected
        // (the element reference may have been replaced by DOM update)
        const allSelected = document.querySelectorAll(
          '.fa-check-circle, .icon-check, [data-selected="true"], .terpilih'
        );
        for (const sel of allSelected) {
          const text = normalizeText(getText(sel.closest('li, div, tr') ?? sel));
          if (courseNameSimilarity(text, course.name) > 0.5) return true;
        }

        return false;
      },
      4000,
      250
    );

    Logger.debug(`UndipAdapter: Verification ${verified ? 'SUCCESS' : 'FAILED'} for "${course.name}"`);
    return verified;
  }

  detectFinalSubmitButton(): HTMLElement | null {
    return queryFirst(document,
      UNDIP_SELECTORS.FINAL_SUBMIT,
      'button:not(.btn-back):not(.btn-cancel)',
    );
  }
}
