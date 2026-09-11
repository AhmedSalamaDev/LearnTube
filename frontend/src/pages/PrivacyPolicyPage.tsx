import { Link } from 'react-router-dom';

export const PrivacyPolicyPage = () => {
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
          Privacy Policy
        </h1>

        <div className="space-y-6 text-[var(--lt-muted)]">
          <section>
            <h2 className="text-xl font-semibold text-[var(--lt-text)] mb-3">
              1. Information We Collect
            </h2>
            <p>
              We collect information you provide directly to us when you create
              an account, such as your name, email address, and authentication
              credentials. We may also collect data related to your usage of the
              application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--lt-text)] mb-3">
              2. How We Use Your Information
            </h2>
            <p>
              We use the information we collect to provide, maintain, and
              improve our services, including to process your requests and
              personalize your learning experience. We do not sell your personal
              information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--lt-text)] mb-3">
              3. Data Security
            </h2>
            <p>
              We implement appropriate technical and organizational measures to
              protect your personal information against unauthorized access,
              alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--lt-text)] mb-3">
              4. Third-Party Services
            </h2>
            <p>
              Our service integrates with third-party platforms like YouTube.
              Your use of these integrations may also be subject to the
              respective privacy policies of these third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--lt-text)] mb-3">
              5. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us at privacy@learntube.app.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};
