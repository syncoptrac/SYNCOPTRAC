import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import CountUp from '../../components/ui/CountUp';
import api, { getUser } from '../../lib/api';

/* Design tokens — palette unchanged */
const C = {
  navy: '#11245d',
  navyLight: '#1c2f6e',
  cyan: '#5ce1e6',
  ink: '#0f172a',
  sub: '#64748b',
  faint: '#94a3b8',
  line: 'rgba(15,23,42,0.07)',
  card: '#ffffff',
};
const EASE = 'cubic-bezier(0.16,1,0.3,1)';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* Pre-computed accent sets instead of color-mix(), which Safari only supports
   from 16.2 — on older phones the tinted wells fell back to transparent. */
const A = {
  cyan:   { c: '#5ce1e6', tint: 'rgba(92,225,230,0.16)', glow: 'rgba(92,225,230,0.20)', edge: 'rgba(92,225,230,0.44)' },
  blue:   { c: '#1a73e8', tint: 'rgba(26,115,232,0.10)', glow: 'rgba(26,115,232,0.16)', edge: 'rgba(26,115,232,0.34)' },
  violet: { c: '#7c3aed', tint: 'rgba(124,58,237,0.10)', glow: 'rgba(124,58,237,0.16)', edge: 'rgba(124,58,237,0.34)' },
  red:    { c: '#dc2626', tint: 'rgba(220,38,38,0.10)',  glow: 'rgba(220,38,38,0.16)',  edge: 'rgba(220,38,38,0.34)' },
  green:  { c: '#059669', tint: 'rgba(5,150,105,0.10)',   glow: 'rgba(5,150,105,0.16)',   edge: 'rgba(5,150,105,0.34)' },
  sky:    { c: '#0ea5e9', tint: 'rgba(14,165,233,0.10)',  glow: 'rgba(14,165,233,0.16)',  edge: 'rgba(14,165,233,0.34)' },
};

const STATUS_STYLE = {
  paid:    { bg: 'rgba(16,185,129,0.12)', text: '#059669', label: 'Paid' },
  overdue: { bg: 'rgba(239,68,68,0.12)',  text: '#dc2626', label: 'Overdue' },
  pending: { bg: 'rgba(245,158,11,0.12)', text: '#d97706', label: 'Pending' },
};

/* Style helpers (single-brace usage) */
const delay = (s) => ({ animationDelay: s + 's' });
const accentCard = (a, i) => ({
  '--accent': a.c,
  '--tint': a.tint,
  '--glow': a.glow,
  '--edge': a.edge,
  animationDelay: i * 0.05 + 's',
});
const chipStyle = (s) => ({ background: s.bg, color: s.text });
const monthCell = (isSel) => ({
  background: isSel ? C.navy : 'transparent',
  color: isSel ? '#fff' : C.ink,
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
    /* Escape to dismiss — the popover was previously mouse-only. */
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

  /* Each KPI now routes somewhere useful instead of being a dead tile. */
  const kpis = [
    { label: 'Active Institutes', value: fmt(stats?.activeInstitutes), raw: stats?.activeInstitutes, accent: A.cyan,
      href: '/admin/institutes',
      icon: <><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3"/></> },
    { label: 'Total Institutes', value: fmt(stats?.totalInstitutes), raw: stats?.totalInstitutes, accent: A.blue,
      href: '/admin/institutes',
      icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></> },
    { label: 'New Requests', value: fmt(stats?.newLeads), raw: stats?.newLeads, accent: A.violet,
      href: '/admin/leads',
      icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></> },
    { label: "This Month's Overdue", value: '₹' + fmt(stats?.overduePayments), raw: stats?.overduePayments, prefix: '₹', accent: A.red,
      href: '/admin/institutes',
      icon: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></> },
    { label: 'Lifetime Revenue', value: '₹' + fmt(stats?.totalRevenue), raw: stats?.totalRevenue, prefix: '₹', accent: A.green,
      href: '/admin/institutes',
      icon: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></> },
    { label: 'New This Month', value: fmt(stats?.newInstitutesThisMonth), raw: stats?.newInstitutesThisMonth, accent: A.sky,
      href: '/admin/institutes',
      icon: <><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></> },
  ];

  const quickActions = [
    { label: 'Add Institute', accent: A.cyan, action: () => router.push('/admin/institutes?action=new'),
      icon: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></> },
    { label: `View Leads (${stats?.newLeads || 0} new)`, accent: A.blue, action: () => router.push('/admin/leads'),
      icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></> },
    { label: 'Manage Institutes', accent: A.violet, action: () => router.push('/admin/institutes'),
      icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></> },
  ];

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="sk-wrap" role="status" aria-label="Loading dashboard">
          <div className="sk sk-hero" />
          <div className="sk-grid">
            {[1,2,3,4,5,6].map(i => <div key={i} className="sk sk-card" style={delay(i*0.07)} />)}
          </div>
          <div className="sk sk-rev" />
          <div className="sk-bottom">
            <div className="sk sk-tall" />
            <div className="sk sk-tall short" />
          </div>
        </div>
        <style jsx>{`
          .sk-wrap { display:flex; flex-direction:column; gap:14px; }
          .sk { position:relative; overflow:hidden; background:#fff; border:1px solid ${C.line};
            box-shadow:0 2px 10px rgba(15,23,42,0.04); }
          .sk::after { content:''; position:absolute; inset:0; transform:translateX(-100%);
            background: linear-gradient(90deg, transparent, rgba(17,36,93,0.07), transparent);
            animation: sheen 1.4s ${EASE} infinite; }
          .sk-hero { height:140px; border-radius:22px; }
          .sk-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
          .sk-card { height:92px; border-radius:18px; }
          .sk-rev { height:118px; border-radius:20px; }
          .sk-bottom { display:grid; grid-template-columns:1fr; gap:14px; }
          .sk-tall { height:240px; border-radius:20px; }
          @keyframes sheen { to { transform:translateX(100%); } }
          @media (min-width:760px){
            .sk-grid{grid-template-columns:repeat(3,1fr); gap:16px}
            .sk-card{height:118px}
            .sk-bottom{grid-template-columns:1.6fr 1fr}
          }
          @media (prefers-reduced-motion: reduce){ .sk::after { animation:none; } }
        `}</style>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="dash">

        {dbOffline && (
          <div className="offline" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Database is offline. Some data may not be available.
          </div>
        )}

        {/* Hero */}
        <section className="hero noise-overlay">
          <span className="hero-glow" aria-hidden="true" />
          <span className="hero-glow two" aria-hidden="true" />
          <span className="hero-sheen" aria-hidden="true" />

          <div className="hero-row">
            <div className="hero-text">
              <p className="hero-greet">{greeting}, Admin</p>
              <h2 className="hero-name">Control Center</h2>
              <p className="hero-date">{todayLabel}</p>
            </div>
            <div className="hero-rev">
              <p className="hero-rev-l">Lifetime Revenue</p>
              <p className="hero-rev-v">₹<CountUp value={stats?.totalRevenue || 0} /></p>
              <p className="hero-rev-s"><CountUp value={stats?.activeInstitutes || 0} /> active institutes</p>
            </div>
          </div>

          {/* At-a-glance strip so the hero carries real information. */}
          <div className="glance">
            <div className="g-item">
              <span className="g-v"><CountUp value={stats?.activeInstitutes || 0} /></span>
              <span className="g-l">Active</span>
            </div>
            <span className="g-sep" aria-hidden="true" />
            <div className="g-item">
              <span className="g-v"><CountUp value={stats?.newLeads || 0} /></span>
              <span className="g-l">New requests</span>
            </div>
            <span className="g-sep" aria-hidden="true" />
            <div className="g-item">
              <span className="g-v"><CountUp value={stats?.newInstitutesThisMonth || 0} /></span>
              <span className="g-l">New this month</span>
            </div>
          </div>
        </section>

        {/* KPI cards — now tappable */}
        <section className="kpis" aria-label="Key figures">
          {kpis.map((k, i) => (
            <button
              key={k.label}
              type="button"
              className="kpi"
              style={accentCard(k.accent, i)}
              onClick={() => router.push(k.href)}
              aria-label={k.label + ': ' + k.value}
            >
              <span className="kpi-bar" aria-hidden="true" />
              <span className="kpi-ico" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={k.accent.c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{k.icon}</svg>
              </span>
              <span className="kpi-body">
                <span className="kpi-val">
                  {typeof k.raw === 'number' ? <CountUp value={k.raw} prefix={k.prefix || ''} /> : k.value}
                </span>
                <span className="kpi-lab">{k.label}</span>
              </span>
            </button>
          ))}
        </section>

        {/* Monthly revenue card with picker */}
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
                  {/* Scrim only exists on phones, where the popover becomes a
                      centred sheet instead of a 230px box that could hang off
                      the right edge of a 360px screen. */}
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

        {/* Bottom grid */}
        <section className="bottom">
          {/* Recent institutes */}
          <article className="panel">
            <header className="panel-h">
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

          {/* Quick actions */}
          <article className="panel">
            <header className="panel-h"><h3>Quick Actions</h3></header>
            <div className="qa-col">
              {quickActions.map((a, i) => (
                <button key={a.label} className="qa" style={accentCard(a.accent, i)} onClick={a.action}>
                  <span className="qa-ico" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a.accent.c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{a.icon}</svg>
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
        .dash { display:flex; flex-direction:column; gap:14px; animation: rise .5s ${EASE} both; }
        @keyframes rise { from { opacity:0; transform: translateY(8px);} to { opacity:1; transform:none;} }
        @keyframes pop { from { opacity:0; transform: translateY(10px);} to { opacity:1; transform:none;} }

        .offline { display:flex; align-items:center; gap:8px; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2);
          color:#b91c1c; font-size:.82rem; font-weight:600; padding:11px 14px; border-radius:14px; }

        /* ── Hero ─────────────────────────────────────────────────────── */
        .hero { position:relative; overflow:hidden; border-radius:22px; padding:20px 18px 0;
          background: linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 100%);
          box-shadow:0 18px 44px rgba(17,36,93,0.30), inset 0 1px 0 rgba(255,255,255,0.14); }
        .hero-glow { position:absolute; top:-74px; right:-52px; width:250px; height:250px; border-radius:50%;
          background: radial-gradient(circle, rgba(92,225,230,0.32), transparent 70%); pointer-events:none; }
        .hero-glow.two { top:auto; bottom:-120px; right:auto; left:-80px; width:230px; height:230px;
          background: radial-gradient(circle, rgba(92,225,230,0.15), transparent 72%); }
        .hero-sheen { position:absolute; top:0; left:0; right:0; height:48%; pointer-events:none;
          background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0)); }

        .hero-row { position:relative; display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap; }
        .hero-text { min-width:0; }
        .hero-greet { color: rgba(255,255,255,0.72); font-size:.82rem; font-weight:500; margin:0; }
        .hero-name { color:#fff; font-size: clamp(1.3rem, 5.4vw, 1.75rem); font-weight:800; margin:3px 0 5px; letter-spacing:-0.02em; line-height:1.12; }
        .hero-date { color: rgba(255,255,255,0.6); font-size:.78rem; margin:0; }
        .hero-rev { text-align:left; }
        .hero-rev-l { color: rgba(255,255,255,0.6); font-size:.68rem; text-transform:uppercase; letter-spacing:.08em; margin:0; }
        .hero-rev-v { color:${C.cyan}; font-size: clamp(1.4rem, 6vw, 1.65rem); font-weight:800; margin:3px 0; letter-spacing:-0.02em;
          font-variant-numeric: tabular-nums; }
        .hero-rev-s { color: rgba(255,255,255,0.6); font-size:.72rem; margin:0; }

        .glance { position:relative; display:flex; align-items:stretch; gap:2px; margin:18px -18px 0;
          padding:12px 6px; border-top:1px solid rgba(255,255,255,0.12);
          background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)); }
        .g-item { flex:1 1 0; min-width:0; display:flex; flex-direction:column; align-items:center; gap:3px; padding:0 4px; }
        .g-v { color:#fff; font-size:.95rem; font-weight:800; letter-spacing:-0.01em; font-variant-numeric: tabular-nums; }
        .g-l { color: rgba(255,255,255,0.58); font-size:.63rem; font-weight:500; text-align:center;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
        .g-sep { width:1px; background: rgba(255,255,255,0.12); flex-shrink:0; }

        /* ── KPI cards ────────────────────────────────────────────────── */
        /* Compact row on mobile: six stacked cards used to push the revenue
           card and everything below it far off-screen. */
        .kpis { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
        .kpi { position:relative; overflow:hidden; display:flex; align-items:center; gap:11px; width:100%;
          min-height:44px; padding:13px 12px; text-align:left; cursor:pointer; -webkit-tap-highlight-color:transparent;
          background:${C.card}; border:1px solid ${C.line}; border-radius:18px;
          box-shadow:0 2px 10px rgba(15,23,42,0.04);
          transition: transform .28s ${EASE}, box-shadow .28s ${EASE}, border-color .28s ${EASE};
          animation: pop .45s ${EASE} both; }
        .kpi-bar { position:absolute; top:0; left:0; right:0; height:3px; background: linear-gradient(90deg, var(--accent), transparent); }
        .kpi-ico { width:38px; height:38px; border-radius:12px; flex-shrink:0; display:flex; align-items:center; justify-content:center;
          background: var(--tint); }
        .kpi-body { display:flex; flex-direction:column; min-width:0; }
        .kpi-val { font-size: clamp(1.1rem, 4.4vw, 1.4rem); font-weight:800; color:${C.ink}; letter-spacing:-0.02em;
          line-height:1.15; font-variant-numeric: tabular-nums; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .kpi-lab { font-size:.72rem; color:${C.sub}; font-weight:600; margin-top:1px;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        /* ── Revenue card ─────────────────────────────────────────────── */
        .rev-card { position:relative; background: linear-gradient(135deg,#0f9d6b,#059669); border-radius:20px; padding:18px; color:#fff;
          box-shadow:0 14px 34px rgba(5,150,105,0.26), inset 0 1px 0 rgba(255,255,255,0.18); overflow:visible; }
        .rev-glow { position:absolute; top:-50px; right:-30px; width:180px; height:180px; border-radius:50%; pointer-events:none;
          background: radial-gradient(circle, rgba(255,255,255,0.20), transparent 70%); }
        .rev-head { position:relative; display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .rev-title { font-size:.82rem; font-weight:600; opacity:.92; margin:0; }
        .picker { position:relative; flex-shrink:0; }
        .picker-btn { background:rgba(255,255,255,0.20); border:1px solid rgba(255,255,255,0.22); color:#fff; font-size:.75rem; font-weight:700;
          padding:8px 12px; border-radius:11px; cursor:pointer; display:flex; align-items:center; gap:6px; min-height:38px;
          -webkit-tap-highlight-color:transparent; transition: background .2s ease, transform .2s ${EASE}; }
        .picker-btn:active { transform: scale(0.97); }
        .caret { font-size:.6rem; }

        .picker-scrim { display:none; }
        .picker-pop { position:absolute; right:0; top:calc(100% + 8px); z-index:40; width:236px; background:#fff; border-radius:16px; padding:12px;
          box-shadow:0 22px 52px rgba(15,23,42,0.26); border:1px solid ${C.line};
          animation: pop .22s ${EASE} both; }
        .picker-yr { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; color:${C.ink}; font-weight:700; font-size:.88rem; }
        .yr-nav { background:rgba(15,23,42,0.05); border:none; width:34px; height:34px; border-radius:10px; cursor:pointer; color:${C.ink};
          font-size:1.05rem; line-height:1; -webkit-tap-highlight-color:transparent; }
        .picker-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
        .month-cell { border:none; border-radius:10px; padding:11px 0; font-size:.78rem; cursor:pointer;
          -webkit-tap-highlight-color:transparent; transition: background .15s ease; }

        .rev-value { position:relative; font-size: clamp(1.7rem, 7.5vw, 2rem); font-weight:800; margin:14px 0 2px; letter-spacing:-0.02em;
          font-variant-numeric: tabular-nums; }
        .rev-sub { position:relative; font-size:.74rem; opacity:.88; margin:0; }

        /* ── Panels ───────────────────────────────────────────────────── */
        .bottom { display:grid; grid-template-columns:1fr; gap:14px; }
        .panel { background:${C.card}; border:1px solid ${C.line}; border-radius:20px; padding:16px; box-shadow:0 2px 10px rgba(15,23,42,0.04); }
        .panel-h { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px; }
        .panel-h h3 { font-size:.95rem; font-weight:700; color:${C.ink}; margin:0; }
        .link { background:none; border:none; color:#1a73e8; font-size:.78rem; font-weight:600; cursor:pointer;
          padding:6px 2px; margin:-6px -2px; border-radius:8px; flex-shrink:0; -webkit-tap-highlight-color:transparent; }

        .inst-list { display:flex; flex-direction:column; gap:4px; }
        /* Real <button> now, so these rows are keyboard reachable. */
        .inst-row { display:flex; align-items:center; gap:12px; width:100%; padding:10px; border-radius:14px; cursor:pointer;
          background:transparent; border:1px solid transparent; text-align:left; min-height:56px;
          -webkit-tap-highlight-color:transparent; transition: background .18s ease, border-color .18s ease, transform .18s ${EASE}; }
        .inst-row:active { transform: scale(0.99); }
        .inst-avatar { width:40px; height:40px; border-radius:12px; flex-shrink:0; display:flex; align-items:center; justify-content:center;
          font-weight:800; font-size:.95rem; color:${C.navy}; background: linear-gradient(135deg, rgba(92,225,230,0.5), rgba(92,225,230,0.2)); }
        .inst-meta { flex:1; min-width:0; display:flex; flex-direction:column; }
        .inst-name { font-size:.88rem; font-weight:700; color:${C.ink}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .inst-owner { font-size:.74rem; color:${C.faint}; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .chip { font-size:.68rem; font-weight:700; padding:5px 10px; border-radius:99px; flex-shrink:0; }
        .empty { text-align:center; color:${C.faint}; font-size:.82rem; padding:24px 0; }

        .qa-col { display:flex; flex-direction:column; gap:10px; }
        .qa { display:flex; align-items:center; gap:11px; padding:13px; border-radius:16px; cursor:pointer; text-align:left; width:100%;
          min-height:52px; -webkit-tap-highlight-color:transparent;
          background:${C.card}; border:1px solid ${C.line}; font-size:.85rem; font-weight:600; color:${C.ink};
          transition: transform .25s ${EASE}, box-shadow .25s ${EASE}, border-color .25s ${EASE};
          animation: pop .45s ${EASE} both; }
        .qa-ico { width:36px; height:36px; border-radius:11px; display:flex; align-items:center; justify-content:center; flex-shrink:0;
          background: var(--tint); }
        .qa-label { flex:1; min-width:0; }
        .qa-arrow { color:${C.faint}; flex-shrink:0; transition: transform .25s ${EASE}, color .25s ${EASE}; }

        /* ── Interaction ──────────────────────────────────────────────── */
        .kpi:active, .qa:active { transform: scale(0.975); }
        @media (hover: hover) and (pointer: fine) {
          .kpi:hover { transform: translateY(-4px); border-color: var(--edge); box-shadow:0 16px 34px var(--glow); }
          .qa:hover { transform: translateX(3px); border-color: var(--edge); box-shadow:0 10px 24px var(--glow); }
          .qa:hover .qa-arrow { transform: translateX(3px); color: var(--accent); }
          .inst-row:hover { background:rgba(15,23,42,0.03); border-color:${C.line}; }
          .picker-btn:hover { background:rgba(255,255,255,0.30); }
          .yr-nav:hover { background:rgba(15,23,42,0.1); }
          .month-cell:hover { background:rgba(15,23,42,0.06); }
          .link:hover { text-decoration:underline; }
        }
        .kpi:focus-visible, .qa:focus-visible, .inst-row:focus-visible, .link:focus-visible,
        .picker-btn:focus-visible, .month-cell:focus-visible, .yr-nav:focus-visible {
          outline:2px solid ${C.navy}; outline-offset:2px; }

        /* ── Breakpoints ──────────────────────────────────────────────── */
        /* Phones: the month popover becomes a centred sheet so it can never sit
           half off-screen, which is what a right-anchored 236px box did at 360px. */
        @media (max-width:520px){
          .picker-scrim { display:block; position:fixed; inset:0; z-index:39; background:rgba(8,18,52,0.44); }
          .picker-pop { position:fixed; top:50%; left:50%; right:auto; transform:translate(-50%,-50%);
            width:min(300px, calc(100vw - 40px)); padding:14px; }
          .month-cell { padding:13px 0; font-size:.82rem; }
        }

        @media (min-width:760px){
          .dash { gap:16px; }
          .hero { padding:24px 22px 0; }
          .hero-rev { text-align:right; }
          .glance { margin:20px -22px 0; padding:14px 10px; gap:4px; }
          .g-v { font-size:1.05rem; }
          .g-l { font-size:.68rem; }
          .kpis { grid-template-columns:repeat(3,1fr); gap:16px; }
          .kpi { flex-direction:column; align-items:flex-start; gap:0; padding:16px; }
          .kpi-ico { margin-bottom:12px; }
          .kpi-lab { font-size:.76rem; }
          .bottom { grid-template-columns:1.6fr 1fr; }
          .panel { padding:18px; }
          .rev-card { padding:20px; }
        }

        @media (prefers-reduced-motion: reduce){
          .dash, .kpi, .qa, .picker-pop { animation:none; }
          .qa-arrow { transition:none; }
          .kpi:active, .qa:active, .inst-row:active, .picker-btn:active { transform:none; }
        }
      `}</style>
    </AdminLayout>
  );
}
