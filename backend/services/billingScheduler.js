// ============================================================================
// Dependency-free monthly scheduler for website-service billing.
// Fires on the 1st of every month at 09:00 IST and emails active institutes.
// Uses setTimeout (re-armed after each run) so no external cron lib is needed.
// ============================================================================
const { sendMonthlyBills } = require('./billing');

const TZ = 'Asia/Kolkata';
const RUN_HOUR_IST = 9; // 09:00 IST on the 1st of each month

// Current wall-clock parts in IST.
function nowPartsIST() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const p = {};
  for (const part of fmt.formatToParts(new Date())) p[part.type] = part.value;
  return {
    year: Number(p.year), month: Number(p.month), day: Number(p.day),
    hour: Number(p.hour === '24' ? '0' : p.hour),
    minute: Number(p.minute), second: Number(p.second),
  };
}

// Milliseconds from now until the next 1st-of-month 09:00 IST.
function msUntilNextRun() {
  const ist = nowPartsIST();
  // IST is UTC+5:30 (no DST), so an IST wall time maps to a fixed UTC instant.
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

  // Build the next target: 1st of next month at RUN_HOUR_IST:00 IST.
  let year = ist.year;
  let month = ist.month; // 1-12

  // If we're still before the run time on the 1st, target is today.
  const beforeRunToday = ist.day === 1 &&
    (ist.hour < RUN_HOUR_IST || (ist.hour === RUN_HOUR_IST && ist.minute === 0 && ist.second === 0));

  if (!beforeRunToday) {
    month += 1;
    if (month > 12) { month = 1; year += 1; }
  }

  // Target instant (UTC epoch) for year-month-01 RUN_HOUR:00:00 IST.
  const targetUtcMs = Date.UTC(year, month - 1, 1, RUN_HOUR_IST, 0, 0) - IST_OFFSET_MS;
  const delay = targetUtcMs - Date.now();
  return delay > 0 ? delay : 60 * 1000; // safety floor
}

function scheduleNext() {
  const delay = msUntilNextRun();
  const runAt = new Date(Date.now() + delay);
  console.log(`[billing] Next monthly billing run scheduled for ${runAt.toISOString()} (UTC).`);

  // setTimeout caps at ~24.8 days, so chunk long waits.
  const MAX = 2 ** 31 - 1;
  if (delay > MAX) {
    setTimeout(scheduleNext, MAX);
    return;
  }

  setTimeout(async () => {
    try {
      await sendMonthlyBills({ trigger: 'scheduled' });
    } catch (err) {
      console.error('[billing] Scheduled run failed:', err.message);
    } finally {
      scheduleNext(); // re-arm for the following month
    }
  }, delay);
}

// Start the recurring schedule. Safe to call once at server boot.
function startBillingScheduler() {
  if (global.__billingSchedulerStarted) return;
  global.__billingSchedulerStarted = true;
  scheduleNext();
}

module.exports = { startBillingScheduler, msUntilNextRun };
