import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import InstituteLayout from '../../components/layout/InstituteLayout';
import api, { getUser } from '../../lib/api';

const fmtDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return String(val);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = d.toLocaleString('en-IN', { month: 'short', timeZone: 'UTC' });
  return `${day} ${month} ${d.getUTCFullYear()}`;
};

export default function InstituteDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'institute') { router.push('/institute/login'); return; }
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

  if (loading) {
    return (
      <InstituteLayout title="Dashboard">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: 80, borderRadius: 16, background: 'white', border: '1px solid rgba(0,0,0,0.06)', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i*0.1}s` }} />
          ))}
        </div>
        <style jsx global>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
      </InstituteLayout>
    );
  }

  // ── Stats as flat data ──────────────────────────────────────────────────────
  const stats = [
    { label: 'Total Students', value: summary?.totalStudents ?? 0, icon: '👨‍🎓', accent: '#1a73e8', bg: 'rgba(26,115,232,0.08)' },
    { label: 'Present Today',  value: summary?.presentToday ?? 0,  icon: '✅',   accent: '#059669', bg: 'rgba(16,185,129,0.08)' },
    { label: 'Absent Today',   value: summary?.absentToday ?? 0,   icon: '❌',   accent: '#dc2626', bg: 'rgba(239,68,68,0.08)' },
    { label: 'Overdue Fees',   value: `₹${fmt(summary?.pendingFees)}`, icon: '💰', accent: '#d97706', bg: 'rgba(245,158,11,0.08)', sub: `${summary?.overdueStudents ?? 0} students overdue` },
    { label: 'New Enquiries',  value: summary?.newEnquiries ?? 0,  icon: '📝',   accent: '#7c3aed', bg: 'rgba(139,92,246,0.08)', sub: `${summary?.followUpEnquiries ?? 0} follow-up` },
  ];

  const quickActions = [
    { label: 'Add Student',     icon: '👤', href: '/institute/students',   accent: '#1a73e8', bg: 'rgba(26,115,232,0.07)' },
    { label: 'Mark Attendance', icon: '✅', href: '/institute/attendance',  accent: '#059669', bg: 'rgba(16,185,129,0.07)' },
    { label: 'Update Fees',     icon: '💰', href: '/institute/fees',        accent: '#d97706', bg: 'rgba(245,158,11,0.07)' },
    { label: 'Enquiries',       icon: '📝', href: '/institute/enquiries',   accent: '#7c3aed', bg: 'rgba(139,92,246,0.07)' },
  ];

  const feeRows = [
    { label: 'Total Fees',       value: `₹${fmt(summary?.totalFees)}`,    color: '#374151' },
    { label: 'Collected',        value: `₹${fmt(summary?.collectedFees)}`, color: '#059669' },
    { label: 'Overdue Students', value: summary?.overdueStudents ?? 0,      color: '#dc2626' },
  ];

  const enquiryPipeline = [
    { label: 'New',       value: summary?.newEnquiries ?? 0,       bg: 'rgba(26,115,232,0.08)',  text: '#1a73e8' },
    { label: 'Follow-Up', value: summary?.followUpEnquiries ?? 0,  bg: 'rgba(245,158,11,0.08)', text: '#d97706' },
    { label: 'Converted', value: summary?.convertedEnquiries ?? 0, bg: 'rgba(16,185,129,0.08)', text: '#059669' },
  ];

  return (
    <InstituteLayout title="Dashboard">

      {/* ── MOBILE LAYOUT ─────────────────────────────────────────────────────── */}
      <div className="mobile-layout">

        {/* Horizontal scrollable stat pills — Duolingo/Airbnb style */}
        <div style={{ margin: '0 -16px', paddingLeft: 16, overflowX: 'auto', display: 'flex', gap: 10, paddingBottom: 4, scrollbarWidth: 'none' }}
          className="hide-scroll">
          {stats.map(s => (
            <div key={s.label} style={{
              flexShrink: 0, background: 'white', borderRadius: 16,
              border: `1.5px solid ${s.accent}22`,
              padding: '14px 16px', minWidth: 130,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
              </div>
              <p style={{ fontSize: '1.6rem', fontWeight: 800, color: s.accent, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</p>
              {s.sub && <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: 4 }}>{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Quick actions — 2x2 grid, Airbnb category pill style */}
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Quick Actions</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {quickActions.map(a => (
              <button key={a.label} onClick={() => router.push(a.href)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px', borderRadius: 14, cursor: 'pointer',
                background: a.bg, border: `1.5px solid ${a.accent}22`,
                fontSize: '0.82rem', fontWeight: 600, color: a.accent,
                textAlign: 'left', transition: 'all 0.18s ease',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <span style={{ fontSize: '1.2rem' }}>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fee Overview — card */}
        <div style={{ marginTop: 20, background: 'white', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>💰 Fee Overview</span>
            <button onClick={() => router.push('/institute/fees')} style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1a73e8', background: 'rgba(26,115,232,0.06)', border: '1px solid rgba(26,115,232,0.14)', padding: '4px 10px', borderRadius: 20, cursor: 'pointer' }}>
              View Fees →
            </button>
          </div>
          <div style={{ padding: '4px 16px 8px' }}>
            {feeRows.map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>{row.label}</span>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Enquiry Pipeline — card */}
        <div style={{ marginTop: 14, background: 'white', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>📝 Enquiry Pipeline</span>
            <button onClick={() => router.push('/institute/enquiries')} style={{ fontSize: '0.72rem', fontWeight: 600, color: '#7c3aed', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.14)', padding: '4px 10px', borderRadius: 20, cursor: 'pointer' }}>
              Manage →
            </button>
          </div>
          <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {enquiryPipeline.map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '14px 8px', textAlign: 'center' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: s.text, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: '10px', fontWeight: 600, color: s.text, marginTop: 4, opacity: 0.8 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── DESKTOP LAYOUT (unchanged) ─────────────────────────────────────────── */}
      <div className="desktop-layout">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</p>
                  <p style={{ fontSize: '1.65rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</p>
                  {s.sub && <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>{s.sub}</p>}
                </div>
                <div style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem' }}>{s.icon}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontWeight: 700, color: '#111827', fontSize: '0.925rem' }}>💰 Fee Overview</h2>
              <button onClick={() => router.push('/institute/fees')} style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1a73e8', background: 'rgba(26,115,232,0.06)', border: '1px solid rgba(26,115,232,0.14)', padding: '4px 12px', borderRadius: 20, cursor: 'pointer' }}>View Fees →</button>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {feeRows.map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <span style={{ fontSize: '0.825rem', color: '#9ca3af' }}>{row.label}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontWeight: 700, color: '#111827', fontSize: '0.925rem' }}>📝 Enquiry Pipeline</h2>
              <button onClick={() => router.push('/institute/enquiries')} style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1a73e8', background: 'rgba(26,115,232,0.06)', border: '1px solid rgba(26,115,232,0.14)', padding: '4px 12px', borderRadius: 20, cursor: 'pointer' }}>Manage →</button>
            </div>
            <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {enquiryPipeline.map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '14px 10px', textAlign: 'center' }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: s.text, lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: '0.7rem', fontWeight: 600, color: s.text, marginTop: 5, opacity: 0.8 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontWeight: 700, color: '#111827', fontSize: '0.925rem' }}>⚡ Quick Actions</h2>
            </div>
            <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {quickActions.map((a, idx) => (
                <button key={a.label} onClick={() => router.push(a.href)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '13px 14px', borderRadius: 12, cursor: 'pointer',
                  background: a.bg, border: `1px solid ${a.accent}20`,
                  fontSize: '0.8rem', fontWeight: 600, color: a.accent,
                  textAlign: 'left', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                  gridColumn: (quickActions.length % 2 !== 0 && idx === quickActions.length - 1) ? '1 / -1' : 'auto',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 20px ${a.accent}22`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{a.icon}</span>{a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .mobile-layout { display: block; }
        .desktop-layout { display: none; }
        .hide-scroll::-webkit-scrollbar { display: none; }
        @media (min-width: 768px) {
          .mobile-layout { display: none; }
          .desktop-layout { display: block; }
        }
      `}</style>
    </InstituteLayout>
  );
}