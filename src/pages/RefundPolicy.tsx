import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const RefundPolicy = () => {
  return (
    <>
      <Navbar />

      <div className="pt-20 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Refund Policy</h1>

        {/* Introduction */}
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Introduction</h2>
          <p>
            We value your trust. In order to honor that trust, ExpertiseStation adheres to ethical
            standards in gathering, using, and safeguarding any information you provide.
          </p>
        </section>

        {/* Information Collection */}
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Information Collection</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>We collect personal information such as name, email, and contact details.</li>
            <li>Information is collected during registration, form submissions, or any direct interaction with our platform.</li>
            <li>We may collect usage data to analyze and improve user experience.</li>
          </ul>
        </section>

        {/* Use of Information */}
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>To provide personalized services and improve user experience.</li>
            <li>For communication and customer support purposes.</li>
            <li>To analyze usage trends and optimize performance.</li>
          </ul>
        </section>

        {/* Sharing Policy */}
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Sharing of Personal Information</h2>
          <p>
            We do not share your personal information with third parties without your consent, except as required by law.
          </p>
        </section>

        {/* Data Protection */}
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal data.
          </p>
        </section>
{/* User Rights */}
<section className="mb-6">
  <h2 className="text-2xl font-semibold mb-2">Your Rights</h2>
  <ul className="list-disc list-inside space-y-2">
    <li>You have the right to access, update, or delete your personal information.</li>
    <li>You can request data portability or restrict data processing.</li>
    <li>To make a request, email us at <a href="mailto:support@expertisestation.com" style={{ color: 'blue' }}><strong>support@expertisestation.com</strong></a>.</li>
  </ul>
</section>

        {/* Changes to Policy */}
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Changes to This Policy</h2>
          <p>
            We may update our Refund Policy from time to time. We encourage users to review this page periodically.
          </p>
        </section>
      </div>

      <Footer />
    </>
  );
};

export default RefundPolicy;
