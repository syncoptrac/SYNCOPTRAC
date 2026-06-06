import Link from 'next/link';
import { FadeUp } from '../ui/ScrollReveal';

export default function Footer() {
  return (
    <footer style={{
      background: 'linear-gradient(180deg, #0d1e55 0%, #11245d 100%)',
      color: 'rgba(180,200,240,0.55)',
      paddingTop: '64px',
      paddingBottom: '40px',
      marginTop: 'auto',
      borderTop: '1px solid rgba(92,225,230,0.08)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '200px',
        background: 'radial-gradient(ellipse, rgba(92,225,230,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <img
                  src="/logo.png"
                  alt="SYNCOPTRAC"
                  className="h-10 w-10 object-cover rounded-lg"
                  style={{ boxShadow: '0 0 16px rgba(92,225,230,0.15)' }}
                />
                <div>
                  <p className="font-bold text-base leading-none">
                    <span style={{ color: '#5ce1e6' }}>SYNCOP</span>
                    <span style={{ color: '#ffffff' }}>TRAC</span>
                  </p>
                  <p className="text-xs mt-0.5 italic" style={{ color: 'rgba(180,200,240,0.35)' }}>
                    Where communication gets organised and nothing is missed
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-5 text-sm" style={{ color: 'rgba(240,245,255,0.75)', letterSpacing: '0.01em' }}>
                Quick Links
              </h4>
              <div className="space-y-3 text-sm">
                {[
                  ['/', 'Home'],
                  ['/features', 'Features'],
                  ['/get-started', 'Get Started'],
                  ['/about', 'About'],
                  ['/contact', 'Contact'],
                  ['/privacy', 'Privacy & Data Handling'],
                ].map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    style={{
                      display: 'block',
                      color: 'rgba(180,200,240,0.5)',
                      transition: 'color 0.25s ease, padding-left 0.25s ease',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = '#5ce1e6';
                      e.currentTarget.style.paddingLeft = '4px';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = 'rgba(180,200,240,0.5)';
                      e.currentTarget.style.paddingLeft = '0px';
                    }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-5 text-sm" style={{ color: 'rgba(240,245,255,0.75)', letterSpacing: '0.01em' }}>
                Contact
              </h4>
              <div className="space-y-3 text-sm">
                <a
                  href="mailto:syncoptrac@gmail.com"
                  style={{
                    display: 'block',
                    color: 'rgba(180,200,240,0.5)',
                    transition: 'color 0.25s ease',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#5ce1e6'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(180,200,240,0.5)'}
                >
                  syncoptrac@gmail.com
                </a>
                <p className="text-xs" style={{ color: 'rgba(180,200,240,0.35)' }}>We respond within 24 hours</p>
              </div>
            </div>
          </div>
        </FadeUp>

        <div style={{
          borderTop: '1px solid rgba(92,225,230,0.08)',
          paddingTop: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }} className="sm:flex-row">
          <p className="text-xs" style={{ color: 'rgba(180,200,240,0.3)' }}>
            © 2026 SYNCOPTRAC. All rights reserved.
          </p>
          <p className="text-xs italic" style={{ color: 'rgba(180,200,240,0.25)' }}>
            Made in India.
          </p>
        </div>
      </div>
    </footer>
  );
}