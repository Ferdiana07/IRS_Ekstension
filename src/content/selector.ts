// ============================================================
// Content: Selection Engine
// ============================================================

import type { IRSAdapter } from '../adapters/adapter';
import type { DetectedCourse } from '../types/course';
import type { CourseTarget } from '../types/course';
import { findCourseOnPage } from './scanner';
import { describeAvailability } from './availability';
import { validateIdentity, isStopped } from './safety';
import Logger from '../utils/logger';

export interface SelectionResult {
  success: boolean;
  detectedCourse?: DetectedCourse;
  selectedClass?: string;
  reason?: string;
}

/**
 * Attempt to find and click the select button for a course target.
 *
 * Tries each class in preferredClasses order.
 * Returns success=false if no available class found, already selected,
 * or if course cannot be identified.
 */
export async function attemptSelect(
  adapter: IRSAdapter,
  target: CourseTarget
): Promise<SelectionResult> {
  if (isStopped()) {
    return { success: false, reason: 'STOPPED' };
  }

  Logger.info(`Selector: Searching "${target.name}"`);

  for (const cls of target.preferredClasses) {
    if (isStopped()) return { success: false, reason: 'STOPPED' };

    Logger.debug(`Selector: Trying "${target.name}" Kelas ${cls}`);

    const detected = findCourseOnPage(adapter, target, cls);

    if (!detected) {
      Logger.debug(`Selector: "${target.name}" Kelas ${cls} not found on page`);
      continue;
    }

    // Validate identity before any action
    if (!validateIdentity({ courseName: detected.name, className: detected.className })) {
      Logger.warn(`Selector: Identity validation failed for ${detected.name} - ${detected.className}`);
      continue;
    }

    // Check if already selected
    if (adapter.isAlreadySelected(detected)) {
      Logger.info(`Selector: "${detected.name}" Kelas ${cls} already selected — SKIP`);
      return { success: true, detectedCourse: detected, selectedClass: cls, reason: 'ALREADY_SELECTED' };
    }

    // Check availability
    const availability = adapter.detectAvailability(detected);
    Logger.info(`Selector: "${detected.name}" Kelas ${cls} = ${describeAvailability(availability)}`);

    if (!availability.available) {
      Logger.debug(`Selector: Kelas ${cls} unavailable, trying next`);
      continue;
    }

    // Found an available class — select it
    Logger.info(`Selector: Selecting "${detected.name}" Kelas ${cls}`);
    const clicked = await adapter.selectCourse(detected);

    if (!clicked) {
      Logger.warn(`Selector: Click failed for "${detected.name}" Kelas ${cls}`);
      return { success: false, detectedCourse: detected, selectedClass: cls, reason: 'CLICK_FAILED' };
    }

    return { success: true, detectedCourse: detected, selectedClass: cls };
  }

  Logger.warn(`Selector: No available class found for "${target.name}"`);
  return { success: false, reason: 'NO_AVAILABLE_CLASS' };
}
