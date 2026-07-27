import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { FadeUp } from '../components/ui/ScrollReveal';

/* Premium enterprise legal page - shared deep dark blue design system.
   All twelve sections, every paragraph, the intro block, the icons, the
   last-updated line and the contact block are preserved exactly. */

const sections = [
  {
    title: 'What Information We Collect',
    icon: '📋',
    content: [
      'When you submit the Get Started form, we may collect: Institute Name, Owner / Contact Name, Email Address, Institute Type, Number of Students, Phone Number (if provided), and any additional information included in your message.',
      'When your institute account is active, information entered into the system may include student records, attendance records, fee records, batch information, schedules, and enquiry records.',
    ],
  },
  {
    title: 'How We Use Information',
    icon: '🔍',
    content: [
      'Information submitted through the Get Started form is used to: review your request, contact you regarding onboarding and setup, provide information about our services, and configure and maintain your institute account.',
      'We do not sell institute data or use it for unrelated third-party marketing purposes.',
    ],
  },
  {
    title: 'Data Storage',
    icon: '🗄️',
    content: [
      "Institute operational data is stored in the Google Sheet connected to your institute account. The storage, availability, and security of that data are also subject to Google's services and policies.",
      'Information submitted through this website for onboarding, support, or account management may be stored and processed as required to operate and maintain the service.',
    ],
  },
  {
    title: 'Data Access & Ownership',
    icon: '🔐',
    content: [
      'Institutes retain ownership of the information they enter into the system.',
      'Access to institute data is restricted to authorised users of the respective institute and to SYNCOPTRAC personnel when reasonably required for setup, support, maintenance, troubleshooting, or operation of the service.',
      'Institutes are responsible for ensuring that they have obtained any required permissions, authorisations, or consent from students, parents, staff, or other individuals whose information is entered into the system.',
    ],
  },
  {
    title: 'Email Communication',
    icon: '📧',
    content: [
      'The system may send automated emails on behalf of an institute for operational purposes such as attendance notifications and fee reminders.',
      'These communications are sent using the email configuration connected to the institute account and are intended only for recipients designated by the institute.',
    ],
  },
  {
    title: 'Third-Party Services',
    icon: '🔗',
    content: [
      'SYNCOPTRAC relies on third-party services, including Google Sheets, Google Apps Script, and Gmail, to provide certain features of the platform.',
      'Use of these services is subject to the applicable terms, policies, and practices of the respective providers.',
    ],
  },
  {
    title: 'Account Closure & Data Requests',
    icon: '📁',
    content: [
      'Institutes may contact us regarding account closure or requests related to their information by emailing us at syncoptrac@gmail.com.',
      'We will review and process deletion requests within 7 working days of receiving the request.',
    ],
  },
  {
    title: 'Security & Service Availability',
    icon: '🛡️',
    content: [
      'SYNCOPTRAC uses reasonable administrative and technical measures to help protect information handled through the platform.',
      'However, no electronic system, internet transmission, or third-party service can be guaranteed to be completely secure, uninterrupted, or error-free.',
      'While reasonable efforts are made to maintain service availability and data integrity, SYNCOPTRAC does not guarantee uninterrupted operation or prevention of data loss.',
    ],
  },
  {
    title: 'Limitation of Liability',
    icon: '⚖️',
    content: [
      'To the maximum extent permitted by applicable law, SYNCOPTRAC shall not be liable for any indirect, incidental, consequential, special, or business losses arising from the use of the service, including loss of data, loss of revenue, interruption of operations, or reliance on information stored within the platform.',
    ],
  },
  {
    title: 'Changes to This Policy',
    icon: '📝',
    content: [
      'This Privacy & Data Handling statement may be updated from time to time to reflect changes in the service, operational requirements, or legal obligations.',
      'The version published on this page represents the current policy.',
    ],
  },
  {
    title: 'Governing Law',
    icon: '🌍',
    content: [
      'This Privacy & Data Handling statement shall be governed by and interpreted in accordance with the laws of India.',
    ],
  },
  {
    title: 'Contact',
    icon: '💬',
    content: [
      'For any questions, concerns, or requests regarding privacy, data handling, or your account, please contact: syncoptrac@gmail.com',
      'We are committed to handling all privacy matters transparently and promptly.',
    ],
  },
];

export default function PrivacyPage() {
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
            Legal
          </div>
          <h1 className="ph-title">Privacy &amp; Data Handling</h1>
          <p className="ph-lede">
            How SYNCOPTRAC collects, uses, and handles your institute&apos;s information.
          </p>
          <p className="ph-stamp">Last updated: May 2026</p>
        </div>
      </section>

      {/* Privacy sections */}
      <section className="ls">
        <span className="ls-wash" aria-hidden="true" />
        <div className="ls-inner">
          {/* Intro block */}
          <FadeUp>
            <div className="lintro">
              <span className="lintro-rail" aria-hidden="true" />
              <span className="lintro-mark" aria-hidden="true" />
              <p className="lintro-copy">
                SYNCOPTRAC is built for coaching centres and training institutes. We
                understand that institute, student, and parent information is sensitive and
                should be handled responsibly. This page explains what information we
                collect, how it is used, and how it is handled within the system.
              </p>
            </div>
          </FadeUp>

          {/* Sections */}
          {sections.map((section, i) => (
            <FadeUp key={section.title} delay={i * 60}>
              <article className="lc">
                <span className="lc-edge" aria-hidden="true" />
                <span className="lc-wash" aria-hidden="true" />
                <div className="lc-head">
                  <span className="lc-ico" aria-hidden="true">
                    <span className="lc-ico-glyph">{section.icon}</span>
                  </span>
                  <h2 className="lc-title">{section.title}</h2>
                  <span className="lc-num" aria-hidden="true" />
                </div>
                <div className="lc-body">
                  {section.content.map((para, j) => (
                    <p key={j} className="lc-para">
                      {para}
                    </p>
                  ))}
                </div>
              </article>
            </FadeUp>
          ))}

          {/* Contact block */}
          <FadeUp delay={sections.length * 60}>
            <div className="lct">
              <p className="lct-copy">
                Questions about this policy?{' '}
                <a href="mailto:syncoptrac@gmail.com" className="lct-link">
                  syncoptrac@gmail.com
                </a>
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        .pg {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          overflow-x: hidden;
          background: #f8fafc;
        }

        /* ---- page header ---- */
        .ph {
          position: relative;
          overflow: hidden;
          padding: 96px 24px 104px;
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
          width: 420px;
          height: 420px;
          top: -30%;
          left: -6%;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.32), transparent 68%);
          animation: phOrb1 20s ease-in-out infinite;
        }
        .ph-orb-2 {
          width: 360px;
          height: 360px;
          bottom: -34%;
          right: -5%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.24), transparent 68%);
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
          max-width: 700px;
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
          margin: 0 0 18px;
          font-size: clamp(2rem, 5.6vw, 3.1rem);
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #ffffff 0%, #dbeafe 55%, #93c5fd 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .ph-lede {
          max-width: 540px;
          margin: 0 auto;
          font-size: clamp(0.95rem, 2.3vw, 1.05rem);
          line-height: 1.75;
          color: rgba(199, 215, 245, 0.8);
        }
        .ph-stamp {
          margin: 14px 0 0;
          font-size: 0.78rem;
          letter-spacing: 0.04em;
          color: rgba(190, 209, 247, 0.5);
        }

        /* ---- sections ---- */
        .ls {
          position: relative;
          flex: 1;
          padding: 8px 24px 88px;
          background: #f8fafc;
        }
        .ls-wash {
          position: absolute;
          top: -40px;
          left: 50%;
          width: 780px;
          height: 320px;
          transform: translateX(-50%);
          pointer-events: none;
          background: radial-gradient(
            ellipse at center,
            rgba(37, 99, 235, 0.07),
            transparent 70%
          );
        }
        .ls-inner {
          position: relative;
          z-index: 2;
          max-width: 760px;
          margin: 0 auto;
        }
        .ls-inner {
          counter-reset: lcard;
        }
        .lc {
          counter-increment: lcard;
        }
        .lc-num::before {
          content: counter(lcard, decimal-leading-zero);
        }

        .lintro {
          position: relative;
          overflow: hidden;
          margin-bottom: 26px;
          padding: 32px 34px;
          border-radius: 22px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 2px rgba(11, 31, 77, 0.04),
            0 14px 34px rgba(11, 31, 77, 0.06);
        }
        .lintro-rail {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #2563eb, #3b82f6, transparent);
        }
        .lintro-mark {
          position: absolute;
          top: -30px;
          right: -20px;
          width: 200px;
          height: 200px;
          pointer-events: none;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.08), transparent 66%);
        }
        .lintro-copy {
          position: relative;
          z-index: 2;
          margin: 0;
          font-size: 0.94rem;
          line-height: 1.85;
          color: #374151;
        }

        .lc {
          position: relative;
          overflow: hidden;
          margin-bottom: 16px;
          padding: 26px 30px;
          border-radius: 18px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 2px rgba(11, 31, 77, 0.03);
          transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 400ms cubic-bezier(0.16, 1, 0.3, 1), border-color 300ms ease;
        }
        .lc-edge {
          position: absolute;
          top: 18px;
          bottom: 18px;
          left: 0;
          width: 3px;
          border-radius: 0 3px 3px 0;
          background: linear-gradient(180deg, #2563eb, #3b82f6);
          transform: scaleY(0);
          transform-origin: top center;
          transition: transform 460ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .lc-wash {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(
            460px circle at 96% 0%,
            rgba(37, 99, 235, 0.06),
            transparent 62%
          );
          opacity: 0;
          transition: opacity 420ms ease;
        }
        .lc:hover {
          transform: translateY(-4px);
          border-color: #bfdbfe;
          box-shadow: 0 18px 40px rgba(37, 99, 235, 0.12);
        }
        .lc:hover .lc-edge {
          transform: scaleY(1);
        }
        .lc:hover .lc-wash {
          opacity: 1;
        }
        .lc-head {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 14px;
        }
        .lc-ico {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border-radius: 13px;
          background: linear-gradient(140deg, #eff6ff, #dbeafe);
          border: 1px solid #bfdbfe;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
          transition: transform 440ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .lc-ico-glyph {
          font-size: 1.28rem;
          line-height: 1;
        }
        .lc:hover .lc-ico {
          transform: scale(1.08) rotate(-4deg);
        }
        .lc-title {
          flex: 1;
          margin: 0;
          font-size: 1.02rem;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: #111827;
        }
        .lc-num {
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #cbd5e1;
          transition: color 340ms ease;
        }
        .lc:hover .lc-num {
          color: #3b82f6;
        }
        .lc-body {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .lc-para {
          margin: 0;
          font-size: 0.882rem;
          line-height: 1.78;
          color: #4b5563;
        }

        .lct {
          margin-top: 14px;
          padding: 22px 26px;
          border-radius: 16px;
          text-align: center;
          background: linear-gradient(135deg, #eff6ff, #f8fafc);
          border: 1px solid #bfdbfe;
        }
        .lct-copy {
          margin: 0;
          font-size: 0.882rem;
          color: #6b7280;
        }
        .lct-link {
          font-weight: 700;
          color: #2563eb;
          text-decoration: none;
          transition: color 240ms ease;
        }
        .lct-link:hover {
          color: #1d4ed8;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .lct-link:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 3px;
          border-radius: 4px;
        }

        @media (max-width: 520px) {
          .ph {
            padding: 74px 18px 88px;
          }
          .ls {
            padding: 8px 18px 64px;
          }
          .lintro {
            padding: 26px 22px;
          }
          .lc {
            padding: 22px 20px;
          }
          .lc-num {
            display: none;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ph-orb,
          .ph-beam,
          .ph-badge-dot {
            animation: none !important;
          }
          .lc,
          .lc-ico,
          .lc-edge {
            transition-duration: 1ms !important;
          }
        }
      `}</style>
    </div>
  );
}
