import { useState } from 'react';

const THEMES = {
  blue:   { bg: 'rgba(26,115,232,0.09)',   icon: 'rgba(26,115,232,1)',   text: '#1a73e8',  glow: 'rgba(26,115,232,0.18)',  bar: '#1a73e8' },
  green:  { bg: 'rgba(16,185,129,0.09)',   icon: 'rgba(16,185,129,1)',   text: '#059669',  glow: 'rgba(16,185,129,0.18)',  bar: '#10b981' },
  yellow: { bg: 'rgba(245,158,11,0.09)',   icon: 'rgba(245,158,11,1)',   text: '#d97706',  glow: 'rgba(245,158,11,0.18)',  bar: '#f59e0b' },
  red:    { bg: 'rgba(239,68,68,0.09)',    icon: 'rgba(239,68,68,1)',    text: '#dc2626',  glow: 'rgba(239,68,68,0.18)',   bar: '#ef4444' },
  purple: { bg: 'rgba(139,92,246,0.09)',   icon: 'rgba(139,92,246,1)',   text: '#7c3aed',  glow: 'rgba(139,92,246,0.18)',  bar: '#8b5cf6' },
  gold:   { bg: 'rgba(92,225,230,0.09)',   icon: 'rgba(92,225,230,1)',   text: '#ffffff',  glow: 'rgba(92,225,230,0.18)',  bar: '#5ce1e6' },
};

export default function StatCard({ label, value, icon, color = 'gold', sub, trend }) {
  const t = THEMES[color] || THEMES.gold;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'white',
        borderRadius: 16,
        border: hovered ? `1px solid ${t.glow}` : '1px solid rgba(0,0,0,0.06)',
        padding: '20px',
        boxShadow: hovered
          ? `0 12px 36px ${t.glow}, 0 4px 12px rgba(0,0,0,0.06)`
          : '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        willChange: 'transform, box-shadow',
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2.5px',
        background: `linear-gradient(90deg, ${t.bar}, ${t.bar}88)`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.3s ease',
        borderRadius: '16px 16px 0 0',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
          }}>{label}</p>
          <p style={{
            fontSize: '1.65rem', fontWeight: 800, color: '#111827',
            letterSpacing: '-0.03em', lineHeight: 1, marginBottom: sub ? 6 : 0,
            transition: 'color 0.2s ease',
          }}>
            {value ?? '—'}
          </p>
          {sub && (
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>{sub}</p>
          )}
          {trend && (
            <p style={{
              fontSize: '0.75rem', fontWeight: 600, marginTop: 6,
              color: trend > 0 ? '#10b981' : '#ef4444',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        <div style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
          background: t.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.35rem',
          boxShadow: hovered ? `0 0 20px ${t.glow}` : 'none',
          transition: 'box-shadow 0.35s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1)',
          transform: hovered ? 'scale(1.1) rotate(-4deg)' : 'scale(1)',
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}