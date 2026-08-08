// ============================================================
// Content: Course Scanner
// ============================================================

import type { IRSAdapter } from '../adapters/adapter';
import type { CourseTarget, DetectedCourse } from '../types/course';
import { courseNameSimilarity, classMatches } from '../utils/normalize';
import Logger from '../utils/logger';

const NAME_SIMILARITY_THRESHOLD = 0.6;

/**
 * Scan the page for all detected courses, then find the best matching
 * DetectedCourse for a given CourseTarget + class label.
 *
 * Returns null if no match is found.
 */
export function findCourseOnPage(
  adapter: IRSAdapter,
  target: CourseTarget,
  targetClass: string
): DetectedCourse | null {
  const allCourses = adapter.detectCourses();

  Logger.debug(`Scanner: Detected ${allCourses.length} course rows on page`);

  let bestMatch: DetectedCourse | null = null;
  let bestScore = 0;

  for (const detected of allCourses) {
    // 1. Check class match first (faster gate)
    if (!classMatches(detected.className, targetClass)) continue;

    // 2. Check course name similarity
    const score = courseNameSimilarity(detected.name, target.name);
    if (score >= NAME_SIMILARITY_THRESHOLD && score > bestScore) {
      bestScore = score;
      bestMatch = detected;
    }

    // 3. If code is provided, also check code match
    if (target.code && detected.code) {
      if (detected.code.toLowerCase() === target.code.toLowerCase()) {
        bestScore = 1;
        bestMatch = detected;
        break;
      }
    }
  }

  if (bestMatch) {
    Logger.debug(
      `Scanner: Matched "${bestMatch.name}" Kelas ${bestMatch.className} ` +
      `(score: ${bestScore.toFixed(2)}) for target "${target.name}"`
    );
  } else {
    Logger.debug(`Scanner: No match found for "${target.name}" Kelas ${targetClass}`);
  }

  return bestMatch;
}

/**
 * Sort course targets by priority (lower number = higher priority).
 */
export function sortByPriority(targets: CourseTarget[]): CourseTarget[] {
  return [...targets].sort((a, b) => a.priority - b.priority);
}

/**
 * Return only enabled targets that haven't been successfully completed.
 */
export function filterPendingTargets(
  targets: CourseTarget[],
  completedIds: Set<string>
): CourseTarget[] {
  return targets.filter((t) => t.enabled && !completedIds.has(t.id));
}
