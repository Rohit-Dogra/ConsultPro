import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SEOHead from '../components/SEO/SEOHead';
import { pageSEOConfig } from '../config/seo';

const PrivacyPolicy = () => {
  return (
    <>
      <SEOHead 
        title={pageSEOConfig.privacyPolicy.title}
        description={pageSEOConfig.privacyPolicy.description}
        keywords={pageSEOConfig.privacyPolicy.keywords}
        url="https://expertisestation.com/privacypolicy"
        noindex={true}
      />
      <Navbar />
      <div className="pt-20 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="mb-6 text-gray-700 italic">
  <span className="font-semibold">Effective Date:</span> 24th April 2025
</p>


        <p className="mb-6">
          At Expertise Station ("we", "our", or "us"), your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and protect your information when you visit our website <a href="https://www.expertisestation.com" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>www.expertisestation.com </a>(the &ldquo;Site&rdquo;). By using the Site, you agree to the collection and use of information in accordance with this Privacy Policy.
        </p>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">1. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <h3 className="text-xl font-semibold mb-1">a. Personal Information</h3>
          <p>This may include:</p>
          <ul className="list-disc list-inside mb-2">
            <li>Full name</li>
            <li>Email address</li>
            <li>Contact number</li>
            <li>Company details</li>
            <li>Job title</li>
            <li>Any other information you submit via forms or interactions on our site</li>
          </ul>
          <h3 className="text-xl font-semibold mb-1">b. Non-Personal Information</h3>
          <p>This includes:</p>
          <ul className="list-disc list-inside">
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Pages visited and time spent on the site</li>
            <li>Referring website addresses</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">2. How We Use Your Information</h2>
          <p>We may use your information for:</p>
          <ul className="list-disc list-inside">
            <li>Providing and improving our services</li>
            <li>Sending newsletters, updates, or promotional content (with consent)</li>
            <li>Responding to inquiries or customer support</li>
            <li>Analyzing website usage and trends</li>
            <li>Complying with legal obligations</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">3. Sharing of Information</h2>
          <p>We do not sell your personal information. We may share your information with:</p>
          <ul className="list-disc list-inside">
            <li>Trusted third-party service providers for website operations, analytics, or communication (e.g., email services)</li>
            <li>Government or legal authorities if required under law</li>
            <li>Business partners or affiliates (with your consent)</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">4. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies to enhance your browsing experience and collect analytics data. You can modify your browser settings to manage cookies. However, disabling cookies may affect some features of the site.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">5. Data Retention</h2>
          <p>
            We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required or permitted by law.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">6. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">7. Your Rights (India + GDPR-aligned)</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc list-inside">
            <li>Access, update, or delete your personal data</li>
            <li>Withdraw consent for data processing</li>
            <li>Lodge a complaint with a data protection authority</li>
          </ul>
          <p>You can exercise these rights by contacting us beforehand (details below).</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">8. Third-Party Links</h2>
          <p>
            Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of those sites.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">9. Children’s Privacy</h2>
          <p>
            Our services are not directed to individuals under the age of 18. We do not knowingly collect data from minors.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">10. Updates to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Effective Date".
          </p>
        </section>

        <section>
  <h2 className="text-2xl font-semibold mb-2">11. Contact Us</h2>
  <p>
    If you have any questions or concerns about this Privacy Policy or our data practices, please contact:
  </p>
  <p className="font-semibold">Expertise Station</p>
  <p className="font-semibold">
    Email:{' '}
    <a
      href="mailto:sunil.kapoor@brenstoneinternational.com"
      className="text-blue-600 underline"
    >
      sunil.kapoor@brenstoneinternational.com
    </a>
  </p>
  <p className="font-semibold">
    Website:{' '}
    <a
      href="https://www.expertisestation.com"
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline"
    >
      www.expertisestation.com
    </a>
  </p>
</section>

      </div>
      <Footer />
    </>
  );
};

export default PrivacyPolicy;
