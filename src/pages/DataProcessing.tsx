import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const DataProcessing = () => {
  return (
    <>
      <Navbar />
      <div className="pt-20 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Data Processing Policy</h1>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Introduction</h2>
          <p>
            At Expertise Station, we are committed to transparent and responsible data processing practices. This Data Processing Policy explains how we collect, process, and protect data within our platform.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Data Collection</h2>
          <p>
            We collect data from various sources including user inputs, interactions on our platform, and third-party integrations. The types of data collected include personal information, usage data, and business-related data.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Data Processing Methods</h2>
          <p>
            Data is processed using secure and efficient methods to ensure accuracy and integrity. Processing activities include data validation, aggregation, analysis, and storage.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Purpose of Data Processing</h2>
          <p>
            The data we process is used to provide and improve our services, personalize user experience, communicate updates, and comply with legal obligations.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Data Security</h2>
          <p>
            We implement technical and organizational measures to protect data against unauthorized access, loss, or misuse. Our security practices are regularly reviewed and updated.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">User Rights</h2>
          <p>
            Users have rights regarding their data including access, correction, deletion, and objection to processing. We provide mechanisms to exercise these rights through our platform.
          </p>
        </section>

        <section>
  <h2 className="text-2xl font-semibold mb-2">Contact Us</h2>
  <p className="mb-2">
    For any questions or concerns about our data processing practices, please contact us at:{' '}
    <a
      href="mailto:info@brenstoneinternational.com"
      className="text-blue-600 underline"
    >
      info@brenstoneinternational.com
    </a>
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

export default DataProcessing;
