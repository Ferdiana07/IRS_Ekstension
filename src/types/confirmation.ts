// ============================================================
// Types: Confirmation Modal
// ============================================================

/** Represents a detected confirmation modal on the IRS page */
export interface ConfirmationModal {
  /** The root DOM element of the modal */
  element: HTMLElement;
  /** Modal title text, if detected */
  title?: string;
  /** Full modal message/body text */
  message?: string;
  /** The confirm/OK button inside the modal */
  confirmButton?: HTMLElement;
  /** The cancel/dismiss button inside the modal */
  cancelButton?: HTMLElement;
  /** Detected course name from modal text */
  detectedCourseName?: string;
  /** Detected class label from modal text */
  detectedClassName?: string;
}

/** Result of modal validation */
export type ModalValidationResult =
  | 'VALID'        // Modal matches target course + class
  | 'MISMATCH'     // Modal is for a different course/class
  | 'UNREADABLE'   // Cannot extract course/class from modal
  | 'NO_BUTTON'    // Modal found but confirm button missing
  | 'NOT_FOUND';   // No modal detected
