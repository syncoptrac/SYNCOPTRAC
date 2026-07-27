import Link from 'next/link';
import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { FadeUp } from '../components/ui/ScrollReveal';

/* Premium enterprise features page - shared deep dark blue design system.
   All four features, every list item, both tab labels, the recommended
   practice note and all routes are preserved exactly as before.
   The default tab stays 'works' so the page renders identically. */

const features = [
  {
    id: 'enquiry',
    icon: '📊',
    title: 'Enquiry Management',
    description:
      'Never lose track of a prospective student. Every enquiry stays organised from first contact to final outcome.',
    howItWorks: [
      'Add new enquiries manually as they are received',
      'Update enquiry status (New, Follow-Up, Converted)',
      'Track follow-up dates',
      'Search and filter enquiries easily',
    ],
    howItHelps: [
      'Prevents enquiries from being forgotten after the first conversation',
      'Gives a clear view of who needs follow-up and when',
      'Reduces dependence on memory, notebooks, and scattered messages',
      'Helps prevent potential admissions from slipping through the cracks',
    ],
    accent: '#5ce1e6',
  },
  {
    id: 'attendance',
    icon: '👥',
    title: 'Attendance & Absentee Tracking',
    description:
      'Mark attendance in seconds and automatically notify absent students or parents.',
    howItWorks: [
      'Teachers mark daily attendance',
      'Automated emails are sent to absent students or parents',
      'Reasons for absence can be recorded manually',
      'Attendance records and reports remain available for review',
    ],
    howItHelps: [
      'Makes absentees visible immediately instead of days later',
      'Encourages timely communication with students and parents',
      'Helps identify recurring attendance issues early',
      'Keeps attendance records organised and easy to review',
    ],
    note: 'Attendance notifications are sent to the email address provided by the institute (parent, guardian, or student).',
    accent: '#5ce1e6',
  },
  {
    id: 'fees',
    icon: '💰',
    title: 'Fee Tracking & Reminders',
    description:
      'Keep track of paid and overdue fees while reducing manual follow-up work.',
    howItWorks: [
      'Teachers update fee status on the due date',
      'Fees are marked as Paid or Overdue',
      'Automated reminder emails are sent for overdue fees',
      'Payment records remain organised for reference',
    ],
    howItHelps: [
      'Makes overdue payments visible before they become larger collection problems',
      'Removes the need to manually send every reminder',
      'Provides clear visibility into overdue payments',
      'Keeps fee follow-ups structured and consistent',
    ],
    accent: '#5ce1e6',
  },
  {
    id: 'batches',
    icon: '📅',
    title: 'Batch & Schedule Management',
    description:
      'Organise batches, assign teachers, and manage schedules from one structured view.',
    howItWorks: [
      'View batch details, assigned teachers, and courses',
      'Track student count and joining dates',
      'Maintain weekly schedules and class plans',
      'Update or reschedule classes whenever required',
    ],
    howItHelps: [
      'Reduces confusion around batch planning and coordination',
      'Makes important information easy to find when needed',
      'Reduces the mental load of managing batches and schedules',
      'Keeps daily operations structured and easier to manage',
    ],
    accent: '#5ce1e6',
  },
];

const TABS = [
  { key: 'works', label: 'How it works' },
  { key: 'helps', label: 'How it helps you' },
];

function FeatureSection({ feature, index }) {
  const [activeTab, setActiveTab] = useState('works');
  const points = activeTab === 'works' ? feature.howItWorks : feature.howItHelps;

  return (
    <FadeUp delay={index * 80}>
      <article className="fc">
        <span className="fc-rail" aria-hidden="true" />
        <span className="fc-wash" aria-hidden="true" />

        <div className="fc-body">
          <div className="fc-head">
            <span className="fc-ico" aria-hidden="true">
              <span className="fc-ico-glyph">{feature.icon}</span>
            </span>
            <h2 className="fc-title">{feature.title}</h2>
            <span className="fc-index" aria-hidden="true" />
          </div>

          <p className="fc-desc">{feature.description}</p>

          <div className="fc-tabs" role="tablist">
            <span
              className="fc-thumb"
              aria-hidden="true"
              style={{ transform: 'translateX(' + (activeTab === 'works' ? '0%' : '100%') + ')' }}
            />
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={'fc-tab' + (activeTab === tab.key ? ' is-on' : '')}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="fc-panel">
            <ul className="fc-list">
              {points.map((point, i) => (
                <li
                  key={activeTab + '-' + i}
                  className="fc-item"
                  style={{ animationDelay: i * 60 + 'ms' }}
                >
                  <span className="fc-tick" aria-hidden="true" />
                  <span className="fc-txt">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {feature.note && (
            <p className="fc-note">Recommended Practice: {feature.note}</p>
          )}
        </div>
      </article>
    </FadeUp>
  );
}

export default function FeaturesPage() {
  return (
    <div className="pg">
      <Navbar />

      {/* Page header */}
      <section className="ph">
        <span className="ph-grid" aria-hidden="true" />
        <span className="ph-orb ph-orb-1" aria-hidden="true" />
        <span className="ph-orb ph-orb-2" aria-hidden="true" />
        <span className="ph-beam" aria-hidden="true" />
        <span className="ph-fade" aria-hidden="true" />
        <div className="ph-inner">
          <div className="ph-badge">
            <span className="ph-badge-dot" aria-hidden="true" />
            Features
          </div>
          <h1 className="ph-title">Everything Your Institute Needs</h1>
          <p className="ph-lede">
            Four focused features that cover the core operational needs of any coaching
            centre or training institute.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="fs">
        <div className="fs-inner">
          {features.map((feature, i) => (
            <FeatureSection key={feature.id} feature={feature} index={i} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <span className="cta-grid" aria-hidden="true" />
        <span className="cta-glow" aria-hidden="true" />
        <FadeUp className="cta-wrap">
          <h2 className="cta-title">Ready to Start Using These Features?</h2>
          <p className="cta-copy">
            Get started by telling us about your institute. We will take it from there.
          </p>
          <Link href="/get-started" className="cta-btn">
            <span className="cta-btn-sheen" aria-hidden="true" />
            <span className="cta-btn-face">Get Started →</span>
          </Link>
        </FadeUp>
      </section>

      <Footer />

      <style jsx global>{`
        .pg {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          overflow-x: hidden;
          overflow-x: clip;
          background: #f8fafc;
        }

        /* ---- page header ---- */
        .ph {
          position: relative;
          overflow: hidden;
          padding: 104px 24px 112px;
          text-align: center;
          background: linear-gradient(165deg, #071a52 0%, #0b1f4d 52%, #12356d 100%);
          color: #ffffff;
        }
        .ph-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: linear-gradient(
              rgba(147, 197, 253, 0.06) 1px,
              transparent 1px
            ),
            linear-gradient(90deg, rgba(147, 197, 253, 0.06) 1px, transparent 1px);
          background-size: 62px 62px;
          mask-image: radial-gradient(ellipse 70% 70% at 50% 40%, #000 0%, transparent 78%);
          -webkit-mask-image: radial-gradient(
            ellipse 70% 70% at 50% 40%,
            #000 0%,
            transparent 78%
          );
        }
        .ph-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(44px);
        }
        .ph-orb-1 {
          width: 440px;
          height: 440px;
          top: -28%;
          left: -6%;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.34), transparent 68%);
          animation: phOrb1 20s ease-in-out infinite;
        }
        .ph-orb-2 {
          width: 380px;
          height: 380px;
          bottom: -32%;
          right: -5%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.26), transparent 68%);
          animation: phOrb2 25s ease-in-out infinite;
        }
        @keyframes phOrb1 {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(46px, 30px, 0) scale(1.1);
          }
        }
        @keyframes phOrb2 {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(-40px, -26px, 0) scale(1.08);
          }
        }
        .ph-beam {
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
          animation: phBeam 13s ease-in-out infinite;
        }
        @keyframes phBeam {
          0% {
            left: -220px;
          }
          55%,
          100% {
            left: 120%;
          }
        }
        .ph-fade {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 120px;
          pointer-events: none;
          background: linear-gradient(180deg, transparent, #f8fafc);
        }
        .ph-inner {
          position: relative;
          z-index: 3;
          max-width: 760px;
          margin: 0 auto;
        }
        .ph-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
          padding: 7px 16px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #bfdbfe;
          background: rgba(37, 99, 235, 0.18);
          border: 1px solid rgba(147, 197, 253, 0.28);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .ph-badge-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #3b82f6;
          animation: phPulse 2.4s ease-out infinite;
        }
        @keyframes phPulse {
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
        .ph-title {
          margin: 0 0 20px;
          font-size: clamp(2.1rem, 6vw, 3.3rem);
          font-weight: 900;
          line-height: 1.08;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #ffffff 0%, #dbeafe 55%, #93c5fd 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .ph-lede {
          max-width: 580px;
          margin: 0 auto;
          font-size: clamp(0.98rem, 2.4vw, 1.1rem);
          line-height: 1.75;
          color: rgba(199, 215, 245, 0.82);
        }

        /* ---- feature cards ---- */
        .fs {
          position: relative;
          padding: 8px 24px 90px;
          background: #f8fafc;
        }
        .fs-inner {
          max-width: 860px;
          margin: 0 auto;
        }
        .fs-inner {
          counter-reset: fcard;
        }
        .fc {
          counter-increment: fcard;
        }
        .fc-index::before {
          content: counter(fcard, decimal-leading-zero);
        }
        .fc {
          position: relative;
          overflow: hidden;
          margin-bottom: 22px;
          border-radius: 22px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 2px rgba(11, 31, 77, 0.04),
            0 12px 30px rgba(11, 31, 77, 0.05);
          transition: transform 420ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 420ms cubic-bezier(0.16, 1, 0.3, 1), border-color 300ms ease;
        }
        .fc-rail {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #2563eb, #3b82f6, transparent);
          transform: scaleX(0.3);
          transform-origin: left center;
          transition: transform 560ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .fc-wash {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(
            560px circle at 92% 0%,
            rgba(37, 99, 235, 0.07),
            transparent 62%
          );
          opacity: 0;
          transition: opacity 420ms ease;
        }
        .fc:hover {
          transform: translateY(-6px);
          border-color: #bfdbfe;
          box-shadow: 0 1px 2px rgba(11, 31, 77, 0.05),
            0 26px 56px rgba(37, 99, 235, 0.15);
        }
        .fc:hover .fc-rail {
          transform: scaleX(1);
        }
        .fc:hover .fc-wash {
          opacity: 1;
        }
        .fc-body {
          position: relative;
          z-index: 2;
          padding: 32px 34px 34px;
        }
        .fc-head {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 14px;
        }
        .fc-ico {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          flex-shrink: 0;
          border-radius: 15px;
          background: linear-gradient(140deg, #eff6ff, #dbeafe);
          border: 1px solid #bfdbfe;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
          transition: transform 460ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .fc-ico-glyph {
          font-size: 1.45rem;
          line-height: 1;
        }
        .fc:hover .fc-ico {
          transform: scale(1.09) rotate(-4deg);
        }
        .fc-title {
          flex: 1;
          margin: 0;
          font-size: clamp(1.1rem, 2.5vw, 1.38rem);
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #111827;
        }
        .fc-index {
          font-size: 1.5rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          color: #eff6ff;
          transition: color 360ms ease;
        }
        .fc:hover .fc-index {
          color: #dbeafe;
        }
        .fc-desc {
          margin: 0 0 24px;
          font-size: 0.93rem;
          line-height: 1.78;
          color: #4b5563;
        }

        .fc-tabs {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          width: 100%;
          max-width: 340px;
          margin-bottom: 20px;
          padding: 4px;
          border-radius: 999px;
          background: #f1f5f9;
          border: 1px solid #e5e7eb;
        }
        .fc-thumb {
          position: absolute;
          top: 4px;
          bottom: 4px;
          left: 4px;
          width: calc(50% - 4px);
          border-radius: 999px;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.32);
          transition: transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .fc-tab {
          position: relative;
          z-index: 2;
          padding: 9px 8px;
          border: none;
          background: transparent;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          color: #6b7280;
          transition: color 260ms ease;
        }
        .fc-tab.is-on {
          color: #ffffff;
        }
        .fc-tab:not(.is-on):hover {
          color: #2563eb;
        }

        .fc-panel {
          padding: 22px 24px;
          border-radius: 16px;
          background: linear-gradient(150deg, #f8fafc, #eff6ff);
          border: 1px solid #e5e7eb;
        }
        .fc-list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .fc-item {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          animation: fcItem 460ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes fcItem {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .fc-tick {
          position: relative;
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          margin-top: 3px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
        .fc-tick::after {
          content: '';
          position: absolute;
          left: 5px;
          top: 4.5px;
          width: 4px;
          height: 7px;
          border-right: 1.7px solid #ffffff;
          border-bottom: 1.7px solid #ffffff;
          transform: rotate(45deg);
        }
        .fc-txt {
          font-size: 0.885rem;
          line-height: 1.72;
          color: #374151;
        }
        .fc-note {
          margin: 16px 0 0;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 0.8rem;
          font-style: italic;
          line-height: 1.65;
          color: #6b7280;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-left: 3px solid #3b82f6;
        }

        /* ---- CTA ---- */
        .cta {
          position: relative;
          overflow: hidden;
          padding: 92px 24px;
          text-align: center;
          background: linear-gradient(150deg, #0b1f4d 0%, #071a52 55%, #12356d 100%);
        }
        .cta-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: linear-gradient(
              rgba(147, 197, 253, 0.055) 1px,
              transparent 1px
            ),
            linear-gradient(90deg, rgba(147, 197, 253, 0.055) 1px, transparent 1px);
          background-size: 58px 58px;
          mask-image: radial-gradient(ellipse 60% 70% at 50% 50%, #000 0%, transparent 76%);
          -webkit-mask-image: radial-gradient(
            ellipse 60% 70% at 50% 50%,
            #000 0%,
            transparent 76%
          );
        }
        .cta-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 640px;
          height: 360px;
          transform: translate(-50%, -50%);
          pointer-events: none;
          background: radial-gradient(
            ellipse at center,
            rgba(37, 99, 235, 0.28),
            transparent 68%
          );
        }
        .cta-wrap {
          position: relative;
          z-index: 3;
        }
        .cta-title {
          margin: 0 auto 18px;
          max-width: 640px;
          font-size: clamp(1.7rem, 5vw, 2.5rem);
          font-weight: 900;
          line-height: 1.15;
          letter-spacing: -0.03em;
          color: #ffffff;
        }
        .cta-copy {
          max-width: 520px;
          margin: 0 auto 38px;
          font-size: 1rem;
          line-height: 1.75;
          color: rgba(199, 215, 245, 0.78);
        }
        .cta-btn {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 17px 38px;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 700;
          color: #ffffff;
          text-decoration: none;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          box-shadow: 0 16px 40px rgba(37, 99, 235, 0.44),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
          transition: transform 340ms cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 340ms ease;
        }
        .cta-btn-face {
          position: relative;
          z-index: 2;
        }
        .cta-btn-sheen {
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
        .cta-btn:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 22px 52px rgba(37, 99, 235, 0.58),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        .cta-btn:hover .cta-btn-sheen {
          animation: ctaSheen 760ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes ctaSheen {
          from {
            left: -60%;
          }
          to {
            left: 130%;
          }
        }

        .fc-tab:focus-visible,
        .cta-btn:focus-visible {
          outline: 2px solid #93c5fd;
          outline-offset: 3px;
        }

        @media (max-width: 560px) {
          .ph {
            padding: 78px 18px 92px;
          }
          .fs {
            padding: 8px 18px 68px;
          }
          .fc-body {
            padding: 26px 22px 28px;
          }
          .fc-panel {
            padding: 18px 18px;
          }
          .fc-tabs {
            max-width: 100%;
          }
          .fc-index {
            display: none;
          }
          .cta {
            padding: 72px 18px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ph-orb,
          .ph-beam,
          .ph-badge-dot,
          .fc-item {
            animation: none !important;
          }
          .fc,
          .fc-ico,
          .fc-rail,
          .fc-thumb,
          .cta-btn {
            transition-duration: 1ms !important;
          }
          .cta-btn:hover .cta-btn-sheen {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
