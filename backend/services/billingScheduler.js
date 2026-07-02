// ============================================================================
// Dependency-free DAILY scheduler for website-service billing.
// Runs every day at 09:00 IST. billing.js then charges only the institutes
// whose billingDay matches that day (with last-day-of-month safety), so every
// institute is billed on its own date, each month, automatically.
// ============================================================================
const { sendMonthlyBills } = require('./billing');

const TZ = 'Asia/Kolkata';
const RUN_HOUR_IST = 9; // 09:00 IST daily

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

// Milliseconds until the next 09:00 IST (today if still before 9, else tomorrow).
function msUntilNextRun() {
  const ist = nowPartsIST();
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000; // IST = UTC+5:30, no DST
  let targetUtcMs = Date.UTC(ist.year, ist.month - 1, ist.day, RUN_HOUR_IST, 0, 0) - IST_OFFSET_MS;
  if (targetUtcMs - Date.now() <= 0) {
    targetUtcMs += 24 * 60 * 60 * 1000; // already past 9 AM today -> tomorrow
  }
  const delay = targetUtcMs - Date.now();
  return delay > 0 ? delay : 60 * 1000; // safety floor
}

// Optional one-time override for the next run (testing), via BILLING_NEXT_OVERRIDE.
let __overrideConsumed = false;
function nextRunDelay() {
  const override = (process.env.BILLING_NEXT_OVERRIDE || '').trim();
  if (override && !__overrideConsumed) {
    __overrideConsumed = true;
    const parsed = Date.parse(override);
    const d = parsed - Date.now();
    if (!Number.isNaN(parsed) && d > 0) {
      console.log('[billing] Using BILLING_NEXT_OVERRIDE for the next run (one-time).');
      return d;
    }
    console.log(`[billing] BILLING_NEXT_OVERRIDE ignored (invalid or in the past): "${override}"`);
  }
  return msUntilNextRun();
}

function scheduleNext() {
  const delay = nextRunDelay();
  const runAt = new Date(Date.now() + delay);
  console.log(`[billing] Next daily billing check scheduled for ${runAt.toISOString()} (UTC).`);

  const MAX = 2 ** 31 - 1; // setTimeout cap (~24.8 days)
  if (delay > MAX) { setTimeout(scheduleNext, MAX); return; }

  setTimeout(async () => {
    try {
      await sendMonthlyBills({ trigger: 'scheduled' });
    } catch (err) {
      console.error('[billing] Daily run failed:', err.message);
    } finally {
      scheduleNext(); // re-arm for the next day
    }
  }, delay);
}

// Start the recurring schedule. Safe to call once at server boot.
function startBillingScheduler() {
  if (global.__billingSchedulerStarted) return;
  global.__billingSchedulerStarted = true;
  // Runs daily at 09:00 IST; billing.js decides which institutes are due today.
  scheduleNext();
}

module.exports = { startBillingScheduler, msUntilNextRun };
