// ============================================================
// Content Script: IRS WAR ASSISTANT — Main Entry Point
// ============================================================

import type { AutomationConfig } from '../types/config';
import type { CourseTarget, AttemptRecord, AttemptResult } from '../types/course';
import type { BackgroundToContentMessage } from '../types/message';

import { MockIRSAdapter } from '../adapters/mock/mock-irs-adapter';
import { UndipIRSAdapter } from '../adapters/undip/undip-irs-adapter';
import type { IRSAdapter } from '../adapters/adapter';

import { stateMachine, WarState } from './state-machine';
import { attemptSelect } from './selector';
import { handleConfirmation } from './confirmation';
import { verifySelection } from './verification';
import { disconnectAllObservers } from './observer';
import {
  initStop,
  triggerStop,
  isStopped,
  acquireActionLock,
  releaseActionLock,
  buildCourseKey,
  lockCourse,
  unlockCourse,
  clearAllLocks,
} from './safety';
import { sortByPriority, filterPendingTargets } from './scanner';
import { sleep } from '../utils/sleep';
import Logger from '../utils/logger';

// ── Adapter Selection ──────────────────────────────────────────────────────
// Switch to UndipIRSAdapter once UNDIP DOM is inspected and implemented.
// import { UndipIRSAdapter } from '../adapters/undip/undip-irs-adapter';

function createAdapter(): IRSAdapter {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  // Use UndipIRSAdapter on the real UNDIP IRS page
  if (hostname.includes('siap.undip.ac.id') || hostname.includes('krs.undip.ac.id')) {
    Logger.info(`Using UndipIRSAdapter (${hostname}${pathname})`);
    return new UndipIRSAdapter();
  }

  // Use MockAdapter on localhost/file:// (mock-irs testing)
  if (hostname === '' || hostname === 'localhost' || hostname === '127.0.0.1') {
    Logger.info('Using MockIRSAdapter (localhost/file)');
    return new MockIRSAdapter();
  }

  Logger.warn(`Unknown host "${hostname}" — falling back to MockIRSAdapter`);
  return new MockIRSAdapter();
}

// ── War Engine ─────────────────────────────────────────────────────────────

class WarEngine {
  private adapter: IRSAdapter;
  private config: AutomationConfig | null = null;
  private completedIds: Set<string> = new Set();
  private failedCounts: Map<string, number> = new Map();
  private records: AttemptRecord[] = [];

  constructor(adapter: IRSAdapter) {
    this.adapter = adapter;
  }

  // ── Single course attempt ───────────────────────────────────────────────

  private async processCourse(target: CourseTarget): Promise<AttemptResult> {
    const settings = this.config!.settings;
    const courseKey = buildCourseKey(target.name, target.preferredClasses[0] ?? '?');

    // Acquire course lock
    if (!lockCourse(courseKey)) {
      Logger.debug(`Engine: Course already locked: ${target.name}`);
      return 'UNKNOWN';
    }

    // Acquire global action lock
    if (!acquireActionLock()) {
      unlockCourse(courseKey);
      Logger.debug(`Engine: Action in progress, skipping ${target.name}`);
      return 'UNKNOWN';
    }

    let result: AttemptResult = 'FAILED';

    try {
      stateMachine.transition(WarState.SCANNING);
      Logger.info(`Engine: Processing "${target.name}"`);

      // ── STEP 1: Select ────────────────────────────────────────────────
      stateMachine.transition(WarState.SELECTING);
      const selection = await attemptSelect(this.adapter, target);

      if (selection.reason === 'STOPPED') return 'STOPPED';

      if (selection.reason === 'ALREADY_SELECTED') {
        Logger.success(`Engine: "${target.name}" already selected — SKIP`);
        return 'ALREADY_SELECTED';
      }

      if (!selection.success || !selection.detectedCourse) {
        if (selection.reason === 'NO_AVAILABLE_CLASS') return 'UNAVAILABLE';
        return 'FAILED';
      }

      const detectedCourse = selection.detectedCourse;
      const selectedClass = selection.selectedClass!;

      Logger.info(`Engine: Selected "${target.name}" Kelas ${selectedClass}`);

      // ── STEP 2: Wait for & handle confirmation modal ──────────────────
      stateMachine.transition(WarState.WAITING_FOR_CONFIRMATION);

      if (settings.automationMode === 'safe') {
        // MODE 3 — Safe: do NOT auto-confirm
        Logger.info('Engine: Mode=SAFE — confirmation requires manual user action');
        notifyBackground({
          type: 'STATE_UPDATE',
          state: WarState.WAITING_FOR_CONFIRMATION,
          currentCourse: target.name,
          currentClass: selectedClass,
        });
        return 'FAILED'; // Will not auto-confirm in safe mode
      }

      stateMachine.transition(WarState.CONFIRMING);
      const confirmation = await handleConfirmation(this.adapter, detectedCourse, settings);

      if (confirmation.outcome === 'STOPPED') return 'STOPPED';

      if (confirmation.outcome !== 'CONFIRMED') {
        Logger.error(`Engine: Confirmation failed — ${confirmation.outcome}`);
        return confirmation.outcome === 'MISMATCH' ? 'FAILED' : 'MODAL_NOT_FOUND';
      }

      // ── STEP 3: Verify ────────────────────────────────────────────────
      stateMachine.transition(WarState.VERIFYING);
      const verification = await verifySelection(this.adapter, detectedCourse);

      if (!verification.verified) {
        return 'VERIFICATION_FAILED';
      }

      stateMachine.transition(WarState.SUCCESS);
      Logger.success(`Engine: "${target.name}" Kelas ${selectedClass} — SUCCESS ✓`);
      result = 'SUCCESS';

    } finally {
      releaseActionLock();
      unlockCourse(courseKey);
    }

    return result;
  }

  // ── Main War Loop ───────────────────────────────────────────────────────

  async run(config: AutomationConfig): Promise<void> {
    this.config = config;
    this.completedIds.clear();
    this.failedCounts.clear();
    this.records = [];

    const { settings } = config;
    const sorted = sortByPriority(config.courses);

    stateMachine.transition(WarState.RUNNING);
    Logger.info(`Engine: WAR STARTED — ${sorted.filter((c) => c.enabled).length} targets`);

    initStop();

    let cycleCount = 0;
    const MAX_IDLE_CYCLES = 100; // safety against infinite loop
    let idleCycles = 0;

    while (!isStopped()) {
      cycleCount++;

      const pending = filterPendingTargets(sorted, this.completedIds);
      if (pending.length === 0) {
        Logger.success('Engine: All targets completed!');
        stateMachine.transition(WarState.COMPLETED);
        break;
      }

      let anyActionTaken = false;

      for (const target of pending) {
        if (isStopped()) break;

        const retries = this.failedCounts.get(target.id) ?? 0;
        if (retries >= settings.maxRetries) {
          Logger.warn(`Engine: "${target.name}" exceeded maxRetries (${settings.maxRetries}) — skipping`);
          this.completedIds.add(target.id); // Mark as done (failed)
          this.records.push({
            courseTarget: target,
            result: 'FAILED',
            timestamp: Date.now(),
            retryCount: retries,
          });
          continue;
        }

        const result = await this.processCourse(target);
        
        // Only consider an action taken if it wasn't just skipping an unavailable course
        if (result !== 'UNAVAILABLE' && result !== 'UNKNOWN') {
          anyActionTaken = true;
        }

        if (result === 'STOPPED') {
          stateMachine.transition(WarState.STOPPED);
          Logger.warn('Engine: Stopped by user');
          this.sendWarComplete();
          return;
        }

        if (result === 'SUCCESS' || result === 'ALREADY_SELECTED' || result === 'SKIPPED') {
          this.completedIds.add(target.id);
          this.records.push({
            courseTarget: target,
            selectedClass: undefined,
            result,
            timestamp: Date.now(),
            retryCount: retries,
          });
          stateMachine.transition(WarState.NEXT_TARGET);
        } else if (result === 'UNAVAILABLE' || result === 'UNKNOWN') {
          // Will retry on next cycle
          Logger.debug(`Engine: "${target.name}" not yet available — will retry`);
        } else {
          // Failed — increment retry count
          this.failedCounts.set(target.id, retries + 1);
          Logger.warn(`Engine: "${target.name}" failed (attempt ${retries + 1}/${settings.maxRetries})`);
        }

        // Notify background of attempt
        notifyBackground({
          type: 'ATTEMPT_COMPLETE',
          record: {
            courseTarget: target,
            result,
            timestamp: Date.now(),
            retryCount: retries,
          },
        });

        // Small yield between courses
        await sleep(100);
        if (isStopped()) break;
      }

      if (!anyActionTaken) {
        idleCycles++;
        if (idleCycles > MAX_IDLE_CYCLES) {
          Logger.warn('Engine: Too many idle cycles — stopping to prevent infinite loop');
          break;
        }

        // Auto-Refresh Logic
        if (settings.autoRefresh) {
          Logger.info(`Engine: Auto-Refresh enabled. Reloading page in ${settings.autoRefreshInterval / 1000}s...`);
          await sleep(settings.autoRefreshInterval);
          if (isStopped()) break;
          Logger.debug('Engine: Reloading window now...');
          window.location.reload();
          return; // Stop current engine loop since page is reloading
        }
      } else {
        idleCycles = 0;
      }

      // Yield between full scan cycles (if not auto-refreshing, or if action WAS taken)
      if (!isStopped() && (!settings.autoRefresh || anyActionTaken)) {
        await sleep(settings.scanInterval);
      }
    }

    stateMachine.transition(WarState.COMPLETED);
    this.sendWarComplete();
    Logger.info('Engine: WAR ENDED');
  }

  stop(): void {
    triggerStop();
    disconnectAllObservers();
    clearAllLocks();
    stateMachine.transition(WarState.STOPPED);
    Logger.warn('Engine: Stopped');
    this.sendWarComplete();
  }

  private sendWarComplete(): void {
    notifyBackground({ type: 'WAR_COMPLETE', records: this.records });
  }
}

// ── Message handler from background ───────────────────────────────────────

let engine: WarEngine | null = null;

chrome.runtime.onMessage.addListener((message: BackgroundToContentMessage, _sender, sendResponse) => {
  switch (message.type) {
    case 'CONTENT_START':
      Logger.info('Starting War Engine...');
      if (engine) engine.stop();
      const adapter = createAdapter();
      engine = new WarEngine(adapter);

      Logger.onLog((entry) => {
        notifyBackground({
          type: 'LOG',
          level: entry.level,
          text: entry.text,
          timestamp: entry.timestamp,
        });
      });

      // Forward all state machine transitions to the background script
      stateMachine.onChange((state) => {
        notifyBackground({
          type: 'STATE_UPDATE',
          state,
        });
      });

      Logger.setDebugMode(message.config.settings.debugMode);
      engine.run(message.config).catch((err: unknown) => {
        Logger.error(`Engine: Unhandled error — ${err}`);
      });
      sendResponse({ ok: true });
      break;

    case 'CONTENT_STOP':
    case 'EMERGENCY_STOP':
      Logger.info('Stopping War Engine...');
      engine?.stop();
      sendResponse({ ok: true });
      break;

    case 'SCAN_COURSES': {
      try {
        const adapter = createAdapter();
        const detected = adapter.detectCourses();
        // Group by course name
        const coursesMap = new Map<string, Set<string>>();
        for (const c of detected) {
          if (!coursesMap.has(c.name)) {
            coursesMap.set(c.name, new Set());
          }
          if (c.className) {
            coursesMap.get(c.name)!.add(c.className);
          }
        }
        
        // Convert to array
        const result = Array.from(coursesMap.entries()).map(([name, classesSet]) => ({
          name,
          classes: Array.from(classesSet).sort()
        })).sort((a, b) => a.name.localeCompare(b.name));

        sendResponse({ ok: true, courses: result });
      } catch (err) {
        sendResponse({ ok: false, error: String(err) });
      }
      break;
    }
  }

  return true; // keep channel open for async
});

// ── Background notification helper ────────────────────────────────────────

function notifyBackground(message: unknown): void {
  try {
    chrome.runtime.sendMessage(message).catch(() => {
      // Background may not be listening — ignore
    });
  } catch {
    // Extension context invalidated — ignore
  }
}

// ── Emergency stop via keyboard command ───────────────────────────────────

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'EMERGENCY_STOP') {
    engine?.stop();
  }
  return false;
});

Logger.info('IRS WAR ASSISTANT content script loaded');

// ── Auto-Resume on Page Load ──────────────────────────────────────────────
setTimeout(() => {
  try {
    chrome.runtime.sendMessage({ type: 'CHECK_AUTO_RESUME' }).catch(() => {
      // background might not be listening, which is fine
    });
  } catch (err) {
    // context might be invalidated
  }
}, 500);
