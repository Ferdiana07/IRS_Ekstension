// ============================================================
// Adapters: UNDIP IRS Selectors
//
// Derived from: siap.undip.ac.id/irs/mhs/irs
// DOM inspection: screenshots + HTML provided by user (2026-08-08)
//
// ── CONFIRMED selectors (verified from screenshots/HTML) ──────────────────
// - Modal: Bootstrap modal .modal.show with title "Konfirmasi IRS"
// - Confirm button: button with text "Ya"
// - Cancel button:  button with text "Tidak"
// - Left sidebar:   .col-matakuliah-left or similar
// - Course cell:    calendar block with course name + class info
//
// ── NEEDS VERIFICATION ────────────────────────────────────────────────────
// - Exact CSS class of the course calendar cell element
// - Exact CSS class of the class/quota display inside each cell
// - The select/click mechanism (click on cell? or button inside cell?)
// ============================================================

export const UNDIP_SELECTORS = {
  // ── Course table / calendar view ──────────────────────────────────────────
  // The IRS page shows courses in a weekly calendar grid.
  // Each course block is a clickable td or div inside the grid.
  // TODO: Verify exact selector by right-clicking a course cell → Inspect
  COURSE_ROW: 'td.fc-event, div.fc-event, [data-mkkrs]',

  // ── Left sidebar course list ───────────────────────────────────────────────
  // Left panel with "Matakuliah Ditampilkan" list
  SIDEBAR_COURSE_ITEM: '.col-matakuliah-left .item-mkkrs, .daftar-mkkrs .item',

  /** Element containing the course name within a sidebar item */
  COURSE_NAME_SIDEBAR: '.nama-mk, .course-name, strong',

  /** Element containing the class label (A, B, C, ...) */
  COURSE_CLASS_SIDEBAR: '.kelas-mk, .kelas',

  /** Quota text element, e.g. "3/3 sks" or "29/30" */
  COURSE_QUOTA: '.kuota, .sks-info',

  /** Element showing availability status */
  COURSE_STATUS: '.status-mk',

  // ── Selection ─────────────────────────────────────────────────────────────
  // On UNDIP IRS, clicking the course cell itself triggers selection.
  // The calendar cells are clickable.
  // TODO: Verify — may be a button inside the cell
  SELECT_BUTTON: 'td.fc-event, div.fc-event, .btn-pilih-mk',

  /** Indicator that a course has already been selected (green checkmark in sidebar) */
  // From screenshot: courses with checkmark icon are already selected
  SELECTED_INDICATOR: '.icon-check, .fa-check-circle, .terpilih, [data-selected="true"]',

  // ── Confirmation Modal (CONFIRMED from screenshot) ─────────────────────────
  /**
   * CONFIRMED: The modal is a Bootstrap modal.
   * Title: "Konfirmasi IRS"
   * Body:  "Apakah anda yakin ingin memilih mata kuliah ini?"
   * Confirm: button text "Ya" (blue)
   * Cancel:  button text "Tidak" (red)
   */
  MODAL: '.modal.show, .modal[style*="display: block"], .modal[style*="display:block"]',
  MODAL_TITLE: '.modal-title, .modal-header h4, .modal-header h5',
  MODAL_BODY: '.modal-body',
  // Confirm = "Ya", Cancel = "Tidak"
  MODAL_CONFIRM: '.modal.show .btn-primary, .modal.show .btn-success, .modal.show button.ya',
  MODAL_CANCEL: '.modal.show .btn-danger, .modal.show .btn-secondary, .modal.show button.tidak',

  // ── Final Submission ──────────────────────────────────────────────────────
  /** Final "Simpan IRS" / "Submit IRS" button - needs verification */
  FINAL_SUBMIT: '.btn-simpan-irs, button[data-action="simpan-irs"], #btn-simpan-irs',
} as const;

// ── Known text patterns (CONFIRMED from screenshots) ───────────────────────
export const UNDIP_CONFIRMATION_TEXTS = {
  // Modal title text (confirmed)
  MODAL_TITLE: 'Konfirmasi IRS',
  // Modal body text (confirmed)
  MODAL_BODY_KEYWORD: 'ingin memilih mata kuliah',
  // Confirm button text (confirmed)
  CONFIRM_BUTTON_TEXT: 'ya',
  // Cancel button text (confirmed)
  CANCEL_BUTTON_TEXT: 'tidak',
  // Selected state indicators
  SELECTED_TEXT: ['terpilih', 'selected', 'dipilih', 'sudah dipilih'],
  AVAILABLE_TEXT: ['tersedia', 'available'],
  FULL_TEXT: ['penuh', 'full', 'closed'],
};

// ── UNDIP IRS page URL patterns ────────────────────────────────────────────
export const UNDIP_IRS_URLS = [
  'siap.undip.ac.id/irs/mhs/irs',
  'siap.undip.ac.id/irs',
];

