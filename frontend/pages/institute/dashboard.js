import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import InstituteLayout from '../../components/layout/InstituteLayout';
import StatCard from '../../components/ui/StatCard';
import api, { getUser } from '../../lib/api';

// Timezone-safe date formatter — handles ISO strings from Google Sheets
// Sheets stores dates as UTC midnight IST (i.e. 18:30 UTC prev day).
// We read the date parts directly from UTC to avoid local-TZ shift.
const fmtDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return String(val);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = d.toLocaleString('en-IN', { month: 'short', timeZone: 'UTC' });
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
};

function LoadingPulse() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{
          height: 100, borderRadius: 16, background: 'white',
          border: '1px solid rgba(0,0,0,0.06)',
          animation: 'dashPulse 1.5s ease-in-out infinite',
          animationDelay: `${i * 0.1}s`,
        }} />
      ))}
      <style jsx global>{`
        @keyframes dashPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </div>
  );
}

function SectionCard({ children, title, action, actionLabel }) {
  return (
    <div style={{
      background: 'white', borderRadius: 16,
      border: '1px solid rgba(0,0,0,0.06)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      overflow: 'hidden',
    }}>
      {(title || action) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        }}>
          {title && (
            <h2 style={{ fontWeight: 700, color: '#111827', fontSize: '0.925rem', letterSpacing: '-0.01em' }}>
              {title}
            </h2>
          )}
          {action && (
            <button onClick={action} style={{
              fontSize: '0.75rem', fontWeight: 600, color: '#1a73e8',
              background: 'rgba(26,115,232,0.06)', border: '1px solid rgba(26,115,232,0.14)',
              padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,115,232,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(26,115,232,0.06)'}
            >
              {actionLabel || 'View all →'}
            </button>
          )}
        </div>
      )}
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  );
}

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
      // FIX: log the real error so you can diagnose Apps Script issues in the console
      console.error('Dashboard summary failed:', e?.response?.data || e.message);
      // Don't crash — show zeros rather than a blank/broken page
      setSummary(null);
    } finally { setLoading(false); }
  };

  const fmt = (n) => (n ?? 0).toLocaleString('en-IN');

  const feeRows = [
    { label: 'Total Fees',        value: `₹${fmt(summary?.totalFees)}`,     color: '#374151' },
    { label: 'Collected',         value: `₹${fmt(summary?.collectedFees)}`,  color: '#059669' },
    { label: 'Overdue Students',  value: summary?.overdueStudents ?? 0,       color: '#dc2626' },
  ];

  const enquiryPipeline = [
    { label: 'New',       value: summary?.newEnquiries ?? 0,       bg: 'rgba(26,115,232,0.08)',  text: '#1a73e8',  border: 'rgba(26,115,232,0.15)' },
    { label: 'Follow-Up', value: summary?.followUpEnquiries ?? 0,  bg: 'rgba(245,158,11,0.08)', text: '#d97706', border: 'rgba(245,158,11,0.15)' },
    { label: 'Converted', value: summary?.convertedEnquiries ?? 0, bg: 'rgba(16,185,129,0.08)', text: '#059669', border: 'rgba(16,185,129,0.15)' },
  ];

  const quickActions = [
    { label: 'Add Student',       icon: '👤', href: '/institute/students',   color: '#1a73e8', bg: 'rgba(26,115,232,0.07)' },
    { label: 'Mark Attendance',   icon: '✅', href: '/institute/attendance',  color: '#059669', bg: 'rgba(16,185,129,0.07)' },
    { label: 'Update Fees',       icon: '💰', href: '/institute/fees',        color: '#d97706', bg: 'rgba(245,158,11,0.07)' },
  ];

  return (
    <InstituteLayout title="Dashboard">
      {loading ? <LoadingPulse /> : (
        <>
          {/* ── Stat Cards ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 14, marginBottom: 20,
          }}>
            <StatCard label="Total Students"  value={summary?.totalStudents ?? 0}        icon="👨‍🎓" color="blue" />
            <StatCard label="Present Today"   value={summary?.presentToday ?? 0}          icon="✅"   color="green" />
            <StatCard label="Absent Today"    value={summary?.absentToday ?? 0}           icon="❌"   color="red" />
            <StatCard label="Overdue Fees"    value={`₹${fmt(summary?.pendingFees)}`}     icon="💰"   color="red"
              sub={`${summary?.overdueStudents ?? 0} overdue`} />
            <StatCard label="New Enquiries"   value={summary?.newEnquiries ?? 0}          icon="📝"   color="purple"
              sub={`${summary?.followUpEnquiries ?? 0} follow-up`} />
          </div>

          {/* ── Bottom Grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>

            {/* Fee Overview */}
            <SectionCard title="💰 Fee Overview" action={() => router.push('/institute/fees')} actionLabel="View Fees →">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {feeRows.map(row => (
                  <div key={row.label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                  }}>
                    <span style={{ fontSize: '0.825rem', color: '#9ca3af' }}>{row.label}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Enquiry Pipeline */}
            <SectionCard title="📝 Enquiry Pipeline" action={() => router.push('/institute/enquiries')} actionLabel="Manage →">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 4 }}>
                {enquiryPipeline.map(s => (
                  <div key={s.label} style={{
                    background: s.bg, borderRadius: 12, padding: '14px 10px', textAlign: 'center',
                    border: `1px solid ${s.border}`,
                    transition: 'transform 0.2s ease',
                    cursor: 'default',
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: s.text, lineHeight: 1 }}>{s.value}</p>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color: s.text, marginTop: 5, opacity: 0.8 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Quick Actions */}
            <SectionCard title="⚡ Quick Actions">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {quickActions.map(a => (
                  <button key={a.label} onClick={() => router.push(a.href)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '13px 14px', borderRadius: 12, cursor: 'pointer',
                    background: a.bg, border: `1px solid ${a.color}20`,
                    transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                    textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: a.color,
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                      e.currentTarget.style.boxShadow = `0 8px 20px ${a.color}22`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{a.icon}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </SectionCard>

          </div>
        </>
      )}
    </InstituteLayout>
  );
}