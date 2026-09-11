import { Link } from 'react-router-dom';

export const TermsOfServicePage = () => {
  return (
    <div className="lt-page min-h-screen">
      <header className="border-b border-[var(--lt-border)] bg-[rgba(15,19,29,0.78)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[26px] text-[var(--lt-primary)]">
              school
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold">
              Learn<span className="text-[var(--lt-primary)]">Tube</span>
            </span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold mb-8">
          Terms of Service
        </h1>

        <div className="space-y-6 text-[var(--lt-muted)]">
          <section>
            <h2 className="text-xl font-semibold text-[var(--lt-text)] mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using LearnTube, you agree to be bound by these
              Terms of Service. If you disagree with any part of the terms, you
              may not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--lt-text)] mb-3">
              2. Description of Service
            </h2>
            <p>
              LearnTube provides a platform to organize and view educational
              video content. The service is provided "as is" without any
              warranties, express or implied.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--lt-text)] mb-3">
              3. User Accounts
            </h2>
            <p>
              You are responsible for safeguarding the password that you use to
              access the service and for any activities or actions under your
              password. You must notify us immediately upon becoming aware of
              any breach of security or unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--lt-text)] mb-3">
              4. Content Guidelines
            </h2>
            <p>
              Users must comply with all applicable laws and regulations when
              using the service. You may not use the service to store or
              transmit infringing, libelous, or otherwise unlawful or tortious
              material.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--lt-text)] mb-3">
              5. Modifications
            </h2>
            <p>
              We reserve the right to modify or replace these Terms at any time.
              We will provide notice of any material changes before they take
              effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--lt-text)] mb-3">
              6. Contact Us
            </h2>
            <p>
              If you have any questions about these Terms, please contact us at
              support@learntube.app.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};
