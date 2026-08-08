// ============================================================
// Adapters: UNDIP IRS Selectors
//
// Source: siap.undip.ac.id/irs/mhs/irs
// DOM verified: 2026-08-08 (actual outerHTML provided by user)
//
// ── Calendar block structure ───────────────────────────────
// Each calendar <td> contains zero or more <div class="makul_XXXX ...">
// blocks. XXXX = numeric course ID.
//
// Three states:
//
// 1. AVAILABLE (can select):
//    <div class="makul_XXXX bs-callout-success callout-bordered btn_unirs"
//         data-id-mk-smt="519944"   ← non-empty IRS session ID
//         style="cursor:pointer">
//      <strong>Course Name</strong>
//      <b class="orange">A 3/3 sks</b>
//    </div>
//    → has .btn_unirs, cursor:pointer, NO .ft-check-circle
//
// 2. SELECTED (already picked):
//    Same as above BUT contains:
//      <i class="ft-check-circle"></i>
//    → has .btn_unirs + .ft-check-circle
//
// 3. NOT AVAILABLE (full / restricted):
//    <div class="makul_XXXX bs-callout-grey ... grey"
//         style="cursor:not-allowed">
//      <strong>Course Name</strong>
//      <b class="orange">A 3/3 sks</b>
//    </div>
//    → has .bs-callout-grey + cursor:not-allowed, NO .btn_unirs
//
// ── Quota note ─────────────────────────────────────────────
// "A 3/3 sks" = class A + 3 SKS (NOT quota count!)
// Real quota is inside data-content (HTML-encoded popover table):
//   Kuota kelas: 45, Kuota terisi: 42
// ============================================================

export const UNDIP_SELECTORS = {
  // ── Course blocks in calendar ─────────────────────────────
  /** Any course block div (any state) */
  COURSE_BLOCK: 'div[class*="makul_"]',

  /** Clickable/selectable course block (available OR already selected) */
  CLICKABLE_BLOCK: 'div.btn_unirs',

  /** Available to select: btn_unirs + no checkmark */
  AVAILABLE_BLOCK: 'div.btn_unirs:not(:has(.ft-check-circle))',

  /** Already selected: has checkmark icon inside */
  SELECTED_INDICATOR: '.ft-check-circle',

  /** Not available: grey + cursor not-allowed */
  NOT_AVAILABLE_BLOCK: 'div.bs-callout-grey',

  // ── Data within each block ────────────────────────────────
  /** Course name element */
  COURSE_NAME_EL: 'strong',

  /**
   * Class + SKS element.
   * Text: "A 3/3 sks" → class = first token before space = "A"
   */
  COURSE_CLASS_EL: 'b.orange',

  /**
   * data-original-title attribute = full course name
   * e.g. " Pembelajaran Mesin (GABUNGAN)"
   */
  COURSE_NAME_ATTR: 'data-original-title',

  /**
   * data-id-mk-smt = IRS session ID for this specific class slot.
   * Non-empty only when course is selectable.
   * Used as domKey to uniquely identify each block.
   */
  COURSE_ID_ATTR: 'data-id-mk-smt',

  /**
   * data-content = HTML-encoded popover table with full details:
   * Kuota kelas, Kuota terisi, Kelas, Kode MK, etc.
   */
  COURSE_POPOVER_ATTR: 'data-content',

  // ── Confirmation Modal (CONFIRMED from screenshots & HTML snippet) ──
  // Supports both Bootstrap modals and SweetAlert2
  MODAL: '.modal.show, .modal[style*="display: block"], .modal[style*="display:block"], .swal2-container.swal2-shown, .swal2-popup',
  MODAL_TITLE: '.modal-title, .modal-header h4, .modal-header h5, .swal2-title',
  MODAL_BODY: '.modal-body, .swal2-content, #swal2-content',
  // Buttons found by text: "Ya" (confirm) / "Tidak" (cancel)
  MODAL_CONFIRM_TEXT: 'ya',
  MODAL_CANCEL_TEXT: 'tidak',

  // ── Final Submission ──────────────────────────────────────
  FINAL_SUBMIT: '.btn-simpan-irs, #btn-simpan-irs, button[data-action="simpan"]',
} as const;

// ── Popover quota parser ────────────────────────────────────────────────────
/**
 * Parse Kuota kelas + Kuota terisi from the HTML-encoded data-content attribute.
 * Returns { capacity, current } or null if unparseable.
 */
export function parseUndipQuotaFromPopover(dataContent: string): {
  capacity: number;
  current: number;
  status: 'AVAILABLE' | 'FULL' | 'NOT_AVAILABLE';
} | null {
  if (!dataContent) return null;

  try {
    // data-content is HTML-encoded — decode it first
    const decoded = dataContent
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // Extract status header: (DIPILIH), (PENUH - FULL QUOTA), (TIDAK TERSEDIA)
    const statusMatch = decoded.match(/\((DIPILIH|PENUH|TIDAK TERSEDIA)[^)]*\)/i);
    const rawStatus = statusMatch?.[1]?.toUpperCase() ?? '';

    // Extract quota numbers
    const kapasitasMatch = decoded.match(/Kuota kelas[\s\S]*?<td[^>]*>(\d+)<\/td>/i);
    const terisiMatch = decoded.match(/Kuota terisi[\s\S]*?<td[^>]*>(\d+)<\/td>/i);

    const capacity = kapasitasMatch ? parseInt(kapasitasMatch[1]) : NaN;
    const current  = terisiMatch ? parseInt(terisiMatch[1]) : NaN;

    if (isNaN(capacity) || isNaN(current)) return null;

    let status: 'AVAILABLE' | 'FULL' | 'NOT_AVAILABLE' = 'AVAILABLE';
    if (rawStatus === 'PENUH') status = 'FULL';
    else if (rawStatus === 'TIDAK TERSEDIA') status = 'NOT_AVAILABLE';
    else if (current >= capacity) status = 'FULL';

    return { capacity, current, status };
  } catch {
    return null;
  }
}

// ── Text patterns ───────────────────────────────────────────────────────────
export const UNDIP_MODAL_TEXTS = {
  TITLE: 'konfirmasi',
  BODY_KEYWORD: 'memilih',
  CONFIRM: 'ya',
  CANCEL: 'tidak',
};
