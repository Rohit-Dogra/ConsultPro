import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
// import cookie from '../img/network/cookie-policy.jpg';

const CookiePolicy = () => {
  return (
    <>
      <Navbar />

      {/* Uncomment below if you plan to use a banner image in future */}
      {/* 
      <div className="pt-20">
        <div className="h-64 md:h-96 overflow-hidden">
          <img
            src={cookie}
            alt="Cookie Policy Banner"
            className="w-full h-full object-cover"
          />
        </div>
      </div> 
      */}

      <div className="pt-20 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>

        <section className="mb-6 space-y-4">
          <p>
            Below is information about how we and our affiliates use cookies and other similar technology on this website.
            This policy is effective as of July 8, 2022. Please note that this privacy statement will be updated from time to time.
          </p>
          <p>
            We can place cookies and other similar technology on your device, including mobile device, in accordance with your preferences set on our cookie consent manager. Depending on your settings, the following information may be collected: unique device identifier, IP address, OS info, carrier, and location (as allowed by law).
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">What are cookies?</h2>
          <p>
            Cookies are small text files downloaded to your device that allow websites to recognize your device. We use both “first party cookies” and “third party cookies”.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Why do we use cookies and similar technologies?</h2>
          <p>
            Cookies help with navigation, remembering preferences, improving user experience, providing relevant ads, and enabling analytics. They also enhance interaction with social media platforms.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Do we use cookies for marketing and analytics?</h2>
          <p>
            Yes. Cookies help us understand user behavior and deliver personalized content. For example:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Tracking email interactions (open, read, click).</li>
            <li>Tracking link clicks to our website from emails.</li>
            <li>Combining and analyzing personal data to enhance user experience.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Do we use third-party cookies?</h2>
          <p>
            Yes. We use third-party tools like Facebook, Microsoft, Twitter, YouTube, Instagram, LinkedIn, etc., for analytics and advertising. These may track your interactions with our site.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Do we use tracking technologies like web beacons?</h2>
          <p>
            Yes. Web beacons and conversion pixels are used in emails, websites, and affiliated platforms to measure engagement and conversions. They may work with cookies but don’t store data themselves.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">How can you manage cookies?</h2>
          <p>
            You can use our cookie consent manager or your browser settings to manage or delete cookies. Note that blocking cookies might affect site functionality.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Types of cookies we use</h2>
          <p className="mb-4">
            Not all cookies may be used on all sites or in all jurisdictions. Here are the types we may use:
          </p>
          <table className="table-auto border-collapse border border-gray-300 w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">Category</th>
                <th className="border px-4 py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-4 py-2 font-semibold">Strictly Necessary Cookies</td>
                <td className="border px-4 py-2">Essential for site functionality like secure login and navigation.</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-semibold">First-Party Analytics Cookies</td>
                <td className="border px-4 py-2">Used for analyzing site performance without identifying users.</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-semibold">Performance Cookies</td>
                <td className="border px-4 py-2">Collected by third parties to improve site usability and performance.</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-semibold">Functionality Cookies</td>
                <td className="border px-4 py-2">Remember your preferences like language, region, or username.</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-semibold">Advertising & Social Media Cookies</td>
                <td className="border px-4 py-2">Used to serve personalized ads, track ad effectiveness, and support social media integrations.</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Contact Us</h2>
          <p className="mb-2">
            If you have any questions now or during your visit, feel free to reach out to us.
          </p>
          <a
            href="/contact"
            className="inline-block mt-2 bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            Go to Contact Page
          </a>
        </section>
      </div>

      <Footer />
    </>
  );
};

export default CookiePolicy;
