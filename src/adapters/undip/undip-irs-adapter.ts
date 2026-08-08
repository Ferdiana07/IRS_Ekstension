// ============================================================
// Adapters: UNDIP IRS Adapter
//
// ⚠️  STUB — NOT READY FOR USE
//
// This adapter will implement the real UNDIP IRS integration.
// It CANNOT be completed until the actual DOM structure of the
// UNDIP IRS page is provided (HTML + screenshot + URL).
//
// To activate this adapter:
// 1. Inspect the UNDIP IRS page (krs.undip.ac.id or similar)
// 2. Fill in src/adapters/undip/selectors.ts with real selectors
// 3. Implement each method below based on the actual DOM
// 4. Switch adapter in src/content/irs.ts
// ============================================================

import type { IRSAdapter } from '../adapter';
import type { DetectedCourse } from '../../types/course';
import type { Availability } from '../../types/availability';
import type { ConfirmationModal } from '../../types/confirmation';
import { UNDIP_SELECTORS } from './selectors';
import Logger from '../../utils/logger';

export class UndipIRSAdapter implements IRSAdapter {
  readonly name = 'UndipIRSAdapter';

  private assertNotStub(): never {
    const message =
      'UndipIRSAdapter is a stub. ' +
      'Provide UNDIP IRS DOM HTML/screenshot to implement real selectors. ' +
      'Use MockIRSAdapter for development.';
    Logger.error(message);
    throw new Error(message);
  }

  detectCourses(): DetectedCourse[] {
    // TODO: implement after DOM inspection
    // Example structure (DO NOT USE until verified against real DOM):
    // const rows = document.querySelectorAll<HTMLElement>(UNDIP_SELECTORS.COURSE_ROW);
    Logger.warn('UndipIRSAdapter.detectCourses() — STUB, not implemented');
    this.assertNotStub();
  }

  detectAvailability(_course: DetectedCourse): Availability {
    Logger.warn('UndipIRSAdapter.detectAvailability() — STUB, not implemented');
    this.assertNotStub();
  }

  isAlreadySelected(_course: DetectedCourse): boolean {
    Logger.warn('UndipIRSAdapter.isAlreadySelected() — STUB, not implemented');
    this.assertNotStub();
  }

  async selectCourse(_course: DetectedCourse): Promise<boolean> {
    Logger.warn('UndipIRSAdapter.selectCourse() — STUB, not implemented');
    this.assertNotStub();
  }

  detectConfirmationModal(): ConfirmationModal | null {
    Logger.warn('UndipIRSAdapter.detectConfirmationModal() — STUB, not implemented');
    this.assertNotStub();
  }

  async confirm(_modal: ConfirmationModal): Promise<boolean> {
    Logger.warn('UndipIRSAdapter.confirm() — STUB, not implemented');
    this.assertNotStub();
  }

  async verifySelection(_course: DetectedCourse): Promise<boolean> {
    Logger.warn('UndipIRSAdapter.verifySelection() — STUB, not implemented');
    this.assertNotStub();
  }

  detectFinalSubmitButton(): HTMLElement | null {
    // Stub: return null until real DOM is known
    // return document.querySelector<HTMLElement>(UNDIP_SELECTORS.FINAL_SUBMIT);
    void UNDIP_SELECTORS; // suppress unused import
    return null;
  }
}
