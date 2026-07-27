import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import InstituteLayout from '../../components/layout/InstituteLayout';
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
const SPRING = 'cubic-bezier(0.34,1.56,0.64,1)';

/* Accent sets are pre-computed instead of using color-mix(), which Safari only
   supports from 16.2 — on older phones the tinted icon wells fell back to
   transparent. Explicit rgba keeps them identical everywhere. */
const A = {
  blue:   { c: '#1a73e8', tint: 'rgba(26,115,232,0.10)',  glow: 'rgba(26,115,232,0.16)',  edge: 'rgba(26,115,232,0.34)' },
  green:  { c: '#059669', tint: 'rgba(5,150,105,0.10)',   glow: 'rgba(5,150,105,0.16)',   edge: 'rgba(5,150,105,0.34)' },
  red:    { c: '#dc2626', tint: 'rgba(220,38,38,0.10)',   glow: 'rgba(220,38,38,0.16)',   edge: 'rgba(220,38,38,0.34)' },
  amber:  { c: '#d97706', tint: 'rgba(217,119,6,0.10)',   glow: 'rgba(217,119,6,0.16)',   edge: 'rgba(217,119,6,0.34)' },
  violet: { c: '#7c3aed', tint: 'rgba(124,58,237,0.10)',  glow: 'rgba(124,58,237,0.16)',  edge: 'rgba(124,58,237,0.34)' },
};

/* Style helpers (single-brace usage avoids JSX-literal pitfalls) */
const delay = (s) => ({ animationDelay: s + 's' });
const wpct = (p) => ({ width: p + '%' });
const bg = (c) => ({ background: c });
const segStyle = (p, c) => ({ width: p + '%', background: c });
const accentCard = (a, i) => ({
  '--accent': a.c,
  '--tint': a.tint,
  '--glow': a.glow,
  '--edge': a.edge,
  animationDelay: i * 0.05 + 's',
});
const ringTrans = { transition: 'stroke-dashoffset 1.1s ' + EASE };

export default function InstituteDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'institute') { router.push('/institute/login'); return; }
    setUser(u);
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/api/sheets/dashboard-summary');
      setSummary(res.data.data);
    } catch (e) {
      console.error('Dashboard summary failed:', e?.response?.data || e.message);
      setSummary(null);
    } finally { setLoading(false); }
  };

  const fmt = (n) => (n ?? 0).toLocaleString('en-IN');

  /* Derived values */
  const totalStudents   = summary?.totalStudents ?? 0;
  const presentToday    = summary?.presentToday ?? 0;
  const absentToday     = summary?.absentToday ?? 0;
  const markedToday     = presentToday + absentToday;
  const attendanceRate  = markedToday > 0 ? Math.round((presentToday / markedToday) * 100) : 0;

  const totalFees       = summary?.totalFees ?? 0;
  const collectedFees   = summary?.collectedFees ?? 0;
  const pendingFees     = summary?.pendingFees ?? 0;
  const overdueStudents = summary?.overdueStudents ?? 0;
  const collectRate     = totalFees > 0 ? Math.round((collectedFees / totalFees) * 100) : 0;

  const newEnquiries       = summary?.newEnquiries ?? 0;
  const followUpEnquiries  = summary?.followUpEnquiries ?? 0;
  const convertedEnquiries = summary?.convertedEnquiries ?? 0;
  const enquiryTotal       = newEnquiries + followUpEnquiries + convertedEnquiries;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();
  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const R = 34;
  const CIRC = 2 * Math.PI * R;

  /* Each KPI is now a real navigation target — the number you tap takes you to
     the screen that explains it, which removes a whole hop through the dock. */
  const kpis = [
    { label: 'Total Students', value: fmt(totalStudents), raw: totalStudents, accent: A.blue,
      href: '/institute/students',
      icon: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/> },
    { label: 'Present Today', value: fmt(presentToday), raw: presentToday, accent: A.green,
      href: '/institute/attendance',
      sub: markedToday > 0 ? attendanceRate + '% attendance' : 'Not marked yet',
      icon: <><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></> },
    { label: 'Absent Today', value: fmt(absentToday), raw: absentToday, accent: A.red,
      href: '/institute/attendance',
      icon: <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></> },
    { label: 'Overdue Fees', value: '₹' + fmt(pendingFees), raw: pendingFees, prefix: '₹', accent: A.amber,
      href: '/institute/fees',
      sub: overdueStudents + (overdueStudents === 1 ? ' student overdue' : ' students overdue'),
      icon: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></> },
  ];

  const quickActions = [
    { label: 'Add Student',     href: '/institute/students',   accent: A.blue,   icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></> },
    { label: 'Mark Attendance', href: '/institute/attendance', accent: A.green,  icon: <><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></> },
    { label: 'Update Fees',     href: '/institute/fees',       accent: A.amber,  icon: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></> },
    { label: 'Enquiries',       href: '/institute/enquiries',  accent: A.violet, icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/> },
  ];

  const pipeline = [
    { label: 'New',       value: newEnquiries,       color: '#1a73e8' },
    { label: 'Follow-Up', value: followUpEnquiries,  color: '#d97706' },
    { label: 'Converted', value: convertedEnquiries, color: '#059669' },
  ];

  const go = (href) => router.push(href);

  if (loading) {
    return (
      <InstituteLayout title="Dashboard">
        <div className="sk-wrap" role="status" aria-label="Loading dashboard">
          <div className="sk sk-hero" />
          <div className="sk-grid">
            {[1,2,3,4].map(i => <div key={i} className="sk sk-card" style={delay(i*0.08)} />)}
          </div>
          <div className="sk-grid two">
            {[1,2].map(i => <div key={i} className="sk sk-tall" style={delay(i*0.1)} />)}
          </div>
        </div>
        <style jsx>{`
          .sk-wrap { display:flex; flex-direction:column; gap:14px; }
          /* Sheen sweep reads as "loading" without the harsh opacity blink. */
          .sk { position:relative; overflow:hidden; background:#fff; border:1px solid ${C.line};
            box-shadow:0 2px 10px rgba(15,23,42,0.04); }
          .sk::after { content:''; position:absolute; inset:0; transform:translateX(-100%);
            background: linear-gradient(90deg, transparent, rgba(17,36,93,0.07), transparent);
            animation: sheen 1.4s ${EASE} infinite; }
          .sk-hero { height:132px; border-radius:22px; }
          .sk-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
          .sk-grid.two { grid-template-columns:1fr; }
          .sk-card { height:92px; border-radius:18px; }
          .sk-tall { height:180px; border-radius:20px; }
          @keyframes sheen { to { transform:translateX(100%); } }
          @media (min-width:760px){
            .sk-grid{grid-template-columns:repeat(4,1fr); gap:16px}
            .sk-grid.two{grid-template-columns:1.35fr 1fr}
            .sk-card{height:118px}
          }
          @media (prefers-reduced-motion: reduce){ .sk::after { animation:none; } }
        `}</style>
      </InstituteLayout>
    );
  }

  return (
    <InstituteLayout title="Dashboard">
      <div className="dash">

        {/* Greeting hero */}
        <section className="hero noise-overlay">
          <span className="hero-glow" aria-hidden="true" />
          <span className="hero-glow two" aria-hidden="true" />
          <span className="hero-sheen" aria-hidden="true" />

          <div className="hero-row">
            <div className="hero-text">
              <p className="hero-greet">{greeting},</p>
              <h2 className="hero-name">{user?.instituteName || 'Institute'}</h2>
              <p className="hero-date">{todayLabel}</p>
            </div>

            <div className="ring" role="img" aria-label={'Attendance ' + attendanceRate + ' percent'}>
              <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
                <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                <circle cx="40" cy="40" r={R} fill="none" stroke={C.cyan} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - attendanceRate / 100)}
                  transform="rotate(-90 40 40)" style={ringTrans} />
              </svg>
              <div className="ring-c">
                <span className="ring-v"><CountUp value={attendanceRate} suffix="%" /></span>
                <span className="ring-l">Present</span>
              </div>
            </div>
          </div>

          {/* At-a-glance strip: the three numbers worth knowing before you tap
              anything, so the hero stops being decorative dead space. */}
          <div className="glance">
            <div className="g-item">
              <span className="g-v"><CountUp value={collectRate} suffix="%" /></span>
              <span className="g-l">Fees collected</span>
            </div>
            <span className="g-sep" aria-hidden="true" />
            <div className="g-item">
              <span className="g-v">{markedToday > 0 ? fmt(markedToday) + '/' + fmt(totalStudents) : '—'}</span>
              <span className="g-l">Marked today</span>
            </div>
            <span className="g-sep" aria-hidden="true" />
            <div className="g-item">
              <span className="g-v"><CountUp value={newEnquiries} /></span>
              <span className="g-l">New enquiries</span>
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
              onClick={() => go(k.href)}
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
                {k.sub && <span className="kpi-sub">{k.sub}</span>}
              </span>
            </button>
          ))}
        </section>

        {/* Lower grid */}
        <section className="lower">
          {/* Fee overview */}
          <article className="panel">
            <header className="panel-h">
              <h3>Fee Overview</h3>
              <button onClick={() => go('/institute/fees')} className="link">Manage →</button>
            </header>
            <div className="collect-top">
              <div>
                <p className="big">₹<CountUp value={collectedFees} /></p>
                <p className="muted">collected of ₹{fmt(totalFees)}</p>
              </div>
              <span className="pct"><CountUp value={collectRate} suffix="%" /></span>
            </div>
            <div className="track" role="img" aria-label={'Fees collected ' + collectRate + ' percent'}>
              <span className="fill" style={wpct(collectRate)} />
            </div>
            <div className="fee-rows">
              <div className="fee-row"><span className="dot" style={bg('#059669')} />Paid<b>₹<CountUp value={collectedFees} /></b></div>
              <div className="fee-row"><span className="dot" style={bg('#dc2626')} />Overdue Students<b><CountUp value={overdueStudents} /></b></div>
            </div>
          </article>

          {/* Enquiry pipeline */}
          <article className="panel">
            <header className="panel-h">
              <h3>Enquiry Pipeline</h3>
              <button onClick={() => go('/institute/enquiries')} className="link">View →</button>
            </header>
            <div className="seg">
              {enquiryTotal > 0
                ? pipeline.map(p => p.value > 0 && <span key={p.label} style={segStyle((p.value/enquiryTotal)*100, p.color)} />)
                : <span style={segStyle(100, 'rgba(15,23,42,0.06)')} />}
            </div>
            <div className="pipe-rows">
              {pipeline.map(p => (
                <div key={p.label} className="pipe-row">
                  <span className="dot" style={bg(p.color)} />
                  <span className="pipe-l">{p.label}</span>
                  <b><CountUp value={p.value} /></b>
                </div>
              ))}
            </div>
            {enquiryTotal === 0 && <p className="panel-empty">No enquiries yet</p>}
          </article>
        </section>

        {/* Quick actions */}
        <section className="qa-wrap">
          <h3 className="qa-title">Quick Actions</h3>
          <div className="qa-grid">
            {quickActions.map((a, i) => (
              <button key={a.label} className="qa" style={accentCard(a.accent, i)} onClick={() => go(a.href)}>
                <span className="qa-ico" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a.accent.c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{a.icon}</svg>
                </span>
                <span className="qa-l">{a.label}</span>
                <span className="qa-arrow" aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
        .dash { display:flex; flex-direction:column; gap:14px; animation: rise .5s ${EASE} both; }
        @keyframes rise { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform:none; } }
        @keyframes pop { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform:none; } }

        /* ── Hero ─────────────────────────────────────────────────────── */
        .hero { position:relative; overflow:hidden; border-radius:22px; padding:20px 18px 0;
          background: linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 100%);
          box-shadow: 0 18px 44px rgba(17,36,93,0.30), inset 0 1px 0 rgba(255,255,255,0.14); }
        .hero-glow { position:absolute; top:-70px; right:-46px; width:230px; height:230px; border-radius:50%;
          background: radial-gradient(circle, rgba(92,225,230,0.34), transparent 70%); pointer-events:none; }
        .hero-glow.two { top:auto; bottom:-110px; right:auto; left:-70px; width:220px; height:220px;
          background: radial-gradient(circle, rgba(92,225,230,0.16), transparent 72%); }
        .hero-sheen { position:absolute; top:0; left:0; right:0; height:48%; pointer-events:none;
          background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0)); }

        .hero-row { position:relative; display:flex; align-items:center; justify-content:space-between; gap:14px; }
        .hero-text { min-width:0; }
        .hero-greet { color: rgba(255,255,255,0.72); font-size:.82rem; font-weight:500; margin:0; }
        /* clamp() instead of a breakpoint jump — a long institute name scales
           down smoothly instead of wrapping into the ring on mid-size phones. */
        .hero-name { color:#fff; font-size: clamp(1.28rem, 5.4vw, 1.75rem); font-weight:800; margin:3px 0 5px;
          letter-spacing:-0.02em; line-height:1.12; overflow-wrap:anywhere; }
        .hero-date { color: rgba(255,255,255,0.6); font-size:.78rem; margin:0; }

        .ring { position:relative; flex-shrink:0; width:80px; height:80px; }
        .ring-c { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
        .ring-v { color:#fff; font-size:1.05rem; font-weight:800; line-height:1; font-variant-numeric: tabular-nums; }
        .ring-l { color: rgba(255,255,255,0.62); font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; margin-top:2px; }

        .glance { position:relative; display:flex; align-items:stretch; gap:2px; margin:18px -18px 0;
          padding:12px 6px calc(12px + env(safe-area-inset-bottom, 0px)); border-top:1px solid rgba(255,255,255,0.12);
          background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)); }
        .g-item { flex:1 1 0; min-width:0; display:flex; flex-direction:column; align-items:center; gap:3px; padding:0 4px; }
        .g-v { color:#fff; font-size:.95rem; font-weight:800; letter-spacing:-0.01em; font-variant-numeric: tabular-nums; }
        .g-l { color: rgba(255,255,255,0.58); font-size:.63rem; font-weight:500; text-align:center;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
        .g-sep { width:1px; background: rgba(255,255,255,0.12); flex-shrink:0; }

        /* ── KPI cards ────────────────────────────────────────────────── */
        /* Mobile is a compact ROW (icon beside the number). The old stacked
           layout made these ~150px tall on a 360px screen, so two rows of
           cards ate the whole viewport before any content showed. */
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
        .kpi-val { font-size: clamp(1.12rem, 4.6vw, 1.5rem); font-weight:800; color:${C.ink}; letter-spacing:-0.02em;
          line-height:1.15; font-variant-numeric: tabular-nums; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .kpi-lab { font-size:.74rem; color:${C.sub}; font-weight:600; margin-top:1px;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .kpi-sub { font-size:.67rem; color:${C.faint}; margin-top:3px;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        /* ── Panels ───────────────────────────────────────────────────── */
        .lower { display:grid; grid-template-columns:1fr; gap:14px; }
        .panel { background:${C.card}; border:1px solid ${C.line}; border-radius:20px; padding:16px;
          box-shadow:0 2px 10px rgba(15,23,42,0.04); }
        .panel-h { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:14px; }
        .panel-h h3 { font-size:.95rem; font-weight:700; color:${C.ink}; margin:0; }
        /* 44px tap target without visually enlarging the link. */
        .link { background:none; border:none; color:#1a73e8; font-size:.78rem; font-weight:600; cursor:pointer;
          padding:6px 2px; margin:-6px -2px; border-radius:8px; flex-shrink:0; -webkit-tap-highlight-color:transparent; }
        .panel-empty { text-align:center; color:${C.faint}; font-size:.8rem; margin:12px 0 0; }

        .collect-top { display:flex; align-items:flex-end; justify-content:space-between; gap:10px; }
        .big { font-size: clamp(1.25rem, 5vw, 1.5rem); font-weight:800; color:#059669; margin:0; letter-spacing:-0.02em;
          font-variant-numeric: tabular-nums; }
        .muted { font-size:.74rem; color:${C.faint}; margin:2px 0 0; }
        .pct { font-size:1rem; font-weight:800; color:#059669; font-variant-numeric: tabular-nums; flex-shrink:0; }
        .track { height:9px; border-radius:99px; background:rgba(15,23,42,0.06); overflow:hidden; margin:12px 0 14px; }
        .fill { display:block; height:100%; border-radius:99px; background: linear-gradient(90deg,#10b981,#059669);
          transition: width 1.1s ${EASE}; }
        .fee-rows { display:flex; flex-direction:column; gap:9px; }
        .fee-row, .pipe-row { display:flex; align-items:center; gap:8px; font-size:.82rem; color:${C.sub}; }
        .fee-row b, .pipe-row b { margin-left:auto; color:${C.ink}; font-weight:700; font-variant-numeric: tabular-nums; }
        .dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }

        .seg { display:flex; height:11px; border-radius:99px; overflow:hidden; margin-bottom:14px; background:rgba(15,23,42,0.06); }
        .seg span { transition: width 1.1s ${EASE}; }
        .pipe-rows { display:flex; flex-direction:column; gap:9px; }
        .pipe-l { color:${C.sub}; }

        /* ── Quick actions ────────────────────────────────────────────── */
        .qa-title { font-size:.95rem; font-weight:700; color:${C.ink}; margin:2px 0 11px; }
        .qa-grid { display:grid; grid-template-columns:1fr; gap:10px; }
        .qa { display:flex; align-items:center; gap:11px; padding:13px; border-radius:16px; cursor:pointer; text-align:left;
          min-height:52px; -webkit-tap-highlight-color:transparent;
          background:${C.card}; border:1px solid ${C.line}; font-size:.85rem; font-weight:600; color:${C.ink};
          box-shadow:0 2px 8px rgba(15,23,42,0.04);
          transition: transform .25s ${EASE}, box-shadow .25s ${EASE}, border-color .25s ${EASE};
          animation: pop .45s ${EASE} both; }
        .qa-ico { width:36px; height:36px; border-radius:11px; display:flex; align-items:center; justify-content:center; flex-shrink:0;
          background: var(--tint); }
        .qa-l { flex:1; min-width:0; }
        .qa-arrow { color:${C.faint}; font-size:.9rem; flex-shrink:0;
          transition: transform .25s ${EASE}, color .25s ${EASE}; }

        /* ── Interaction ──────────────────────────────────────────────── */
        /* Press feedback works on touch; lift/hover is gated to real pointers
           so a phone tap never leaves a card stuck in its hover state. */
        .kpi:active, .qa:active { transform: scale(0.975); }
        @media (hover: hover) and (pointer: fine) {
          .kpi:hover { transform: translateY(-4px); border-color: var(--edge); box-shadow:0 16px 34px var(--glow); }
          .qa:hover { transform: translateY(-3px); border-color: var(--edge); box-shadow:0 12px 26px var(--glow); }
          .qa:hover .qa-arrow { transform: translateX(3px); color: var(--accent); }
          .link:hover { text-decoration:underline; }
        }
        .kpi:focus-visible, .qa:focus-visible, .link:focus-visible {
          outline:2px solid ${C.cyan}; outline-offset:2px; }

        /* ── Breakpoints ──────────────────────────────────────────────── */
        @media (min-width:420px){
          .qa-grid { grid-template-columns:repeat(2,1fr); }
        }
        @media (min-width:760px){
          .dash { gap:16px; }
          .hero { padding:24px 22px 0; }
          .glance { margin:20px -22px 0; padding:14px 10px; gap:4px; }
          .g-v { font-size:1.05rem; }
          .g-l { font-size:.68rem; }
          /* Desktop restores the taller stacked card — there is room for it. */
          .kpis { grid-template-columns:repeat(4,1fr); gap:16px; }
          .kpi { flex-direction:column; align-items:flex-start; gap:0; padding:16px; }
          .kpi-ico { margin-bottom:12px; }
          .kpi-lab { font-size:.78rem; }
          .kpi-sub { font-size:.7rem; }
          .lower { grid-template-columns:1.35fr 1fr; }
          .panel { padding:18px; }
          .qa-grid { grid-template-columns:repeat(4,1fr); gap:12px; }
        }

        @media (prefers-reduced-motion: reduce){
          .dash, .kpi, .qa { animation:none; }
          .fill, .seg span, .qa-arrow { transition:none; }
          .kpi:active, .qa:active { transform:none; }
        }
      `}</style>
    </InstituteLayout>
  );
}
