// ============================================================
// Types: Availability
// ============================================================

export type AvailabilityStatus =
  | 'AVAILABLE'   // Kuota tersedia, dapat dipilih
  | 'FULL'        // Kuota penuh
  | 'CLOSED'      // Kelas ditutup
  | 'SELECTED'    // Sudah dipilih oleh mahasiswa ini
  | 'UNKNOWN';    // Status tidak dapat dipastikan — JANGAN KLIK

export interface Availability {
  status: AvailabilityStatus;
  /** Filled seats */
  current?: number;
  /** Max capacity */
  capacity?: number;
  /** The raw text from which this was parsed */
  rawText: string;
  /** True only when status === 'AVAILABLE' */
  available: boolean;
}

/** Keywords used for availability detection */
export const AVAILABILITY_KEYWORDS = {
  AVAILABLE: ['tersedia', 'available', 'open', 'buka'],
  FULL: ['penuh', 'full', 'closed', 'tutup', 'tidak tersedia'],
  SELECTED: ['terpilih', 'selected', 'dipilih', '✓', 'sudah'],
} as const;
