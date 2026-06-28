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
        <h2 className="text-xl font-semibold">Terms & Conditions for Solution Seekers</h2>
        <p className="text-sm text-gray-500">www.expertisestation.com</p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="py-4 space-y-6 text-sm">
          {/* Section 1 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">1. Introduction & Scope</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>These Terms & Conditions ("T&C") govern the use of www.expertisestation.com ("Platform") by all Solution Seekers ("Solution Seeker(s)" or "you").</li>
              <li>The Platform is a tech aggregator where Solution Seekers can define business problems, use AI analysis, and select independent Experts to address specific needs.</li>
              <li>By using the Platform, you agree to these T&C, all Platform policies, and applicable laws.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">2. Defining the Business Problem & Using AI Analysis</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Solution Seekers must clearly and accurately define their business problems. You are solely responsible for the correctness and completeness of provided information.</li>
              <li>AI-generated analyses are for indicative guidance only and do not constitute professional advice. The Platform disclaims any warranty for their accuracy or fitness for purpose.</li>
            </ul>
          </section>

          {/* Continue with sections 3*/}
          <section>
            <h3 className="font-semibold text-lg mb-2">3. Selection and Engagement of Experts</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Solution Seekers independently select Experts via the Platform. The Platform does not endorse or guarantee any Expert.</li>
              <li>Experts are external consultants, not employees or representatives of the Platform.</li>
            </ul>
          </section>



            {/* Continue with sections 4 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">4. Payment Terms</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>All payments are made to the Platform in advance. Payment for cross-border services may occur in INR or USD, as communicated.</li>
              <li>Additional sessions or rescheduling incur extra fees, payable in advance.</li>
            </ul>
          </section>

    {/* Continue with sections 5 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">5. Engagement Timing & Additional Charges</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>	Time is of the essence. Extensions, delays, or rescheduling may incur extra charges. Details are communicated via the Platform interface.</li>
            
            </ul>
          </section>

    {/* Continue with sections 6 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">6. Service Completion, Acceptance, and Satisfaction Note</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>	After every session, Solution Seekers must submit a written “Satisfaction Note” to confirm service delivery before the Platform releases payment to the Expert.</li>
              <li>	Absence of a Satisfaction Note may result in the session being deemed incomplete. If you are not satisfied by the concerned Expert’s session,
                 you may rate their performance based upon point system of 0 to 10, with the score of 0 being the lowest & 10 being the highest.</li>
            </ul>
          </section>

    {/* Continue with sections 7*/}
          <section>
            <h3 className="font-semibold text-lg mb-2">7. No Refund Policy</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>	No refunds are provided after service delivery, regardless of result, unless explicitly mandated by law or the Platform’s written guarantee.</li>
              
            </ul>
          </section>

    {/* Continue with sections 8 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">8. Prohibited Direct Communication</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><b>No Direct Communications:</b> Solution Seekers must not, under any circumstances, share or request
                 personal contact information, credentials, or any electronic or print means of direct communication with Experts. All interactions must occur strictly
                  through the Platform’s communication tools.</li>
              <li>	Any attempt to initiate or facilitate off-platform communication, including but not limited to phone calls, emails, messaging, or printed correspondence,
                 is strictly prohibited and may result in immediate suspension or termination of accounts.</li>
                <li>	This policy is designed to protect the integrity of the engagement, maintain confidentiality, and ensure the 
                  security and accountability of all parties, mirroring the obligations placed upon Experts.</li>
                 
            </ul>
          </section>

    {/* Continue with sections 9 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">9. Data Privacy & Confidentiality</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Solution Seekers must provide accurate, non-infringing information. Use and protection of data is governed by Platform policy and the law.</li>
              <li>	Both Solution Seekers and the Platform are required to keep all exchanged proprietary information confidential, unless disclosure is legally required.</li>
            </ul>
          </section>

    {/* Continue with sections 10 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">10. Indemnity</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>	Solution Seekers agree to indemnify and hold harmless the Platform, its operators, employees, and affiliates against third-party claims or liabilities arising from their use, misuse, or violation of these T&C.</li>
             
            </ul>
          </section>

    {/* Continue with sections 11 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">11. Problem Definition & Result Expectations</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>The quality of advice and AI analysis depends on the clarity and accuracy of information supplied by the Solution Seeker. Poorly defined or incomplete submissions may impede service quality.</li>
              
            </ul>
          </section>


    {/* Continue with sections 12 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">12. Limitation of Platform’s Role & Liability</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>	The Platform only facilitates Expert connections and AI analysis—results and decisions are at the Solution Seeker’s own risk. The Platform disclaims liability for Expert services or decision-making outcomes.</li>
            </ul>
          </section>



         {/* Continue with sections 12 */}
          <section>
            <h3 className="font-semibold text-lg mb-2">13. Amendments, Jurisdiction, and Miscellaneous</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>The Platform may update these T&C at any time, as reflected on the Platform. Continued use implies acceptance.</li>
              <li>If a provision is unenforceable, all others remain in effect. Jurisdiction and governing law are as per the Platform's principal place of business.</li>
            </ul>
          </section>

          {/* Final Note */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> Please read these terms carefully. By continuing to use our platform, 
              you acknowledge that you have read, understood, and agreed to be bound by all terms and conditions.
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