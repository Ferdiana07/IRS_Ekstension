// ============================================================
// Content: Verification Engine
// ============================================================

import type { IRSAdapter } from '../adapters/adapter';
import type { DetectedCourse } from '../types/course';
import { isStopped } from './safety';
import Logger from '../utils/logger';

export interface VerificationResult {
  verified: boolean;
  reason?: string;
}

/**
 * After confirmation, verify that the course is now shown as selected.
 * Uses adapter.verifySelection() which itself uses MutationObserver internally.
 */
export async function verifySelection(
  adapter: IRSAdapter,
  course: DetectedCourse
): Promise<VerificationResult> {
  if (isStopped()) {
    return { verified: false, reason: 'STOPPED' };
  }

  Logger.info(`Verification: Checking "${course.name}" Kelas ${course.className}...`);

  const verified = await adapter.verifySelection(course);

  if (verified) {
    Logger.success(`Verification: "${course.name}" Kelas ${course.className} VERIFIED ✓`);
    return { verified: true };
  } else {
    Logger.error(`Verification: "${course.name}" Kelas ${course.className} FAILED`);
    return { verified: false, reason: 'NOT_SELECTED_AFTER_CONFIRM' };
  }
}
