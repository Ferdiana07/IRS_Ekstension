# 🎓 IRS WAR ASSISTANT

> **Chrome Extension untuk otomasi pemilihan mata kuliah IRS UNDIP**  
> Cepat, aman, tervalidasi (BETA).

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

## Limitations

1. **UNDIP adapter not implemented** — use Mock IRS for testing
2. **SSO login is manual** — extension does not touch login flow
3. **Works on one tab** — run on the active IRS tab
4. **Final IRS submission** — disabled by default; extra safety guard required
