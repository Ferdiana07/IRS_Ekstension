// ============================================================
// Content: Availability Detection
// ============================================================

import type { Availability } from '../types/availability';
import { AVAILABILITY_KEYWORDS } from '../types/availability';
import { normalizeText, parseQuota } from '../utils/normalize';
import Logger from '../utils/logger';

/**
 * Parse availability from raw text content.
 * This is a fallback used by adapters when a status element has text.
 */
export function parseAvailabilityText(rawText: string): Availability {
  const normalized = normalizeText(rawText);

  // Check SELECTED state first
  if (containsAnyKeyword(normalized, AVAILABILITY_KEYWORDS.SELECTED)) {
    return { status: 'SELECTED', available: false, rawText };
  }

  // Check explicit FULL keywords
  if (containsAnyKeyword(normalized, AVAILABILITY_KEYWORDS.FULL)) {
    const quota = parseQuota(rawText);
    return {
      status: 'FULL',
      available: false,
      current: quota?.current,
      capacity: quota?.capacity,
      rawText,
    };
  }

  // Check explicit AVAILABLE keywords
  if (containsAnyKeyword(normalized, AVAILABILITY_KEYWORDS.AVAILABLE)) {
    const quota = parseQuota(rawText);
    return {
      status: 'AVAILABLE',
      available: true,
      current: quota?.current,
      capacity: quota?.capacity,
      rawText,
    };
  }

  // Try to derive from quota format x/y
  const quota = parseQuota(rawText);
  if (quota !== null) {
    if (quota.current >= quota.capacity) {
      return {
        status: 'FULL',
        available: false,
        current: quota.current,
        capacity: quota.capacity,
        rawText,
      };
    } else {
      return {
        status: 'AVAILABLE',
        available: true,
        current: quota.current,
        capacity: quota.capacity,
        rawText,
      };
    }
  }

  // Cannot determine
  Logger.debug(`Availability: UNKNOWN for text: "${rawText}"`);
  return { status: 'UNKNOWN', available: false, rawText };
}

function containsAnyKeyword(text: string, keywords: readonly string[]): boolean {
  return keywords.some((kw) => text.includes(normalizeText(kw)));
}

/**
 * Human-readable summary of availability.
 */
export function describeAvailability(av: Availability): string {
  if (av.current !== undefined && av.capacity !== undefined) {
    return `${av.status} (${av.current}/${av.capacity})`;
  }
  return av.status;
}
