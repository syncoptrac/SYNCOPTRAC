import Link from 'next/link';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import AnimatedHero from '../components/ui/AnimatedHero';
import { FadeUp, FadeIn } from '../components/ui/ScrollReveal';

const valuePoints = [
  {
    icon: '🔗',
    title: 'Centralised Communication',
    desc: 'Centralised communication where nothing gets missed — all records, messages, and updates flow through one organised system.',
  },
  {
    icon: '👁️',
    title: 'Clear Visibility',
    desc: 'Clear visibility with timely follow-ups across batches, attendance, fees, and enquiries — so nothing slips through the cracks.',
  },
  {
    icon: '📂',
    title: 'Everything in One Place',
    desc: 'All communication stays organised in one place — no scattered spreadsheets, no missed follow-ups, no confusion.',
  },
];

const howItWorks = [
  { step: '1', title: 'Submit Institute Details', desc: 'Fill in your institute details through the Get Started form.' },
  { step: '2', title: 'Instant Confirmation Email', desc: 'You will receive an immediate confirmation that your request was received.' },
  { step: '3', title: 'Review & Eligibility Check', desc: 'Our team reviews your details and checks eligibility within 24 hours.' },
  { step: '4', title: 'Plan Confirmation', desc: 'We confirm your plan and share the next steps with you directly.' },
  { step: '5', title: 'Setup & Activation', desc: 'Your institute account is configured, connected, and ready to use.' },
];

function ValueCard({ icon, title, desc, delay }) {
  return (
    <FadeUp delay={delay}>
      <div
        style={{
          background: 'white',
          borderRadius: '18px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)',
          padding: '32px 28px',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          transition: 'box-shadow 0.35s ease, border-color 0.35s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 24px 64px rgba(17,36,93,0.10), 0 8px 24px rgba(0,0,0,0.07)';
          e.currentTarget.style.borderColor = 'rgba(92,225,230,0.22)';
          e.currentTarget.style.transform = 'translateY(-6px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)';
          e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(92,225,230,0.45), transparent)',
          borderRadius: '18px 18px 0 0',
        }} />
        <div style={{ fontSize: '2.2rem', marginBottom: '18px' }}>{icon}</div>
        <h3 style={{ fontWeight: 700, color: '#111827', marginBottom: '10px', fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
          {title}
        </h3>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.7 }}>{desc}</p>
      </div>
    </FadeUp>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ overflowX: 'hidden' }}>
      <Navbar />

      <AnimatedHero />

      {/* CORE VALUE POINTS */}
      <section className="py-28 px-4" style={{ background: '#f4f6ff' }}>
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-16">
            <div
              className="inline-block text-xs font-bold px-3.5 py-1.5 rounded-full mb-5 uppercase tracking-widest"
              style={{
                background: 'rgba(17,36,93,0.07)',
                color: '#11245d',
                border: '1px solid rgba(17,36,93,0.18)',
              }}
            >
              Why SYNCOPTRAC
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4" style={{ letterSpacing: '-0.02em' }}>
              Built Around One Simple Idea
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
              Keep everything organised, keep everyone informed, and let nothing fall through the cracks.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {valuePoints.map((v, i) => (
              <ValueCard key={v.title} {...v} delay={i * 90} />
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-28 px-4 bg-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(17,36,93,0.055) 1px, transparent 0)',
          backgroundSize: '36px 36px',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 50%, rgba(255,255,255,0.85) 100%)',
        }} />

        <div className="max-w-5xl mx-auto relative z-10">
          <FadeUp className="text-center mb-18">
            <div
              className="inline-block text-xs font-bold px-3.5 py-1.5 rounded-full mb-5 uppercase tracking-widest"
              style={{
                background: 'rgba(92,225,230,0.07)',
                color: '#11245d',
                border: '1px solid rgba(92,225,230,0.22)',
              }}
            >
              How It Works
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900" style={{ letterSpacing: '-0.02em' }}>
              From Request to Ready in 5 Steps
            </h2>
            <p className="text-gray-500 text-base mt-4 max-w-xl mx-auto leading-relaxed">
              A structured onboarding process so your institute is set up correctly, every time.
            </p>
          </FadeUp>

          <div className="mt-16 relative">
            <FadeIn>
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0" style={{
                width: '1px',
                background: 'linear-gradient(180deg, transparent, rgba(17,36,93,0.2) 15%, rgba(17,36,93,0.35) 50%, rgba(17,36,93,0.2) 85%, transparent)',
                transform: 'translateX(-50%)',
              }} />
            </FadeIn>

            <div className="space-y-10 md:space-y-0">
              {howItWorks.map((s, i) => (
                <FadeUp key={s.step} delay={i * 110}>
                  <div className={`md:flex items-center gap-8 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                    style={{ marginBottom: '32px' }}>

                    <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right md:pr-8' : 'md:text-left md:pl-8'}`}>
                      <div style={{
                        background: 'white',
                        borderRadius: '14px',
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                        padding: '22px 24px',
                        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
                      }}
                        onMouseEnter={e => {
                          e.currentTarget.style.boxShadow = '0 8px 32px rgba(17,36,93,0.10)';
                          e.currentTarget.style.borderColor = 'rgba(92,225,230,0.28)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)';
                          e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)';
                        }}
                      >
                        <div className="md:hidden" style={{ marginBottom: '12px' }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #11245d, #5ce1e6)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '0.85rem', color: 'white',
                            boxShadow: '0 0 14px rgba(17,36,93,0.25)',
                          }}>
                            {s.step}
                          </div>
                        </div>
                        <h3 style={{ fontWeight: 700, color: '#111827', marginBottom: '6px', fontSize: '0.975rem' }}>
                          {s.title}
                        </h3>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.65 }}>{s.desc}</p>
                      </div>
                    </div>

                    <div className="hidden md:flex flex-shrink-0 items-center justify-center" style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #11245d, #5ce1e6)',
                      fontWeight: 800, fontSize: '1.1rem', color: 'white',
                      boxShadow: '0 0 24px rgba(17,36,93,0.3), 0 4px 12px rgba(0,0,0,0.15)',
                      position: 'relative', zIndex: 1,
                      flexShrink: 0,
                    }}>
                      {s.step}
                    </div>

                    <div className="hidden md:block flex-1" />
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-24 px-4 text-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0a1844 0%, #11245d 45%, #172d74 75%, #0a1844 100%)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 55% 55% at 50% 50%, rgba(92,225,230,0.07) 0%, transparent 70%)',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 30% 40% at 20% 80%, rgba(212,175,55,0.04) 0%, transparent 60%)',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(92,225,230,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(92,225,230,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

        <FadeUp className="relative z-10">
          <div
            className="inline-block text-xs font-bold px-3.5 py-1.5 rounded-full mb-6 uppercase tracking-widest"
            style={{
              background: 'rgba(212,175,55,0.08)',
              color: '#f0c040',
              border: '1px solid rgba(212,175,55,0.18)',
            }}
          >
            Get Started
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-5" style={{ letterSpacing: '-0.02em' }}>
            Ready to Get Organised?
          </h2>
          <p className="mb-10 text-lg max-w-xl mx-auto leading-relaxed" style={{ color: 'rgba(200,215,255,0.65)' }}>
            Tell us about your institute and we will get everything set up for you.
          </p>
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2.5 font-bold px-9 py-4 rounded-xl text-base group"
            style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #f0c040 50%, #d4af37 100%)',
              backgroundSize: '200% auto',
              color: '#11245d',
              boxShadow: '0 0 36px rgba(212,175,55,0.32), 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25)',
              transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
              letterSpacing: '0.01em',
              textDecoration: 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 0 60px rgba(212,175,55,0.55), 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)';
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
              e.currentTarget.style.backgroundPosition = '100% center';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 0 36px rgba(212,175,55,0.32), 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25)';
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.backgroundPosition = '0% center';
            }}
          >
            Get Started
            <span style={{ transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)', display: 'inline-block' }} className="group-hover:translate-x-1.5">→</span>
          </Link>
        </FadeUp>
      </section>

      <Footer />
    </div>
  );
}
