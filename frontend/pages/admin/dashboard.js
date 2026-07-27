import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import CountUp from '../../components/ui/CountUp';
import api, { getUser } from '../../lib/api';

/* ────────────────────────────────────────────────────────────────────
   COMMAND CONSOLE — dark navy glass. Matches the institute console so both
   portals read as one product. Palette: navy + cyan, with the app's existing
   status colours kept only where they carry meaning (paid / overdue / pending).

   Contained panel, not a full-bleed background, so the dark treatment cannot
   leak onto the light table pages (institutes, leads).
   ─────────────────────────────────────────────────────────────────── */

const C = {
  navy: '#11245d',
  navyDeep: '#0a1844',
  navyMid: '#0d1e55',
  cyan: '#5ce1e6',
  text: '#ffffff',
  dim: 'rgba(198, 214, 248, 0.72)',
  faint: 'rgba(168, 190, 236, 0.52)',
  hair: 'rgba(92, 225, 230, 0.14)',
};
const EASE = 'cubic-bezier(0.16,1,0.3,1)';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const OK_GREEN = '#34d399';
const BAD_RED = '#fca5a5';
const WARN = '#f0c040';

/* Status chips — same three states, retuned for a dark surface. */
const STATUS_STYLE = {
  paid:    { bg: 'rgba(52,211,153,0.14)', text: '#34d399', label: 'Paid' },
  overdue: { bg: 'rgba(252,165,165,0.14)', text: '#fca5a5', label: 'Overdue' },
  pending: { bg: 'rgba(240,192,64,0.14)',  text: '#f0c040', label: 'Pending' },
};

const delay = (s) => ({ animationDelay: s + 's' });
const tone = (c, i) => ({ '--tone': c, animationDelay: i * 0.05 + 's' });
const chipStyle = (s) => ({ background: s.bg, color: s.text });
const monthCell = (isSel) => ({
  background: isSel ? C.cyan : 'transparent',
  color: isSel ? C.navyDeep : '#fff',
  fontWeight: isSel ? 800 : 600,
});

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbOffline, setDbOffline] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthRevenue, setMonthRevenue] = useState(null);
  const [monthLoading, setMonthLoading] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const router = useRouter();
  const user = typeof window !== 'undefined' ? getUser() : null;

  const handleMonthSelect = (year, monthIdx) => {
    setSelectedMonth(`${year}-${String(monthIdx + 1).padStart(2, '0')}`);
    setShowMonthPicker(false);
  };

  const selectedLabel = (() => {
    const [y, m] = selectedMonth.split('-');
    return `${MONTHS[parseInt(m) - 1]} ${y}`;
  })();

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'admin') { router.push('/admin/login'); return; }
    fetchData();
  }, []);

  useEffect(() => { fetchMonthRevenue(selectedMonth); }, [selectedMonth]);

  useEffect(() => {
    if (!showMonthPicker) return;
    const handler = (e) => { if (!e.target.closest('[data-month-picker]')) setShowMonthPicker(false); };
    const keys = (e) => { if (e.key === 'Escape') setShowMonthPicker(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keys);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keys);
    };
  }, [showMonthPicker]);

  const fetchMonthRevenue = async (month) => {
    setMonthLoading(true);
    try {
      const res = await api.get(`/api/admin/revenue?month=${month}`);
      setMonthRevenue(res.data);
    } catch { setMonthRevenue(null); }
    finally { setMonthLoading(false); }
  };

  const fetchData = async () => {
    try {
      const [statsRes, instRes] = await Promise.all([
        api.get('/api/admin/dashboard'),
        api.get('/api/admin/institutes'),
      ]);
      setStats(statsRes.data);
      setInstitutes(instRes.data.slice(0, 5));
    } catch (e) {
      console.error(e);
      setDbOffline(true);
    } finally { setLoading(false); }
  };

  const fmt = (n) => n?.toLocaleString('en-IN') ?? '—';

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();
  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const kpis = [
    { label: 'Active Institutes', value: fmt(stats?.activeInstitutes), raw: stats?.activeInstitutes, tone: C.cyan,
      href: '/admin/institutes',
      icon: <><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3"/></> },
    { label: 'Total Institutes', value: fmt(stats?.totalInstitutes), raw: stats?.totalInstitutes, tone: '#8ab4f8',
      href: '/admin/institutes',
      icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></> },
    { label: 'New Requests', value: fmt(stats?.newLeads), raw: stats?.newLeads, tone: '#c4b5fd',
      href: '/admin/leads',
      icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></> },
    { label: "This Month's Overdue", value: '₹' + fmt(stats?.overduePayments), raw: stats?.overduePayments, prefix: '₹', tone: BAD_RED,
      href: '/admin/institutes',
      icon: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></> },
    { label: 'Lifetime Revenue', value: '₹' + fmt(stats?.totalRevenue), raw: stats?.totalRevenue, prefix: '₹', tone: OK_GREEN,
      href: '/admin/institutes',
      icon: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></> },
    { label: 'New This Month', value: fmt(stats?.newInstitutesThisMonth), raw: stats?.newInstitutesThisMonth, tone: '#7dd3fc',
      href: '/admin/institutes',
      icon: <><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></> },
  ];

  const quickActions = [
    { label: 'Add Institute', action: () => router.push('/admin/institutes?action=new'),
      icon: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></> },
    { label: `View Leads (${stats?.newLeads || 0} new)`, action: () => router.push('/admin/leads'),
      icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></> },
    { label: 'Manage Institutes', action: () => router.push('/admin/institutes'),
      icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></> },
  ];

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="console" role="status" aria-label="Loading dashboard">
          <span className="aurora a1" aria-hidden="true" />
          <span className="aurora a2" aria-hidden="true" />
          <div className="sk sk-head" />
          <div className="sk-grid">
            {[1,2,3,4,5,6].map(i => <div key={i} className="sk sk-card" style={delay(i*0.06)} />)}
          </div>
          <div className="sk sk-rev" />
          <div className="sk-grid two">
            {[1,2].map(i => <div key={i} className="sk sk-wide" style={delay(i*0.09)} />)}
          </div>
        </div>
        <style jsx>{`
          .console { position:relative; overflow:hidden; border-radius:26px; padding:18px;
            display:flex; flex-direction:column; gap:12px;
            background: linear-gradient(160deg, ${C.navyDeep} 0%, ${C.navy} 48%, ${C.navyMid} 100%);
            box-shadow: 0 26px 60px rgba(8,18,52,0.42), inset 0 1px 0 rgba(255,255,255,0.10); }
          .aurora { position:absolute; border-radius:50%; pointer-events:none; }
          .a1 { top:-120px; right:-80px; width:320px; height:320px;
            background: radial-gradient(circle, rgba(92,225,230,0.20), transparent 70%); }
          .a2 { bottom:-150px; left:-100px; width:300px; height:300px;
            background: radial-gradient(circle, rgba(92,225,230,0.10), transparent 72%); }
          .sk { position:relative; overflow:hidden; border-radius:18px;
            background: rgba(255,255,255,0.055); border:1px solid ${C.hair}; }
          .sk::after { content:''; position:absolute; inset:0; transform:translateX(-100%);
            background: linear-gradient(90deg, transparent, rgba(92,225,230,0.10), transparent);
            animation: sheen 1.4s ${EASE} infinite; }
          .sk-head { height:96px; }
          .sk-grid { position:relative; display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
          .sk-grid.two { grid-template-columns:1fr; }
          .sk-card { height:98px; }
          .sk-rev { height:120px; border-radius:20px; }
          .sk-wide { height:200px; }
          @keyframes sheen { to { transform:translateX(100%); } }
          @media (min-width:760px){
            .console { padding:24px; gap:14px; }
            .sk-grid { grid-template-columns:repeat(3,1fr); gap:14px; }
            .sk-grid.two { grid-template-columns:1.6fr 1fr; }
            .sk-card { height:110px; }
          }
          @media (prefers-reduced-motion: reduce){ .sk::after { animation:none; } }
        `}</style>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="console">
        <span className="aurora a1" aria-hidden="true" />
        <span className="aurora a2" aria-hidden="true" />
        <span className="grid-lines" aria-hidden="true" />

        {dbOffline && (
          <div className="offline" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BAD_RED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Database is offline. Some data may not be available.
          </div>
        )}

        {/* ── Console head ── */}
        <header className="head">
          <div className="head-text">
            <p className="greet">{greeting}, Admin</p>
            <h2 className="name">Control Center</h2>
            <p className="date">
              <span className="live" aria-hidden="true" />
              {todayLabel}
            </p>
          </div>

          <div className="rev-badge">
            <p className="rb-l">Lifetime Revenue</p>
            <p className="rb-v">₹<CountUp value={stats?.totalRevenue || 0} /></p>
            <p className="rb-s"><CountUp value={stats?.activeInstitutes || 0} /> active institutes</p>
          </div>
        </header>

        {/* ── Bento ── */}
        <section className="bento" aria-label="Key figures">
          {kpis.map((k, i) => (
            <button
              key={k.label}
              type="button"
              className="tile kpi"
              style={tone(k.tone, i)}
              onClick={() => router.push(k.href)}
              aria-label={k.label + ': ' + k.value}
            >
              <span className="tile-edge" aria-hidden="true" />
              <span className="kpi-top">
                <span className="kpi-ico" aria-hidden="true">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={k.tone} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{k.icon}</svg>
                </span>
                <span className="kpi-lab">{k.label}</span>
              </span>
              <span className="kpi-val">
                {typeof k.raw === 'number' ? <CountUp value={k.raw} prefix={k.prefix || ''} /> : k.value}
              </span>
            </button>
          ))}
        </section>

        {/* ── Monthly revenue ── */}
        <section className="rev-card">
          <span className="rev-glow" aria-hidden="true" />
          <div className="rev-head">
            <p className="rev-title">Monthly Revenue</p>
            <div className="picker" data-month-picker>
              <button
                className="picker-btn"
                onClick={() => setShowMonthPicker(p => !p)}
                aria-haspopup="dialog"
                aria-expanded={showMonthPicker}
              >
                {selectedLabel} <span className="caret" aria-hidden="true">▾</span>
              </button>

              {showMonthPicker && (
                <>
                  {/* Scrim only on phones, where the popover becomes a centred
                      sheet instead of a box that could hang off a 360px screen. */}
                  <span className="picker-scrim" aria-hidden="true" />
                  <div className="picker-pop" role="dialog" aria-label="Choose month">
                    <div className="picker-yr">
                      <button onClick={() => setPickerYear(y => y - 1)} className="yr-nav" aria-label="Previous year">‹</button>
                      <span>{pickerYear}</span>
                      <button onClick={() => setPickerYear(y => y + 1)} className="yr-nav" aria-label="Next year">›</button>
                    </div>
                    <div className="picker-grid">
                      {MONTHS.map((m, i) => {
                        const val = `${pickerYear}-${String(i + 1).padStart(2, '0')}`;
                        const isSel = val === selectedMonth;
                        return (
                          <button
                            key={m}
                            className="month-cell"
                            style={monthCell(isSel)}
                            onClick={() => handleMonthSelect(pickerYear, i)}
                            aria-pressed={isSel}
                          >{m}</button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <p className="rev-value">
            {monthLoading ? <span className="rev-dots" aria-label="Loading">…</span> : <>₹<CountUp value={monthRevenue?.revenue ?? stats?.monthlyRevenue ?? 0} /></>}
          </p>
          <p className="rev-sub">
            {monthRevenue ? `${monthRevenue.paidCount ?? 0} paid institute${(monthRevenue.paidCount ?? 0) !== 1 ? 's' : ''} in ${selectedLabel}` : `Revenue for ${selectedLabel}`}
          </p>
        </section>

        {/* ── Bottom ── */}
        <section className="bottom">
          <article className="tile panel" style={tone(C.cyan, 0)}>
            <span className="tile-edge" aria-hidden="true" />
            <header className="t-head">
              <h3>Recent Institutes</h3>
              <button className="link" onClick={() => router.push('/admin/institutes')}>View all →</button>
            </header>

            <div className="inst-list">
              {institutes.map((inst) => {
                const s = STATUS_STYLE[inst.paymentStatus] || STATUS_STYLE.pending;
                return (
                  <button
                    key={inst._id}
                    type="button"
                    className="inst-row"
                    onClick={() => router.push('/admin/institutes')}
                    aria-label={(inst.instituteName || 'Institute') + ' — ' + s.label}
                  >
                    <span className="inst-avatar" aria-hidden="true">{(inst.instituteName || '?')[0].toUpperCase()}</span>
                    <span className="inst-meta">
                      <span className="inst-name">{inst.instituteName}</span>
                      <span className="inst-owner">{inst.ownerName} · ₹{inst.planAmount?.toLocaleString('en-IN')}</span>
                    </span>
                    <span className="chip" style={chipStyle(s)}>{s.label}</span>
                  </button>
                );
              })}
              {institutes.length === 0 && (
                <p className="empty">{dbOffline ? 'Database offline — cannot load institutes' : 'No institutes yet'}</p>
              )}
            </div>
          </article>

          <article className="tile panel" style={tone('#c4b5fd', 1)}>
            <span className="tile-edge" aria-hidden="true" />
            <header className="t-head"><h3>Quick Actions</h3></header>
            <div className="qa-col">
              {quickActions.map((a, i) => (
                <button key={a.label} className="qa" style={delay(i * 0.04)} onClick={a.action}>
                  <span className="qa-ico" aria-hidden="true">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{a.icon}</svg>
                  </span>
                  <span className="qa-label">{a.label}</span>
                  <span className="qa-arrow" aria-hidden="true">→</span>
                </button>
              ))}
            </div>
          </article>
        </section>
      </div>

      <style jsx>{`
        /* ── Console shell ──────────────────────────────────────────────── */
        .console { position:relative; overflow:hidden; border-radius:26px; padding:18px;
          display:flex; flex-direction:column; gap:14px;
          background: linear-gradient(160deg, ${C.navyDeep} 0%, ${C.navy} 48%, ${C.navyMid} 100%);
          box-shadow: 0 26px 60px rgba(8,18,52,0.42), inset 0 1px 0 rgba(255,255,255,0.10);
          animation: rise .55s ${EASE} both; }
        @keyframes rise { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform:none; } }
        @keyframes pop { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform:none; } }

        .aurora { position:absolute; border-radius:50%; pointer-events:none; }
        .a1 { top:-120px; right:-80px; width:320px; height:320px;
          background: radial-gradient(circle, rgba(92,225,230,0.22), transparent 70%); }
        .a2 { bottom:-150px; left:-100px; width:300px; height:300px;
          background: radial-gradient(circle, rgba(92,225,230,0.11), transparent 72%); }
        .grid-lines { position:absolute; inset:0; pointer-events:none; opacity:.5;
          background-image:
            linear-gradient(to right, rgba(92,225,230,0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(92,225,230,0.06) 1px, transparent 1px);
          background-size: 46px 46px;
          mask-image: radial-gradient(120% 90% at 50% 0%, #000 30%, transparent 75%);
          -webkit-mask-image: radial-gradient(120% 90% at 50% 0%, #000 30%, transparent 75%); }

        .offline { position:relative; display:flex; align-items:center; gap:8px;
          background:rgba(252,165,165,0.10); border:1px solid rgba(252,165,165,0.24);
          color:#fecaca; font-size:.8rem; font-weight:600; padding:11px 13px; border-radius:14px; }

        /* ── Head ───────────────────────────────────────────────────── */
        .head { position:relative; display:flex; align-items:center; justify-content:space-between; gap:14px;
          flex-wrap:wrap; padding-bottom:14px; border-bottom:1px solid ${C.hair}; }
        .head-text { min-width:0; }
        .greet { color:${C.faint}; font-size:.78rem; font-weight:500; margin:0; }
        .name { color:${C.text}; font-size: clamp(1.35rem, 5.6vw, 2rem); font-weight:800; margin:4px 0 6px;
          letter-spacing:-0.025em; line-height:1.08; text-shadow: 0 2px 18px rgba(92,225,230,0.14); }
        .date { display:flex; align-items:center; gap:7px; color:${C.dim}; font-size:.76rem; margin:0; }
        .live { width:6px; height:6px; border-radius:50%; background:${C.cyan}; flex-shrink:0;
          box-shadow:0 0 0 3px rgba(92,225,230,0.18); animation: beat 2.4s ease-in-out infinite; }
        @keyframes beat { 0%,100%{opacity:1} 50%{opacity:.35} }

        .rev-badge { flex-shrink:0; padding:11px 14px; border-radius:16px;
          background: linear-gradient(180deg, rgba(92,225,230,0.13), rgba(92,225,230,0.05));
          border:1px solid rgba(92,225,230,0.20); }
        .rb-l { color:${C.faint}; font-size:.62rem; text-transform:uppercase; letter-spacing:.1em; margin:0; }
        .rb-v { color:${C.cyan}; font-size: clamp(1.25rem, 5.6vw, 1.6rem); font-weight:800; margin:4px 0 2px;
          letter-spacing:-0.03em; font-variant-numeric: tabular-nums; }
        .rb-s { color:${C.faint}; font-size:.68rem; margin:0; }

        /* ── Bento tiles ──────────────────────────────────────────────── */
        .bento { position:relative; display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
        .tile { position:relative; overflow:hidden; border-radius:18px; padding:14px 13px;
          background: linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.028));
          border:1px solid ${C.hair};
          backdrop-filter: blur(14px) saturate(150%); -webkit-backdrop-filter: blur(14px) saturate(150%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 10px 26px rgba(6,14,40,0.24);
          animation: pop .5s ${EASE} both; }
        .tile-edge { position:absolute; top:0; left:14px; right:14px; height:1px;
          background: linear-gradient(90deg, transparent, var(--tone), transparent); opacity:.75; }

        .kpi { display:flex; flex-direction:column; align-items:flex-start; width:100%; text-align:left;
          cursor:pointer; min-height:44px; -webkit-tap-highlight-color:transparent;
          transition: transform .28s ${EASE}, border-color .28s ${EASE}, box-shadow .28s ${EASE}; }
        .kpi-top { display:flex; align-items:center; gap:7px; min-width:0; width:100%; }
        .kpi-ico { width:26px; height:26px; border-radius:9px; flex-shrink:0; display:flex; align-items:center; justify-content:center;
          background: rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.08); }
        .kpi-lab { color:${C.dim}; font-size:.67rem; font-weight:600; letter-spacing:.02em;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .kpi-val { color:${C.text}; font-size: clamp(1.35rem, 6.2vw, 1.85rem); font-weight:800; letter-spacing:-0.03em;
          line-height:1.05; margin-top:10px; font-variant-numeric: tabular-nums;
          max-width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        /* ── Revenue card ────────────────────────────────────────────── */
        /* Kept as the one green surface, because it is the money number — but
           dimmed and glassed so it belongs to the dark console. */
        .rev-card { position:relative; border-radius:20px; padding:17px; color:#fff; overflow:visible;
          background: linear-gradient(135deg, rgba(15,157,107,0.30), rgba(5,150,105,0.16));
          border:1px solid rgba(52,211,153,0.26);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 14px 34px rgba(6,14,40,0.28);
          animation: pop .5s ${EASE} both; }
        .rev-glow { position:absolute; top:-50px; right:-30px; width:180px; height:180px; border-radius:50%; pointer-events:none;
          background: radial-gradient(circle, rgba(52,211,153,0.22), transparent 70%); }
        .rev-head { position:relative; display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .rev-title { font-size:.8rem; font-weight:600; color:${C.dim}; margin:0; }
        .rev-value { position:relative; font-size: clamp(1.7rem, 8vw, 2.3rem); font-weight:800; margin:12px 0 3px;
          letter-spacing:-0.03em; font-variant-numeric: tabular-nums; color:#fff; }
        .rev-sub { position:relative; font-size:.72rem; color:${C.dim}; margin:0; }
        .rev-dots { opacity:.7; }

        /* ── Month picker ────────────────────────────────────────────── */
        .picker { position:relative; flex-shrink:0; }
        .picker-btn { background:rgba(255,255,255,0.10); border:1px solid rgba(255,255,255,0.18); color:#fff;
          font-size:.74rem; font-weight:700; padding:8px 12px; border-radius:11px; cursor:pointer;
          display:flex; align-items:center; gap:6px; min-height:38px; -webkit-tap-highlight-color:transparent;
          transition: background .2s ease; }
        .caret { font-size:.6rem; opacity:.85; }

        .picker-scrim { display:none; }
        .picker-pop { position:absolute; right:0; top:calc(100% + 8px); z-index:30; width:236px; padding:12px;
          border-radius:16px; background: linear-gradient(180deg, #12275f, #0b1c50);
          border:1px solid rgba(92,225,230,0.20);
          box-shadow: 0 22px 50px rgba(4,10,32,0.55), inset 0 1px 0 rgba(255,255,255,0.10);
          animation: pop .24s ${EASE} both; }
        .picker-yr { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;
          color:#fff; font-size:.82rem; font-weight:800; }
        .yr-nav { background:rgba(255,255,255,0.08); border:1px solid ${C.hair}; color:${C.cyan};
          width:30px; height:30px; border-radius:9px; cursor:pointer; font-size:1rem; line-height:1;
          display:flex; align-items:center; justify-content:center; }
        .picker-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
        .month-cell { border:1px solid ${C.hair}; border-radius:10px; padding:9px 0; font-size:.74rem;
          cursor:pointer; min-height:38px; transition: background .18s ease, transform .18s ${EASE}; }
        .month-cell:active { transform: scale(0.95); }

        /* ── Bottom panels ──────────────────────────────────────────── */
        .bottom { position:relative; display:grid; grid-template-columns:1fr; gap:12px; }
        .t-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px; }
        .t-head h3 { color:${C.text}; font-size:.88rem; font-weight:700; margin:0; }
        .link { background:rgba(255,255,255,0.07); border:1px solid ${C.hair}; color:${C.cyan};
          font-size:.72rem; font-weight:700; cursor:pointer; padding:6px 10px; border-radius:9px; flex-shrink:0;
          -webkit-tap-highlight-color:transparent; transition: background .2s ease, transform .2s ${EASE}; }
        .link:active { transform: scale(0.96); }

        .inst-list { display:flex; flex-direction:column; gap:8px; }
        .inst-row { display:flex; align-items:center; gap:11px; width:100%; text-align:left; cursor:pointer;
          min-height:56px; padding:9px 10px; border-radius:14px;
          background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06);
          -webkit-tap-highlight-color:transparent;
          transition: background .22s ease, transform .22s ${EASE}, border-color .22s ease; }
        .inst-avatar { width:36px; height:36px; border-radius:11px; flex-shrink:0; display:flex; align-items:center; justify-content:center;
          font-size:.86rem; font-weight:800; color:${C.navyDeep};
          background: linear-gradient(135deg, rgba(92,225,230,0.85), rgba(92,225,230,0.45)); }
        .inst-meta { display:flex; flex-direction:column; min-width:0; flex:1; }
        .inst-name { color:${C.text}; font-size:.84rem; font-weight:700;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .inst-owner { color:${C.faint}; font-size:.7rem; margin-top:2px;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .chip { flex-shrink:0; font-size:.64rem; font-weight:800; padding:5px 9px; border-radius:99px;
          text-transform:uppercase; letter-spacing:.04em; }
        .empty { color:${C.faint}; font-size:.78rem; text-align:center; padding:18px 0; margin:0; }

        .qa-col { display:flex; flex-direction:column; gap:9px; }
        .qa { display:flex; align-items:center; gap:10px; padding:12px 13px; border-radius:14px; cursor:pointer; text-align:left;
          min-height:50px; width:100%; -webkit-tap-highlight-color:transparent;
          background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.025));
          border:1px solid ${C.hair}; color:${C.text}; font-size:.82rem; font-weight:600;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
          animation: pop .5s ${EASE} both;
          transition: transform .25s ${EASE}, border-color .25s ${EASE}, box-shadow .25s ${EASE}; }
        .qa-ico { width:30px; height:30px; border-radius:10px; flex-shrink:0; display:flex; align-items:center; justify-content:center;
          background: rgba(92,225,230,0.12); border:1px solid rgba(92,225,230,0.18); }
        .qa-label { flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .qa-arrow { color:${C.faint}; flex-shrink:0; transition: transform .25s ${EASE}, color .25s ${EASE}; }

        /* ── Interaction ──────────────────────────────────────────────── */
        .kpi:active, .qa:active, .inst-row:active { transform: scale(0.975); }
        @media (hover: hover) and (pointer: fine) {
          .kpi:hover { transform: translateY(-4px); border-color: rgba(92,225,230,0.34);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), 0 18px 38px rgba(6,14,40,0.4), 0 0 0 1px rgba(92,225,230,0.12); }
          .qa:hover { transform: translateY(-3px); border-color: rgba(92,225,230,0.34);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), 0 14px 30px rgba(6,14,40,0.36); }
          .qa:hover .qa-arrow { transform: translateX(4px); color:${C.cyan}; }
          .inst-row:hover { background: rgba(92,225,230,0.09); border-color: rgba(92,225,230,0.22); }
          .link:hover, .picker-btn:hover { background: rgba(92,225,230,0.16); }
          .month-cell:hover { background: rgba(92,225,230,0.12); }
          .yr-nav:hover { background: rgba(92,225,230,0.16); }
        }
        .kpi:focus-visible, .qa:focus-visible, .link:focus-visible, .inst-row:focus-visible,
        .picker-btn:focus-visible, .month-cell:focus-visible, .yr-nav:focus-visible {
          outline:2px solid ${C.cyan}; outline-offset:2px; }

        /* ── Breakpoints ──────────────────────────────────────────────── */
        /* Below 520px the popover becomes a centred sheet — a 236px box anchored
           right could previously hang off the edge of a small screen. */
        @media (max-width:519px){
          .picker-scrim { display:block; position:fixed; inset:0; z-index:29;
            background: rgba(4,10,32,0.55); backdrop-filter: blur(2px); }
          .picker-pop { position:fixed; top:50%; left:50%; right:auto;
            transform: translate(-50%,-50%); width: min(300px, calc(100vw - 40px)); }
          .month-cell { min-height:44px; }
        }
        @media (min-width:760px){
          .console { padding:26px; gap:18px; border-radius:30px; }
          .head { padding-bottom:18px; }
          .bento { grid-template-columns:repeat(3,1fr); gap:14px; }
          .tile { padding:18px 17px; border-radius:20px; }
          .kpi-lab { font-size:.72rem; }
          .bottom { grid-template-columns:1.6fr 1fr; gap:14px; }
          .rev-card { padding:22px; }
        }

        @media (prefers-reduced-motion: reduce){
          .console, .tile, .qa, .rev-card, .picker-pop { animation:none; }
          .qa-arrow, .live { transition:none; animation:none; }
          .kpi:active, .qa:active, .inst-row:active, .month-cell:active { transform:none; }
        }
      `}</style>
    </AdminLayout>
  );
}
