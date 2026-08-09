// ============================================================
// Options: options.ts
// Course target editor, settings, mode selection
// ============================================================

import type { AutomationConfig, AutomationMode } from '../types/config';
import type { CourseTarget } from '../types/course';
import { DEFAULT_SETTINGS } from '../types/config';

// ── State ──────────────────────────────────────────────────────────────────
let config: AutomationConfig = {
  courses: [],
  settings: { ...DEFAULT_SETTINGS },
};

let selectedMode: AutomationMode = 'assisted';

// ── Navigation ─────────────────────────────────────────────────────────────
document.querySelectorAll<HTMLElement>('.nav-item').forEach((item) => {
  item.addEventListener('click', () => {
    const sectionId = item.dataset['section']!;
    document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
    document.querySelectorAll('.section').forEach((s) => s.classList.remove('active'));
    item.classList.add('active');
    document.getElementById(`section-${sectionId}`)?.classList.add('active');
  });
});

// ── Course List Rendering ──────────────────────────────────────────────────

function generateId(): string {
  return `course-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function renderCourseList(): void {
  const list = document.getElementById('course-list')!;
  list.innerHTML = '';

  config.courses.forEach((course, index) => {
    const item = document.createElement('div');
    item.className = 'course-item';
    item.dataset['id'] = course.id;
    item.innerHTML = `
      <div class="course-item-header">
        <div class="course-priority-badge">${index + 1}</div>
        <input
          class="form-input course-name-input"
          type="text"
          placeholder="Nama Mata Kuliah (contoh: Pemrograman Web)"
          value="${escHtml(course.name)}"
          data-field="name"
          data-id="${course.id}"
        />
        <label class="toggle" title="Enable/Disable">
          <input type="checkbox" ${course.enabled ? 'checked' : ''} data-field="enabled" data-id="${course.id}" />
          <span class="toggle-track"></span>
        </label>
      </div>

      <div class="course-item-row">
        <div class="form-group" style="margin:0">
          <label class="form-label">Kode MK (opsional)</label>
          <input
            class="form-input"
            type="text"
            placeholder="contoh: TIF305"
            value="${escHtml(course.code ?? '')}"
            data-field="code"
            data-id="${course.id}"
          />
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Priority</label>
          <input
            class="form-input"
            type="number"
            min="1"
            max="99"
            value="${course.priority}"
            style="width:80px"
            data-field="priority"
            data-id="${course.id}"
          />
        </div>
      </div>

      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Kelas Prioritas (pisah koma, kiri = utama)</label>
        <input
          class="form-input"
          type="text"
          placeholder="contoh: A, B, C"
          value="${course.preferredClasses.join(', ')}"
          data-field="preferredClasses"
          data-id="${course.id}"
        />
        <div class="form-hint">Kelas A akan dicoba pertama, lalu B, lalu C.</div>
      </div>

      <div class="course-actions">
        <button class="btn btn-ghost btn-sm" data-action="move-up" data-id="${course.id}">↑ Naik</button>
        <button class="btn btn-ghost btn-sm" data-action="move-down" data-id="${course.id}">↓ Turun</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${course.id}">🗑️ Hapus</button>
      </div>
    `;
    list.appendChild(item);
  });

  // Attach change listeners
  list.querySelectorAll<HTMLInputElement>('[data-field]').forEach((input) => {
    input.addEventListener('input', handleFieldChange);
    input.addEventListener('change', handleFieldChange);
  });

  // Attach action listeners
  list.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((btn) => {
    btn.addEventListener('click', handleCourseAction);
  });
}

function handleFieldChange(e: Event): void {
  const input = e.target as HTMLInputElement;
  const id = input.dataset['id']!;
  const field = input.dataset['field']!;
  const course = config.courses.find((c) => c.id === id);
  if (!course) return;

  if (field === 'name') course.name = input.value;
  if (field === 'code') course.code = input.value || undefined;
  if (field === 'priority') course.priority = parseInt(input.value) || 1;
  if (field === 'enabled') course.enabled = (input as HTMLInputElement).checked;
  if (field === 'preferredClasses') {
    course.preferredClasses = input.value
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);
  }
}

function handleCourseAction(e: Event): void {
  const btn = e.target as HTMLButtonElement;
  const action = btn.dataset['action']!;
  const id = btn.dataset['id']!;
  const index = config.courses.findIndex((c) => c.id === id);
  if (index === -1) return;

  if (action === 'delete') {
    config.courses.splice(index, 1);
    renderCourseList();
  } else if (action === 'move-up' && index > 0) {
    [config.courses[index - 1], config.courses[index]] = [config.courses[index], config.courses[index - 1]];
    // Update priorities
    config.courses.forEach((c, i) => { c.priority = i + 1; });
    renderCourseList();
  } else if (action === 'move-down' && index < config.courses.length - 1) {
    [config.courses[index], config.courses[index + 1]] = [config.courses[index + 1], config.courses[index]];
    config.courses.forEach((c, i) => { c.priority = i + 1; });
    renderCourseList();
  }
}

document.getElementById('btn-add-course')!.addEventListener('click', () => {
  const newCourse: CourseTarget = {
    id: generateId(),
    name: '',
    code: undefined,
    preferredClasses: ['A'],
    priority: config.courses.length + 1,
    enabled: true,
  };
  config.courses.push(newCourse);
  renderCourseList();
  // Focus name input of new item
  const inputs = document.querySelectorAll<HTMLInputElement>('[data-field="name"]');
  inputs[inputs.length - 1]?.focus();
});

// ── Scanning ───────────────────────────────────────────────────────────────

const btnScan = document.getElementById('btn-scan-courses') as HTMLButtonElement;
const scanContainer = document.getElementById('scan-results-container')!;
const scanList = document.getElementById('scan-results-list')!;
const btnCloseScan = document.getElementById('btn-close-scan')!;
const btnAddScanned = document.getElementById('btn-add-scanned')!;

btnScan.addEventListener('click', async () => {
  btnScan.disabled = true;
  btnScan.textContent = 'Memindai...';
  scanList.innerHTML = '<div style="padding:12px;text-align:center">Memindai halaman IRS...</div>';
  scanContainer.style.display = 'block';

  try {
    const response = await chrome.runtime.sendMessage({ type: 'SCAN_COURSES' }) as { ok: boolean, courses?: any[], error?: string };
    
    if (!response || !response.ok) {
      throw new Error(response?.error || 'Pastikan kamu sedang membuka halaman IRS dan sudah di-refresh (F5).');
    }

    const courses = response.courses || [];
    if (courses.length === 0) {
      scanList.innerHTML = '<div style="padding:12px;text-align:center;color:var(--clr-danger)">Tidak ada mata kuliah yang terdeteksi di halaman kalender.</div>';
    } else {
      scanList.innerHTML = courses.map((c, i) => `
        <label style="display:flex; align-items:center; gap:8px; padding:8px; background:var(--clr-surface2); border-radius:4px; cursor:pointer;">
          <input type="checkbox" class="scan-checkbox" data-index="${i}" data-name="${escHtml(c.name)}" data-classes="${escHtml(c.classes.join(','))}" />
          <div>
            <div style="font-weight:600; font-size:13px">${escHtml(c.name)}</div>
            <div style="font-size:11px; color:var(--clr-text-muted)">Kelas: ${escHtml(c.classes.join(', '))}</div>
          </div>
        </label>
      `).join('');
    }
  } catch (err) {
    scanList.innerHTML = `<div style="padding:12px;color:var(--clr-danger);font-size:12px">Gagal memindai: ${err}</div>`;
  } finally {
    btnScan.disabled = false;
    btnScan.textContent = '🔍 Pindai Mata Kuliah dari Halaman';
  }
});

btnCloseScan.addEventListener('click', () => {
  scanContainer.style.display = 'none';
});

btnAddScanned.addEventListener('click', () => {
  const checkboxes = scanList.querySelectorAll<HTMLInputElement>('.scan-checkbox:checked');
  if (checkboxes.length === 0) return;

  checkboxes.forEach((cb) => {
    const name = cb.dataset['name']!;
    const classes = cb.dataset['classes']!.split(',');
    
    // Check if already exists
    if (config.courses.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      return;
    }

    config.courses.push({
      id: generateId(),
      name: name,
      code: undefined,
      preferredClasses: classes.length > 0 && classes[0] !== '' ? classes : ['A'],
      priority: config.courses.length + 1,
      enabled: true,
    });
  });

  renderCourseList();
  scanContainer.style.display = 'none';
});

// ── Mode Selection ─────────────────────────────────────────────────────────

document.querySelectorAll<HTMLElement>('.mode-card').forEach((card) => {
  card.addEventListener('click', () => {
    const mode = card.dataset['mode'] as AutomationMode;
    selectedMode = mode;
    config.settings.automationMode = mode;

    document.querySelectorAll('.mode-card').forEach((c) => c.classList.remove('selected'));
    card.classList.add('selected');

    const finalCard = document.getElementById('card-final-submit')!;
    finalCard.style.display = mode === 'full' ? 'block' : 'none';
  });
});

// ── Settings Controls ──────────────────────────────────────────────────────

function bindSetting(id: string, key: keyof typeof DEFAULT_SETTINGS, type: 'number' | 'boolean' = 'number'): void {
  const el = document.getElementById(id);
  if (!el) return;
  if (type === 'boolean') {
    const cb = el as HTMLInputElement;
    cb.addEventListener('change', () => {
      (config.settings as Record<string, unknown>)[key] = cb.checked;
    });
  } else {
    const inp = el as HTMLInputElement;
    inp.addEventListener('input', () => {
      (config.settings as Record<string, unknown>)[key] = parseInt(inp.value) || (DEFAULT_SETTINGS[key] as number);
    });
  }
}

bindSetting('input-scan-interval', 'scanInterval');
bindSetting('input-confirm-timeout', 'confirmationTimeout');
bindSetting('input-max-retries', 'maxRetries');
bindSetting('input-countdown', 'finalSubmissionCountdown');
bindSetting('toggle-sound', 'enableSound', 'boolean');
bindSetting('toggle-notifications', 'enableNotifications', 'boolean');
bindSetting('toggle-debug', 'debugMode', 'boolean');
bindSetting('toggle-final-submit', 'enableFinalSubmission', 'boolean');
bindSetting('toggle-auto-refresh', 'autoRefresh', 'boolean');

const refreshIntervalInput = document.getElementById('input-refresh-interval') as HTMLSelectElement;
refreshIntervalInput?.addEventListener('change', () => {
  config.settings.autoRefreshInterval = (parseInt(refreshIntervalInput.value) || 5) * 1000;
});

// ── Save ───────────────────────────────────────────────────────────────────

document.getElementById('btn-save')!.addEventListener('click', async () => {
  try {
    await chrome.runtime.sendMessage({ type: 'SAVE_CONFIG', config });
    const indicator = document.getElementById('save-indicator')!;
    indicator.classList.add('show');
    setTimeout(() => indicator.classList.remove('show'), 2000);
  } catch (err) {
    console.error('Save failed', err);
  }
});

// ── Reset ──────────────────────────────────────────────────────────────────

document.getElementById('btn-reset')!.addEventListener('click', async () => {
  if (!confirm('Hapus semua data konfigurasi? Tindakan ini tidak dapat dibatalkan.')) return;
  await chrome.storage.local.clear();
  window.location.reload();
});

// ── Load Config ────────────────────────────────────────────────────────────

async function loadConfig(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' }) as {
      ok: boolean; config?: AutomationConfig;
    };
    if (response?.ok && response.config) {
      config = response.config;
      selectedMode = config.settings.automationMode;

      // Apply to UI
      renderCourseList();

      // Mode cards
      document.querySelectorAll('.mode-card').forEach((card) => {
        const el = card as HTMLElement;
        el.classList.toggle('selected', el.dataset['mode'] === selectedMode);
      });

      const finalCard = document.getElementById('card-final-submit')!;
      finalCard.style.display = selectedMode === 'full' ? 'block' : 'none';

      // Settings inputs
      (document.getElementById('input-scan-interval') as HTMLInputElement).value = String(config.settings.scanInterval);
      (document.getElementById('input-confirm-timeout') as HTMLInputElement).value = String(config.settings.confirmationTimeout);
      (document.getElementById('input-max-retries') as HTMLInputElement).value = String(config.settings.maxRetries);
      (document.getElementById('input-countdown') as HTMLInputElement).value = String(config.settings.finalSubmissionCountdown);
      (document.getElementById('toggle-sound') as HTMLInputElement).checked = config.settings.enableSound;
      (document.getElementById('toggle-notifications') as HTMLInputElement).checked = config.settings.enableNotifications;
      (document.getElementById('toggle-debug') as HTMLInputElement).checked = config.settings.debugMode;
      (document.getElementById('toggle-final-submit') as HTMLInputElement).checked = config.settings.enableFinalSubmission;
      (document.getElementById('toggle-auto-refresh') as HTMLInputElement).checked = config.settings.autoRefresh;
      
      const refreshIntervalInput = document.getElementById('input-refresh-interval') as HTMLSelectElement;
      if (refreshIntervalInput) {
        refreshIntervalInput.value = String(config.settings.autoRefreshInterval / 1000);
      }
    }
  } catch { /* first run — use defaults */ }
}

// ── Misc ───────────────────────────────────────────────────────────────────

document.getElementById('btn-open-mock')?.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('mock-irs/index.html') }).catch(() => {
    alert('Cannot open mock IRS. Make sure mock-irs/index.html is included in the extension package.');
  });
});

function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Init ───────────────────────────────────────────────────────────────────

void loadConfig();
