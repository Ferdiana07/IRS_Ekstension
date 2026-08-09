// ============================================================
// Types: Config
// ============================================================

import type { CourseTarget } from './course';

/**
 * MODE 1 — Assisted:  select auto, confirm modal auto, final submit MANUAL
 * MODE 2 — Full:      select auto, confirm modal auto, final submit AUTO
 * MODE 3 — Safe:      select auto, confirm modal MANUAL, final submit MANUAL
 */
export type AutomationMode = 'assisted' | 'full' | 'safe';

export interface WarSettings {
  /** Polling fallback interval in ms (default: 500) */
  scanInterval: number;
  /** How long to wait for confirmation modal in ms (default: 3000) */
  confirmationTimeout: number;
  /** Max retries per course before marking FAILED (default: 3) */
  maxRetries: number;
  /** Play a sound on success/failure */
  enableSound: boolean;
  /** Show Chrome notifications */
  enableNotifications: boolean;
  /** Enable verbose debug logging */
  debugMode: boolean;
  /** Enable auto-refresh on the courses page */
  autoRefresh: boolean;
  /** Auto-refresh interval in ms (default: 5000) */
  autoRefreshInterval: number;
  /** Automation mode (default: 'assisted') */
  automationMode: AutomationMode;
  /** Allow final IRS submission (only relevant in 'full' mode) */
  enableFinalSubmission: boolean;
  /** Countdown seconds before final submission (default: 10) */
  finalSubmissionCountdown: number;
}

export interface AutomationConfig {
  courses: CourseTarget[];
  settings: WarSettings;
}

export const DEFAULT_SETTINGS: WarSettings = {
  scanInterval: 500,
  confirmationTimeout: 3000,
  maxRetries: 3,
  enableSound: true,
  enableNotifications: true,
  debugMode: false,
  autoRefresh: false,
  autoRefreshInterval: 5000,
  automationMode: 'assisted',
  enableFinalSubmission: false,
  finalSubmissionCountdown: 10,
};
