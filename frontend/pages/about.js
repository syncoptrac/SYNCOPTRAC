import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Link from 'next/link';
import { FadeUp } from '../components/ui/ScrollReveal';

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — one set, used everywhere
// ─────────────────────────────────────────────────────────────────────────────
const TOKENS = {
  // Section spacing
  sectionPy: '80px',
  sectionPx: '16px',
  maxWidth: '820px',

  // Card — identical in every section
  card: {
    background: '#ffffff',
    borderRadius: '14px',
    padding: '22px 24px',
    border: '1px solid rgba(0,0,0,0.07)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    transition: 'box-shadow 0.3s ease, border-color 0.3s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1)',
  },
  cardHoverShadow: '0 8px 28px rgba(0,0,0,0.09)',

  // Typography
  labelSize: '11px',
  labelWeight: 700,
  labelSpacing: '0.07em',
  headingSize: 'clamp(1.35rem, 3vw, 1.75rem)',
  headingWeight: 800,
  headingColor: '#0f1c13',
  bodySize: '0.9375rem',
  bodyColor: '#4b5563',
  bodyLineHeight: 1.75,

  // Accent colors
  gold:       { text: '#ffffff', bg: 'rgba(92,225,230,0.07)',  border: 'rgba(92,225,230,0.2)',  bar: '#5ce1e6' },
  red:        { text: '#c0392b', bg: 'rgba(220,38,38,0.05)',   border: 'rgba(220,38,38,0.15)',  bar: '#dc2626' },
  green:      { text: '#15803d', bg: 'rgba(22,163,74,0.06)',   border: 'rgba(22,163,74,0.18)',  bar: '#16a34a' },
  blue:       { text: '#11245d', bg: 'rgba(17,36,93,0.06)',   border: 'rgba(17,36,93,0.18)',  bar: '#11245d' },
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Section label — left-aligned pill
function SectionLabel({ text, accent = TOKENS.gold }) {
  return (
    <div style={{
      display: 'inline-block',
      fontSize: TOKENS.labelSize,
      fontWeight: TOKENS.labelWeight,
      letterSpacing: TOKENS.labelSpacing,
      textTransform: 'uppercase',
      color: accent.text,
      background: accent.bg,
      border: `1px solid ${accent.border}`,
      borderRadius: '20px',
      padding: '4px 12px',
      marginBottom: '14px',
    }}>
      {text}
    </div>
  );
}

// Section heading — left-aligned
function SectionHeading({ children }) {
  return (
    <h2 style={{
      fontSize: TOKENS.headingSize,
      fontWeight: TOKENS.headingWeight,
      color: TOKENS.headingColor,
      letterSpacing: '-0.02em',
      lineHeight: 1.25,
      margin: '0 0 32px 0',
      maxWidth: '640px',
    }}>
      {children}
    </h2>
  );
}

// The ONE card component used everywhere
// accent = { text, bg, border, bar } from TOKENS
function Card({ children, accent = TOKENS.gold, style: extraStyle = {} }) {
  return (
    <div
      style={{ ...TOKENS.card, position: 'relative', overflow: 'hidden', ...extraStyle }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = TOKENS.cardHoverShadow;
        e.currentTarget.style.borderColor = accent.border;
        e.currentTarget.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = TOKENS.card.boxShadow;
        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.07)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Coloured left bar — the only accent in every card */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '3px', height: '100%',
        background: accent.bar,
        borderRadius: '14px 0 0 14px',
        opacity: 0.7,
      }} />
      <div style={{ paddingLeft: '14px' }}>
        {children}
      </div>
    </div>
  );
}

// Section wrapper — consistent max-width, padding, bg
function Section({ children, bg = '#f9fafb', id }) {
  return (
    <section
      id={id}
      style={{
        background: bg,
        padding: `${TOKENS.sectionPy} ${TOKENS.sectionPx}`,
      }}
    >
      <div style={{ maxWidth: TOKENS.maxWidth, margin: '0 auto' }}>
        {children}
      </div>
    </section>
  );
}

// Responsive card grid — 1 col mobile, 2 col tablet+
function CardGrid({ children, cols = 2 }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(${cols === 2 ? '280px' : '200px'}, 1fr))`,
      gap: '14px',
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ overflowX: 'hidden' }}>
      <Navbar />
      <main className="flex-1">

        {/* ══════════════════════════════════════════════════════════════
            SECTION 1 — HERO
           ══════════════════════════════════════════════════════════════ */}
        <section style={{
          background: 'linear-gradient(160deg, #0a1844 0%, #11245d 45%, #0a1844 100%)',
          color: 'white',
          padding: '96px 16px 88px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Ambient layers */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 55% 55% at 50% 50%, rgba(92,225,230,0.07) 0%, transparent 70%)',
          }} />
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(92,225,230,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(92,225,230,0.025) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />

          <FadeUp className="relative z-10" style={{ maxWidth: TOKENS.maxWidth, margin: '0 auto' }}>
            {/* Label */}
            <div style={{
              display: 'inline-block',
              fontSize: TOKENS.labelSize,
              fontWeight: TOKENS.labelWeight,
              letterSpacing: TOKENS.labelSpacing,
              textTransform: 'uppercase',
              color: '#f0c040',
              background: 'rgba(92,225,230,0.1)',
              border: '1px solid rgba(92,225,230,0.22)',
              borderRadius: '20px',
              padding: '4px 12px',
              marginBottom: '24px',
            }}>
              About <span style={{color:"#5ce1e6"}}>S</span>YNCOPTRAC
            </div>

            {/* Heading */}
            <h1 style={{
              fontSize: 'clamp(1.75rem, 4.5vw, 2.75rem)',
              fontWeight: 800,
              color: '#f0f6ff',
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
              marginBottom: '20px',
              maxWidth: '680px',
            }}>
              Helping Educational and Training Institutes move from scattered operations to structured clarity.
            </h1>

            {/* Subtext */}
            <p style={{
              fontSize: '1.0625rem',
              color: 'rgba(200,215,255,0.65)',
              lineHeight: TOKENS.bodyLineHeight,
              maxWidth: '520px',
              margin: 0,
            }}>
              <strong style={{fontWeight:800,color:'rgba(220,235,255,0.92)'}}>Most institutes don't struggle with teaching.</strong>
              <br />
              <strong style={{fontWeight:800,color:'rgba(220,235,255,0.92)'}}>They struggle with everything around teaching.</strong>
            </p>
          </FadeUp>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2 — THE PROBLEM
           ══════════════════════════════════════════════════════════════ */}
        <Section bg="#fff5f5" id="problem">
          <FadeUp>
            <SectionLabel text="The Problem" accent={TOKENS.red} />
            <SectionHeading>
              Small operational gaps create larger problems over time.
            </SectionHeading>
          </FadeUp>

          <CardGrid>
            {[
              { problem: 'Missed enquiries',  result: 'Lost students and revenue' },
              { problem: 'Attendance gaps',   result: 'Unnoticed student issues' },
              { problem: 'Fee delays',        result: 'Unstable cash flow' },
              { problem: 'Batch confusion',   result: 'Lack of structure and coordination' },
            ].map((item, i) => (
              <FadeUp key={item.problem} delay={i * 80}>
                <Card accent={TOKENS.red}>
                  <p style={{
                    fontWeight: 700,
                    color: TOKENS.headingColor,
                    fontSize: '0.9375rem',
                    marginBottom: '6px',
                  }}>
                    {item.problem}
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    color: TOKENS.red.text,
                    margin: 0,
                    lineHeight: 1.5,
                  }}>
                    → {item.result}
                  </p>
                </Card>
              </FadeUp>
            ))}
          </CardGrid>
        </Section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 3 — WHAT WE BUILT
           ══════════════════════════════════════════════════════════════ */}
        <Section bg="#f0fdf4" id="solution">
          <FadeUp>
            <SectionLabel text="What We Built" accent={TOKENS.green} />
            <SectionHeading>
              A single structured system for daily institute operations.
            </SectionHeading>
          </FadeUp>

          <CardGrid>
            {[
              { title: 'Enquiry & Admission Management',   icon: '📝' },
              { title: 'Attendance & Absentee Tracking',   icon: '✅' },
              { title: 'Fee Tracking & Reminders',         icon: '💰' },
              { title: 'Batch & Schedule Management',      icon: '📅' },
            ].map((item, i) => (
              <FadeUp key={item.title} delay={i * 80}>
                <Card accent={TOKENS.green}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{item.icon}</span>
                    <p style={{
                      fontWeight: 700,
                      color: TOKENS.headingColor,
                      fontSize: '0.9375rem',
                      margin: 0,
                      lineHeight: 1.4,
                    }}>
                      {item.title}
                    </p>
                  </div>
                </Card>
              </FadeUp>
            ))}
          </CardGrid>
        </Section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 4 — WHAT CHANGES
           ══════════════════════════════════════════════════════════════ */}
        <Section bg="#000080" id="what-changes">
          <FadeUp>
            <SectionLabel text="What Changes" accent={TOKENS.gold} />
            <SectionHeading>
              Instead of constantly asking:
            </SectionHeading>
          </FadeUp>

          <CardGrid>
            {[
              'Did we update this?',
              'Who was absent today?',
              'Has this fee been paid?',
              'Where is this information saved?',
            ].map((q, i) => (
              <FadeUp key={q} delay={i * 80}>
                <Card accent={TOKENS.gold}>
                  <p style={{
                    fontWeight: 600,
                    color: '#6b7280',
                    fontSize: '0.9375rem',
                    margin: 0,
                    fontStyle: 'italic',
                  }}>
                    "{q}"
                  </p>
                </Card>
              </FadeUp>
            ))}
          </CardGrid>

          <FadeUp delay={360}>
            <p style={{
              marginTop: '28px',
              fontSize: '1rem',
              fontWeight: 600,
              color: TOKENS.headingColor,
              lineHeight: 1.65,
              maxWidth: '560px',
              paddingLeft: '2px',
            }}>
              Everything becomes structured, visible, and easier to manage.
            </p>
          </FadeUp>
        </Section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 5 — OUR APPROACH
           ══════════════════════════════════════════════════════════════ */}
        <Section bg="#fc9644" id="approach">
          <FadeUp>
            <SectionLabel text="Our Approach" accent={TOKENS.gold} />
          </FadeUp>

          <CardGrid cols={4}>
            {[
              { title: 'Simplicity',        desc: 'No unnecessary complexity. Every feature exists because it solves a real problem.' },
              { title: 'Structure',         desc: 'Operations that are structured once don\'t need to be managed repeatedly.' },
              { title: 'Clarity',           desc: 'Every record, every status, every update is visible when you need it.' },
              { title: 'Practical Systems', desc: 'Built around how institutes actually run, not how software assumes they run.' },
            ].map((item, i) => (
              <FadeUp key={item.title} delay={i * 80}>
                <Card accent={TOKENS.gold}>
                  <p style={{
                    fontWeight: 700,
                    color: TOKENS.headingColor,
                    fontSize: '0.9375rem',
                    marginBottom: '8px',
                  }}>
                    {item.title}
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    color: TOKENS.bodyColor,
                    margin: 0,
                    lineHeight: 1.65,
                  }}>
                    {item.desc}
                  </p>
                </Card>
              </FadeUp>
            ))}
          </CardGrid>
        </Section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 6 — HOW IT WORKS
           ══════════════════════════════════════════════════════════════ */}
        <Section bg="#98FB98" id="how-it-works">
          <FadeUp>
            <SectionLabel text="How It Works" accent={TOKENS.gold} />
            <SectionHeading>
              A simple onboarding process. Five steps.
            </SectionHeading>
          </FadeUp>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { n: 1, title: 'Submit Institute Details',  desc: 'Fill the Get Started form with your institute information.' },
              { n: 2, title: 'Review Requirements',       desc: 'We review your request and check suitability within 24 hours.' },
              { n: 3, title: 'Confirm Suitability',       desc: 'We confirm whether your institute is a good fit for the system.' },
              { n: 4, title: 'Setup System',              desc: 'Your Google Sheet, dashboard, and account are configured.' },
              { n: 5, title: 'Activate Dashboard',        desc: 'Your institute goes live. Students, attendance, fees — all ready.' },
            ].map((step, i) => (
              <FadeUp key={step.n} delay={i * 75}>
                <Card accent={TOKENS.gold} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  {/* Step number */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #d4af37, #f0c040)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.875rem', color: '#11245d',
                    boxShadow: '0 0 12px rgba(92,225,230,0.2)',
                  }}>
                    {step.n}
                  </div>
                  <div>
                    <p style={{
                      fontWeight: 700,
                      color: TOKENS.headingColor,
                      fontSize: '0.9375rem',
                      marginBottom: '4px',
                    }}>
                      {step.title}
                    </p>
                    <p style={{
                      fontSize: '0.875rem',
                      color: TOKENS.bodyColor,
                      margin: 0,
                      lineHeight: 1.6,
                    }}>
                      {step.desc}
                    </p>
                  </div>
                </Card>
              </FadeUp>
            ))}
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 7 — WHO IT IS FOR
           ══════════════════════════════════════════════════════════════ */}
        <Section bg="#00008B" id="who-its-for">
          <FadeUp>
            <SectionLabel text="Who It Is For" accent={TOKENS.gold} />
            <SectionHeading>
              Built for institutes that run on consistency.
            </SectionHeading>
          </FadeUp>

          <CardGrid cols={3}>
            {[
              { title: 'Coaching Institutes',       icon: '🏫' },
              { title: 'Training Centres',          icon: '🎓' },
              { title: 'Computer Institutes',       icon: '💻' },
              { title: 'Academic Coaching Classes', icon: '📚' },
              { title: 'Skill Development Centres', icon: '🛠️' },
            ].map((item, i) => (
              <FadeUp key={item.title} delay={i * 70}>
                <Card accent={TOKENS.gold}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{item.icon}</span>
                    <p style={{
                      fontWeight: 700,
                      color: TOKENS.headingColor,
                      fontSize: '0.9375rem',
                      margin: 0,
                    }}>
                      {item.title}
                    </p>
                  </div>
                </Card>
              </FadeUp>
            ))}
          </CardGrid>
        </Section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 8 — OUR GOAL
           ══════════════════════════════════════════════════════════════ */}
        <Section bg="#f9fafb" id="our-goal">
          <FadeUp>
            <SectionLabel text="Our Goal" accent={TOKENS.blue} />
          </FadeUp>

          <FadeUp delay={80}>
            <Card accent={TOKENS.gold} style={{ maxWidth: '640px' }}>
              <p style={{
                fontSize: '1.0625rem',
                color: TOKENS.headingColor,
                lineHeight: 1.8,
                fontWeight: 500,
                margin: 0,
              }}>
                To help institutes move away from scattered operations and into a clear, structured system where{' '}
                <span style={{ fontWeight: 700, color: '#0f1c13' }}>teaching stays the focus.</span>
              </p>
            </Card>
          </FadeUp>
        </Section>

        {/* ══════════════════════════════════════════════════════════════
            CTA
           ══════════════════════════════════════════════════════════════ */}
        <section style={{
          background: 'linear-gradient(160deg, #0a1844 0%, #11245d 50%, #0a1844 100%)',
          padding: '80px 16px',
          textAlign: 'left',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 55% 55% at 50% 50%, rgba(92,225,230,0.06) 0%, transparent 70%)',
          }} />
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(92,225,230,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(92,225,230,0.025) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />

          <FadeUp className="relative z-10" style={{ maxWidth: TOKENS.maxWidth, margin: '0 auto' }}>
            <div style={{
              display: 'inline-block',
              fontSize: TOKENS.labelSize,
              fontWeight: TOKENS.labelWeight,
              letterSpacing: TOKENS.labelSpacing,
              textTransform: 'uppercase',
              color: '#f0c040',
              background: 'rgba(92,225,230,0.1)',
              border: '1px solid rgba(92,225,230,0.22)',
              borderRadius: '20px',
              padding: '4px 12px',
              marginBottom: '20px',
            }}>
              Get Started
            </div>

            <h2 style={{
              fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
              fontWeight: 800,
              color: '#f0f6ff',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginBottom: '14px',
              maxWidth: '560px',
            }}>
              Ready to bring structure to your institute?
            </h2>

            <p style={{
              color: 'rgba(200,215,255,0.6)',
              fontSize: '1rem',
              lineHeight: 1.7,
              marginBottom: '32px',
              maxWidth: '480px',
            }}>
              Tell us about your institute. We'll review your request and get in touch within 24 hours.
            </p>

            <Link
              href="/get-started"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #d4af37 0%, #f0c040 50%, #d4af37 100%)',
                backgroundSize: '200% auto',
                color: '#11245d',
                fontWeight: 700,
                fontSize: '0.9375rem',
                padding: '13px 28px',
                borderRadius: '12px',
                textDecoration: 'none',
                boxShadow: '0 0 28px rgba(92,225,230,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 0 48px rgba(92,225,230,0.5), inset 0 1px 0 rgba(255,255,255,0.25)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 0 28px rgba(92,225,230,0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
              }}
            >
              Get Started →
            </Link>
          </FadeUp>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 9 - FROM THE FOUNDER
           ══════════════════════════════════════════════════════════════ */}
        <Section bg="#00008B" id="from-the-founder">
          <FadeUp>
            <SectionLabel text="From the Founder" accent={TOKENS.gold} />
            <SectionHeading>
              Jenifar Alam
            </SectionHeading>
            <p className="text-sm font-semibold text-gray-500 mb-1">Founder &amp; CEO</p>
          </FadeUp>

          <FadeUp delay={80}>
            <Card accent={TOKENS.gold}>
              <div className="space-y-6">
                <div>
                  <p className="text-lg font-bold text-gray-900 mb-2">About</p>
                  <p className="text-base leading-relaxed text-gray-600">
                    Syncoptrac was built on a simple belief: technology should make work simpler, not more complicated. My goal is to create solutions that help education providers manage their daily operations through a platform that is intuitive, reliable, and easy to use.
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 mb-2">Why I Started Syncoptrac</p>
                  <p className="text-base leading-relaxed text-gray-600">
                    Education providers manage countless responsibilities every day—from admissions and student records to attendance, communication, and fee management. I started Syncoptrac with the vision of bringing these essential operations together into one unified platform, helping institutions stay organised, save time, and work more efficiently through simplicity.
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 mb-2">Vision</p>
                  <p className="text-base leading-relaxed text-gray-600">
                    My vision is for Syncoptrac to become the trusted operating and growth platform for education providers, empowering institutions with simple, reliable technology that supports their growth and helps them deliver better educational experiences.
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 mb-2">Thank You</p>
                  <p className="text-base leading-relaxed text-gray-600">
                    Thank you for taking the time to learn about Syncoptrac. Your support and trust inspire us to keep building with purpose, and we look forward to being a part of your journey.
                  </p>
                </div>
              </div>
            </Card>
          </FadeUp>
        </Section>

      </main>
      <Footer />
    </div>
  );
}