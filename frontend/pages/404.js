import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a1844 0%, #11245d 50%, #0a1844 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 55% 55% at 50% 50%, rgba(92,225,230,0.06) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(92,225,230,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(92,225,230,0.02) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      <div style={{
        textAlign: 'center', position: 'relative', zIndex: 10,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(24px)',
        transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{
          fontSize: '8rem',
          fontWeight: 900,
          background: 'linear-gradient(135deg, rgba(92,225,230,0.15), rgba(240,192,64,0.08))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
          marginBottom: '16px',
          letterSpacing: '-0.04em',
        }}>
          404
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f0f6ff', marginBottom: '8px' }}>
          Page not found
        </h1>
        <p style={{ color: 'rgba(200,215,255,0.5)', marginBottom: '36px' }}>
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link
            href="/"
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.875rem',
              color: '#11245d',
              background: 'linear-gradient(135deg, #d4af37, #f0c040)',
              boxShadow: '0 0 20px rgba(92,225,230,0.25)',
              transition: 'all 0.3s ease',
              textDecoration: 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 0 36px rgba(92,225,230,0.45)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(92,225,230,0.25)';
            }}
          >
            Go Home
          </Link>
          <Link
            href="/institute/login"
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'rgba(200,215,255,0.75)',
              border: '1px solid rgba(200,215,255,0.14)',
              background: 'rgba(255,255,255,0.03)',
              transition: 'all 0.3s ease',
              textDecoration: 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#f0c040';
              e.currentTarget.style.borderColor = 'rgba(92,225,230,0.35)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(200,215,255,0.75)';
              e.currentTarget.style.borderColor = 'rgba(200,215,255,0.14)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Institute Login
          </Link>
        </div>
      </div>
    </div>
  );
}