import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Link from 'next/link';
import { FadeUp } from '../components/ui/ScrollReveal';

/* Premium enterprise about page - shared deep dark blue design system.
   All nine sections, every card, every question, the founder letter and
   all routes are preserved exactly. Only the visual presentation changed. */

const PROBLEMS = [
  { problem: 'Missed enquiries', result: 'Lost students and revenue' },
  { problem: 'Attendance gaps', result: 'Unnoticed student issues' },
  { problem: 'Fee delays', result: 'Unstable cash flow' },
  { problem: 'Batch confusion', result: 'Lack of structure and coordination' },
];

const BUILT = [
  { title: 'Enquiry & Admission Management', icon: '📝' },
  { title: 'Attendance & Absentee Tracking', icon: '✅' },
  { title: 'Fee Tracking & Reminders', icon: '💰' },
  { title: 'Batch & Schedule Management', icon: '📅' },
];

const QUESTIONS = [
  'Did we update this?',
  'Who was absent today?',
  'Has this fee been paid?',
  'Where is this information saved?',
];

const APPROACH = [
  {
    title: 'Simplicity',
    desc: 'No unnecessary complexity. Every feature exists because it solves a real problem.',
  },
  {
    title: 'Structure',
    desc: "Operations that are structured once don't need to be managed repeatedly.",
  },
  {
    title: 'Clarity',
    desc: 'Every record, every status, every update is visible when you need it.',
  },
  {
    title: 'Practical Systems',
    desc: 'Built around how institutes actually run, not how software assumes they run.',
  },
];

const STEPS = [
  {
    n: 1,
    title: 'Submit Institute Details',
    desc: 'Fill the Get Started form with your institute information.',
  },
  {
    n: 2,
    title: 'Review Requirements',
    desc: 'We review your request and check suitability within 24 hours.',
  },
  {
    n: 3,
    title: 'Confirm Suitability',
    desc: 'We confirm whether your institute is a good fit for the system.',
  },
  {
    n: 4,
    title: 'Setup System',
    desc: 'Your Google Sheet, dashboard, and account are configured.',
  },
  {
    n: 5,
    title: 'Activate Dashboard',
    desc: 'Your institute goes live. Students, attendance, fees — all ready.',
  },
];

const AUDIENCE = [
  { title: 'Coaching Institutes', icon: '🏫' },
  { title: 'Training Centres', icon: '🎓' },
  { title: 'Computer Institutes', icon: '💻' },
  { title: 'Academic Coaching Classes', icon: '📚' },
  { title: 'Skill Development Centres', icon: '🛠️' },
];

const FOUNDER = [
  {
    heading: 'About',
    body: 'Syncoptrac was built on a simple belief: technology should make work simpler, not more complicated. My goal is to create solutions that help education providers manage their daily operations through a platform that is intuitive, reliable, and easy to use.',
  },
  {
    heading: 'Why I Started Syncoptrac',
    body: 'Education providers manage countless responsibilities every day—from admissions and student records to attendance, communication, and fee management. I started Syncoptrac with the vision of bringing these essential operations together into one unified platform, helping institutions stay organised, save time, and work more efficiently through simplicity.',
  },
  {
    heading: 'Vision',
    body: 'My vision is for Syncoptrac to become the trusted operating and growth platform for education providers, empowering institutions with simple, reliable technology that supports their growth and helps them deliver better educational experiences.',
  },
  {
    heading: 'Thank You',
    body: 'Thank you for taking the time to learn about Syncoptrac. Your support and trust inspire us to keep building with purpose, and we look forward to being a part of your journey.',
  },
];

function Label({ children }) {
  return (
    <div className="ab-lbl">
      <span className="ab-lbl-dot" aria-hidden="true" />
      {children}
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="ab-pg">
      <Navbar />
      <main className="ab-main">
        {/* SECTION 1 - HERO */}
        <section className="ab-hero">
          <span className="ab-hero-grid" aria-hidden="true" />
          <span className="ab-hero-orb ab-hero-orb-1" aria-hidden="true" />
          <span className="ab-hero-orb ab-hero-orb-2" aria-hidden="true" />
          <span className="ab-hero-beam" aria-hidden="true" />
          <span className="ab-hero-fade" aria-hidden="true" />

          <FadeUp className="ab-hero-inner">
            <div className="ab-hero-badge">
              <span className="ab-hero-badge-dot" aria-hidden="true" />
              About <span className="ab-mark-s">S</span>YNCOPTRAC
            </div>

            <h1 className="ab-hero-title">
              Helping Educational and Training Institutes move from scattered operations to
              structured clarity.
            </h1>

            <p className="ab-hero-sub">
              <strong>Most institutes don&apos;t struggle with teaching.</strong>
              <br />
              <strong>They struggle with everything around teaching.</strong>
            </p>
          </FadeUp>
        </section>

        {/* SECTION 2 - THE PROBLEM */}
        <section className="ab-sec" id="problem">
          <div className="ab-sec-inner">
            <FadeUp>
              <Label>The Problem</Label>
              <h2 className="ab-sec-title">
                Small operational gaps create larger problems over time.
              </h2>
            </FadeUp>

            <div className="ab-grid ab-grid-2">
              {PROBLEMS.map((item, i) => (
                <FadeUp key={item.problem} delay={i * 80}>
                  <article className="ab-card ab-card-warn">
                    <span className="ab-card-edge" aria-hidden="true" />
                    <span className="ab-card-wash" aria-hidden="true" />
                    <p className="ab-card-title">{item.problem}</p>
                    <p className="ab-card-result">→ {item.result}</p>
                  </article>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3 - WHAT WE BUILT */}
        <section className="ab-sec ab-sec-alt" id="solution">
          <div className="ab-sec-inner">
            <FadeUp>
              <Label>What We Built</Label>
              <h2 className="ab-sec-title">
                A single structured system for daily institute operations.
              </h2>
            </FadeUp>

            <div className="ab-grid ab-grid-2">
              {BUILT.map((item, i) => (
                <FadeUp key={item.title} delay={i * 80}>
                  <article className="ab-card ab-card-row">
                    <span className="ab-card-edge" aria-hidden="true" />
                    <span className="ab-card-wash" aria-hidden="true" />
                    <span className="ab-card-ico" aria-hidden="true">
                      <span className="ab-card-ico-glyph">{item.icon}</span>
                    </span>
                    <p className="ab-card-title ab-card-title-flush">{item.title}</p>
                  </article>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4 - WHAT CHANGES */}
        <section className="ab-sec" id="what-changes">
          <div className="ab-sec-inner">
            <FadeUp>
              <Label>What Changes</Label>
              <h2 className="ab-sec-title">Instead of constantly asking:</h2>
            </FadeUp>

            <div className="ab-grid ab-grid-2">
              {QUESTIONS.map((q, i) => (
                <FadeUp key={q} delay={i * 80}>
                  <article className="ab-card ab-card-quote">
                    <span className="ab-card-edge" aria-hidden="true" />
                    <span className="ab-card-wash" aria-hidden="true" />
                    <span className="ab-card-qmark" aria-hidden="true" />
                    <p className="ab-card-q">&quot;{q}&quot;</p>
                  </article>
                </FadeUp>
              ))}
            </div>

            <FadeUp delay={360}>
              <p className="ab-sec-close">
                Everything becomes structured, visible, and easier to manage.
              </p>
            </FadeUp>
          </div>
        </section>

        {/* SECTION 5 - OUR APPROACH */}
        <section className="ab-sec ab-sec-alt" id="approach">
          <div className="ab-sec-inner">
            <FadeUp>
              <Label>Our Approach</Label>
            </FadeUp>

            <div className="ab-grid ab-grid-4">
              {APPROACH.map((item, i) => (
                <FadeUp key={item.title} delay={i * 80}>
                  <article className="ab-card">
                    <span className="ab-card-edge" aria-hidden="true" />
                    <span className="ab-card-wash" aria-hidden="true" />
                    <p className="ab-card-title">{item.title}</p>
                    <p className="ab-card-copy">{item.desc}</p>
                  </article>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6 - HOW IT WORKS */}
        <section className="ab-sec" id="how-it-works">
          <div className="ab-sec-inner">
            <FadeUp>
              <Label>How It Works</Label>
              <h2 className="ab-sec-title">A simple onboarding process. Five steps.</h2>
            </FadeUp>

            <div className="ab-steps">
              <span className="ab-steps-rail" aria-hidden="true" />
              {STEPS.map((step, i) => (
                <FadeUp key={step.n} delay={i * 75}>
                  <article className="ab-card ab-card-step">
                    <span className="ab-card-wash" aria-hidden="true" />
                    <span className="ab-step-num">
                      <span className="ab-step-num-face">{step.n}</span>
                      <span className="ab-step-num-ring" aria-hidden="true" />
                    </span>
                    <div className="ab-step-body">
                      <p className="ab-card-title ab-card-title-flush">{step.title}</p>
                      <p className="ab-card-copy">{step.desc}</p>
                    </div>
                  </article>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 7 - WHO IT IS FOR */}
        <section className="ab-sec ab-sec-alt" id="who-its-for">
          <div className="ab-sec-inner">
            <FadeUp>
              <Label>Who It Is For</Label>
              <h2 className="ab-sec-title">Built for institutes that run on consistency.</h2>
            </FadeUp>

            <div className="ab-grid ab-grid-3">
              {AUDIENCE.map((item, i) => (
                <FadeUp key={item.title} delay={i * 70}>
                  <article className="ab-card ab-card-row">
                    <span className="ab-card-edge" aria-hidden="true" />
                    <span className="ab-card-wash" aria-hidden="true" />
                    <span className="ab-card-ico" aria-hidden="true">
                      <span className="ab-card-ico-glyph">{item.icon}</span>
                    </span>
                    <p className="ab-card-title ab-card-title-flush">{item.title}</p>
                  </article>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 8 - OUR GOAL */}
        <section className="ab-sec" id="our-goal">
          <div className="ab-sec-inner">
            <FadeUp>
              <Label>Our Goal</Label>
            </FadeUp>

            <FadeUp delay={80}>
              <article className="ab-goal">
                <span className="ab-goal-edge" aria-hidden="true" />
                <span className="ab-goal-wash" aria-hidden="true" />
                <p className="ab-goal-copy">
                  To help institutes move away from scattered operations and into a clear,
                  structured system where{' '}
                  <span className="ab-goal-em">teaching stays the focus.</span>
                </p>
              </article>
            </FadeUp>
          </div>
        </section>

        {/* CTA */}
        <section className="ab-cta">
          <span className="ab-cta-grid" aria-hidden="true" />
          <span className="ab-cta-glow" aria-hidden="true" />
          <span className="ab-cta-beam" aria-hidden="true" />

          <FadeUp className="ab-cta-inner">
            <div className="ab-hero-badge">
              <span className="ab-hero-badge-dot" aria-hidden="true" />
              Get Started
            </div>

            <h2 className="ab-cta-title">Ready to bring structure to your institute?</h2>

            <p className="ab-cta-copy">
              Tell us about your institute. We&apos;ll review your request and get in touch
              within 24 hours.
            </p>

            <Link href="/get-started" className="ab-cta-btn">
              <span className="ab-cta-btn-sheen" aria-hidden="true" />
              <span className="ab-cta-btn-face">Get Started →</span>
            </Link>
          </FadeUp>
        </section>

        {/* SECTION 9 - FROM THE FOUNDER */}
        <section className="ab-sec ab-sec-white" id="from-the-founder">
          <div className="ab-sec-inner">
            <FadeUp>
              <Label>From the Founder</Label>
              <h2 className="ab-sec-title ab-sec-title-tight">Jenifar Alam</h2>
              <p className="ab-fdr-role">Founder &amp; CEO</p>
            </FadeUp>

            <FadeUp delay={80}>
              <article className="ab-fdr">
                <span className="ab-fdr-edge" aria-hidden="true" />
                <span className="ab-fdr-wash" aria-hidden="true" />
                <div className="ab-fdr-stack">
                  {FOUNDER.map((block) => (
                    <div key={block.heading} className="ab-fdr-block">
                      <p className="ab-fdr-head">
                        <span className="ab-fdr-head-rail" aria-hidden="true" />
                        {block.heading}
                      </p>
                      <p className="ab-fdr-copy">{block.body}</p>
                    </div>
                  ))}
                </div>
              </article>
            </FadeUp>
          </div>
        </section>
      </main>
      <Footer />

      <style jsx global>{`
        .ab-pg {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          overflow-x: hidden;
          overflow-x: clip;
          background: #f8fafc;
        }
        .ab-main {
          flex: 1;
        }

        /* ---- hero ---- */
        .ab-hero {
          position: relative;
          overflow: hidden;
          padding: 104px 24px 104px;
          background: linear-gradient(165deg, #071a52 0%, #0b1f4d 48%, #12356d 100%);
          color: #ffffff;
        }
        .ab-hero-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: linear-gradient(
              rgba(147, 197, 253, 0.06) 1px,
              transparent 1px
            ),
            linear-gradient(90deg, rgba(147, 197, 253, 0.06) 1px, transparent 1px);
          background-size: 62px 62px;
          mask-image: radial-gradient(ellipse 74% 74% at 40% 40%, #000 0%, transparent 78%);
          -webkit-mask-image: radial-gradient(
            ellipse 74% 74% at 40% 40%,
            #000 0%,
            transparent 78%
          );
        }
        .ab-hero-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(46px);
        }
        .ab-hero-orb-1 {
          width: 460px;
          height: 460px;
          top: -32%;
          left: -8%;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.34), transparent 68%);
          animation: aOrb1 21s ease-in-out infinite;
        }
        .ab-hero-orb-2 {
          width: 380px;
          height: 380px;
          bottom: -34%;
          right: -6%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.26), transparent 68%);
          animation: aOrb2 26s ease-in-out infinite;
        }
        @keyframes aOrb1 {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(48px, 32px, 0) scale(1.1);
          }
        }
        @keyframes aOrb2 {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(-42px, -28px, 0) scale(1.08);
          }
        }
        .ab-hero-beam {
          position: absolute;
          top: 0;
          bottom: 0;
          left: -220px;
          width: 220px;
          pointer-events: none;
          background: linear-gradient(
            100deg,
            transparent,
            rgba(147, 197, 253, 0.08),
            transparent
          );
          transform: skewX(-14deg);
          animation: aBeam 14s ease-in-out infinite;
        }
        @keyframes aBeam {
          0% {
            left: -220px;
          }
          55%,
          100% {
            left: 120%;
          }
        }
        .ab-hero-fade {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 120px;
          pointer-events: none;
          background: linear-gradient(180deg, transparent, #f8fafc);
        }
        .ab-hero-inner {
          position: relative;
          z-index: 3;
          max-width: 900px;
          margin: 0 auto;
        }
        .ab-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 26px;
          padding: 7px 16px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #bfdbfe;
          background: rgba(37, 99, 235, 0.18);
          border: 1px solid rgba(147, 197, 253, 0.28);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .ab-hero-badge-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #3b82f6;
          animation: aPulse 2.4s ease-out infinite;
        }
        @keyframes aPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.55);
          }
          70% {
            box-shadow: 0 0 0 7px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
        .ab-mark-s {
          color: #5ce1e6;
        }
        .ab-hero-title {
          max-width: 760px;
          margin: 0 0 22px;
          font-size: clamp(1.85rem, 4.8vw, 2.95rem);
          font-weight: 900;
          line-height: 1.18;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #ffffff 0%, #dbeafe 58%, #93c5fd 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .ab-hero-sub {
          max-width: 560px;
          margin: 0;
          font-size: clamp(1rem, 2.4vw, 1.08rem);
          line-height: 1.8;
          color: rgba(199, 215, 245, 0.78);
        }
        .ab-hero-sub strong {
          font-weight: 800;
          color: rgba(226, 238, 255, 0.94);
        }

        /* ---- sections ---- */
        .ab-sec {
          position: relative;
          padding: 84px 24px;
          background: #f8fafc;
        }
        .ab-sec-alt {
          background: linear-gradient(180deg, #f8fafc, #eff6ff 60%, #f8fafc);
        }
        .ab-sec-white {
          background: #ffffff;
        }
        .ab-sec-inner {
          max-width: 900px;
          margin: 0 auto;
        }
        .ab-lbl {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #1d4ed8;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
        }
        .ab-lbl-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #2563eb;
        }
        .ab-sec-title {
          max-width: 660px;
          margin: 0 0 34px;
          font-size: clamp(1.4rem, 3.2vw, 1.95rem);
          font-weight: 900;
          line-height: 1.26;
          letter-spacing: -0.025em;
          color: #111827;
        }
        .ab-sec-title-tight {
          margin-bottom: 4px;
        }
        .ab-sec-close {
          max-width: 580px;
          margin: 30px 0 0;
          font-size: 1.02rem;
          font-weight: 700;
          line-height: 1.7;
          color: #111827;
        }

        .ab-grid {
          display: grid;
          gap: 16px;
        }
        .ab-grid-2 {
          grid-template-columns: repeat(auto-fill, minmax(272px, 1fr));
        }
        .ab-grid-3 {
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        }
        .ab-grid-4 {
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
        }

        /* ---- cards ---- */
        .ab-card {
          position: relative;
          overflow: hidden;
          height: 100%;
          padding: 24px 26px;
          box-sizing: border-box;
          border-radius: 16px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 2px rgba(11, 31, 77, 0.04);
          transition: transform 420ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 420ms cubic-bezier(0.16, 1, 0.3, 1), border-color 300ms ease;
        }
        .ab-card-edge {
          position: absolute;
          top: 14px;
          bottom: 14px;
          left: 0;
          width: 3px;
          border-radius: 0 3px 3px 0;
          background: linear-gradient(180deg, #2563eb, #3b82f6);
          transform: scaleY(0.4);
          transform-origin: top center;
          transition: transform 480ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ab-card-wash {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(
            420px circle at 92% 0%,
            rgba(37, 99, 235, 0.08),
            transparent 62%
          );
          opacity: 0;
          transition: opacity 420ms ease;
        }
        .ab-card:hover {
          transform: translateY(-6px);
          border-color: #bfdbfe;
          box-shadow: 0 22px 46px rgba(37, 99, 235, 0.14);
        }
        .ab-card:hover .ab-card-edge {
          transform: scaleY(1);
        }
        .ab-card:hover .ab-card-wash {
          opacity: 1;
        }
        .ab-card-warn .ab-card-edge {
          background: linear-gradient(180deg, #f59e0b, #ef4444);
        }
        .ab-card-warn:hover {
          border-color: rgba(245, 158, 11, 0.4);
          box-shadow: 0 22px 46px rgba(239, 68, 68, 0.12);
        }
        .ab-card-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .ab-card-title {
          position: relative;
          z-index: 2;
          margin: 0 0 7px;
          padding-left: 14px;
          font-size: 0.945rem;
          font-weight: 800;
          letter-spacing: -0.01em;
          line-height: 1.45;
          color: #111827;
        }
        .ab-card-title-flush {
          margin: 0;
          padding-left: 0;
        }
        .ab-card-result {
          position: relative;
          z-index: 2;
          margin: 0;
          padding-left: 14px;
          font-size: 0.875rem;
          font-weight: 600;
          line-height: 1.55;
          color: #b45309;
        }
        .ab-card-copy {
          position: relative;
          z-index: 2;
          margin: 0;
          padding-left: 14px;
          font-size: 0.875rem;
          line-height: 1.68;
          color: #4b5563;
        }
        .ab-card-row .ab-card-copy,
        .ab-card-step .ab-card-copy {
          padding-left: 0;
        }
        .ab-card-ico {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          flex-shrink: 0;
          margin-left: 10px;
          border-radius: 14px;
          background: linear-gradient(140deg, #eff6ff, #dbeafe);
          border: 1px solid #bfdbfe;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
          transition: transform 460ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .ab-card-ico-glyph {
          font-size: 1.32rem;
          line-height: 1;
        }
        .ab-card:hover .ab-card-ico {
          transform: scale(1.09) rotate(-5deg);
        }

        .ab-card-quote .ab-card-qmark::before {
          content: '\\201C';
        }
        .ab-card-quote .ab-card-qmark {
          position: absolute;
          top: 2px;
          right: 16px;
          font-size: 3.4rem;
          line-height: 1;
          font-weight: 900;
          color: #eff6ff;
          transition: color 380ms ease;
        }
        .ab-card-quote:hover .ab-card-qmark {
          color: #dbeafe;
        }
        .ab-card-q {
          position: relative;
          z-index: 2;
          margin: 0;
          padding-left: 14px;
          font-size: 0.945rem;
          font-weight: 600;
          font-style: italic;
          line-height: 1.6;
          color: #6b7280;
        }

        /* ---- steps ---- */
        .ab-steps {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 13px;
        }
        .ab-steps-rail {
          position: absolute;
          top: 34px;
          bottom: 34px;
          left: 44px;
          width: 2px;
          pointer-events: none;
          background: linear-gradient(180deg, #bfdbfe, rgba(191, 219, 254, 0));
        }
        .ab-card-step {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        .ab-step-num {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.32);
        }
        .ab-step-num-face {
          position: relative;
          z-index: 2;
          font-size: 0.875rem;
          font-weight: 800;
          color: #ffffff;
        }
        .ab-step-num-ring {
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          border: 1px solid rgba(37, 99, 235, 0.28);
          opacity: 0;
          transition: opacity 380ms ease, transform 380ms ease;
          transform: scale(0.9);
        }
        .ab-card-step:hover .ab-step-num-ring {
          opacity: 1;
          transform: scale(1);
        }
        .ab-step-body {
          position: relative;
          z-index: 2;
        }

        /* ---- goal ---- */
        .ab-goal {
          position: relative;
          overflow: hidden;
          max-width: 680px;
          padding: 34px 34px;
          border-radius: 20px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 2px rgba(11, 31, 77, 0.04),
            0 16px 38px rgba(11, 31, 77, 0.06);
          transition: transform 420ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 420ms ease, border-color 300ms ease;
        }
        .ab-goal-edge {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #2563eb, #3b82f6, transparent);
        }
        .ab-goal-wash {
          position: absolute;
          top: -40px;
          right: -30px;
          width: 260px;
          height: 260px;
          pointer-events: none;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.09), transparent 66%);
        }
        .ab-goal:hover {
          transform: translateY(-5px);
          border-color: #bfdbfe;
          box-shadow: 0 24px 52px rgba(37, 99, 235, 0.15);
        }
        .ab-goal-copy {
          position: relative;
          z-index: 2;
          margin: 0;
          font-size: 1.06rem;
          font-weight: 500;
          line-height: 1.82;
          color: #111827;
        }
        .ab-goal-em {
          font-weight: 800;
          color: #1d4ed8;
        }

        /* ---- CTA ---- */
        .ab-cta {
          position: relative;
          overflow: hidden;
          padding: 88px 24px;
          background: linear-gradient(150deg, #0b1f4d 0%, #071a52 55%, #12356d 100%);
        }
        .ab-cta-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: linear-gradient(
              rgba(147, 197, 253, 0.055) 1px,
              transparent 1px
            ),
            linear-gradient(90deg, rgba(147, 197, 253, 0.055) 1px, transparent 1px);
          background-size: 58px 58px;
          mask-image: radial-gradient(ellipse 66% 74% at 40% 50%, #000 0%, transparent 76%);
          -webkit-mask-image: radial-gradient(
            ellipse 66% 74% at 40% 50%,
            #000 0%,
            transparent 76%
          );
        }
        .ab-cta-glow {
          position: absolute;
          top: 50%;
          left: 30%;
          width: 620px;
          height: 360px;
          transform: translate(-50%, -50%);
          pointer-events: none;
          background: radial-gradient(
            ellipse at center,
            rgba(37, 99, 235, 0.3),
            transparent 68%
          );
        }
        .ab-cta-beam {
          position: absolute;
          top: 0;
          bottom: 0;
          left: -200px;
          width: 200px;
          pointer-events: none;
          background: linear-gradient(
            100deg,
            transparent,
            rgba(147, 197, 253, 0.07),
            transparent
          );
          transform: skewX(-14deg);
          animation: aBeam 15s ease-in-out infinite;
        }
        .ab-cta-inner {
          position: relative;
          z-index: 3;
          max-width: 900px;
          margin: 0 auto;
        }
        .ab-cta-title {
          max-width: 600px;
          margin: 0 0 16px;
          font-size: clamp(1.55rem, 3.6vw, 2.35rem);
          font-weight: 900;
          line-height: 1.2;
          letter-spacing: -0.028em;
          color: #ffffff;
        }
        .ab-cta-copy {
          max-width: 500px;
          margin: 0 0 34px;
          font-size: 1rem;
          line-height: 1.75;
          color: rgba(199, 215, 245, 0.76);
        }
        .ab-cta-btn {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 15px 30px;
          border-radius: 13px;
          font-size: 0.945rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          color: #ffffff;
          text-decoration: none;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          box-shadow: 0 14px 36px rgba(37, 99, 235, 0.44),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
          transition: transform 340ms cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 340ms ease;
        }
        .ab-cta-btn-face {
          position: relative;
          z-index: 2;
        }
        .ab-cta-btn-sheen {
          position: absolute;
          top: 0;
          bottom: 0;
          left: -60%;
          width: 45%;
          background: linear-gradient(
            100deg,
            transparent,
            rgba(255, 255, 255, 0.42),
            transparent
          );
          transform: skewX(-18deg);
        }
        .ab-cta-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 20px 48px rgba(37, 99, 235, 0.58),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        .ab-cta-btn:hover .ab-cta-btn-sheen {
          animation: aSheen 760ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes aSheen {
          from {
            left: -60%;
          }
          to {
            left: 130%;
          }
        }

        /* ---- founder ---- */
        .ab-fdr-role {
          margin: 0 0 32px;
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: #6b7280;
        }
        .ab-fdr {
          position: relative;
          overflow: hidden;
          padding: 38px 38px;
          border-radius: 22px;
          background: linear-gradient(165deg, #ffffff, #f8fafc);
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 2px rgba(11, 31, 77, 0.04),
            0 20px 46px rgba(11, 31, 77, 0.06);
        }
        .ab-fdr-edge {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #2563eb, #3b82f6, transparent);
        }
        .ab-fdr-wash {
          position: absolute;
          top: -60px;
          right: -40px;
          width: 320px;
          height: 320px;
          pointer-events: none;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.07), transparent 66%);
        }
        .ab-fdr-stack {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .ab-fdr-head {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 10px;
          font-size: 1.06rem;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: #111827;
        }
        .ab-fdr-head-rail {
          width: 22px;
          height: 2px;
          flex-shrink: 0;
          border-radius: 2px;
          background: linear-gradient(90deg, #2563eb, #3b82f6);
        }
        .ab-fdr-copy {
          margin: 0;
          font-size: 0.975rem;
          line-height: 1.82;
          color: #4b5563;
        }

        .ab-cta-btn:focus-visible {
          outline: 2px solid #93c5fd;
          outline-offset: 3px;
        }

        @media (max-width: 560px) {
          .ab-hero {
            padding: 80px 18px 88px;
          }
          .ab-sec {
            padding: 64px 18px;
          }
          .ab-cta {
            padding: 70px 18px;
          }
          .ab-card {
            padding: 20px 20px;
          }
          .ab-goal,
          .ab-fdr {
            padding: 26px 22px;
          }
          .ab-steps-rail {
            display: none;
          }
          .ab-card-quote .ab-card-qmark {
            display: none;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ab-hero-orb,
          .ab-hero-beam,
          .ab-hero-badge-dot,
          .ab-cta-beam {
            animation: none !important;
          }
          .ab-card,
          .ab-card-edge,
          .ab-card-ico,
          .ab-goal,
          .ab-cta-btn,
          .ab-step-num-ring {
            transition-duration: 1ms !important;
          }
          .ab-cta-btn:hover .ab-cta-btn-sheen {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
