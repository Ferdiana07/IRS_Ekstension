// ============================================================
// Storage: Chrome Storage API wrapper
// NEVER store passwords, tokens, credentials, or session cookies.
// ============================================================

import type { AutomationConfig, WarSettings } from '../types/config';
import type { CourseTarget } from '../types/course';
import type { AttemptRecord } from '../types/course';
import type { WarStatus } from '../types/message';
import { DEFAULT_SETTINGS } from '../types/config';

const KEYS = {
  COURSES: 'irs_courses',
  SETTINGS: 'irs_settings',
  STATUS: 'irs_status',
  RECORDS: 'irs_records',
} as const;

// --------------- Courses ---------------

export async function saveCourses(courses: CourseTarget[]): Promise<void> {
  await chrome.storage.local.set({ [KEYS.COURSES]: courses });
}

export async function loadCourses(): Promise<CourseTarget[]> {
  const result = await chrome.storage.local.get(KEYS.COURSES);
  return (result[KEYS.COURSES] as CourseTarget[]) ?? [];
}

// --------------- Settings ---------------

export async function saveSettings(settings: WarSettings): Promise<void> {
  await chrome.storage.local.set({ [KEYS.SETTINGS]: settings });
}

export async function loadSettings(): Promise<WarSettings> {
  const result = await chrome.storage.local.get(KEYS.SETTINGS);
  const stored = result[KEYS.SETTINGS] as Partial<WarSettings> | undefined;
  return { ...DEFAULT_SETTINGS, ...stored };
}

// --------------- Full Config ---------------

export async function saveConfig(config: AutomationConfig): Promise<void> {
  await Promise.all([saveCourses(config.courses), saveSettings(config.settings)]);
}

export async function loadConfig(): Promise<AutomationConfig> {
  const [courses, settings] = await Promise.all([loadCourses(), loadSettings()]);
  return { courses, settings };
}

// --------------- War Status ---------------

export async function saveStatus(status: Partial<WarStatus>): Promise<void> {
  const current = await loadStatus();
  await chrome.storage.local.set({ [KEYS.STATUS]: { ...current, ...status } });
}

export async function loadStatus(): Promise<WarStatus | null> {
  const result = await chrome.storage.local.get(KEYS.STATUS);
  return (result[KEYS.STATUS] as WarStatus) ?? null;
}

export async function clearStatus(): Promise<void> {
  await chrome.storage.local.remove(KEYS.STATUS);
}

// --------------- Attempt Records ---------------

export async function appendRecord(record: AttemptRecord): Promise<void> {
  const existing = await loadRecords();
  existing.push(record);
  await chrome.storage.local.set({ [KEYS.RECORDS]: existing });
}

export async function loadRecords(): Promise<AttemptRecord[]> {
  const result = await chrome.storage.local.get(KEYS.RECORDS);
  return (result[KEYS.RECORDS] as AttemptRecord[]) ?? [];
}

export async function clearRecords(): Promise<void> {
  await chrome.storage.local.remove(KEYS.RECORDS);
}

// --------------- Reset ---------------

export async function clearAll(): Promise<void> {
  await chrome.storage.local.clear();
}

// --------------- Storage change listener ---------------

export function onStorageChange(
  key: string,
  callback: (newValue: unknown) => void
): () => void {
  const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
    if (key in changes) {
      callback(changes[key].newValue);
    }
  };
  chrome.storage.local.onChanged.addListener(listener);
  return () => chrome.storage.local.onChanged.removeListener(listener);
}
