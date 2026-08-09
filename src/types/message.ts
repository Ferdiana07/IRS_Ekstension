// ============================================================
// Types: Chrome Extension Messages
// ============================================================

import type { WarState } from '../content/state-machine';
import type { AttemptRecord } from './course';
import type { AutomationConfig } from './config';

// --------------- Popup → Background ---------------

export interface StartWarMessage {
  type: 'START_WAR';
}

export interface StopWarMessage {
  type: 'STOP_WAR';
}

export interface GetStatusMessage {
  type: 'GET_STATUS';
}

export interface GetConfigMessage {
  type: 'GET_CONFIG';
}

export interface SaveConfigMessage {
  type: 'SAVE_CONFIG';
  config: AutomationConfig;
}

export interface ScanCoursesMessage {
  type: 'SCAN_COURSES';
}

// --------------- Background → Content ---------------

export interface ContentStartMessage {
  type: 'CONTENT_START';
  config: AutomationConfig;
}

export interface ContentStopMessage {
  type: 'CONTENT_STOP';
}

// --------------- Content → Background ---------------

export interface StateUpdateMessage {
  type: 'STATE_UPDATE';
  state: WarState;
  currentCourse?: string;
  currentClass?: string;
}

export interface LogMessage {
  type: 'LOG';
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'DEBUG';
  text: string;
  timestamp: number;
}

export interface AttemptCompleteMessage {
  type: 'ATTEMPT_COMPLETE';
  record: AttemptRecord;
}

export interface WarCompleteMessage {
  type: 'WAR_COMPLETE';
  records: AttemptRecord[];
}

// --------------- Status Response ---------------

export interface WarStatus {
  state: WarState;
  totalTargets: number;
  targetNames?: string[];
  successCount: number;
  failedCount: number;
  skippedCount: number;
  currentCourse?: string;
  currentClass?: string;
  logs: LogEntry[];
  records: AttemptRecord[];
}

export interface LogEntry {
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'DEBUG';
  text: string;
  timestamp: number;
}

// --------------- Union Types ---------------

export type PopupToBackgroundMessage =
  | StartWarMessage
  | StopWarMessage
  | GetStatusMessage
  | GetConfigMessage
  | SaveConfigMessage
  | ScanCoursesMessage;

export type BackgroundToContentMessage =
  | ContentStartMessage
  | ContentStopMessage
  | ScanCoursesMessage;

export type ContentToBackgroundMessage =
  | StateUpdateMessage
  | LogMessage
  | AttemptCompleteMessage
  | WarCompleteMessage;
