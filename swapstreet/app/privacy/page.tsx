import LegalPageLayout from "@/components/legal/LegalPageLayout";

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated="Mar 2, 2026"
      image={{ src: "/images/privacy.svg", alt: "Privacy Policy" }}
    >
      {/* Intro */}
      <div className="mb-8">
        <p className="text-gray-700 leading-relaxed mb-4">
          This Privacy Policy explains what information SWAPSTREET collects, how
          it is used, and the choices you have regarding your personal data. By
          using our platform, you agree to the practices described below.
        </p>
      </div>

      {/* Section 1 */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          1. Information We Collect
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          When you use SWAPSTREET, we may collect the following types of
          information:
        </p>
        <ul className="list-disc ml-6 text-gray-700 leading-relaxed mb-4">
          <li>
            <strong>Account information</strong> — name, email address, and
            password when you register
          </li>
          <li>
            <strong>Profile information</strong> — profile picture, bio, and
            preferences you choose to provide
          </li>
          <li>
            <strong>Listing data</strong> — photos, descriptions, and pricing
            details you upload for items
          </li>
          <li>
            <strong>Usage data</strong> — pages visited, searches performed, and
            interactions within the platform
          </li>
          <li>
            <strong>Communication data</strong> — messages exchanged with other
            users through our integrated chat system
          </li>
          <li>
            <strong>Location data</strong> — your approximate location, used to
            show nearby listings and help coordinate in-person exchanges with
            other users
          </li>
        </ul>
      </section>

      {/* Section 2 */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          2. How We Use Your Information
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Your information is used to:
        </p>
        <ul className="list-disc ml-6 text-gray-700 leading-relaxed mb-4">
          <li>Create and manage your account</li>
          <li>Display your listings and profile to other users</li>
          <li>
            Enable communication between buyers and sellers through our chat
            system
          </li>
          <li>
            Power AI features such as virtual try-ons and outfit suggestions
          </li>
          <li>Improve platform performance, features, and user experience</li>
          <li>Detect and prevent fraud, misuse, or unauthorized activity</li>
        </ul>
        <p className="text-gray-700 leading-relaxed">
          We do not sell your personal information to third parties.
        </p>
      </section>

      {/* Section 3 */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          3. Data Sharing
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Your data is only shared in the following limited circumstances:
        </p>
        <ul className="list-disc ml-6 text-gray-700 leading-relaxed mb-4">
          <li>
            <strong>With other users</strong> — your public profile and listings
            are visible to other platform users
          </li>
          <li>
            <strong>With service providers</strong> — third-party tools that
            help us operate the platform (e.g., cloud storage, authentication)
          </li>
          <li>
            <strong>When required by law</strong> — if disclosure is required by
            applicable legal obligations
          </li>
        </ul>
      </section>

      {/* Section 4 */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          4. Data Retention
        </h2>
        <p className="text-gray-700 leading-relaxed">
          We retain your account data for as long as your account is active. If
          you delete your account, your personal data will be removed from our
          systems within a reasonable timeframe, except where retention is
          required by law or for legitimate platform security purposes.
        </p>
      </section>

      {/* Section 5 */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          5. Your Rights
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          As a user, you have the right to:
        </p>
        <ul className="list-disc ml-6 text-gray-700 leading-relaxed mb-4">
          <li>Access the personal data we hold about you</li>
          <li>Request corrections to inaccurate information</li>
          <li>Delete your account and associated data</li>
          <li>Withdraw consent for optional data uses at any time</li>
        </ul>
        <p className="text-gray-700 leading-relaxed">
          To exercise these rights, you may manage your preferences directly
          through your account settings.
        </p>
      </section>

      {/* Section 6 */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies</h2>
        <p className="text-gray-700 leading-relaxed">
          SWAPSTREET may use cookies and similar technologies to maintain
          session state, remember preferences, and understand how the platform
          is used. You can control cookie behaviour through your browser
          settings, though this may affect certain platform features.
        </p>
      </section>

      {/* Section 7 */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Security</h2>
        <p className="text-gray-700 leading-relaxed">
          We apply reasonable technical measures to protect your data, including
          encrypted connections and secure authentication. However, no system is
          completely immune to risk. Users are encouraged to use strong, unique
          passwords and report any suspicious account activity promptly.
        </p>
      </section>

      {/* Section 8 */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          8. Changes to This Policy
        </h2>
        <p className="text-gray-700 leading-relaxed">
          This Privacy Policy may be updated as the platform evolves. Any
          significant changes will be reflected in the &quot;Last Updated&quot;
          date at the top of this page. Continued use of the platform after an
          update constitutes acceptance of the revised policy.
        </p>
      </section>
    </LegalPageLayout>
  );
}
