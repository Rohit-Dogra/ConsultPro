import React from 'react';
import { Button } from '@/components/ui/button';

interface TermsAndConditionsProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ onAccept, onDecline }) => {
  return (
    <div className="relative flex flex-col h-[calc(100vh-8rem)] max-h-[800px]">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-white">
        <h2 className="text-xl font-semibold">Terms & Conditions for Experts</h2>
        <p className="text-sm text-gray-500">Expertisestation.com</p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="py-4 space-y-6 text-sm">
          {/* Section 1 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">1. Definition and Scope</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>These Terms & Conditions ("T&C") govern the relationship between all Experts ("Expert(s)") providing consultancy or advisory services via www.expertisestation.com ("Platform").</li>
              <li>By registering as an Expert, you agree to be bound by these T&C, all Platform policies, and applicable laws.</li>
              <li>Independent Contractor Status: Experts registered on the Platform are acknowledged solely as external consultants. In no event shall Experts be deemed agents, employees, representatives, partners, or affiliates of the Platform. No employment, partnership, or joint-venture relationship between the Platform and any Expert is created or implied by these T&C or by participation on the Platform.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">2. Registration and Eligibility</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must provide true, complete, and updated information at all times.</li>
              <li>You confirm that you possess the proper qualifications and authority to offer your stated area(s) of expertise.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">3. Service Engagement and Performance</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Assignments shall be defined as per Platform guidelines or separate Statement of Work.</li>
              <li>Services must be delivered with professionalism and within agreed timelines.</li>
              <li>You must avoid conflicts of interest.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">4. Fees, Payments, Currency, and Deductions</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>a. Platform Deductions: Payment to Experts will be routed only through the Platform, after deduction of administrative and other expenses (10% of total fee + GST).</li>
              <li>b. Payment Currency: Payments will be made in INR or USD as per the Solution Seeker's location.</li>
              <li>c. Currency Conversion: Currency conversion charges, if required, will be borne solely by the Expert.</li>
              <li>d. Payment Release Condition: Payment to Experts shall be subject to receipt of a written "Satisfactory Note" from the Solution Seeker.</li>
              <li>e. Payment Transmission Timeline: Upon receipt of the Satisfactory Note, payment will be remitted (net of deductions) to the Expert within seven (7) working days. This policy may change as updated on www.expertisestation.com.</li>
              <li>The Platform has the right to modify payment policies, which will be documented on the Platform.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">5. Confidentiality and Communication</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>All information gained through the Platform or from Solution Seekers must be kept strictly confidential.</li>
              <li>No Direct Communication: Experts shall not share their personal or professional credentials, contact information, or any electronic/print means for direct communication with Solution Seekers outside the Platform.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">6. Service Completion</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Accomplishment Definition: Services shall be considered complete, and payment released, only upon receipt of a written "Satisfactory Note" from the Solution Seeker.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">7. Intellectual Property</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Unless otherwise agreed, deliverables may be licensed to Solution Seekers, while ownership remains as agreed in writing.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">8. Data Protection</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Experts must comply with all laws applicable to data privacy and protection, and may not retain or misuse Platform or Solution Seeker data after engagement.</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">9. Visibility of Experts</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>The front-end visibility of select Experts on www.expertisestation.com will be determined by the quality and completeness of their registered profile and their customer feedback score.</li>
              <li>Visibility and ranking is dynamic, and may increase or decrease over time as a function of performance, experience, and feedback from Solution Seekers.</li>
            </ul>
          </section>

          {/* Section 10 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">10. Warranties and Indemnification</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Warranties: You warrant that all services provided shall conform to professional standards and applicable law.</li>
              <li>Indemnity: You agree to fully indemnify, defend, and hold harmless www.expertisestation.com, its owners, affiliates, partners, directors, officers, employees, and agents from and against any and all claims, losses, damages, liabilities, costs, or expenses (including reasonable legal fees) that may arise from:</li>
              <li>Your service, advice, or related activities,</li>
              <li>Any breach of these T&C or violation of applicable law, or</li>
              <li>Any third-party claims regarding infringement of intellectual property rights or misuse of confidential information.</li>
              <li>This indemnity applies during and after the period of your association with the Platform.</li>
            </ul>
          </section>

          {/* Section 11 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">11. Limitation of Liability</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>The Platform's role is limited to facilitating connections and handling payments. It is not liable for any advice or work product delivered by Experts.</li>
              <li>Experts' liability to Solution Seekers and to the Platform will be as set forth under engagement terms and applicable law.</li>
            </ul>
          </section>

          {/* Section 12 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">12. Termination</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Registration may be terminated by either party by written notice, or immediately for cause (e.g., breach of these T&C).</li>
              <li>Confidentiality, intellectual property, data protection, and indemnity provisions survive termination.</li>
            </ul>
          </section>

          {/* Section 13 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">13. Dispute Resolution</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Disputes shall be resolved in good faith. The Platform may offer dispute facilitation, but does not guarantee outcome.</li>
              <li>Governing law and jurisdiction will be that of the Platform's principal place of business.</li>
            </ul>
          </section>

          {/* Section 14 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">14. Amendments</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>The Platform may modify these T&C and operational procedures with notice. Updates are posted on www.expertisestation.com. Ongoing use of the Platform indicates acceptance.</li>
            </ul>
          </section>

          {/* Section 15 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">15. Miscellaneous</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>These T&C and any written Platform policies constitute the full agreement between the Expert and the Platform.</li>
              <li>If any provision is found unenforceable, the remainder remains effective.</li>
              <li>No waivers are valid unless in writing.</li>
            </ul>
          </section>

          {/* Final Note */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> This document reflects all requirements in addition to existing provisions. 
              Legal review specific to your jurisdiction is advised for maximum compliance and enforceability.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="bg-white py-4">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={onDecline}
                className="w-24"
              >
                Decline
              </Button>
              <Button
                onClick={onAccept}
                className="w-24"
              >
                Accept
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;