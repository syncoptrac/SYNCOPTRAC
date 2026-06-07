import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { FadeUp } from '../components/ui/ScrollReveal';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ overflowX: 'hidden' }}>
      <Navbar />

      {/* Page header */}
      <section
        className="relative py-20 px-4 text-center overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0a1844 0%, #11245d 50%, #0a1844 100%)',
          color: 'white',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(92,225,230,0.07) 0%, transparent 70%)',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(92,225,230,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(92,225,230,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        <div className="relative z-10">
          <div
            className="inline-block text-xs font-bold px-3.5 py-1.5 rounded-full mb-6 uppercase tracking-widest"
            style={{
              background: 'rgba(92,225,230,0.08)',
              color: '#f0c040',
              border: '1px solid rgba(92,225,230,0.2)',
            }}
          >
            Contact
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ letterSpacing: '-0.02em' }}>
            Contact Us
          </h1>
          <p className="text-lg" style={{ color: 'rgba(200,215,255,0.7)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
            For any queries related to setup, features, or pricing, feel free to reach out.
          </p>
        </div>
      </section>

      {/* Contact info */}
      <section className="py-16 px-4" style={{ background: '#f4f6ff', flex: 1 }}>
        <div className="max-w-2xl mx-auto">
          <FadeUp>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Email card */}
              <div style={{
                background: 'white',
                borderRadius: '20px',
                border: '1px solid rgba(92,225,230,0.12)',
                boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                padding: '32px 28px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'box-shadow 0.3s ease, transform 0.3s ease',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(92,225,230,0.1)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ height: 3, background: 'linear-gradient(90deg, #5ce1e6, transparent)', position: 'absolute', top: 0, left: 0, right: 0, borderRadius: '20px 20px 0 0' }} />
                <div style={{ fontSize: '2rem', marginBottom: '16px' }}>📧</div>
                <h3 style={{ fontWeight: 700, color: '#111827', fontSize: '1rem', marginBottom: '8px' }}>Email</h3>
                <a
                  href="mailto:syncoptrac@gmail.com"
                  style={{
                    display: 'block',
                    color: '#111827',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#374151'}
                  onMouseLeave={e => e.currentTarget.style.color = '#111827'}
                >
                  syncoptrac@gmail.com
                </a>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '8px' }}>
                  We respond within 24 hours
                </p>
              </div>

              {/* Call timing card */}
              <div style={{
                background: 'white',
                borderRadius: '20px',
                border: '1px solid rgba(26,115,232,0.1)',
                boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                padding: '32px 28px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'box-shadow 0.3s ease, transform 0.3s ease',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(26,115,232,0.08)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ height: 3, background: 'linear-gradient(90deg, #1a73e8, transparent)', position: 'absolute', top: 0, left: 0, right: 0, borderRadius: '20px 20px 0 0' }} />
                <div style={{ fontSize: '2rem', marginBottom: '16px' }}>📞</div>
                <h3 style={{ fontWeight: 700, color: '#111827', fontSize: '1rem', marginBottom: '8px' }}>Call Requests</h3>
                <p style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.65, marginBottom: '10px' }}>
                  To request a call, email us your phone number. We will review your request and contact you to arrange a suitable time for a call.
                </p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(26,115,232,0.07)', borderRadius: '10px',
                  padding: '8px 12px',
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1a73e8' }}>
                    Calling Hours: Monday – Saturday &nbsp;·&nbsp; 5:00 PM – 9:00 PM
                  </span>
                </div>
              </div>
            </div>
          </FadeUp>

          {/* Bottom CTA */}
          <FadeUp delay={120}>
            <div style={{
              marginTop: '32px',
              background: 'white',
              borderRadius: '20px',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              padding: '32px 28px',
              textAlign: 'center',
            }}>
              <p style={{ color: '#374151', fontSize: '0.95rem', marginBottom: '18px', lineHeight: 1.65 }}>
                Looking to set up your institute? Use the form to submit your details and we will get in touch.
              </p>
              <Link
                href="/get-started"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, #d4af37, #f0c040)',
                  color: '#11245d',
                  fontWeight: 700, fontSize: '0.9rem',
                  padding: '12px 24px', borderRadius: '12px',
                  textDecoration: 'none',
                  boxShadow: '0 0 20px rgba(92,225,230,0.25)',
                  transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
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
                Get Started →
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      <Footer />
    </div>
  );
}