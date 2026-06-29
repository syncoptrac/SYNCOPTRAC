import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import InstituteLayout from '../../components/layout/InstituteLayout';
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

/* Style helpers (single-brace usage avoids JSX-literal pitfalls) */
const delay = (s) => ({ animationDelay: s + 's' });
const wpct = (p) => ({ width: p + '%' });
const bg = (c) => ({ background: c });
const segStyle = (p, c) => ({ width: p + '%', background: c });
const accentCard = (a, i) => ({ '--accent': a, animationDelay: (i * 0.05) + 's' });
const accentVar = (a) => ({ '--accent': a });
const ringTrans = { transition: 'stroke-dashoffset 1s ' + EASE };

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

  const kpis = [
    { label: 'Total Students', value: fmt(totalStudents), accent: '#1a73e8',
      icon: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/> },
    { label: 'Present Today', value: fmt(presentToday), accent: '#059669', sub: markedToday > 0 ? attendanceRate + '% attendance' : 'Not marked yet',
      icon: <><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></> },
    { label: 'Absent Today', value: fmt(absentToday), accent: '#dc2626',
      icon: <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></> },
    { label: 'Overdue Fees', value: '₹' + fmt(pendingFees), accent: '#d97706', sub: overdueStudents + (overdueStudents === 1 ? ' student overdue' : ' students overdue'),
      icon: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></> },
  ];

  const quickActions = [
    { label: 'Add Student',     href: '/institute/students',   accent: '#1a73e8', icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></> },
    { label: 'Mark Attendance', href: '/institute/attendance',  accent: '#059669', icon: <><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></> },
    { label: 'Update Fees',     href: '/institute/fees',        accent: '#d97706', icon: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></> },
    { label: 'Enquiries',       href: '/institute/enquiries',   accent: '#7c3aed', icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/> },
  ];

  const pipeline = [
    { label: 'New',       value: newEnquiries,       color: '#1a73e8' },
    { label: 'Follow-Up', value: followUpEnquiries,  color: '#d97706' },
    { label: 'Converted', value: convertedEnquiries, color: '#059669' },
  ];

  if (loading) {
    return (
      <InstituteLayout title="Dashboard">
        <div className="sk-hero" />
        <div className="sk-grid">
          {[1,2,3,4].map(i => <div key={i} className="sk-card" style={delay(i*0.08)} />)}
        </div>
        <div className="sk-grid two">
          {[1,2].map(i => <div key={i} className="sk-tall" style={delay(i*0.1)} />)}
        </div>
        <style jsx>{`
          .sk-hero { height: 104px; border-radius: 20px; background:#fff; border:1px solid ${C.line}; animation: pulse 1.5s ease-in-out infinite; }
          .sk-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; margin-top:16px; }
          .sk-grid.two { grid-template-columns:1fr; }
          .sk-card { height:108px; border-radius:18px; background:#fff; border:1px solid ${C.line}; animation: pulse 1.5s ease-in-out infinite; }
          .sk-tall { height:180px; border-radius:18px; background:#fff; border:1px solid ${C.line}; animation: pulse 1.5s ease-in-out infinite; }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
          @media (min-width:760px){ .sk-grid{grid-template-columns:repeat(4,1fr)} .sk-grid.two{grid-template-columns:1.4fr 1fr} }
        `}</style>
      </InstituteLayout>
    );
  }

  return (
    <InstituteLayout title="Dashboard">
      <div className="dash">

        {/* Greeting hero */}
        <section className="hero">
          <div className="hero-glow" />
          <div className="hero-row">
            <div>
              <p className="hero-greet">{greeting},</p>
              <h2 className="hero-name">{user?.instituteName || 'Institute'}</h2>
              <p className="hero-date">{todayLabel}</p>
            </div>
            <div className="ring" role="img" aria-label={'Attendance ' + attendanceRate + ' percent'}>
              <svg viewBox="0 0 80 80" width="80" height="80">
                <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                <circle cx="40" cy="40" r={R} fill="none" stroke={C.cyan} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - attendanceRate / 100)}
                  transform="rotate(-90 40 40)" style={ringTrans} />
              </svg>
              <div className="ring-c">
                <span className="ring-v">{attendanceRate}%</span>
                <span className="ring-l">Present</span>
              </div>
            </div>
          </div>
        </section>

        {/* KPI cards */}
        <section className="kpis">
          {kpis.map((k, i) => (
            <article key={k.label} className="kpi" style={accentCard(k.accent, i)}>
              <span className="kpi-bar" />
              <div className="kpi-ico">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={k.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{k.icon}</svg>
              </div>
              <p className="kpi-val">{k.value}</p>
              <p className="kpi-lab">{k.label}</p>
              {k.sub && <p className="kpi-sub">{k.sub}</p>}
            </article>
          ))}
        </section>

        {/* Lower grid */}
        <section className="lower">
          {/* Fee overview */}
          <article className="panel">
            <header className="panel-h">
              <h3>Fee Overview</h3>
              <button onClick={() => router.push('/institute/fees')} className="link">Manage →</button>
            </header>
            <div className="collect-top">
              <div>
                <p className="big">₹{fmt(collectedFees)}</p>
                <p className="muted">collected of ₹{fmt(totalFees)}</p>
              </div>
              <span className="pct">{collectRate}%</span>
            </div>
            <div className="track"><span className="fill" style={wpct(collectRate)} /></div>
            <div className="fee-rows">
              <div className="fee-row"><span className="dot" style={bg('#d97706')} />Pending<b>₹{fmt(pendingFees)}</b></div>
              <div className="fee-row"><span className="dot" style={bg('#dc2626')} />Overdue Students<b>{overdueStudents}</b></div>
            </div>
          </article>

          {/* Enquiry pipeline */}
          <article className="panel">
            <header className="panel-h">
              <h3>Enquiry Pipeline</h3>
              <button onClick={() => router.push('/institute/enquiries')} className="link">View →</button>
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
                  <b>{p.value}</b>
                </div>
              ))}
            </div>
          </article>
        </section>

        {/* Quick actions */}
        <section className="qa-wrap">
          <h3 className="qa-title">Quick Actions</h3>
          <div className="qa-grid">
            {quickActions.map(a => (
              <button key={a.label} className="qa" style={accentVar(a.accent)} onClick={() => router.push(a.href)}>
                <span className="qa-ico">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{a.icon}</svg>
                </span>
                {a.label}
              </button>
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
        .dash { display:flex; flex-direction:column; gap:16px; animation: rise .5s ${EASE}; }
        @keyframes rise { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform:none; } }
        @keyframes pop { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform:none; } }

        .hero { position:relative; overflow:hidden; border-radius:20px; padding:22px;
          background: linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 100%);
          box-shadow: 0 14px 38px rgba(17,36,93,0.28); }
        .hero-glow { position:absolute; top:-60px; right:-40px; width:220px; height:220px; border-radius:50%;
          background: radial-gradient(circle, rgba(92,225,230,0.32), transparent 70%); }
        .hero-row { position:relative; display:flex; align-items:center; justify-content:space-between; gap:16px; }
        .hero-greet { color: rgba(255,255,255,0.7); font-size:.82rem; font-weight:500; margin:0; }
        .hero-name { color:#fff; font-size:1.5rem; font-weight:800; margin:2px 0 4px; letter-spacing:-0.02em; line-height:1.1; }
        .hero-date { color: rgba(255,255,255,0.6); font-size:.78rem; margin:0; }
        .ring { position:relative; flex-shrink:0; width:80px; height:80px; }
        .ring-c { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
        .ring-v { color:#fff; font-size:1.05rem; font-weight:800; line-height:1; }
        .ring-l { color: rgba(255,255,255,0.6); font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; margin-top:2px; }

        .kpis { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
        .kpi { position:relative; overflow:hidden; background:${C.card}; border:1px solid ${C.line}; border-radius:18px; padding:16px;
          box-shadow:0 2px 10px rgba(15,23,42,0.04); transition: transform .3s ${EASE}, box-shadow .3s ${EASE};
          animation: pop .45s ${EASE} both; }
        .kpi:hover { transform: translateY(-4px); box-shadow:0 16px 34px color-mix(in srgb, var(--accent) 18%, transparent); }
        .kpi-bar { position:absolute; top:0; left:0; right:0; height:3px; background: linear-gradient(90deg, var(--accent), transparent); }
        .kpi-ico { width:38px; height:38px; border-radius:11px; display:flex; align-items:center; justify-content:center;
          background: color-mix(in srgb, var(--accent) 12%, white); margin-bottom:12px; }
        .kpi-val { font-size:1.5rem; font-weight:800; color:${C.ink}; margin:0; letter-spacing:-0.02em; }
        .kpi-lab { font-size:.78rem; color:${C.sub}; font-weight:600; margin:3px 0 0; }
        .kpi-sub { font-size:.7rem; color:${C.faint}; margin:4px 0 0; }

        .lower { display:grid; grid-template-columns:1fr; gap:14px; }
        .panel { background:${C.card}; border:1px solid ${C.line}; border-radius:18px; padding:18px; box-shadow:0 2px 10px rgba(15,23,42,0.04); }
        .panel-h { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
        .panel-h h3 { font-size:.95rem; font-weight:700; color:${C.ink}; margin:0; }
        .link { background:none; border:none; color:#1a73e8; font-size:.78rem; font-weight:600; cursor:pointer; padding:0; }
        .link:hover { text-decoration:underline; }

        .collect-top { display:flex; align-items:flex-end; justify-content:space-between; }
        .big { font-size:1.45rem; font-weight:800; color:#059669; margin:0; letter-spacing:-0.02em; }
        .muted { font-size:.74rem; color:${C.faint}; margin:2px 0 0; }
        .pct { font-size:1rem; font-weight:800; color:#059669; }
        .track { height:9px; border-radius:99px; background:rgba(15,23,42,0.06); overflow:hidden; margin:12px 0 14px; }
        .fill { display:block; height:100%; border-radius:99px; background: linear-gradient(90deg,#10b981,#059669); transition: width 1s ${EASE}; }
        .fee-rows { display:flex; flex-direction:column; gap:8px; }
        .fee-row, .pipe-row { display:flex; align-items:center; gap:8px; font-size:.82rem; color:${C.sub}; }
        .fee-row b, .pipe-row b { margin-left:auto; color:${C.ink}; font-weight:700; }
        .dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }

        .seg { display:flex; height:11px; border-radius:99px; overflow:hidden; margin-bottom:14px; background:rgba(15,23,42,0.06); }
        .seg span { transition: width 1s ${EASE}; }
        .pipe-rows { display:flex; flex-direction:column; gap:9px; }
        .pipe-l { color:${C.sub}; }

        .qa-title { font-size:.95rem; font-weight:700; color:${C.ink}; margin:2px 0 12px; }
        .qa-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
        .qa { display:flex; align-items:center; gap:10px; padding:14px; border-radius:14px; cursor:pointer; text-align:left;
          background:${C.card}; border:1px solid ${C.line}; font-size:.82rem; font-weight:600; color:${C.ink};
          box-shadow:0 2px 8px rgba(15,23,42,0.04); transition: transform .25s ${EASE}, box-shadow .25s ${EASE}, border-color .25s ${EASE}; }
        .qa:hover { transform: translateY(-3px); border-color: color-mix(in srgb, var(--accent) 35%, transparent);
          box-shadow:0 12px 26px color-mix(in srgb, var(--accent) 16%, transparent); }
        .qa-ico { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0;
          background: color-mix(in srgb, var(--accent) 12%, white); }

        @media (min-width:760px){
          .kpis { grid-template-columns:repeat(4,1fr); gap:16px; }
          .lower { grid-template-columns:1.35fr 1fr; }
          .qa-grid { grid-template-columns:repeat(4,1fr); }
          .hero-name { font-size:1.7rem; }
        }
      `}</style>
    </InstituteLayout>
  );
}
