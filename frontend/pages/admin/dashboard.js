import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import StatCard from '../../components/ui/StatCard';
import api, { getUser } from '../../lib/api';

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
          padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)',
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
            >{actionLabel || 'View all →'}</button>
          )}
        </div>
      )}
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  );
}

const STATUS_STYLE = {
  paid:    { bg: 'rgba(16,185,129,0.09)',  text: '#059669', label: 'Paid' },
  overdue: { bg: 'rgba(239,68,68,0.09)',   text: '#dc2626', label: 'Overdue' },
  pending: { bg: 'rgba(245,158,11,0.09)',  text: '#d97706', label: 'Pending' },
};

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
  const router = useRouter();
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const handleMonthSelect = (year, monthIdx) => {
    const val = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
    setSelectedMonth(val);
    setShowMonthPicker(false);
  };

  const selectedLabel = (() => {
    const [y, m] = selectedMonth.split('-');
    return `${MONTHS[parseInt(m) - 1]} ${y}`;
  })();

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'admin') { router.push('/admin/login'); return; }
    fetchData();
  }, []);

  useEffect(() => {
    fetchMonthRevenue(selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    if (!showMonthPicker) return;
    const handler = (e) => {
      if (!e.target.closest('[data-month-picker]')) setShowMonthPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMonthPicker]);

  const fetchMonthRevenue = async (month) => {
    setMonthLoading(true);
    try {
      const res = await api.get(`/api/admin/revenue?month=${month}`);
      setMonthRevenue(res.data);
    } catch {
      setMonthRevenue(null);
    } finally { setMonthLoading(false); }
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

  const quickActions = [
    { label: 'Add Institute', icon: '➕', action: () => router.push('/admin/institutes?action=new'),
      color: '#5ce1e6', bg: 'rgba(92,225,230,0.08)', border: 'rgba(92,225,230,0.2)' },
    { label: `View Leads (${stats?.newLeads || 0} new)`, icon: '📋', action: () => router.push('/admin/leads'),
      color: '#1a73e8', bg: 'rgba(26,115,232,0.07)', border: 'rgba(26,115,232,0.15)' },
    { label: 'Manage Institutes', icon: '🏫', action: () => router.push('/admin/institutes'),
      color: '#7c3aed', bg: 'rgba(139,92,246,0.07)', border: 'rgba(139,92,246,0.15)' },
  ];

  return (
    <AdminLayout title="Dashboard">
      {/* Offline banner */}
      {dbOffline && (
        <div style={{
          marginBottom: 16, padding: '12px 16px', borderRadius: 12,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: '#92400e',
        }}>
          <span style={{ fontSize: '1rem' }}>⚠️</span>
          Database is offline. Some data may not be available. Core admin functions still work.
        </div>
      )}

      {/* Stat Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{
              height: 100, borderRadius: 16, background: 'white',
              border: '1px solid rgba(0,0,0,0.06)',
              animation: 'dashPulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`,
            }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
          <StatCard label="Active Institutes"          value={stats?.activeInstitutes ?? '—'}           icon="🏢" color="gold" />
          <StatCard label="Total Institutes"           value={stats?.totalInstitutes ?? '—'}            icon="🏫" color="blue" />
          <StatCard label="New Requests"               value={stats?.newLeads ?? '—'}                   icon="📝" color="blue" />

          {/* Monthly Revenue with month selector */}
          <div style={{
            background: 'white', borderRadius: 16,
            border: '1px solid rgba(92,225,230,0.18)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            padding: '16px 18px',
            gridColumn: 'span 2',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.07em', color: '#6b7280', textTransform: 'uppercase' }}>
                💰 Monthly Revenue
              </p>
              <div style={{ position: 'relative' }} data-month-picker="true">
                <button
                  onClick={() => setShowMonthPicker(p => !p)}
                  style={{
                    fontSize: '0.75rem', fontWeight: 600, color: '#92680a',
                    background: 'rgba(92,225,230,0.07)', border: '1px solid rgba(92,225,230,0.2)',
                    borderRadius: 8, padding: '4px 10px', cursor: 'pointer', outline: 'none',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  {selectedLabel} <span style={{ fontSize: '0.65rem' }}>▾</span>
                </button>
                {showMonthPicker && (
                  <div style={{
                    position: 'absolute', right: 0, top: '110%', zIndex: 100,
                    background: 'white', borderRadius: 12, padding: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.14)', border: '1px solid rgba(0,0,0,0.08)',
                    width: 220,
                  }}>
                    {/* Year navigation */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <button onClick={() => setPickerYear(y => y - 1)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '1rem', color: '#6b7280', padding: '2px 6px', borderRadius: 6,
                      }}>‹</button>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>{pickerYear}</span>
                      <button onClick={() => setPickerYear(y => y + 1)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '1rem', color: '#6b7280', padding: '2px 6px', borderRadius: 6,
                      }}>›</button>
                    </div>
                    {/* Month grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                      {MONTHS.map((m, i) => {
                        const val = `${pickerYear}-${String(i + 1).padStart(2, '0')}`;
                        const isSelected = val === selectedMonth;
                        return (
                          <button key={m} onClick={() => handleMonthSelect(pickerYear, i)} style={{
                            padding: '6px 4px', borderRadius: 8, cursor: 'pointer',
                            background: isSelected ? 'rgba(92,225,230,0.15)' : 'transparent',
                            border: isSelected ? '1px solid rgba(92,225,230,0.4)' : '1px solid transparent',
                            color: isSelected ? '#92680a' : '#374151',
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: '0.75rem',
                            transition: 'all 0.15s ease',
                          }}
                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
                            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                          >{m}</button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#92680a', letterSpacing: '-0.02em' }}>
              {monthLoading ? '...' : `₹${fmt(monthRevenue?.revenue ?? stats?.monthlyRevenue)}`}
            </p>
            {monthRevenue && (
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>
                {monthRevenue.paidCount ?? 0} paid institute{(monthRevenue.paidCount ?? 0) !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <StatCard label="This Month's Overdue"       value={`₹${fmt(stats?.overduePayments)}`}        icon="🔴" color="red" />
          <StatCard label="Total Lifetime Revenue"     value={`₹${fmt(stats?.totalRevenue)}`}           icon="📈" color="green" />
          <StatCard label="New Institutes This Month"  value={stats?.newInstitutesThisMonth ?? '—'}     icon="🚀" color="green" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>

        {/* Recent institutes table */}
        <div style={{ gridColumn: 'span 2' }} className="min-w-0">
          <SectionCard title="Recent Institutes" action={() => router.push('/admin/institutes')} actionLabel="View all →">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Institute', 'Owner', 'Plan', 'Status'].map(h => (
                      <th key={h} style={{
                        textAlign: 'left', padding: '0 8px 12px',
                        color: '#9ca3af', fontWeight: 600, fontSize: '0.75rem',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        borderBottom: '1px solid rgba(0,0,0,0.05)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {institutes.map((inst, i) => {
                    const s = STATUS_STYLE[inst.paymentStatus] || STATUS_STYLE.pending;
                    return (
                      <tr key={inst._id} style={{
                        borderBottom: i < institutes.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                        transition: 'background 0.15s ease',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.015)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 8px', fontWeight: 600, color: '#111827' }}>
                          {inst.instituteName}
                        </td>
                        <td style={{ padding: '12px 8px', color: '#6b7280' }}>{inst.ownerName}</td>
                        <td style={{ padding: '12px 8px', fontWeight: 600, color: '#374151' }}>
                          ₹{inst.planAmount?.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '3px 10px', borderRadius: 20,
                            fontSize: '0.7rem', fontWeight: 700,
                            background: s.bg, color: s.text,
                          }}>
                            {s.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {institutes.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '36px 8px', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                        {dbOffline ? 'Database offline — cannot load institutes' : 'No institutes yet'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        {/* Quick actions + active widget */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SectionCard title="Quick Actions">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {quickActions.map(a => (
                <button key={a.label} onClick={a.action} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                  background: a.bg, border: `1px solid ${a.border}`,
                  fontSize: '0.85rem', fontWeight: 600, color: a.color,
                  textAlign: 'left', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.boxShadow = `0 4px 16px ${a.color}22`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </SectionCard>

        </div>

      </div>

      <style jsx global>{`
        @keyframes dashPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </AdminLayout>
  );
}