import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import InstituteLayout from '../../components/layout/InstituteLayout';
import CountUp from '../../components/ui/CountUp';
import api, { getUser } from '../../lib/api';

/* ────────────────────────────────────────────────────────────────────
   COMMAND CONSOLE — dark navy glass.

   The old dashboard was white cards on a light grey field, which fought the
   navy header above it and the navy glass dock below it. This is one deep-navy
   console panel instead: aurora light behind frosted bento tiles, cyan as the
   only accent, figures large enough to read at a glance.

   The console is a contained panel rather than a full-bleed background, so the
   dark treatment cannot leak onto the light table pages (students, fees, etc.)
   and nothing else in the app needs to change.
   ─────────────────────────────────────────────────────────────────── */

const C = {
  navy: '#11245d',
  navyDeep: '#0a1844',
  navyMid: '#0d1e55',
  navyLight: '#1c2f6e',
  cyan: '#5ce1e6',
  text: '#ffffff',
  dim: 'rgba(198, 214, 248, 0.72)',
  faint: 'rgba(168, 190, 236, 0.52)',
  hair: 'rgba(92, 225, 230, 0.14)',
};
const EASE = 'cubic-bezier(0.16,1,0.3,1)';

/* Status colours are the ones already in the app — kept only where they carry
   meaning (paid / overdue), muted for a dark surface. Cyan stays the accent. */
const OK_GREEN = '#34d399';
const BAD_RED = '#fca5a5';
const WARN = '#f0c040';

const delay = (s) => ({ animationDelay: s + 's' });
const wpct = (p) => ({ width: p + '%' });
const bg = (c) => ({ background: c });
const segStyle = (p, c) => ({ width: p + '%', background: c });
const tone = (c, i) => ({ '--tone': c, animationDelay: i * 0.05 + 's' });
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

  const R = 32;
  const CIRC = 2 * Math.PI * R;

  const kpis = [
    { label: 'Total Students', value: fmt(totalStudents), raw: totalStudents, tone: C.cyan,
      href: '/institute/students', sub: 'on the register',
      icon: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/> },
    { label: 'Present Today', value: fmt(presentToday), raw: presentToday, tone: OK_GREEN,
      href: '/institute/attendance',
      sub: markedToday > 0 ? attendanceRate + '% attendance' : 'Not marked yet',
      icon: <><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></> },
    { label: 'Absent Today', value: fmt(absentToday), raw: absentToday, tone: BAD_RED,
      href: '/institute/attendance', sub: markedToday > 0 ? 'of ' + fmt(markedToday) + ' marked' : 'Not marked yet',
      icon: <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></> },
    { label: 'Overdue Fees', value: '₹' + fmt(pendingFees), raw: pendingFees, prefix: '₹', tone: WARN,
      href: '/institute/fees',
      sub: overdueStudents + (overdueStudents === 1 ? ' student overdue' : ' students overdue'),
      icon: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></> },
  ];

  const quickActions = [
    { label: 'Add Student',     href: '/institute/students',   icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></> },
    { label: 'Mark Attendance', href: '/institute/attendance', icon: <><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></> },
    { label: 'Update Fees',     href: '/institute/fees',       icon: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></> },
    { label: 'Enquiries',       href: '/institute/enquiries',  icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/> },
  ];

  const pipeline = [
    { label: 'New',       value: newEnquiries,       color: C.cyan },
    { label: 'Follow-Up', value: followUpEnquiries,  color: WARN },
    { label: 'Converted', value: convertedEnquiries, color: OK_GREEN },
  ];

  const go = (href) => router.push(href);

  if (loading) {
    return (
      <InstituteLayout title="Dashboard">
        <div className="console" role="status" aria-label="Loading dashboard">
          <span className="aurora a1" aria-hidden="true" />
          <span className="aurora a2" aria-hidden="true" />
          <div className="sk sk-head" />
          <div className="sk-grid">
            {[1,2,3,4].map(i => <div key={i} className="sk sk-tile" style={delay(i*0.07)} />)}
          </div>
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
          .sk-tile { height:104px; }
          .sk-wide { height:172px; }
          @keyframes sheen { to { transform:translateX(100%); } }
          @media (min-width:760px){
            .console { padding:24px; gap:14px; }
            .sk-grid { grid-template-columns:repeat(4,1fr); gap:14px; }
            .sk-grid.two { grid-template-columns:1fr 1fr; }
          }
          @media (prefers-reduced-motion: reduce){ .sk::after { animation:none; } }
        `}</style>
      </InstituteLayout>
    );
  }

  return (
    <InstituteLayout title="Dashboard">
      <div className="console">
        <span className="aurora a1" aria-hidden="true" />
        <span className="aurora a2" aria-hidden="true" />
        <span className="grid-lines" aria-hidden="true" />

        {/* ── Console head ── */}
        <header className="head">
          <div className="head-text">
            <p className="greet">{greeting},</p>
            <h2 className="name">{user?.instituteName || 'Institute'}</h2>
            <p className="date">
              <span className="live" aria-hidden="true" />
              {todayLabel}
            </p>
          </div>

          <div className="ring" role="img" aria-label={'Attendance ' + attendanceRate + ' percent'}>
            <svg viewBox="0 0 76 76" width="76" height="76" aria-hidden="true">
              <circle cx="38" cy="38" r={R} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="6" />
              <circle cx="38" cy="38" r={R} fill="none" stroke={C.cyan} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - attendanceRate / 100)}
                transform="rotate(-90 38 38)" style={ringTrans} />
            </svg>
            <div className="ring-c">
              <span className="ring-v"><CountUp value={attendanceRate} suffix="%" /></span>
              <span className="ring-l">Present</span>
            </div>
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
              onClick={() => go(k.href)}
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
              <span className="kpi-sub">{k.sub}</span>
            </button>
          ))}

          {/* Fee overview — wide tile */}
          <article className="tile wide" style={tone(OK_GREEN, 4)}>
            <span className="tile-edge" aria-hidden="true" />
            <header className="t-head">
              <h3>Fee Overview</h3>
              <button onClick={() => go('/institute/fees')} className="link">Manage →</button>
            </header>
            <div className="fee-top">
              <p className="fee-big">₹<CountUp value={collectedFees} /></p>
              <span className="fee-pct"><CountUp value={collectRate} suffix="%" /></span>
            </div>
            <p className="fee-of">collected of ₹{fmt(totalFees)}</p>
            <div className="track" role="img" aria-label={'Fees collected ' + collectRate + ' percent'}>
              <span className="fill" style={wpct(collectRate)} />
            </div>
            <div className="rows">
              <div className="row"><span className="dot" style={bg(OK_GREEN)} />Paid<b>₹<CountUp value={collectedFees} /></b></div>
              <div className="row"><span className="dot" style={bg(BAD_RED)} />Overdue Students<b><CountUp value={overdueStudents} /></b></div>
            </div>
          </article>

          {/* Enquiry pipeline — wide tile */}
          <article className="tile wide" style={tone(C.cyan, 5)}>
            <span className="tile-edge" aria-hidden="true" />
            <header className="t-head">
              <h3>Enquiry Pipeline</h3>
              <button onClick={() => go('/institute/enquiries')} className="link">View →</button>
            </header>
            <p className="pipe-total"><CountUp value={enquiryTotal} /> <span>in pipeline</span></p>
            <div className="seg">
              {enquiryTotal > 0
                ? pipeline.map(p => p.value > 0 && <span key={p.label} style={segStyle((p.value/enquiryTotal)*100, p.color)} />)
                : <span style={segStyle(100, 'rgba(255,255,255,0.08)')} />}
            </div>
            <div className="rows">
              {pipeline.map(p => (
                <div key={p.label} className="row">
                  <span className="dot" style={bg(p.color)} />
                  {p.label}
                  <b><CountUp value={p.value} /></b>
                </div>
              ))}
            </div>
            {enquiryTotal === 0 && <p className="empty">No enquiries yet</p>}
          </article>
        </section>

        {/* ── Quick actions ── */}
        <section className="qa-wrap">
          <p className="qa-title">Quick Actions</p>
          <div className="qa-grid">
            {quickActions.map((a, i) => (
              <button key={a.label} className="qa" style={delay(i * 0.04)} onClick={() => go(a.href)}>
                <span className="qa-ico" aria-hidden="true">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{a.icon}</svg>
                </span>
                <span className="qa-l">{a.label}</span>
                <span className="qa-arrow" aria-hidden="true">→</span>
              </button>
            ))}
          </div>
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
        /* Faint engineering grid — the "console" cue, at 3% so it never competes. */
        .grid-lines { position:absolute; inset:0; pointer-events:none; opacity:.5;
          background-image:
            linear-gradient(to right, rgba(92,225,230,0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(92,225,230,0.06) 1px, transparent 1px);
          background-size: 46px 46px;
          mask-image: radial-gradient(120% 90% at 50% 0%, #000 30%, transparent 75%);
          -webkit-mask-image: radial-gradient(120% 90% at 50% 0%, #000 30%, transparent 75%); }

        /* ── Head ────────────────────────────────────────────────────── */
        .head { position:relative; display:flex; align-items:center; justify-content:space-between; gap:14px;
          padding-bottom:14px; border-bottom:1px solid ${C.hair}; }
        .head-text { min-width:0; }
        .greet { color:${C.faint}; font-size:.78rem; font-weight:500; margin:0; letter-spacing:.01em; }
        .name { color:${C.text}; font-size: clamp(1.35rem, 5.6vw, 2rem); font-weight:800; margin:4px 0 6px;
          letter-spacing:-0.025em; line-height:1.08; overflow-wrap:anywhere;
          text-shadow: 0 2px 18px rgba(92,225,230,0.14); }
        .date { display:flex; align-items:center; gap:7px; color:${C.dim}; font-size:.76rem; margin:0; }
        .live { width:6px; height:6px; border-radius:50%; background:${C.cyan}; flex-shrink:0;
          box-shadow:0 0 0 3px rgba(92,225,230,0.18); animation: beat 2.4s ease-in-out infinite; }
        @keyframes beat { 0%,100%{opacity:1} 50%{opacity:.35} }

        .ring { position:relative; flex-shrink:0; width:76px; height:76px;
          filter: drop-shadow(0 0 12px rgba(92,225,230,0.22)); }
        .ring-c { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
        .ring-v { color:${C.text}; font-size:1.02rem; font-weight:800; line-height:1; font-variant-numeric: tabular-nums; }
        .ring-l { color:${C.faint}; font-size:.56rem; text-transform:uppercase; letter-spacing:.1em; margin-top:3px; }

        /* ── Bento tiles ──────────────────────────────────────────────── */
        .bento { position:relative; display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
        .tile { position:relative; overflow:hidden; border-radius:18px; padding:14px 13px;
          background: linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.028));
          border:1px solid ${C.hair};
          backdrop-filter: blur(14px) saturate(150%); -webkit-backdrop-filter: blur(14px) saturate(150%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 10px 26px rgba(6,14,40,0.24);
          animation: pop .5s ${EASE} both; }
        /* Hairline of the tile's own tone along the top edge. */
        .tile-edge { position:absolute; top:0; left:14px; right:14px; height:1px;
          background: linear-gradient(90deg, transparent, var(--tone), transparent); opacity:.75; }
        .wide { grid-column: span 2; }

        .kpi { display:flex; flex-direction:column; align-items:flex-start; gap:0; width:100%; text-align:left;
          cursor:pointer; min-height:44px; -webkit-tap-highlight-color:transparent;
          transition: transform .28s ${EASE}, border-color .28s ${EASE}, box-shadow .28s ${EASE}; }
        .kpi-top { display:flex; align-items:center; gap:7px; min-width:0; width:100%; }
        .kpi-ico { width:26px; height:26px; border-radius:9px; flex-shrink:0; display:flex; align-items:center; justify-content:center;
          background: rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.08); }
        .kpi-lab { color:${C.dim}; font-size:.68rem; font-weight:600; letter-spacing:.02em;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .kpi-val { color:${C.text}; font-size: clamp(1.5rem, 7vw, 2.1rem); font-weight:800; letter-spacing:-0.03em;
          line-height:1.05; margin-top:10px; font-variant-numeric: tabular-nums;
          max-width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .kpi-sub { color:${C.faint}; font-size:.65rem; margin-top:4px;
          max-width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        .t-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px; }
        .t-head h3 { color:${C.text}; font-size:.88rem; font-weight:700; margin:0; letter-spacing:.01em; }
        .link { background:rgba(255,255,255,0.07); border:1px solid ${C.hair}; color:${C.cyan};
          font-size:.72rem; font-weight:700; cursor:pointer; padding:6px 10px; border-radius:9px; flex-shrink:0;
          -webkit-tap-highlight-color:transparent; transition: background .2s ease, transform .2s ${EASE}; }
        .link:active { transform: scale(0.96); }

        .fee-top { display:flex; align-items:baseline; justify-content:space-between; gap:10px; }
        .fee-big { color:${C.text}; font-size: clamp(1.5rem, 6.4vw, 1.9rem); font-weight:800; margin:0;
          letter-spacing:-0.03em; font-variant-numeric: tabular-nums; }
        .fee-pct { color:${OK_GREEN}; font-size:1rem; font-weight:800; flex-shrink:0; font-variant-numeric: tabular-nums; }
        .fee-of { color:${C.faint}; font-size:.7rem; margin:3px 0 0; }
        .track { height:8px; border-radius:99px; background:rgba(255,255,255,0.08); overflow:hidden; margin:12px 0 13px; }
        .fill { display:block; height:100%; border-radius:99px;
          background: linear-gradient(90deg, ${C.cyan}, ${OK_GREEN});
          box-shadow: 0 0 12px rgba(92,225,230,0.35); transition: width 1.1s ${EASE}; }

        .pipe-total { color:${C.text}; font-size:1.5rem; font-weight:800; margin:0 0 11px; letter-spacing:-0.02em;
          font-variant-numeric: tabular-nums; }
        .pipe-total span { color:${C.faint}; font-size:.7rem; font-weight:500; letter-spacing:0; }
        .seg { display:flex; height:8px; border-radius:99px; overflow:hidden; margin-bottom:13px; background:rgba(255,255,255,0.08); }
        .seg span { transition: width 1.1s ${EASE}; }

        .rows { display:flex; flex-direction:column; gap:9px; }
        .row { display:flex; align-items:center; gap:8px; font-size:.78rem; color:${C.dim}; }
        .row b { margin-left:auto; color:${C.text}; font-weight:700; font-variant-numeric: tabular-nums; }
        .dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        .empty { color:${C.faint}; font-size:.75rem; text-align:center; margin:10px 0 0; }

        /* ── Quick actions ───────────────────────────────────────────── */
        .qa-wrap { position:relative; }
        .qa-title { color:${C.faint}; font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.12em;
          margin:2px 0 10px; }
        .qa-grid { display:grid; grid-template-columns:1fr; gap:9px; }
        .qa { display:flex; align-items:center; gap:10px; padding:12px 13px; border-radius:15px; cursor:pointer; text-align:left;
          min-height:50px; width:100%; -webkit-tap-highlight-color:transparent;
          background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.025));
          border:1px solid ${C.hair}; color:${C.text}; font-size:.82rem; font-weight:600;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
          animation: pop .5s ${EASE} both;
          transition: transform .25s ${EASE}, border-color .25s ${EASE}, box-shadow .25s ${EASE}; }
        .qa-ico { width:30px; height:30px; border-radius:10px; flex-shrink:0; display:flex; align-items:center; justify-content:center;
          background: rgba(92,225,230,0.12); border:1px solid rgba(92,225,230,0.18); }
        .qa-l { flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .qa-arrow { color:${C.faint}; flex-shrink:0; transition: transform .25s ${EASE}, color .25s ${EASE}; }

        /* ── Interaction ──────────────────────────────────────────────── */
        .kpi:active, .qa:active { transform: scale(0.975); }
        @media (hover: hover) and (pointer: fine) {
          .kpi:hover { transform: translateY(-4px); border-color: rgba(92,225,230,0.34);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), 0 18px 38px rgba(6,14,40,0.4), 0 0 0 1px rgba(92,225,230,0.12); }
          .qa:hover { transform: translateY(-3px); border-color: rgba(92,225,230,0.34);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), 0 14px 30px rgba(6,14,40,0.36); }
          .qa:hover .qa-arrow { transform: translateX(4px); color:${C.cyan}; }
          .link:hover { background: rgba(92,225,230,0.16); }
        }
        .kpi:focus-visible, .qa:focus-visible, .link:focus-visible {
          outline:2px solid ${C.cyan}; outline-offset:2px; }

        /* ── Breakpoints ──────────────────────────────────────────────── */
        @media (min-width:420px){
          .qa-grid { grid-template-columns:repeat(2,1fr); }
        }
        @media (min-width:760px){
          .console { padding:26px; gap:18px; border-radius:30px; }
          .head { padding-bottom:18px; }
          .bento { grid-template-columns:repeat(4,1fr); gap:14px; }
          .tile { padding:18px 17px; border-radius:20px; }
          .kpi-lab { font-size:.72rem; }
          .kpi-sub { font-size:.68rem; }
          .ring { width:92px; height:92px; }
          .qa-grid { grid-template-columns:repeat(4,1fr); gap:12px; }
        }

        @media (prefers-reduced-motion: reduce){
          .console, .tile, .qa { animation:none; }
          .fill, .seg span, .qa-arrow, .live { transition:none; animation:none; }
          .kpi:active, .qa:active { transform:none; }
        }
      `}</style>
    </InstituteLayout>
  );
}
