import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import CountUp from '../../components/ui/CountUp';
import api, { getUser } from '../../lib/api';
import { T } from '../../components/ds/tokens';

/* ==========================================================================
   ADMIN DASHBOARD - "Workbench"

   Same design language as the institute dashboard so both portals read as one
   product: bright canvas, hairline masthead, white cards, one accent.

   Where it differs on purpose - this screen is an operator's console, so it
   leads with a 6-up KPI rail and gives revenue its own emphasised card. The
   institute screen leads with money because that is its job; this one leads
   with fleet health.

   Every piece of state, every handler, both endpoints, the month picker
   behaviour and all copy are carried over unchanged.
   ========================================================================== */

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* Status chips - bright surface values from the shared token set. */
const STATUS_STYLE = {
  paid:    { bg: 'rgba(34,197,94,0.12)',  text: '#15803D', label: 'Paid' },
  overdue: { bg: 'rgba(239,68,68,0.12)',  text: '#B91C1C', label: 'Overdue' },
  pending: { bg: 'rgba(245,158,11,0.14)', text: '#B45309', label: 'Pending' },
};

const delay = (s) => ({ animationDelay: s + 's' });
const toneVars = (c, tint) => ({ '--sc-tone': c, '--sc-tone-tint': tint });
const chipStyle = (s) => ({ background: s.bg, color: s.text });
const monthCell = (isSel) => ({
  background: isSel ? T.accent : 'transparent',
  color: isSel ? '#fff' : T.text,
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

  const fmt = (n) => n?.toLocaleString('en-IN') ?? '\u2014';

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();
  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const kpis = [
    { label: 'Active Institutes', value: fmt(stats?.activeInstitutes), raw: stats?.activeInstitutes, tone: T.accent, tint: T.accentTint,
      href: '/admin/institutes',
      icon: <><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3"/></> },
    { label: 'Total Institutes', value: fmt(stats?.totalInstitutes), raw: stats?.totalInstitutes, tone: T.accent2, tint: 'rgba(59,130,246,0.10)',
      href: '/admin/institutes',
      icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></> },
    { label: 'New Requests', value: fmt(stats?.newLeads), raw: stats?.newLeads, tone: T.navy, tint: T.navyTint,
      href: '/admin/leads',
      icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></> },
    { label: "This Month's Overdue", value: '\u20b9' + fmt(stats?.overduePayments), raw: stats?.overduePayments, prefix: '\u20b9', tone: T.danger, tint: T.dangerTint,
      href: '/admin/institutes',
      icon: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></> },
    { label: 'Lifetime Revenue', value: '\u20b9' + fmt(stats?.totalRevenue), raw: stats?.totalRevenue, prefix: '\u20b9', tone: T.success, tint: T.successTint,
      href: '/admin/institutes',
      icon: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></> },
    { label: 'New This Month', value: fmt(stats?.newInstitutesThisMonth), raw: stats?.newInstitutesThisMonth, tone: T.warning, tint: T.warningTint,
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
        <div role="status" aria-label="Loading dashboard" className="wrap">
          <div className="sk-mast">
            <div className="sc-skel sc-skel-text" style={{ width: 110 }} />
            <div className="sc-skel sc-skel-text" style={{ width: 210, height: 26, marginTop: 10 }} />
            <div className="sc-skel sc-skel-text" style={{ width: 180, marginTop: 10 }} />
          </div>
          <div className="grid-kpi">
            {[1,2,3,4,5,6].map(i => <div key={i} className="sc-skel sk-stat" style={delay(i*0.06)} />)}
          </div>
          <div className="sc-skel sk-rev" />
          <div className="grid-bottom">
            {[1,2].map(i => <div key={i} className="sc-skel sk-panel" style={delay(i*0.09)} />)}
          </div>
        </div>
        <style jsx>{`
          .wrap { display: flex; flex-direction: column; gap: 22px; }
          .sk-mast { padding-bottom: 18px; border-bottom: 1px solid ${T.border}; }
          .grid-kpi { display: grid; gap: 14px; grid-template-columns: repeat(2, 1fr); }
          .grid-bottom { display: grid; gap: 14px; grid-template-columns: 1fr; }
          .sk-stat { height: 112px; }
          .sk-rev { height: 150px; }
          .sk-panel { height: 250px; }
          @media (min-width: 900px) {
            .grid-kpi { grid-template-columns: repeat(3, 1fr); gap: 16px; }
            .grid-bottom { grid-template-columns: 1.6fr 1fr; gap: 16px; }
          }
          @media (min-width: 1140px) {
            .grid-kpi { grid-template-columns: repeat(6, 1fr); }
          }
        `}</style>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="wrap">

        {dbOffline && (
          <div className="sc-notice sc-notice-warn" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Database is offline. Some data may not be available.
          </div>
        )}

        {/* ---- Masthead ------------------------------------------------- */}
        <header className="sc-mast">
          <div className="sc-mast-l">
            <p className="sc-eyebrow">{greeting}</p>
            <h1 className="sc-h1 name">Control Center</h1>
            <p className="sc-dim date">{todayLabel}</p>
          </div>
          <div className="sc-mast-r">
            <div className="rev-badge">
              <span className="rb-l">Lifetime Revenue</span>
              <span className="rb-v sc-num">&#8377;{fmt(stats?.totalRevenue)}</span>
            </div>
            <button className="sc-btn sc-btn-primary" onClick={() => router.push('/admin/institutes?action=new')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Institute
            </button>
          </div>
        </header>

        {/* ---- KPI rail ------------------------------------------------- */}
        <section className="grid-kpi" aria-label="Key figures">
          {kpis.map((k, i) => (
            <button
              key={k.label}
              className="sc-card sc-i sc-stat"
              style={{ ...toneVars(k.tone, k.tint), ...delay(i * 0.045) }}
              onClick={() => router.push(k.href)}
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
                {typeof k.raw === 'number'
                  ? <CountUp value={k.raw} prefix={k.prefix || ''} />
                  : k.value}
              </span>
            </button>
          ))}
        </section>

        {/* ---- Monthly revenue ------------------------------------------ */}
        <section className="sc-card sc-card-lg rev-card">
          <div className="rev-head">
            <div>
              <p className="sc-eyebrow">Monthly Revenue</p>
              <p className="rev-value sc-num">
                {monthLoading
                  ? <span className="rev-load" aria-label="Loading revenue">&#8377;&#8202;&mdash;</span>
                  : <>&#8377;{fmt(monthRevenue?.revenue ?? 0)}</>}
              </p>
              <p className="rev-sub">{selectedLabel}</p>
            </div>

            {/* Month picker. Behaviour is unchanged: click-outside via
                [data-month-picker], Escape to dismiss. */}
            <div className="picker" data-month-picker>
              <button
                className="sc-btn sc-btn-secondary sc-btn-sm"
                onClick={() => setShowMonthPicker(v => !v)}
                aria-expanded={showMonthPicker}
                aria-haspopup="dialog"
              >
                {selectedLabel}
                <svg className={'caret' + (showMonthPicker ? ' up' : '')} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {showMonthPicker && (
                <>
                  <span className="picker-scrim" aria-hidden="true" />
                  <div className="picker-pop" role="dialog" aria-label="Select month">
                    <div className="picker-yr">
                      <button className="yr-nav" onClick={() => setPickerYear(y => y - 1)} aria-label="Previous year">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                      </button>
                      <span className="sc-num">{pickerYear}</span>
                      <button className="yr-nav" onClick={() => setPickerYear(y => y + 1)} aria-label="Next year">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    </div>
                    <div className="picker-grid">
                      {MONTHS.map((m, idx) => {
                        const isSel = selectedMonth === `${pickerYear}-${String(idx + 1).padStart(2, '0')}`;
                        return (
                          <button
                            key={m}
                            className="month-cell"
                            style={monthCell(isSel)}
                            onClick={() => handleMonthSelect(pickerYear, idx)}
                            aria-pressed={isSel}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ---- Recent institutes + quick actions ------------------------ */}
        <section className="grid-bottom">

          <article className="sc-card sc-card-lg">
            <div className="p-head">
              <h2 className="sc-h3">Recent Institutes</h2>
              <button className="sc-link" onClick={() => router.push('/admin/institutes')}>View all <span>&rarr;</span></button>
            </div>

            {dbOffline ? (
              <div className="sc-empty">
                <span className="sc-empty-ico">
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                  </svg>
                </span>
                Database offline &mdash; cannot load institutes
              </div>
            ) : institutes.length === 0 ? (
              <div className="sc-empty">
                <span className="sc-empty-ico">
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3"/>
                  </svg>
                </span>
                No institutes yet
              </div>
            ) : (
              <ul className="inst-list">
                {institutes.map((inst, i) => {
                  const s = STATUS_STYLE[inst.paymentStatus] || STATUS_STYLE.pending;
                  return (
                    <li key={inst.id || i} className="inst-row" style={delay(i * 0.05)}>
                      <span className="inst-avatar" aria-hidden="true">
                        {(inst.instituteName || '?').charAt(0).toUpperCase()}
                      </span>
                      <span className="inst-meta">
                        <span className="inst-name">{inst.instituteName || '\u2014'}</span>
                        <span className="inst-owner">{inst.ownerName || inst.username || '\u2014'}</span>
                      </span>
                      <span className="sc-badge" style={chipStyle(s)}>
                        <i className="sc-badge-dot" />{s.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>

          <article className="qa-col">
            <p className="sc-eyebrow qa-title">Quick Actions</p>
            {quickActions.map((a, i) => (
              <button key={a.label} className="sc-action" style={delay(i * 0.05)} onClick={a.action}>
                <span className="sc-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{a.icon}</svg>
                </span>
                {a.label}
                <svg className="sc-action-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            ))}
          </article>

        </section>
      </div>

      <style jsx>{`
        .wrap { display: flex; flex-direction: column; gap: 22px; }

        .name { margin-top: 5px; }
        .date { font-size: ${T.fXs}; margin-top: 6px; }

        /* Lifetime revenue reads as a credential in the masthead, which keeps
           it out of the KPI rail where it would dominate five smaller numbers. */
        .rev-badge {
          display: flex; flex-direction: column; gap: 1px;
          padding: 8px 14px;
          background: ${T.successTint};
          border: 1px solid rgba(34,197,94,0.22);
          border-radius: ${T.rMd};
        }
        .rb-l { font-size: ${T.fMicro}; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #15803D; }
        .rb-v { font-size: 1rem; font-weight: 800; color: #14532D; letter-spacing: -0.02em; }

        .grid-kpi { display: grid; gap: 14px; grid-template-columns: repeat(2, 1fr); }
        .grid-kpi :global(.sc-stat) {
          appearance: none;
          font: inherit;
          text-align: left;
          animation: sc-rise ${T.dSlow} ${T.ease} both;
        }

        /* Revenue card ----------------------------------------------- */
        .rev-card {
          background: linear-gradient(135deg, #FFFFFF 0%, ${T.hover} 100%);
          border-color: rgba(37,99,235,0.18);
        }
        .rev-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .rev-value {
          margin: 7px 0 0;
          font-size: clamp(1.8rem, 6vw, 2.4rem);
          font-weight: 800; letter-spacing: -0.035em; line-height: 1;
          color: ${T.navy};
        }
        .rev-load { opacity: 0.4; }
        .rev-sub { margin: 7px 0 0; font-size: ${T.fXs}; color: ${T.muted}; font-weight: 600; }

        /* Month picker ----------------------------------------------- */
        .picker { position: relative; }
        .caret { transition: transform ${T.dBase} ${T.ease}; }
        .caret.up { transform: rotate(180deg); }

        .picker-scrim { display: none; }

        .picker-pop {
          position: absolute; top: calc(100% + 8px); right: 0; z-index: 40;
          width: 236px; padding: 12px;
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: ${T.rLg};
          box-shadow: ${T.sh4};
          animation: sc-rise 260ms ${T.ease} both;
        }
        .picker-yr {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 10px; font-size: ${T.fSm}; font-weight: 800; color: ${T.text};
        }
        .yr-nav {
          width: 30px; height: 30px;
          display: grid; place-items: center;
          border: 1px solid ${T.border}; border-radius: 9px;
          background: ${T.card}; color: ${T.text}; cursor: pointer;
          transition: background ${T.dFast} ${T.ease};
        }
        .yr-nav:hover { background: ${T.hover}; }
        .picker-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
        .month-cell {
          min-height: 36px;
          border: 0; border-radius: 9px;
          font: inherit; font-size: ${T.fXs};
          cursor: pointer;
          transition: background ${T.dFast} ${T.ease};
        }
        .month-cell:hover { background: ${T.hover}; }

        /* Bottom row ------------------------------------------------- */
        .grid-bottom { display: grid; gap: 14px; grid-template-columns: 1fr; }
        .p-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }

        .inst-list { list-style: none; margin: 0; padding: 0; }
        .inst-row {
          display: flex; align-items: center; gap: 12px;
          min-height: 56px; padding: 10px 0;
          border-bottom: 1px solid #F1F5F9;
          animation: sc-rise ${T.dSlow} ${T.ease} both;
        }
        .inst-row:last-child { border-bottom: 0; }
        .inst-avatar {
          width: 38px; height: 38px; flex: 0 0 38px;
          display: grid; place-items: center;
          border-radius: 11px;
          background: linear-gradient(135deg, ${T.accent} 0%, ${T.accent2} 100%);
          color: #fff; font-weight: 800; font-size: ${T.fSm};
        }
        .inst-meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
        .inst-name {
          font-size: ${T.fSm}; font-weight: 700; color: ${T.text};
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .inst-owner {
          font-size: ${T.fXs}; color: ${T.muted};
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        .qa-col { display: flex; flex-direction: column; gap: 10px; }
        .qa-title { margin: 0 0 2px 2px; }
        .qa-col :global(.sc-action) { animation: sc-rise ${T.dSlow} ${T.ease} both; }

        /* Breakpoints ------------------------------------------------ */
        @media (min-width: 900px) {
          .wrap { gap: 26px; }
          .grid-kpi { grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .grid-bottom { grid-template-columns: 1.6fr 1fr; gap: 16px; }
        }
        @media (min-width: 1140px) {
          .grid-kpi { grid-template-columns: repeat(6, 1fr); }
        }

        /* On phones the popover would overflow the viewport, so it becomes a
           centred sheet with a scrim instead. */
        @media (max-width: 520px) {
          .picker-scrim {
            display: block;
            position: fixed; inset: 0; z-index: 39;
            background: rgba(11,31,77,0.38);
            animation: sc-fade ${T.dBase} ${T.ease} both;
          }
          .picker-pop {
            position: fixed;
            top: 50%; left: 50%; right: auto;
            transform: translate(-50%, -50%);
            width: min(300px, calc(100vw - 40px));
            animation: none;
          }
        }
      `}</style>
    </AdminLayout>
  );
}
