// ─── IST Date Utilities ───────────────────────────────────────────────────────
//
// ROOT CAUSE: Two bugs were causing wrong dates:
//
// 1. new Date().toISOString() returns UTC. IST = UTC+5:30, so before 5:30 AM IST,
//    toISOString() gives yesterday's date. Fixed by todayIST() below.
//
// 2. Google Sheets getValues() returns Date objects for date cells. These
//    serialize to IST-midnight-as-UTC: e.g. "2026-05-30T18:30:00.000Z" for
//    May 31 IST. The old fmtDate used getUTCDate() which read 30, not 31.
//    Fixed in Code.gs (sheetToObjects now converts to YYYY-MM-DD before sending),
//    AND in fmtDate below as a safety net for any edge cases.

/**
 * Returns today's date as a YYYY-MM-DD string in IST (UTC+5:30).
 * Use everywhere you need the current date — attendance, joining date, etc.
 */
export function todayIST() {
  const now = new Date();
  // Shift to IST by adding 5h30m offset, then read the ISO date portion
  const istOffset = 5.5 * 60 * 60 * 1000; // 330 minutes in ms
  const istNow = new Date(now.getTime() + istOffset);
  return istNow.toISOString().substring(0, 10);
}

/**
 * Formats a date value for display as "31 May 2026".
 *
 * Handles all three formats that can come from Google Sheets:
 *   1. "2026-05-31"              — plain YYYY-MM-DD (after Code.gs fix)
 *   2. "2026-05-30T18:30:00.000Z"— IST midnight as UTC (safety net)
 *   3. Anything else             — best-effort fallback
 */
export function fmtDate(val) {
  if (!val) return '—';

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec'];

  // ── Case 1: clean YYYY-MM-DD string (most common after Code.gs fix) ──
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
    const [yyyy, mm, dd] = val.trim().split('-').map(Number);
    return `${String(dd).padStart(2,'0')} ${MONTHS[mm-1]} ${yyyy}`;
  }

  // ── Case 2: ISO datetime string — convert to IST before reading date ──
  // Google Sheets serializes IST-midnight dates as e.g. "2026-05-30T18:30:00.000Z"
  // (which is May 31 00:00 IST). We shift back to IST before extracting the date.
  if (typeof val === 'string' && val.includes('T')) {
    const utcMs = new Date(val).getTime();
    if (!isNaN(utcMs)) {
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(utcMs + istOffset);
      const dd = String(istDate.getUTCDate()).padStart(2, '0');
      const mm = istDate.getUTCMonth(); // 0-indexed
      const yyyy = istDate.getUTCFullYear();
      return `${dd} ${MONTHS[mm]} ${yyyy}`;
    }
  }

  // ── Case 3: fallback for anything else ──
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  // Use IST offset here too
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(d.getTime() + istOffset);
  const dd = String(istDate.getUTCDate()).padStart(2, '0');
  const mm = istDate.getUTCMonth();
  const yyyy = istDate.getUTCFullYear();
  return `${dd} ${MONTHS[mm]} ${yyyy}`;
}