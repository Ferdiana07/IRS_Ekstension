// ============================================================
// Popup: popup.ts
// Real-time status, log display, start/stop controls
// ============================================================

import type { WarStatus, LogEntry } from '../types/message';
import { WarState, STATE_LABEL, STATE_EMOJI } from '../content/state-machine';

// ── DOM refs ───────────────────────────────────────────────────────────────
const statusDot    = document.getElementById('status-dot')!;
const statusLabel  = document.getElementById('status-label')!;
const statusTime   = document.getElementById('status-time')!;
const countTarget  = document.getElementById('count-target')!;
const countSuccess = document.getElementById('count-success')!;
const countFailed  = document.getElementById('count-failed')!;
const countSkipped = document.getElementById('count-skipped')!;
const currentCourse = document.getElementById('current-course')!;
const currentClass  = document.getElementById('current-class')!;
const logPanel      = document.getElementById('log-panel')!;
const btnStart      = document.getElementById('btn-start') as HTMLButtonElement;
const btnStop       = document.getElementById('btn-stop')  as HTMLButtonElement;
const btnOptions    = document.getElementById('btn-options') as HTMLButtonElement;
const btnClearLog   = document.getElementById('btn-clear-log') as HTMLButtonElement;
const warComplete   = document.getElementById('war-complete')!;
const warCompleteStats = document.getElementById('war-complete-stats')!;
const footerMode    = document.getElementById('footer-mode')!;

// ── State ──────────────────────────────────────────────────────────────────
let isRunning = false;

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('id-ID', { hour12: false });
}

function nowHHMMSS(): string {
  return new Date().toLocaleTimeString('id-ID', { hour12: false });
}

function getDotClass(state: WarState): string {
  switch (state) {
    case WarState.IDLE:    return 'idle';
    case WarState.READY:   return 'ready';
    case WarState.COMPLETED:
    case WarState.SUCCESS: return 'success';
    case WarState.FAILED:  return 'failed';
    case WarState.STOPPED: return 'stopped';
    case WarState.WAITING_FOR_CONFIRMATION:
    case WarState.CONFIRMING:
      return 'warning';
    default:               return 'running';
  }
}

function applyStatus(status: WarStatus): void {
  const state = status.state;
  statusDot.className = `status-dot ${getDotClass(state)}`;
  statusLabel.textContent = `${STATE_EMOJI[state]} ${STATE_LABEL[state]}`;
  statusTime.textContent = nowHHMMSS();

  countTarget.textContent  = String(status.totalTargets);
  countSuccess.textContent = String(status.successCount);
  countFailed.textContent  = String(status.failedCount);
  countSkipped.textContent = String(status.skippedCount);

  if (status.currentCourse) {
    currentCourse.innerHTML = `<strong>${status.currentCourse}</strong>`;
    currentClass.textContent = status.currentClass ? `Kelas ${status.currentClass}` : '';
  } else {
    currentCourse.innerHTML = '<span class="current-empty">Menunggu...</span>';
    currentClass.textContent = '';
  }

  const running = [
    WarState.RUNNING, WarState.SCANNING, WarState.COURSE_FOUND,
    WarState.SELECTING, WarState.WAITING_FOR_CONFIRMATION,
    WarState.CONFIRMING, WarState.VERIFYING, WarState.NEXT_TARGET,
  ].includes(state);

  isRunning = running;
  btnStart.disabled = running;
  btnStop.disabled  = !running;

  if (state === WarState.COMPLETED || state === WarState.STOPPED) {
    showWarComplete(status);
  } else {
    warComplete.classList.remove('show');
  }
}

function showWarComplete(status: WarStatus): void {
  warComplete.classList.add('show');
  const total   = status.totalTargets;
  const success = status.successCount;
  const failed  = status.failedCount;
  const skipped = status.skippedCount;
  warCompleteStats.innerHTML =
    `✓ ${success} berhasil &nbsp;·&nbsp; ✗ ${failed} gagal &nbsp;·&nbsp; ⟳ ${skipped} skip<br>` +
    `<strong style="color:var(--clr-text)">${success} / ${total} target selesai</strong>`;
}

function appendLog(entry: LogEntry): void {
  const div = document.createElement('div');
  div.className = `log-entry ${entry.level}`;
  div.innerHTML =
    `<span class="log-time">${formatTime(entry.timestamp)}</span>` +
    `<span class="log-level">${entry.level}</span>` +
    `<span class="log-text">${escapeHtml(entry.text)}</span>`;
  logPanel.appendChild(div);
  // Auto-scroll
  logPanel.scrollTop = logPanel.scrollHeight;
  // Trim old entries
  while (logPanel.children.length > 200) {
    logPanel.removeChild(logPanel.firstChild!);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Load initial status ────────────────────────────────────────────────────

async function loadStatus(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' }) as {
      ok: boolean; status?: WarStatus;
    };
    if (response?.ok && response.status) {
      applyStatus(response.status);
      // Replay logs
      logPanel.innerHTML = '';
      response.status.logs.forEach(appendLog);
    }
  } catch {
    // Background not ready yet — use defaults
  }
}

async function loadMode(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' }) as {
      ok: boolean; config?: { settings: { automationMode: string } };
    };
    if (response?.ok && response.config) {
      const modeMap: Record<string, string> = {
        assisted: 'Assisted',
        full: 'Full Auto',
        safe: 'Safe',
      };
      footerMode.textContent = modeMap[response.config.settings.automationMode] ?? 'Assisted';
    }
  } catch { /* ignore */ }
}

// ── Button handlers ────────────────────────────────────────────────────────

btnStart.addEventListener('click', async () => {
  if (isRunning) return;
  btnStart.disabled = true;
  warComplete.classList.remove('show');
  logPanel.innerHTML = '';

  try {
    const response = await chrome.runtime.sendMessage({ type: 'START_WAR' }) as { ok: boolean; error?: string };
    if (!response?.ok) {
      appendLog({ level: 'ERROR', text: `Gagal memulai: ${response?.error ?? 'unknown error'}`, timestamp: Date.now() });
      btnStart.disabled = false;
    }
  } catch (err) {
    appendLog({ level: 'ERROR', text: `Error: ${err}`, timestamp: Date.now() });
    btnStart.disabled = false;
  }
});

btnStop.addEventListener('click', async () => {
  btnStop.disabled = true;
  try {
    await chrome.runtime.sendMessage({ type: 'STOP_WAR' });
  } catch { /* ignore */ }
});

btnOptions.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

btnClearLog.addEventListener('click', () => {
  logPanel.innerHTML = '';
});

// ── Real-time push from background ────────────────────────────────────────

chrome.runtime.onMessage.addListener((message: Record<string, unknown>) => {
  const type = message['type'] as string;

  if (type === 'STATUS_PUSH' && message['status']) {
    applyStatus(message['status'] as WarStatus);
  }

  if (type === 'LOG_PUSH' && message['entry']) {
    appendLog(message['entry'] as LogEntry);
  }

  if (type === 'WAR_COMPLETE_PUSH' && message['status']) {
    applyStatus(message['status'] as WarStatus);
  }
});

// ── Init ───────────────────────────────────────────────────────────────────

void loadStatus();
void loadMode();
