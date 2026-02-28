"use client";

import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header & Logo */}
      <header className="fixed top-0 w-full bg-white border-b border-gray-100 px-6 py-4 z-50">
        <Link href="/" className="inline-block text-2xl font-bold hover:opacity-80 transition-opacity cursor-pointer">
          <span className="text-teal-600">SWAP</span>
          <span className="text-gray-900">STREET</span>
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 pt-24">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-gray-600 mb-8">
            Last Updated: Feb 27, 2026
          </p>
          
          {/* Image */}
          <div className="flex justify-center mb-8">
            <img 
              src="/images/terms.svg" 
              alt="Terms of Service" 
              className="w-60 h-60 object-contain"
            />
          </div>
        </div>

        {/* Sections */}
        <div className="prose prose-lg max-w-none text-justify">
          {/* Intro */}
          <div className="mb-8">
            <p className="text-gray-700 leading-relaxed mb-4">
              This agreement explains how SWAPSTREET is intended to be used, the responsibilities of users when 
              interacting with the platform and the terms under which the platform is developed and provided.
            </p>
          </div>

          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Platform Overview
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              SWAPSTREET is a web and mobile marketplace for refurbished and second-hand clothing, designed to make 
              fashion more affordable, accessible and sustainable. The platform allows sellers to easily list items and 
              buyers to discover clothing through easy-to-use filters, personalized collections and trending styles.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Beyond simple buying and selling, it envisions advanced features such as AI-powered virtual try-ons, 
              outfit suggestions, secure in-app payments and social interactions to create a more engaging and trustworthy 
              experience. By combining convenience, personalization and eco-conscious values, the platform not only promotes 
              sustainable fashion but also offers a scalable business model through transaction fees, premium subscriptions 
              and partnerships with thrift stores and brands.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Users can communicate directly with sellers through our integrated chat system to arrange meetings, 
              negotiate prices, and coordinate item exchanges in person or through agreed-upon delivery methods.
            </p>
          </section>

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Eligibility
            </h2>
            <p className="text-gray-700 leading-relaxed">
              The platform is intended for users aged 18 or older. By creating an account and using SWAPSTREET, 
              you confirm that you meet this age requirement and have the legal capacity to enter into this agreement.
            </p>
          </section>

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. User Responsibilities
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Users who create listings or make purchases are responsible for:
            </p>
            <ul className="list-disc ml-6 text-gray-700 leading-relaxed mb-4">
              <li>Providing accurate information about items</li>
              <li>Acting honestly and respectfully toward other users</li>
              <li>Using the platform in accordance with applicable laws</li>
              <li>Securing their account credentials and reporting any unauthorized activity if noticed</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. User Content
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Users may upload photos, descriptions, and item details. By posting content, users confirm that:
            </p>
            <ul className="list-disc ml-6 text-gray-700 leading-relaxed mb-4">
              <li>They have the right to sell or display the item</li>
              <li>The material does not infringe on others' rights</li>
              <li>Descriptions are truthful regarding condition and authenticity</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              SWAPSTREET may display this content within the platform solely for the purpose of operating and 
              showcasing listings.
            </p>
          </section>

          {/* Section 5 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Acceptable and Unacceptable Use
            </h2>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Allowed:</h3>
              <ul className="list-disc ml-6 text-gray-700 leading-relaxed mb-4">
                <li>Listing second-hand or refurbished clothing items for sale</li>
                <li>Browsing, purchasing, and communicating with other users</li>
                <li>Using our AI virtual try-on features for better shopping decisions</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Not Allowed:</h3>
              <ul className="list-disc ml-6 text-gray-700 leading-relaxed mb-4">
                <li>Listing counterfeit, stolen, or misrepresented items</li>
                <li>Harassment, fraud, or misleading communication</li>
                <li>Attempts to damage, disrupt, or exploit the platform or its users</li>
              </ul>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Misuse may lead to account restriction or deletion if such actions are taken.
            </p>
          </section>

          {/* Section 6 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Transactions and Interactions
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              SWAPSTREET facilitates communication and discovery between buyers and sellers through our chat system. 
              However:
            </p>
            <ul className="list-disc ml-6 text-gray-700 leading-relaxed mb-4">
              <li>The platform does not guarantee item quality or successful delivery</li>
              <li>Users are responsible for confirming item condition and negotiating exchanges</li>
              <li>Disputes between users should be resolved directly unless structured dispute tools are added later</li>
              <li>The platform does not provide refunds</li>
              <li>SWAPSTREET is not responsible for transactions between users</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Intellectual Property
            </h2>
            <p className="text-gray-700 leading-relaxed">
              User-generated content remains the property of the user, but is permitted to be displayed within 
              SWAPSTREET for listing and marketplace purposes.
            </p>
          </section>

          {/* Section 8 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. No Warranty
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              SWAPSTREET is provided as a developing platform. There may be:
            </p>
            <ul className="list-disc ml-6 text-gray-700 leading-relaxed mb-4">
              <li>Bugs or incomplete features</li>
              <li>Periodic downtime</li>
              <li>Evolving layouts or functionality</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Users interact with the platform at their own discretion.
            </p>
          </section>

          {/* Section 9 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Limitation of Liability
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The SWAPSTREET development team is not responsible for:
            </p>
            <ul className="list-disc ml-6 text-gray-700 leading-relaxed mb-4">
              <li>Financial losses from user-to-user transactions</li>
              <li>Inaccurate item descriptions</li>
              <li>Technical issues, data loss, or unauthorized access</li>
              <li>Any disputes, damages, or issues arising from meetups or exchanges between users</li>
              <li>Quality, authenticity, or condition of items sold on the platform</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Users engage with the platform and other users entirely at their own risk.
            </p>
          </section>

          {/* Section 10 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Termination of Use
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Access to the platform may be limited or removed if a user violates this agreement or uses the 
              platform in harmful or unlawful ways.
            </p>
          </section>

          {/* Section 11 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Updates to This Agreement
            </h2>
            <p className="text-gray-700 leading-relaxed">
              This document may be revised during the project's growth or deployment stages. Any updates reflect 
              improvements, feature expansions, or policy clarifications.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 text-center text-muted-foreground mt-8 pt-8 border-t border-border">
            © 2025 SWAPSTREET. Made with ❤.
      </footer>
    </div>
  );
}