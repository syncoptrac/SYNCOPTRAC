import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import CountUp from '../../components/ui/CountUp';
import api, { getUser } from '../../lib/api';

/* Design tokens */
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

const STATUS_STYLE = {
  paid:    { bg: 'rgba(16,185,129,0.12)', text: '#059669', label: 'Paid' },
  overdue: { bg: 'rgba(239,68,68,0.12)',  text: '#dc2626', label: 'Overdue' },
  pending: { bg: 'rgba(245,158,11,0.12)', text: '#d97706', label: 'Pending' },
};

/* Style helpers (single-brace usage) */
const delay = (s) => ({ animationDelay: s + 's' });
const accentCard = (a, i) => ({ '--accent': a, animationDelay: (i * 0.05) + 's' });
const chipStyle = (s) => ({ background: s.bg, color: s.text });
const monthCell = (isSel) => ({
  background: isSel ? C.navy : 'transparent',
  color: isSel ? '#fff' : C.ink,
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
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
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
    { label: 'Active Institutes', value: fmt(stats?.activeInstitutes), raw: stats?.activeInstitutes, accent: '#5ce1e6',
      icon: <><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3"/></> },
    { label: 'Total Institutes', value: fmt(stats?.totalInstitutes), raw: stats?.totalInstitutes, accent: '#1a73e8',
      icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></> },
    { label: 'New Requests', value: fmt(stats?.newLeads), raw: stats?.newLeads, accent: '#7c3aed',
      icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></> },
    { label: "This Month's Overdue", value: '₹' + fmt(stats?.overduePayments), raw: stats?.overduePayments, prefix: '₹', accent: '#dc2626',
      icon: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></> },
    { label: 'Lifetime Revenue', value: '₹' + fmt(stats?.totalRevenue), raw: stats?.totalRevenue, prefix: '₹', accent: '#059669',
      icon: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></> },
    { label: 'New This Month', value: fmt(stats?.newInstitutesThisMonth), raw: stats?.newInstitutesThisMonth, accent: '#0ea5e9',
      icon: <><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></> },
  ];

  const quickActions = [
    { label: 'Add Institute', accent: '#5ce1e6', action: () => router.push('/admin/institutes?action=new'),
      icon: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></> },
    { label: `View Leads (${stats?.newLeads || 0} new)`, accent: '#1a73e8', action: () => router.push('/admin/leads'),
      icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></> },
    { label: 'Manage Institutes', accent: '#7c3aed', action: () => router.push('/admin/institutes'),
      icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></> },
  ];

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="sk-hero" />
        <div className="sk-grid">
          {[1,2,3,4,5,6].map(i => <div key={i} className="sk-card" style={delay(i*0.07)} />)}
        </div>
        <div className="sk-bottom">
          <div className="sk-tall" />
          <div className="sk-tall short" />
        </div>
        <style jsx>{`
          .sk-hero { height:104px; border-radius:20px; background:#fff; border:1px solid ${C.line}; animation:pulse 1.5s ease-in-out infinite; }
          .sk-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; margin-top:16px; }
          .sk-card { height:118px; border-radius:18px; background:#fff; border:1px solid ${C.line}; animation:pulse 1.5s ease-in-out infinite; }
          .sk-bottom { display:grid; grid-template-columns:1fr; gap:14px; margin-top:16px; }
          .sk-tall { height:240px; border-radius:18px; background:#fff; border:1px solid ${C.line}; animation:pulse 1.5s ease-in-out infinite; }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
          @media (min-width:760px){ .sk-grid{grid-template-columns:repeat(3,1fr)} .sk-bottom{grid-template-columns:1.6fr 1fr} }
        `}</style>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="dash">

        {dbOffline && (
          <div className="offline">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Database is offline. Some data may not be available.
          </div>
        )}

        {/* Hero */}
        <section className="hero noise-overlay">
          <div className="hero-glow" />
          <div className="hero-row">
            <div>
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
        </section>

        {/* KPI cards */}
        <section className="kpis">
          {kpis.map((k, i) => (
            <article key={k.label} className="kpi" style={accentCard(k.accent, i)}>
              <span className="kpi-bar" />
              <div className="kpi-top">
                <div className="kpi-ico">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={k.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{k.icon}</svg>
                </div>
              </div>
              <p className="kpi-val">
                {typeof k.raw === 'number' ? <CountUp value={k.raw} prefix={k.prefix || ''} /> : k.value}
              </p>
              <p className="kpi-lab">{k.label}</p>
            </article>
          ))}
        </section>

        {/* Monthly revenue card with picker */}
        <section className="rev-card">
          <div className="rev-head">
            <p className="rev-title">Monthly Revenue</p>
            <div className="picker" data-month-picker>
              <button className="picker-btn" onClick={() => setShowMonthPicker(p => !p)}>
                {selectedLabel} <span className="caret">▾</span>
              </button>
              {showMonthPicker && (
                <div className="picker-pop">
                  <div className="picker-yr">
                    <button onClick={() => setPickerYear(y => y - 1)} className="yr-nav">‹</button>
                    <span>{pickerYear}</span>
                    <button onClick={() => setPickerYear(y => y + 1)} className="yr-nav">›</button>
                  </div>
                  <div className="picker-grid">
                    {MONTHS.map((m, i) => {
                      const val = `${pickerYear}-${String(i + 1).padStart(2, '0')}`;
                      const isSel = val === selectedMonth;
                      return (
                        <button key={m} className="month-cell" style={monthCell(isSel)} onClick={() => handleMonthSelect(pickerYear, i)}>{m}</button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="rev-value">
            {monthLoading ? '…' : <>₹<CountUp value={monthRevenue?.revenue ?? stats?.monthlyRevenue ?? 0} /></>}
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
                  <div key={inst._id} className="inst-row" onClick={() => router.push('/admin/institutes')}>
                    <div className="inst-avatar">{(inst.instituteName || '?')[0].toUpperCase()}</div>
                    <div className="inst-meta">
                      <p className="inst-name">{inst.instituteName}</p>
                      <p className="inst-owner">{inst.ownerName} · ₹{inst.planAmount?.toLocaleString('en-IN')}</p>
                    </div>
                    <span className="chip" style={chipStyle(s)}>{s.label}</span>
                  </div>
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
              {quickActions.map(a => (
                <button key={a.label} className="qa" style={accentCard(a.accent, 0)} onClick={a.action}>
                  <span className="qa-ico">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{a.icon}</svg>
                  </span>
                  <span className="qa-label">{a.label}</span>
                  <span className="qa-arrow">→</span>
                </button>
              ))}
            </div>
          </article>
        </section>
      </div>

      <style jsx>{`
        .dash { display:flex; flex-direction:column; gap:16px; animation: rise .5s ${EASE}; }
        @keyframes rise { from { opacity:0; transform: translateY(8px);} to { opacity:1; transform:none;} }
        @keyframes pop { from { opacity:0; transform: translateY(10px);} to { opacity:1; transform:none;} }

        .offline { display:flex; align-items:center; gap:8px; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2);
          color:#b91c1c; font-size:.82rem; font-weight:600; padding:11px 14px; border-radius:12px; }

        .hero { position:relative; overflow:hidden; border-radius:20px; padding:22px;
          background: linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 100%); box-shadow:0 14px 38px rgba(17,36,93,0.28); }
        .hero-glow { position:absolute; top:-70px; right:-50px; width:240px; height:240px; border-radius:50%;
          background: radial-gradient(circle, rgba(92,225,230,0.3), transparent 70%); }
        .hero-row { position:relative; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
        .hero-greet { color: rgba(255,255,255,0.7); font-size:.82rem; font-weight:500; margin:0; }
        .hero-name { color:#fff; font-size:1.5rem; font-weight:800; margin:2px 0 4px; letter-spacing:-0.02em; }
        .hero-date { color: rgba(255,255,255,0.6); font-size:.78rem; margin:0; }
        .hero-rev { text-align:right; }
        .hero-rev-l { color: rgba(255,255,255,0.6); font-size:.7rem; text-transform:uppercase; letter-spacing:.08em; margin:0; }
        .hero-rev-v { color:${C.cyan}; font-size:1.6rem; font-weight:800; margin:3px 0; letter-spacing:-0.02em; }
        .hero-rev-s { color: rgba(255,255,255,0.6); font-size:.72rem; margin:0; }

        .kpis { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
        .kpi { position:relative; overflow:hidden; background:${C.card}; border:1px solid ${C.line}; border-radius:18px; padding:16px;
          box-shadow:0 2px 10px rgba(15,23,42,0.04); transition: transform .3s ${EASE}, box-shadow .3s ${EASE}; animation: pop .45s ${EASE} both; }
        .kpi:hover { transform: translateY(-4px); box-shadow:0 16px 34px color-mix(in srgb, var(--accent) 18%, transparent); }
        .kpi-bar { position:absolute; top:0; left:0; right:0; height:3px; background: linear-gradient(90deg, var(--accent), transparent); }
        .kpi-ico { width:38px; height:38px; border-radius:11px; display:flex; align-items:center; justify-content:center;
          background: color-mix(in srgb, var(--accent) 14%, white); margin-bottom:12px; }
        .kpi-val { font-size:1.4rem; font-weight:800; color:${C.ink}; margin:0; letter-spacing:-0.02em; }
        .kpi-lab { font-size:.76rem; color:${C.sub}; font-weight:600; margin:3px 0 0; }

        .rev-card { position:relative; background: linear-gradient(135deg,#0f9d6b,#059669); border-radius:18px; padding:18px; color:#fff;
          box-shadow:0 12px 30px rgba(5,150,105,0.28); overflow:visible; }
        .rev-head { display:flex; align-items:center; justify-content:space-between; }
        .rev-title { font-size:.82rem; font-weight:600; opacity:.9; margin:0; }
        .picker { position:relative; }
        .picker-btn { background:rgba(255,255,255,0.18); border:none; color:#fff; font-size:.74rem; font-weight:700; padding:6px 11px;
          border-radius:9px; cursor:pointer; display:flex; align-items:center; gap:5px; }
        .picker-btn:hover { background:rgba(255,255,255,0.28); }
        .caret { font-size:.6rem; }
        .picker-pop { position:absolute; right:0; top:115%; z-index:30; width:230px; background:#fff; border-radius:14px; padding:12px;
          box-shadow:0 18px 44px rgba(15,23,42,0.22); border:1px solid ${C.line}; }
        .picker-yr { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; color:${C.ink}; font-weight:700; font-size:.85rem; }
        .yr-nav { background:rgba(15,23,42,0.05); border:none; width:26px; height:26px; border-radius:8px; cursor:pointer; color:${C.ink}; font-size:1rem; line-height:1; }
        .yr-nav:hover { background:rgba(15,23,42,0.1); }
        .picker-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
        .month-cell { border:none; border-radius:9px; padding:8px 0; font-size:.76rem; font-weight:600; cursor:pointer; transition: background .15s ease; }
        .month-cell:hover { background:rgba(15,23,42,0.06); }
        .rev-value { font-size:2rem; font-weight:800; margin:12px 0 2px; letter-spacing:-0.02em; }
        .rev-sub { font-size:.74rem; opacity:.85; margin:0; }

        .bottom { display:grid; grid-template-columns:1fr; gap:14px; }
        .panel { background:${C.card}; border:1px solid ${C.line}; border-radius:18px; padding:18px; box-shadow:0 2px 10px rgba(15,23,42,0.04); }
        .panel-h { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
        .panel-h h3 { font-size:.95rem; font-weight:700; color:${C.ink}; margin:0; }
        .link { background:none; border:none; color:#1a73e8; font-size:.78rem; font-weight:600; cursor:pointer; padding:0; }
        .link:hover { text-decoration:underline; }

        .inst-list { display:flex; flex-direction:column; gap:6px; }
        .inst-row { display:flex; align-items:center; gap:12px; padding:10px; border-radius:12px; cursor:pointer; transition: background .18s ease; }
        .inst-row:hover { background:rgba(15,23,42,0.03); }
        .inst-avatar { width:38px; height:38px; border-radius:11px; flex-shrink:0; display:flex; align-items:center; justify-content:center;
          font-weight:800; color:${C.navy}; background: linear-gradient(135deg, rgba(92,225,230,0.5), rgba(92,225,230,0.2)); }
        .inst-meta { flex:1; min-width:0; }
        .inst-name { font-size:.86rem; font-weight:700; color:${C.ink}; margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .inst-owner { font-size:.74rem; color:${C.faint}; margin:2px 0 0; }
        .chip { font-size:.68rem; font-weight:700; padding:4px 10px; border-radius:99px; flex-shrink:0; }
        .empty { text-align:center; color:${C.faint}; font-size:.82rem; padding:24px 0; }

        .qa-col { display:flex; flex-direction:column; gap:10px; }
        .qa { display:flex; align-items:center; gap:11px; padding:13px; border-radius:13px; cursor:pointer; text-align:left; width:100%;
          background:${C.card}; border:1px solid ${C.line}; font-size:.84rem; font-weight:600; color:${C.ink};
          transition: transform .25s ${EASE}, box-shadow .25s ${EASE}, border-color .25s ${EASE}; }
        .qa:hover { transform: translateX(3px); border-color: color-mix(in srgb, var(--accent) 38%, transparent);
          box-shadow:0 10px 24px color-mix(in srgb, var(--accent) 15%, transparent); }
        .qa-ico { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0;
          background: color-mix(in srgb, var(--accent) 14%, white); }
        .qa-label { flex:1; }
        .qa-arrow { color:${C.faint}; }

        @media (min-width:760px){
          .kpis { grid-template-columns:repeat(3,1fr); gap:16px; }
          .bottom { grid-template-columns:1.6fr 1fr; }
          .hero-name { font-size:1.7rem; }
        }
      `}</style>
    </AdminLayout>
  );
}