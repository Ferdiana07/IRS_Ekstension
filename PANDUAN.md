# 🎓 PANDUAN LENGKAP — IRS WAR ASSISTANT

> Panduan ini menjelaskan **dari awal sampai akhir** cara memasang dan menjalankan extension IRS WAR ASSISTANT di Chrome untuk war mata kuliah UNDIP.

---

## 📋 DAFTAR ISI

1. [Syarat Yang Dibutuhkan](#1-syarat-yang-dibutuhkan)
2. [Build Extension (Sekali Saja)](#2-build-extension-sekali-saja)
3. [Pasang di Chrome](#3-pasang-di-chrome)
4. [Setting Target Mata Kuliah](#4-setting-target-mata-kuliah)
5. [Cara Menjalankan War](#5-cara-menjalankan-war)
6. [Memahami Tampilan Popup](#6-memahami-tampilan-popup)
7. [Mode Otomasi](#7-mode-otomasi)
8. [Emergency Stop](#8-emergency-stop)
9. [Setelah Build Ulang](#9-setelah-build-ulang)
10. [FAQ & Troubleshooting](#10-faq--troubleshooting)

---

## 1. Syarat Yang Dibutuhkan

Sebelum mulai, pastikan sudah terinstal:

| Software | Cara cek | Download |
|----------|----------|---------|
| **Node.js** (versi 18+) | Buka CMD → ketik `node -v` | [nodejs.org](https://nodejs.org) |
| **Google Chrome** | Sudah punya? ✓ | — |

> ⚠️ Kalau `node -v` muncul error, berarti Node.js belum terinstal. Install dulu.

---

## 2. Build Extension (Sekali Saja)

Langkah ini hanya perlu dilakukan **satu kali** (atau setiap kali ada update kode).

### Buka Terminal / Command Prompt

Di Windows:
- Tekan `Win + R` → ketik `cmd` → Enter
- **ATAU** di VS Code → menu Terminal → New Terminal

### Jalankan perintah ini satu per satu:

```bash
cd "e:\PROJEKAN GABUT\IRS_Ekstension\irs-war-assistant"
npm install
npm run build
```

### Hasilnya

Setelah selesai akan muncul tulisan seperti ini:
```
✓ built in 336ms
[chrome-extension-fix] popup.html → dist/popup.html
[chrome-extension-fix] Build post-processing complete
```

Sekarang ada folder baru bernama **`dist/`** di dalam folder project. Isi folder `dist/` inilah yang akan dipasang di Chrome.

> ✅ Kalau sudah ada folder `dist/`, kamu bisa skip langkah ini di masa depan selama tidak ada update.

---

## 3. Pasang di Chrome

### Langkah-langkah:

**1.** Buka Chrome → ketik di address bar:
```
chrome://extensions/
```

**2.** Aktifkan **Developer mode** dengan klik toggle di pojok kanan atas

**3.** Klik tombol **"Load unpacked"** (muncul setelah Developer mode aktif)

**4.** Di dialog file yang muncul, navigasi ke folder:
```
e:\PROJEKAN GABUT\IRS_Ekstension\irs-war-assistant\dist
```
Pilih folder **`dist`** → klik **Select Folder**

**5.** Extension **IRS WAR ASSISTANT** akan muncul di daftar extension

**6.** Pin extension ke toolbar:
- Klik ikon puzzle 🧩 di pojok kanan atas Chrome
- Cari "IRS WAR ASSISTANT" → klik pin 📌

Sekarang ikon extension 🎓 akan muncul permanen di toolbar Chrome.

---

## 4. Setting Target Mata Kuliah

Sebelum war dimulai, kamu harus memberitahu extension **mata kuliah apa** yang mau dipilih.

### Cara buka Settings:

Klik ikon extension 🎓 di toolbar → klik **⚙ (Settings)**

**ATAU** di halaman `chrome://extensions/` → klik "Details" → "Extension options"

### Tambah Mata Kuliah:

1. Buka tab **📚 Mata Kuliah**
2. Klik **"+ Tambah Mata Kuliah"**
3. Isi form:

| Field | Isi | Contoh |
|-------|-----|--------|
| **Nama Mata Kuliah** | Nama persis (atau mirip) | `Pembelajaran Mesin` |
| **Kode MK** | Opsional | `MIK1624505` |
| **Priority** | 1 = paling utama | `1` |
| **Kelas Prioritas** | Urutan kelas yang dicoba | `B, A, C` |

> **Tips Kelas Prioritas:**
> Tulis dari kiri ke kanan = urutan prioritas.
> Contoh `B, A, C` artinya: coba kelas B dulu, kalau penuh coba A, kalau masih penuh coba C.

4. Ulangi untuk setiap mata kuliah yang mau diambil
5. Klik **💾 Simpan**

### Contoh pengisian untuk 3 mata kuliah:

```text
MK 1: Pembelajaran Mesin      | Priority: 1 | Kelas: B, A
MK 2: Komputasi Tersebar      | Priority: 2 | Kelas: A, B, C
MK 3: Sistem Informasi        | Priority: 3 | Kelas: D, A
```

---

## 5. Cara Menjalankan War

### Persiapan (sebelum jam war):

- [x] Extension sudah terpasang
- [x] Target mata kuliah sudah di-setting
- [x] Kamu sudah login ke SIAP UNDIP (SSO manual — extension tidak sentuh login)

### Saat jam war dimulai:

**1.** Buka browser Chrome → login ke SIAP UNDIP seperti biasa:
```
https://siap.undip.ac.id
```

**2.** Navigasi ke halaman IRS:
```
https://siap.undip.ac.id/irs/mhs/irs
```

**3.** Pastikan halaman IRS sudah terbuka dan menampilkan kalender mata kuliah

**4.** Klik ikon extension 🎓 di toolbar → popup akan muncul

**5.** Klik tombol **🚀 START WAR**

**6.** Extension akan langsung bekerja secara otomatis:
```
📍 Scan halaman...
🔍 Ditemukan: Pembelajaran Mesin Kelas B (TERSEDIA)
🖱️  Klik blok kursus...
⏳ Menunggu modal konfirmasi...
✅ Modal muncul — "Konfirmasi IRS"
🖱️  Klik tombol "Ya"...
✓ Verifikasi: Pembelajaran Mesin Kelas B berhasil dipilih!
➡️  Lanjut ke target berikutnya...
```

---

## 6. Memahami Tampilan Popup

```text
┌─────────────────────────────────────┐
│ 🎓  IRS WAR ASSISTANT          ⚙   │
│     UNDIP — Automated Course        │
├─────────────────────────────────────┤
│ 🟢 RUNNING          10:00:05        │
│                                     │
│ Target: 3  OK: 1  FAIL: 0  SKIP: 0 │
├─────────────────────────────────────┤
│ Current                             │
│ Komputasi Tersebar dan Pararel      │
│ Kelas B                             │
├─────────────────────────────────────┤
│  [🚀 START WAR]  [🛑 STOP]         │
├─────────────────────────────────────┤
│ 📋 Log                    [Clear]  │
│ 10:00:01 INFO  Extension ready...  │
│ 10:00:05 INFO  Scan halaman...     │
│ 10:00:06 ✓OK   Dipilih: PM Kls B  │
└─────────────────────────────────────┘
```

### Status dot:

| Warna | Arti |
|-------|------|
| ⚫ Abu | IDLE — belum dimulai |
| 🟢 Hijau | RUNNING — sedang berjalan |
| 🟡 Kuning | Menunggu konfirmasi modal |
| 💙 Biru | COMPLETED — semua selesai |
| 🔴 Merah | ERROR / FAILED |

### Counter:
- **Target** = jumlah MK yang mau dipilih
- **OK** = berhasil dipilih
- **FAIL** = gagal (kuota penuh semua kelas, atau error)
- **SKIP** = dilewati (sudah terpilih sebelumnya)

---

## 7. Mode Otomasi

Buka Settings → tab **⚡ Mode Otomasi**

| Mode | Select | Konfirmasi Modal | Final Submit IRS |
|------|--------|-----------------|-----------------|
| **🤝 Assisted** *(default)* | Otomatis | Otomatis | **Manual kamu** |
| **🚀 Full Auto** | Otomatis | Otomatis | Otomatis |
| **🛡️ Safe** | Otomatis | **Manual kamu** | **Manual kamu** |

> **Rekomendasi: Gunakan Assisted** untuk keamanan. Extension yang klik MK dan konfirmasi, tapi kamu yang submit final IRS-nya.

---

## 8. Emergency Stop

Kalau ada yang tidak beres, hentikan extension dengan:

- **Klik popup** → tombol **🛑 STOP**
- **Keyboard:** `Ctrl + Shift + X` (emergency stop dari mana saja)

Saat di-stop:
- Semua operasi langsung berhenti
- Tidak ada klik tambahan yang terjadi
- Status berubah ke STOPPED

---

## 9. Setelah Build Ulang

Kalau ada update kode dan kamu perlu build ulang:

```bash
cd "e:\PROJEKAN GABUT\IRS_Ekstension\irs-war-assistant"
npm run build
```

Setelah build selesai, **reload extension di Chrome**:

1. Buka `chrome://extensions/`
2. Cari IRS WAR ASSISTANT
3. Klik tombol **🔄 (reload)** yang ada di kartu extension

> Tidak perlu "Load unpacked" lagi — cukup reload.

---

## 10. FAQ & Troubleshooting

### ❓ Extension tidak muncul setelah "Load unpacked"
→ Pastikan kamu memilih folder **`dist`** bukan folder `irs-war-assistant` atau folder lainnya.

---

### ❓ Popup muncul tapi tombol START WAR langsung error
→ Pastikan kamu sudah berada di halaman IRS UNDIP (`siap.undip.ac.id/irs/mhs/irs`) saat menekan START WAR.

---

### ❓ Extension berjalan tapi tidak menemukan mata kuliah
→ Kemungkinan penyebab:
1. Nama MK di Settings terlalu berbeda dengan yang ada di halaman IRS
   - ✅ Baik: `Pembelajaran Mesin`
   - ❌ Kurang baik: `ML`, `Machine Learning`
2. Mata kuliah belum ditampilkan di kalender (toggle sidebar kiri)

---

### ❓ Extension menemukan MK tapi tidak bisa klik
→ Kemungkinan: Kelas yang ditarget memang penuh (`cursor: not-allowed`). Extension sudah otomatis coba kelas berikutnya sesuai urutan yang kamu set.

---

### ❓ Modal konfirmasi muncul tapi tidak diklik
→ Extension memvalidasi bahwa modal yang muncul adalah modal IRS yang benar. Kalau modal dari popup lain (bukan "Konfirmasi IRS"), extension tidak akan klik.

---

### ❓ Bagaimana kalau semua kelas penuh?
→ Extension akan menandai MK tersebut sebagai FAILED dan lanjut ke target berikutnya. Kamu akan melihat di log dan counter.

---

### ❓ Apakah extension bisa login SSO otomatis?
→ **Tidak.** Login SSO, CAPTCHA, OTP — semua dilakukan manual oleh kamu. Extension hanya mengotomasi proses **setelah kamu login dan berada di halaman IRS**.

---

### ❓ Aman tidak?
→ Extension tidak menyimpan password atau token. Hanya menyimpan daftar mata kuliah target dan pengaturan di storage lokal Chrome kamu.

---

## 📁 Struktur Folder

```
e:\PROJEKAN GABUT\IRS_Ekstension\
└── irs-war-assistant\
    ├── src\              ← source code (jangan diubah kalau tidak paham)
    ├── dist\             ← hasil build — INI yang dipasang di Chrome
    ├── mock-irs\         ← halaman simulator untuk testing
    ├── public\           ← aset publik (icon, dll)
    ├── package.json
    └── PANDUAN.md        ← file ini
```

---

## 🚀 Ringkasan Cepat

```text
PERTAMA KALI:
1. npm install          (di folder irs-war-assistant)
2. npm run build
3. chrome://extensions/ → Load unpacked → pilih folder dist/
4. Setting target MK di popup → ⚙

SETIAP WAR:
1. Login SSO manual di siap.undip.ac.id
2. Buka siap.undip.ac.id/irs/mhs/irs
3. Klik ikon extension 🎓
4. Klik 🚀 START WAR
5. Tunggu sampai selesai ✓

KALAU PERLU STOP:
→ Klik 🛑 STOP atau tekan Ctrl+Shift+X
```
