import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import InstituteLayout from '../../components/layout/InstituteLayout';
import CountUp from '../../components/ui/CountUp';
import api, { getUser } from '../../lib/api';
import { T, STATUS } from '../../components/ds/tokens';

/* ==========================================================================
   INSTITUTE DASHBOARD - "Workbench"

   Replaces the dark navy console with a bright enterprise canvas: white cards
   on #F8FAFC, one hairline masthead instead of a heavy hero panel, and a real
   donut chart instead of a hand-drawn SVG ring.

   Layout reasoning:
   - The masthead sits directly on the canvas under a single 1px rule. A page
     that opens with a bordered panel feels boxed in; a rule feels like a
     document, which is what an operator wants to scan.
   - KPIs are a 4-up rail that collapses to 2-up on phones rather than 1-up.
     A single column pushed the fee panel two screens down on a 360px device.
   - Fee Overview gets 1.5x the width of Enquiry Pipeline because money is the
     primary job of this screen.

   All API calls, state, routes and copy are unchanged from the previous
   version. Only presentation differs.
   ========================================================================== */

const delay = (s) => ({ animationDelay: s + 's' });
const toneVars = (c, tint) => ({ '--sc-tone': c, '--sc-tone-tint': tint });

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

  const kpis = [
    { label: 'Total Students', raw: totalStudents, tone: T.accent, tint: T.accentTint,
      href: '/institute/students', sub: 'on the register',
      icon: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/> },
    { label: 'Present Today', raw: presentToday, tone: T.success, tint: T.successTint,
      href: '/institute/attendance',
      sub: markedToday > 0 ? attendanceRate + '% attendance' : 'Not marked yet',
      icon: <><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></> },
    { label: 'Absent Today', raw: absentToday, tone: T.danger, tint: T.dangerTint,
      href: '/institute/attendance', sub: markedToday > 0 ? 'of ' + fmt(markedToday) + ' marked' : 'Not marked yet',
      icon: <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></> },
    { label: 'Overdue Fees', raw: pendingFees, prefix: '\u20b9', tone: T.warning, tint: T.warningTint,
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
    { label: 'New',       value: newEnquiries,       color: T.accent },
    { label: 'Follow-Up', value: followUpEnquiries,  color: T.warning },
    { label: 'Converted', value: convertedEnquiries, color: T.success },
  ];

  const go = (href) => router.push(href);

  /* Donut data. When nothing has been billed yet there is no ratio to draw,
     so a single neutral segment stands in for an empty ring - recharts would
     otherwise render an invisible chart and the card would look broken. */
  const hasFeeData = totalFees > 0;
  const donutData = hasFeeData
    ? [{ name: 'Collected', value: collectedFees }, { name: 'Pending', value: Math.max(0, totalFees - collectedFees) }]
    : [{ name: 'No data', value: 1 }];
  const donutColors = hasFeeData ? [T.accent, '#E8EDF5'] : ['#E8EDF5'];

  if (loading) {
    return (
      <InstituteLayout title="Dashboard">
        <div role="status" aria-label="Loading dashboard" className="wrap">
          <div className="sk-mast">
            <div className="sc-skel sc-skel-text" style={{ width: 110 }} />
            <div className="sc-skel sc-skel-text" style={{ width: 230, height: 26, marginTop: 10 }} />
            <div className="sc-skel sc-skel-text" style={{ width: 160, marginTop: 10 }} />
          </div>
          <div className="grid-kpi">
            {[1,2,3,4].map(i => <div key={i} className="sc-skel sk-stat" style={delay(i*0.07)} />)}
          </div>
          <div className="grid-main">
            {[1,2].map(i => <div key={i} className="sc-skel sk-panel" style={delay(i*0.09)} />)}
          </div>
        </div>
        <style jsx>{`
          .wrap { display: flex; flex-direction: column; gap: 22px; }
          .sk-mast { padding-bottom: 18px; border-bottom: 1px solid ${T.border}; }
          .grid-kpi { display: grid; gap: 14px; grid-template-columns: repeat(2, 1fr); }
          .grid-main { display: grid; gap: 14px; grid-template-columns: 1fr; }
          .sk-stat { height: 118px; }
          .sk-panel { height: 268px; }
          @media (min-width: 900px) {
            .grid-kpi { grid-template-columns: repeat(4, 1fr); gap: 16px; }
            .grid-main { grid-template-columns: 1.5fr 1fr; gap: 16px; }
          }
        `}</style>
      </InstituteLayout>
    );
  }

  return (
    <InstituteLayout title="Dashboard">
      <div className="wrap">

        {/* ---- Masthead ------------------------------------------------- */}
        <header className="sc-mast">
          <div className="sc-mast-l">
            <p className="sc-eyebrow">{greeting}</p>
            <h1 className="sc-h1 name">{user?.instituteName || 'Institute'}</h1>
            <p className="sc-dim date">{todayLabel}</p>
          </div>
          <div className="sc-mast-r">
            <span className="sc-live"><i />Live</span>
            <button className="sc-btn sc-btn-primary" onClick={() => go('/institute/students')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Student
            </button>
          </div>
        </header>

        {/* ---- KPI rail ------------------------------------------------- */}
        <section className="grid-kpi" aria-label="Key figures">
          {kpis.map((k, i) => (
            <button
              key={k.label}
              className="sc-card sc-i sc-stat"
              style={{ ...toneVars(k.tone, k.tint), ...delay(i * 0.05) }}
              onClick={() => go(k.href)}
              aria-label={k.label}
            >
              <span className="sc-edge" aria-hidden="true" />
              <span className="sc-stat-top">
                <span className="sc-eyebrow">{k.label}</span>
                <span className="sc-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{k.icon}</svg>
                </span>
              </span>
              <span className="sc-stat-val sc-num">
                <CountUp value={k.raw} prefix={k.prefix || ''} />
              </span>
              <span className="sc-stat-sub">{k.sub}</span>
            </button>
          ))}
        </section>

        {/* ---- Fee overview + enquiry pipeline -------------------------- */}
        <section className="grid-main">

          <article className="sc-card sc-card-lg">
            <div className="p-head">
              <h2 className="sc-h3">Fee Overview</h2>
              <button className="sc-link" onClick={() => go('/institute/fees')}>Manage <span>&rarr;</span></button>
            </div>

            <div className="fee-body">
              <div className="donut" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      innerRadius="70%"
                      outerRadius="100%"
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                      isAnimationActive={hasFeeData}
                      animationDuration={900}
                    >
                      {donutData.map((d, i) => <Cell key={i} fill={donutColors[i]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-mid">
                  <span className="donut-pct sc-num">{collectRate}%</span>
                  <span className="donut-lab">collected</span>
                </div>
              </div>

              <dl className="fee-legend">
                <div className="leg">
                  <dt><i style={{ background: T.accent }} />Collected</dt>
                  <dd className="sc-num">&#8377;{fmt(collectedFees)}</dd>
                </div>
                <div className="leg">
                  <dt><i style={{ background: T.warning }} />Pending</dt>
                  <dd className="sc-num">&#8377;{fmt(pendingFees)}</dd>
                </div>
                <div className="leg total">
                  <dt>Total billed</dt>
                  <dd className="sc-num">&#8377;{fmt(totalFees)}</dd>
                </div>
              </dl>
            </div>

            <div className="track" role="progressbar" aria-valuenow={collectRate} aria-valuemin={0} aria-valuemax={100} aria-label="Fee collection progress">
              <span className="fill" style={{ width: collectRate + '%' }} />
            </div>
          </article>

          <article className="sc-card sc-card-lg">
            <div className="p-head">
              <h2 className="sc-h3">Enquiry Pipeline</h2>
              <button className="sc-link" onClick={() => go('/institute/enquiries')}>Manage <span>&rarr;</span></button>
            </div>

            <p className="pipe-total sc-num"><CountUp value={enquiryTotal} /></p>
            <p className="sc-stat-sub">{enquiryTotal === 1 ? 'enquiry in total' : 'enquiries in total'}</p>

            <div className="pipe-bar" aria-hidden="true">
              {enquiryTotal > 0
                ? pipeline.map(p => (
                    <span key={p.label} className="seg" style={{ width: (p.value / enquiryTotal) * 100 + '%', background: p.color }} />
                  ))
                : <span className="seg" style={{ width: '100%', background: '#E8EDF5' }} />}
            </div>

            <ul className="pipe-rows">
              {pipeline.map(p => (
                <li key={p.label}>
                  <span className="dot" style={{ background: p.color }} aria-hidden="true" />
                  <span className="pipe-lab">{p.label}</span>
                  <span className="pipe-val sc-num">{fmt(p.value)}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        {/* ---- Quick actions ------------------------------------------- */}
        <section aria-label="Quick Actions">
          <p className="sc-eyebrow qa-title">Quick Actions</p>
          <div className="grid-qa">
            {quickActions.map((a, i) => (
              <button key={a.label} className="sc-action" style={delay(i * 0.04)} onClick={() => go(a.href)}>
                <span className="sc-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{a.icon}</svg>
                </span>
                {a.label}
                <svg className="sc-action-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            ))}
          </div>
        </section>

      </div>

      <style jsx>{`
        .wrap { display: flex; flex-direction: column; gap: 22px; }

        .name { margin-top: 5px; }
        .date { font-size: ${T.fXs}; margin-top: 6px; }

        /* KPI cards are <button>, so browser button styling must be reset. */
        .grid-kpi { display: grid; gap: 14px; grid-template-columns: repeat(2, 1fr); }
        .grid-kpi :global(.sc-stat) {
          appearance: none;
          font: inherit;
          text-align: left;
          animation: sc-rise ${T.dSlow} ${T.ease} both;
        }

        .grid-main { display: grid; gap: 14px; grid-template-columns: 1fr; }

        .p-head {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; margin-bottom: 18px;
        }

        /* Fee panel -------------------------------------------------- */
        .fee-body { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .donut { position: relative; width: 132px; height: 132px; flex: 0 0 132px; }
        .donut-mid {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 2px; pointer-events: none;
        }
        .donut-pct { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.03em; color: ${T.text}; }
        .donut-lab { font-size: ${T.fMicro}; font-weight: 650; color: ${T.muted}; }

        .fee-legend { flex: 1; min-width: 168px; margin: 0; display: flex; flex-direction: column; gap: 11px; }
        .leg { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0; }
        .leg dt {
          display: flex; align-items: center; gap: 8px;
          font-size: ${T.fXs}; color: ${T.muted}; font-weight: 600;
        }
        .leg dt i { width: 8px; height: 8px; border-radius: 3px; flex: 0 0 8px; }
        .leg dd { margin: 0; font-size: ${T.fSm}; font-weight: 750; color: ${T.text}; }
        .leg.total { padding-top: 11px; border-top: 1px solid ${T.border}; }
        .leg.total dd { font-size: 1rem; font-weight: 800; }

        .track {
          margin-top: 20px; height: 8px; border-radius: 999px;
          background: #EEF2F7; overflow: hidden;
        }
        .fill {
          display: block; height: 100%; border-radius: 999px;
          background: linear-gradient(90deg, ${T.accent}, ${T.accent2});
          transition: width 1.1s ${T.ease};
        }

        /* Pipeline panel --------------------------------------------- */
        .pipe-total {
          margin: 0; font-size: clamp(1.9rem, 6vw, 2.4rem);
          font-weight: 800; letter-spacing: -0.035em; line-height: 1; color: ${T.text};
        }
        .pipe-bar {
          display: flex; gap: 3px; margin: 18px 0 16px;
          height: 10px; border-radius: 999px; overflow: hidden;
        }
        .seg { display: block; height: 100%; transition: width 900ms ${T.ease}; }

        .pipe-rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
        .pipe-rows li {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 0; border-bottom: 1px solid #F1F5F9;
        }
        .pipe-rows li:last-child { border-bottom: 0; }
        .dot { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 8px; }
        .pipe-lab { font-size: ${T.fSm}; color: ${T.text}; font-weight: 600; }
        .pipe-val { margin-left: auto; font-size: ${T.fSm}; font-weight: 750; color: ${T.text}; }

        /* Quick actions ---------------------------------------------- */
        .qa-title { margin: 0 0 12px 2px; }
        .grid-qa { display: grid; gap: 12px; grid-template-columns: 1fr; }
        .grid-qa :global(.sc-action) { animation: sc-rise ${T.dSlow} ${T.ease} both; }

        /* Breakpoints ------------------------------------------------ */
        @media (min-width: 560px) {
          .grid-qa { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 900px) {
          .wrap { gap: 26px; }
          .grid-kpi { grid-template-columns: repeat(4, 1fr); gap: 16px; }
          .grid-main { grid-template-columns: 1.5fr 1fr; gap: 16px; }
          .grid-qa { grid-template-columns: repeat(4, 1fr); }
        }

        /* On the narrowest phones the donut and legend stack, so centre the
           donut rather than leaving it hard against the left edge. */
        @media (max-width: 400px) {
          .donut { margin: 0 auto; }
          .fee-legend { min-width: 100%; }
        }
      `}</style>
    </InstituteLayout>
  );
}
