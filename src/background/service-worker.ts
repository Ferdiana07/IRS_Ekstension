// ============================================================
// Background: Service Worker
// Message routing, state management, storage coordination
// ============================================================

import type { PopupToBackgroundMessage, WarStatus, LogEntry } from '../types/message';
import type { AutomationConfig } from '../types/config';
import { loadConfig, saveConfig } from '../storage/storage';
import { WarState } from '../content/state-machine';

// ── In-memory war state ────────────────────────────────────────────────────

const MAX_LOGS = 200;

let warStatus: WarStatus = {
  state: WarState.IDLE,
  totalTargets: 0,
  successCount: 0,
  failedCount: 0,
  skippedCount: 0,
  logs: [],
  records: [],
};

function pushLog(entry: LogEntry): void {
  warStatus.logs.push(entry);
  if (warStatus.logs.length > MAX_LOGS) {
    warStatus.logs.splice(0, warStatus.logs.length - MAX_LOGS);
  }
}

function resetStatus(config: AutomationConfig): void {
  const enabled = config.courses.filter((c) => c.enabled);
  warStatus = {
    state: WarState.READY,
    totalTargets: enabled.length,
    successCount: 0,
    failedCount: 0,
    skippedCount: 0,
    logs: [],
    records: [],
  };
}

// ── Active tab management ──────────────────────────────────────────────────

async function getActiveIRSTab(): Promise<chrome.tabs.Tab | null> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] ?? null;
}

// ── Message listener (Popup → Background) ─────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: PopupToBackgroundMessage | Record<string, unknown>, _sender, sendResponse) => {
    const msg = message as PopupToBackgroundMessage;

    switch (msg.type) {
      // ── START WAR ────────────────────────────────────────────────────────
      case 'START_WAR': {
        (async () => {
          const config = await loadConfig();
          resetStatus(config);

          const tab = await getActiveIRSTab();
          if (!tab?.id) {
            sendResponse({ ok: false, error: 'No active tab found' });
            return;
          }

          try {
            await chrome.tabs.sendMessage(tab.id, {
              type: 'CONTENT_START',
              config,
            });
            sendResponse({ ok: true });
          } catch (err) {
            sendResponse({ ok: false, error: String(err) });
          }
        })();
        return true; // async response
      }

      // ── SCAN COURSES ──────────────────────────────────────────────────────
      case 'SCAN_COURSES': {
        (async () => {
          const irsTabs = await chrome.tabs.query({ url: ["*://*.undip.ac.id/*", "http://localhost/*"] });
          let lastError = 'No active tab found';
          
          for (const tab of irsTabs) {
            if (!tab.id) continue;
            try {
              const result = await chrome.tabs.sendMessage(tab.id, { type: 'SCAN_COURSES' });
              if (result && result.ok) {
                sendResponse(result);
                return;
              }
            } catch (err) {
              lastError = String(err);
            }
          }

          // Fallback if none of the url-matched tabs responded successfully
          const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
          if (activeTabs[0]?.id) {
            try {
              const result = await chrome.tabs.sendMessage(activeTabs[0].id, { type: 'SCAN_COURSES' });
              sendResponse(result);
              return;
            } catch (err) {
              lastError = String(err);
            }
          }

          sendResponse({ ok: false, error: lastError });
        })();
        return true;
      }

      // ── STOP WAR ─────────────────────────────────────────────────────────
      case 'STOP_WAR': {
        (async () => {
          warStatus.state = WarState.STOPPED;
          const irsTabs = await chrome.tabs.query({ url: ["*://*.undip.ac.id/*", "http://localhost/*"] });
          for (const tab of irsTabs) {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, { type: 'CONTENT_STOP' }).catch(() => {});
            }
          }
          sendResponse({ ok: true });
        })();
        return true;
      }

      // ── GET STATUS ────────────────────────────────────────────────────────
      case 'GET_STATUS': {
        sendResponse({ ok: true, status: warStatus });
        return false;
      }

      // ── GET CONFIG ────────────────────────────────────────────────────────
      case 'GET_CONFIG': {
        (async () => {
          const config = await loadConfig();
          sendResponse({ ok: true, config });
        })();
        return true;
      }

      // ── SAVE CONFIG ───────────────────────────────────────────────────────
      case 'SAVE_CONFIG': {
        (async () => {
          await saveConfig(msg.config);
          sendResponse({ ok: true });
        })();
        return true;
      }

      default:
        return false;
    }
  }
);

// ── Message listener (Content → Background) ───────────────────────────────

chrome.runtime.onMessage.addListener((message: Record<string, unknown>, _sender, _sendResponse) => {
  const type = message['type'] as string;

  switch (type) {
    case 'STATE_UPDATE': {
      warStatus.state = message['state'] as WarState;
      if (message['currentCourse']) warStatus.currentCourse = message['currentCourse'] as string;
      if (message['currentClass']) warStatus.currentClass = message['currentClass'] as string;
      // Notify popup if open
      chrome.runtime.sendMessage({ type: 'STATUS_PUSH', status: warStatus }).catch(() => {});
      break;
    }

    case 'LOG': {
      const entry: LogEntry = {
        level: message['level'] as LogEntry['level'],
        text: message['text'] as string,
        timestamp: message['timestamp'] as number,
      };
      pushLog(entry);
      // Forward to popup
      chrome.runtime.sendMessage({ type: 'LOG_PUSH', entry }).catch(() => {});
      break;
    }

    case 'ATTEMPT_COMPLETE': {
      const record = message['record'] as WarStatus['records'][0];
      warStatus.records.push(record);
      if (record.result === 'SUCCESS') warStatus.successCount++;
      else if (record.result === 'FAILED') warStatus.failedCount++;
      else if (record.result === 'ALREADY_SELECTED' || record.result === 'SKIPPED') warStatus.skippedCount++;
      break;
    }

    case 'WAR_COMPLETE': {
      warStatus.state = WarState.COMPLETED;
      warStatus.records = message['records'] as WarStatus['records'];
      chrome.runtime.sendMessage({ type: 'WAR_COMPLETE_PUSH', status: warStatus }).catch(() => {});
      break;
    }
  }

  return false;
});

// ── Chrome command listener (Emergency Stop) ──────────────────────────────

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'emergency-stop') {
    warStatus.state = WarState.STOPPED;
    const irsTabs = await chrome.tabs.query({ url: ["*://*.undip.ac.id/*", "http://localhost/*"] });
    for (const tab of irsTabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'EMERGENCY_STOP' }).catch(() => {});
        chrome.tabs.sendMessage(tab.id, { type: 'CONTENT_STOP' }).catch(() => {});
      }
    }
  }
});

// ── Install handler ────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  console.log('[IRS-WAR] Extension installed/updated');
});

console.log('[IRS-WAR] Service worker active');
