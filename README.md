# 🎓 IRS WAR ASSISTANT

> **Chrome Extension untuk otomasi pemilihan mata kuliah IRS UNDIP**  
> Cepat, aman, tervalidasi — bukan brute force.

---

## Overview

IRS WAR ASSISTANT adalah Chrome Extension (Manifest V3) yang membantu mahasiswa UNDIP mengotomasi proses pemilihan mata kuliah pada sistem IRS selama periode "war mata kuliah".

**Prinsip utama:**
```
Detect → Validate → Act → Verify
```
Bukan:
```
Detect → Click blindly ← DILARANG
```

---

## Architecture

```
Popup UI ←──────── Background Service Worker ────────→ Content Script
   │                         │                                │
   │            Chrome Storage (courses, settings)            │
   │                                                          │
   └──── Messages ──────────────────────────────── DOM (IRS Page)
                                                             │
                                                     IRS Adapter
                                                    /           \
                                             MockAdapter    UndipAdapter
```

### Component Map

| Component | File | Responsibility |
|-----------|------|---------------|
| State Machine | `content/state-machine.ts` | War states: IDLE → RUNNING → SUCCESS → COMPLETED |
| Scanner | `content/scanner.ts` | Find courses on page, priority sorting |
| Selector | `content/selector.ts` | Try each class, validate, click select |
| Confirmation | `content/confirmation.ts` | Wait for modal (MutationObserver), validate, confirm |
| Verification | `content/verification.ts` | Post-confirm check that course shows as selected |
| Safety | `content/safety.ts` | Action lock, stop signal, identity guards |
| Observer | `content/observer.ts` | Named MutationObserver registry |
| Availability | `content/availability.ts` | Parse availability from text/quota |

---

## Installation (Development)

### Prerequisites
- Node.js 18+
- Google Chrome / Chromium

### Setup

```bash
cd irs-war-assistant
npm install
npm run build
```

The `dist/` folder will be generated.

### Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/` folder

---

## Development

```bash
# Watch mode — rebuilds on file changes
npm run dev

# Single build
npm run build

# TypeScript check only
npm run type-check
```

---

## Configuration

Open the extension popup → click ⚙ to open Settings.

### Course Targets

Add each mata kuliah you want to select:

```
Name: Pemrograman Web
Code: TIF305 (optional)
Priority: 1
Classes: A, B, C   ← tried left-to-right
```

### Priority System

- **Priority 1** = processed first
- Classes tried in order: `A → B → C`
- Never selects random classes

### Automation Modes

| Mode | Select | Confirm Modal | Final Submit |
|------|--------|---------------|--------------|
| **Assisted** (default) | Auto | Auto | **Manual** |
| **Full Auto** | Auto | Auto | Auto (configurable) |
| **Safe** | Auto | **Manual** | **Manual** |

---

## Automation Flow

```
USER LOGIN SSO (manual)
       ↓
OPEN IRS PAGE
       ↓
CONFIGURE TARGETS in Settings
       ↓
PRESS START WAR
       ↓
Extension scans page for priority targets
       ↓
Course found + class available?
       ↓         ↓
      NO         YES
       ↓          ↓
  Continue     CLICK SELECT (identity-validated)
  monitoring        ↓
              WAIT FOR MODAL (MutationObserver, not setTimeout)
                    ↓
              Modal matches course + class?
                ↙         ↘
              NO           YES
               ↓            ↓
         DO NOT CLICK    CLICK CONFIRM
                              ↓
                        VERIFY SELECTION
                              ↓
                         SUCCESS / FAILED
                              ↓
                         NEXT TARGET
```

---

## Debug Mode

Enable in Settings → Debug:

Console output will include:
```
[IRS-WAR] 🔍 Scanner: Detected 8 course rows on page
[IRS-WAR] 🔍 Scanner: Matched "Pemrograman Web" Kelas A (score: 0.95)
[IRS-WAR] 🔍 Selector: Kelas A = AVAILABLE (29/30)
[IRS-WAR] 🔍 Confirmation: Modal course "Pemrograman Web" vs target "Pemrograman Web" = 0.95
[IRS-WAR] 🔍 Confirmation: Modal class "A" vs target "A" = true
[IRS-WAR] ✓ Verification: "Pemrograman Web" Kelas A VERIFIED ✓
```

---

## Mock IRS Testing

The extension includes a full IRS simulator for testing without the real UNDIP page.

**Open:** `mock-irs/index.html` in Chrome (with extension active)

### Available Test Scenarios

| Test | Scenario | Expected |
|------|----------|---------|
| ① Normal | Classes available | Select → Confirm → Success |
| ② All Full | All quotas full | No action |
| ③ Class Fallback | A full, B available | Select B → Confirm B |
| ④ Already Selected | Pre-selected | SKIP (no re-click) |
| ⑤ Late Modal | 2000ms modal delay | Wait → Detect → Confirm |
| ⑥ Wrong Modal | Modal shows wrong course | DO NOT CONFIRM |
| ⑨ Dynamic DOM | Quota changes after 3s | MutationObserver detects → acts |

---

## UNDIP Integration

> ⚠️ **NOT YET IMPLEMENTED**

`UndipIRSAdapter` is a documented stub. It will be implemented **only after the real UNDIP IRS DOM is inspected**.

To implement UNDIP integration:

1. Open the real IRS page at `krs.undip.ac.id` (or current URL)
2. Open DevTools → Inspector
3. Copy the HTML of the course table
4. Provide a screenshot + HTML to the developer
5. Fill in `src/adapters/undip/selectors.ts`
6. Implement `src/adapters/undip/undip-irs-adapter.ts`
7. Switch adapter in `src/content/irs.ts`

```typescript
// Change this line in src/content/irs.ts:
return new MockIRSAdapter();
// To:
return new UndipIRSAdapter();
```

---

## Emergency Stop

| Method | Action |
|--------|--------|
| Popup → 🛑 STOP | Stops all automation |
| `Ctrl+Shift+X` | Emergency keyboard shortcut |

When stopped:
- AbortController is aborted
- All MutationObservers disconnected
- All action locks cleared
- No further clicks

---

## Safety Rules

Extension will **NEVER** click if:
- Course identity unknown
- Class identity unknown
- Availability unknown (UNKNOWN = DO NOTHING)
- Modal identity unknown
- Confirmation target doesn't match selected course

Extension will **NEVER** store or access:
- Passwords
- SSO credentials
- Session tokens
- Access/refresh tokens
- Cookies

Login SSO is always performed manually by the user.

---

## Troubleshooting

**"No active tab found" error:**
- Make sure the IRS page is the active tab when pressing START WAR

**Modal not detected:**
- Try increasing `Confirmation Timeout` in Settings (default: 3000ms)
- Enable Debug Mode to see what's being detected

**Course not found:**
- Check that the course name in Settings matches exactly (fuzzy matching with 60% threshold)
- Enable Debug Mode to see similarity scores

**Extension not running on IRS page:**
- Verify the IRS URL matches the host permissions in `manifest.json`
- The extension currently includes `https://krs.undip.ac.id/*` — update if the URL differs

---

## Project Structure

```
irs-war-assistant/
├── src/
│   ├── background/service-worker.ts   — Message routing, state mgmt
│   ├── content/
│   │   ├── irs.ts                     — Main entry + war loop
│   │   ├── state-machine.ts           — WarState enum + transitions
│   │   ├── scanner.ts                 — Course/class finder
│   │   ├── selector.ts                — Selection engine
│   │   ├── confirmation.ts            — Modal detect + validate + confirm
│   │   ├── verification.ts            — Post-confirm check
│   │   ├── observer.ts                — MutationObserver registry
│   │   ├── availability.ts            — Availability text parser
│   │   └── safety.ts                  — Locks + stop signal
│   ├── popup/                         — Extension popup UI
│   ├── options/                       — Settings page
│   ├── adapters/
│   │   ├── adapter.ts                 — IRSAdapter interface
│   │   ├── mock/mock-irs-adapter.ts   — Mock implementation
│   │   └── undip/                     — UNDIP stub (pending DOM)
│   ├── storage/storage.ts             — Chrome Storage wrapper
│   ├── types/                         — TypeScript interfaces
│   └── utils/                         — logger, normalize, sleep, debounce
├── mock-irs/index.html                — IRS page simulator
├── public/icons/                      — Extension icons
├── manifest.json
├── vite.config.ts
└── tsconfig.json
```

---

## Security

- **CSP**: `script-src 'self'` — no remote script execution
- **No `eval()`** or `new Function()` anywhere
- **Least privilege**: host permissions only for UNDIP IRS domains
- **No credential storage**: only course targets and settings are saved

---

## Limitations

1. **UNDIP adapter not implemented** — use Mock IRS for testing
2. **SSO login is manual** — extension does not touch login flow
3. **Works on one tab** — run on the active IRS tab
4. **Final IRS submission** — disabled by default; extra safety guard required
