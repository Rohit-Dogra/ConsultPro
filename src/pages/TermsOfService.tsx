import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SEOHead from '../components/SEO/SEOHead';
import { pageSEOConfig } from '../config/seo';

const TermsOfService = () => {
  return (
    <>
      <SEOHead 
        title={pageSEOConfig.termsOfService.title}
        description={pageSEOConfig.termsOfService.description}
        keywords={pageSEOConfig.termsOfService.keywords}
        url="https://expertisestation.com/termofservice"
        noindex={true}
      />
      <Navbar />
      <div className="pt-20 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>

        <p>
          The (“Company”), under formation, owns and operates the website<a href="https://www.expertisestation.com" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}> www.expertisestation.com </a>(“Website”). By accessing the Website, you agree with and consent to be bound by (i) these terms and conditions (“Terms and Conditions”); and (ii) privacy policy detailed herein, which privacy policy is incorporated herein by reference. The words “you” and “user” as used herein refer to all individuals and/or entities accessing this Website for any reason.
        </p>
        <p>
          This document is published in accordance with the provisions of Rule 3 (1) of the Information Technology (Intermediaries Guidelines) Rules, 2011.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. NATURE OF THE WEBSITE</h2>
        <ul className="list-disc list-inside mb-4">
          <li>The Website intends to act as an online information platform for advisory services of the company. The information posted is not intended for any other usage. All the information is proprietary, and ALL RIGHTS ARE RESERVED.</li>
          <li>The Company in not engaged in the business of collecting, storing forwarding or distributing goods. The Company is not a goods booking company, contractor, agent, broker or courier agency.</li>
          <li>The Company is not a shipper or transporter or rendering any services in the nature of freight forwarding. Further, the Company is not offering any goods for transport. At no point of time shall the Company ever be in the possession of goods to be transported by the Consignor through the Transporter.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">ELIGIBILITY TO USE THE WEBSITE</h2>
        <ul className="list-disc list-inside mb-4">
          <li>Use of the Website is available only to persons who can enter into legally binding contracts under Indian law. Persons who are incompetent to contract within the meaning of the Indian Contract Act, 1872, including persons below the age of 18 years are not eligible to use the Website.</li>
          <li>Notwithstanding anything contained herein, the Company hereby reserves the right to deny access to the Website or any part thereof to any person, without assigning any reason therefor.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">REGISTRATION</h2>
        <ul className="list-disc list-inside mb-4">
          <li>For accessing and using the services on the Website, you may have to register an account with the Website. In this regard, you agree and undertake:</li>
          <li>To provide true, accurate, current and complete information about yourself in all aspects as may be prompted by the Website’s registration form (such information being the “Registration Data”).</li>
          <li>To maintain and promptly update the Registration Data to keep it true, accurate, current and complete.</li>
          <li>You will not create more than one account.</li>
          <li>If the Company disables or suspends your account, you shall not create another one without our permission.</li>
          <li>You shall not share your password with any person.</li>
          <li>You shall not assign, transfer or otherwise permit any other person to operate your account.</li>
          <li>Registration: Users may register with the Website under any one of the following categories: (i) “Solution Seeker”and (ii) as an “Expert”. Registration under both categories are paid services or as defined time to time. Please refer to our payment terms provided under “Fees & Charges”. All payments are non refundable.</li>
          <li>The Company may from time to time amend the aforesaid categories of registration or introduce new categories of registration without any prior notice to you. Further, the Company may from time to time amend the pricing plans for any such categories without any notice to you.</li>
          <li>You represent and warrant that registering on the Website and availing the services thereon shall not constitute a breach of any obligation by which you are bound whether arising by contract or operation of law.</li>
          <li>You agree and acknowledge that the Company may delete or suspend your account in the event that you violate any of the Terms and Conditions or applicable law.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">YOUR USE OF THE WEBSITE</h2>
        <ol className="list-decimal list-inside mb-4 space-y-2">
          <li>You shall use the Website strictly in accordance with these Terms and Conditions. Without limiting the generality of the foregoing, you agree that you shall not use the Website for any illegal or unauthorized purpose.</li>
          <li>You agree and undertake that all information, material or content that you shall post on the Website, including but not limited to any personal details, qualifications and experience, shall be accurate and not misleading.</li>
          <li>In the course of the use of the Website, you hereby expressly agree and undertake that you shall not host, display, upload, comment, modify, publish, transmit, update or share any information or material or content that:
            <ul className="list-disc list-inside ml-6 mt-2">
              <li>belongs to another person and to which you do not have any right to;</li>
              <li>is harmful, harassing, blasphemous, defamatory, obscene, pornographic, paedophilic, libellous, invasive of another’s privacy, hateful, or racially, ethnically objectionable, disparaging, relating or encouraging money laundering or gambling, or otherwise unlawful in any manner whatever;</li>
              <li>harms minors in any way;</li>
              <li>infringes any patent, trademark, copyright or other proprietary or intellectual property rights;</li>
              <li>violates any law for the time being in force;</li>
              <li>deceives or misleads the addressee about the origin of such messages or communicates any information which is grossly offensive or menacing in nature;</li>
              <li>impersonates another person;</li>
              <li>contains software viruses or any other computer code, files or programs designed to interrupt, destroy or limit the functionality of any computer resource;</li>
              <li>threatens the unity, integrity, defence, security or sovereignty of India, friendly relations with foreign states, or public order or causes incitement to the commission of any offence or prevents investigation of any offence or is insulting any other nation;</li>
            </ul>
          </li>
          <li>You acknowledge that above has been included in specific compliance of Rule 3 (2) of the Information Technology (Intermediaries guidelines) Rules, 2011. Accordingly, any violation of above shall not only be a breach of these Terms and Conditions but may also be a violation of applicable law.</li>
          <li>You shall not any time indulge in any spamming. You agree not to use or reference the Website for chain letters, junk text, notifications, alerts, or junk mail, spamming or any use of distribution lists to any person who has not given specific permission to be included in such a process.</li>
          <li>You understand and acknowledge that you may be exposed to content on the Website that is inaccurate, offensive, indecent, or objectionable inspite of the fact that the publication of such content / material on the Website is prohibited. The Company does not take any responsibility for the unauthorised publication of such content by any user and disclaims all liability in regard thereto.</li>
          <li>The Website may permit you to post profiles, opinions, comments, messages and other communications as well as upload files (collectively, “user Content“). You understand and agree that user Content is public. Any person may read your user Content without your knowledge. Please do not include any personal information (such as phone numbers, postal addresses, email addresses or similar contact information) in your user Content. The Company is not responsible for the use or disclosure of any personal information that you disclose in your user Content.</li>
          <li>The Company shall have the right, but not the obligation, to review, edit, post, refuse to post, remove, monitor the user Content, at any time, for any reason, including to determine compliance with these Terms and Conditions, as well as to satisfy any applicable law, regulation or authorized government request. Any decision of the Company in this regard shall be final and binding on the users.</li>
          <li>You shall not attempt to gain unauthorized access to any portion or feature of the Website, or any other systems or networks connected to the Website or to any server, computer, network, or to any of the services offered on or through the Website, by hacking or any other illegitimate means.</li>
          <li>In the event that you do not comply with the provisions of these Terms and Conditions or Privacy Policy, then notwithstanding anything to the contrary contained herein, the Company shall have the right to terminate your access or usage rights to the Website and/or remove any non compliance user Content that you may have posted on the Website.</li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">USER RATING & FEEDBACK</h2>
        <ol className="list-decimal list-inside mb-4 space-y-2">
          <li>Users shall be entitled to provide ratings and feedback of other users, based on dealings with such other users.</li>
          <li>You shall exercise due caution and good judgment when leaving a rating or feedback.</li>
          <li>You shall not in any manner misuse the ratings and feedback facility provided on the Website. In particular, you shall not:
            <ul className="list-disc list-inside ml-6 mt-2">
              <li>Use inappropriate language ;</li>
              <li>Manipulate the ratings and feedback system of the Company;</li>
              <li>Use threats of poor rating or feedback or demand a positive feedback;</li>
              <li>Publish contact information within a feedback comment .</li>
            </ul>
          </li>
        </ol>

        <p>Nothing contained on the Website, including any ratings or feedback should be construed as an endorsement by the Company of any other company or Consignor or Transporter.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">DISCLAIMERS OF WARRANTIES</h2>
        <ol className="list-decimal list-inside mb-4 space-y-2">
          <li>Registering with the Website merely gives you a license to access the database of the Company.</li>
          <li>You agree, acknowledge and understand that the Website is merely acting as a platform on which Consignors and Transporters may share information with each other. You understand that the Website does not represent nor is it engaged by either the Consignors or the Transporters.</li>
          <li>In the event that any Transporter is engaged by any Consignor using the services of the Website, such engagement shall be between the Consignor and the Transporter directly. You agree and understand that the Company is not a party to and is not privy to any express or implied contract between the Consignor and the Transporter.</li>
          <li>Nothing contained on the Website should be construed as providing a guarantee or assurance to a Consignor that he would necessarily secure the services of a Transporter or that a Transporter will necessarily be able to find a consignment for carriage.</li>
          <li>The Company does not guarantee the ability of any Consignor or Transporter to complete the transaction or make payment for any of the provided services.</li>
          <li>You are hereby advised to make all independent investigations that you may deem necessary prior to availing any services on and pursuant to the use of the Website. Without limiting the generality of the foregoing, Consignors are advised to conduct appropriate independent diligence of the relevant Transporters before contacting them for carriage of their goods. Similarly, Transporters are advised to conduct appropriate independent diligence of the relevant Consignors before contacting them.</li>
          <li>The Company does not make any representation about the accuracy of any information provided by other users.</li>
          <li>The Company expressly disclaims any and all liabilities, costs, claims, damages or injuries suffered by you due to your use of any services on the Website.</li>
          <li>The selection, coordination and arrangement of the Website shall be at the sole discretion of the Company.</li>
          <li>You expressly acknowledge and agree that use of the Website is at your sole risk. To the maximum extent permitted by applicable law, the Website and any services performed or provided by the Website are provided “as is” and “as available”, without warranty of any kind, and the Company hereby disclaims all warranties and conditions with respect to the Website and any services, either express, implied or statutory, including, but not limited to, the implied warranties and/or conditions of merchantability, of satisfactory quality, of fitness for a particular purpose, of accuracy, and non-infringement of third party rights. The Company does not warrant against interference with your enjoyment of the Website, that the functions contained in, or services performed or provided by, the Website will meet your requirements, that the operation of the Website or services will be uninterrupted, virus-free or error-free, or that defects in the Website or services will be corrected. No oral or written information or advice given by the Company shall create a warranty by the Company. You shall be solely responsible for any damage to your property, including any device or computer system from which the Website is accessed.</li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">INTELLECTUAL PROPERTY</h2>
        <ol className="list-decimal list-inside mb-4 space-y-2">
          <li>You agree that the Website, including but not limited to the, source code, object code, scripts and software used to implement the Website, is owned by the Company. You expressly agree and undertake that you will not use such proprietary information or material in any way whatsoever except for use of the Website in compliance with the terms of these Terms and Conditions.</li>
          <li>With the exception of user Content submitted to the Website by you, all other content on the Website is owned by the Company, and is subject to copyright, trade mark rights, and other intellectual property rights of the Company. The Company owns a copyright in the selection, coordination, arrangement and enhancement of the content submitted by users.</li>
          <li>No downloading, copying, redistribution, retransmission, publication or commercial exploitation of any content on the Website is permissible without the express permission of the Company.</li>
          <li>You shall not use the name, trademarks or logos of the Company without the prior written consent of the Company. Nothing contained herein should be deemed to be an assignment or transfer of any intellectual property right in your favour.</li>
          <li>You may not decompile, disassemble, or reverse engineer the Website by any means whatsoever, or alter, modify, enhance, or create a derivative work of the Website. You may not remove, alter, or obscure any product identification, copyright, or other intellectual property notices on the Website.</li>
          <li>You agree that any user Content that you may upload on the Website shall not infringe any third party rights.</li>
          <li>When you upload or post any user Content, you grant to the Company, a worldwide, perpetual, non-exclusive, royalty-free, transferable license (with right to sub-licence) to use, reproduce, distribute, prepare derivative works of, display, publish and perform that user Content or any part thereof in connection with the provision of the services on the Website and otherwise in connection with the business of the Company, including without limitation for promoting and redistributing part or all of the Website, in any format whatsoever (now known or that may be invented or may be available for use in the future) and through any media channels. The license granted by you hereunder shall survive even if you delete your account on the Website or remove the user Content from the Website or otherwise stop accessing the Website.</li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">FEES AND CHARGES</h2>
        <p>Fees and charges for usage of this website and our services, shall be contracted individually with each party.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">PAYMENT TERMS</h2>
        <ol className="list-decimal list-inside mb-4 space-y-2">
          <li>You may be required to make payments from time to time for accessing certain services of the Company as detailed elsewhere in these Terms and Conditions. Pricing of such services is subject to change at the sole discretion of the Company without any prior notice.</li>
          <li>You may make payments by using credit cards and debit cards, pre-paid cards, UPI or through payment gateway as per options available online through our website or explicitly defined. All such transactions using credit and debit cards or pre-paid cards are processed using a third party payment gateway. The Company does not access or store your credit/ debit card/pre-paid card details, bank details or other financial information.</li>
          <li>You agree and acknowledge that the payment process is not within the control of the Company. Accordingly, you acknowledge that the Company will not be liable for any refunds, damages, interests or claims resulting from not processing any payment or any delay in processing a payment. The Company does not take any responsibility for and shall not be liable for any debit / credit card or netbanking fraud.</li>
          <li>You agree, understand, undertake and confirm that the credit/debit card/pre-paid card details provided by you shall be accurate and complete. You shall not use the credit card/ debit card which is not lawfully owned by you.</li>
          <li>You shall under no circumstances reveal or disclose your financial information, including credit card, debit card or bank account details to anyone who claims to represent the Company. Further, you shall not disclose any such information as a part of the user Content.</li>
          <li>In case of any international payments or payments other than in Indian Rupees, additional fees and/or currency conversion charges may be applicable. Such fees and/or conversion charges shall be borne by you.</li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">NO REFUND OR CANCELLATION</h2>
        <p>All payment obligations are non-cancellable and all amounts paid are non-refundable</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">INDEMNITY</h2>
        <p>
          You shall indemnify and hold harmless the Company, its promoters, licensees, affiliates, subsidiaries, group companies (as applicable) and their respective officers, directors, agents, and employees, from any claim or demand, or actions (including reasonable attorneys’ fees), made by any third party or penalty imposed due to or arising out of your (i) use of the Website; (ii) breach of these Terms and Conditions and any other policy in relation to the Website; (iii) any transaction that you may enter into pursuant to use of the Website; (iv), your violation of any law, rules or regulations or the rights (including infringement of intellectual property rights) of a third party.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">LIMITATION OF LIABILITY</h2>
        <ol className="list-decimal list-inside mb-4 space-y-2">
          <li>In no event shall the Company, its promoters, licensees, affiliates, subsidiaries, group companies (as applicable) and their respective officers, directors, agents, and employees, be liable for any direct, indirect, incidental, special, consequential or punitive damages for any reason whatsoever including without limitation for those arising out of or related to: (i) your use of or reliance upon the Website, and any other content or information contained in the Website; (ii) any user Content that you post or upload; (iii) your inability to use the Website; (iv) any transaction that you may enter into pursuant to use of the Website.</li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">PRIVACY POLICY</h2>
        <p>
          The Privacy Policy of the Company is available here: <a href="https://expertisestation.com/privacy policy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">https://expertisestation.com/privacy policy</a>. The Privacy Policy is incorporated by way of reference to these Terms and Conditions (and is deemed to a part of these Terms and Conditions). Reference to the/these “Terms and Conditions” shall also include the Privacy Policy. You hereby expressly agree and undertake to be bound by the Privacy Policy. If you do not agree to be bound by the Privacy Policy, please do not install or otherwise use the Website.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">ELECTRONIC COMMUNICATION</h2>
        <p>
          The Company may correspond with you electronically by sending e-mails to you or otherwise posting messages/ notifications via the Website. You understand and acknowledge that electronic transmission of information on the internet or otherwise has inherent risks and that such communications may be lost, delayed, intercepted, corrupted or be otherwise altered, rendered incomplete or fail to be delivered. You further understand and acknowledge that electronic transmission of information cannot be guaranteed to be secure or error-free and its confidentiality may be vulnerable to access by unauthorised third parties. The Company shall have no responsibility or liability to you on any basis in respect of any error, omission, claim or loss arising from or in connection with the electronic communication of information to you (or your reliance on such information).
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">FORCE MAJEURE</h2>
        <ol className="list-decimal list-inside mb-4 space-y-2">
          <li>The Company shall be excused from performance under these Terms and Conditions, to the extent it is prevented or delayed from performing, in whole or in part, as a result of an event or series of events caused by or resulting from: (i) acts of God; (ii) acts of war, acts of terrorism, insurrection, riots, civil disorders or rebellion; (iii) quarantines or embargoes; (iv) labour strikes; (v) error or disruption to computer hardware or networks or software failures; or (vi) any other causes (whether similar or dissimilar) beyond the reasonable control of the Company.</li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">ASSIGNMENT</h2>
        <ol className="list-decimal list-inside mb-4 space-y-2">
          <li>You shall not assign these Terms and Conditions, or any rights, benefits or obligations hereunder without the express written permission of the Company. Any attempted assignment that does not comply with these Terms and Conditions shall be null and void. The Company may assign these Terms and Conditions, in whole or in part, to any third-party in its sole discretion.</li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">ENTIRE AGREEMENT</h2>
        <ol className="list-decimal list-inside mb-4 space-y-2">
          <li>The Terms and Conditions, including the incorporated Privacy Policy and other terms incorporated by reference, constitutes the entire agreement and understanding between you and the Company with respect to the subject matter hereof and supersedes all prior or contemporaneous communications and proposals, whether oral or written, between you and the Company with respect to such subject matter.</li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">AMENDMENT</h2>
        <ol className="list-decimal list-inside mb-4 space-y-2">
          <li>The Company reserves its right at all times to modify any part of these Terms and Conditions at its sole discretion. You agree to revisit the Terms and Conditions regularly to ensure that you stay informed of any changes. Your use of the Website after the Company updates the Terms and Conditions will constitute acceptance of the modified Terms and Conditions.</li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">HEADINGS</h2>
        <p>
          The descriptive headings of Clauses are inserted solely for convenience of reference and are not intended as complete or accurate descriptions of content thereof and shall govern the interpretation of the provisions of these Terms and Conditions.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">WAIVER</h2>
        <p>
          The failure of the Company at any time to require observance or performance by you of any of the provisions of these Terms and Conditions shall in no way affect the Company’s right to require such observance of performance at any time thereafter, nor shall the waiver by the Company of a breach of any provision hereof by you be taken or held to be a waiver of any succeeding breach of such provision. A waiver of any of the provisions herein by the Company shall not be deemed to be a continuing waiver, but shall apply solely to the instances to which the waiver is directed.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">SEVERABILITY</h2>
        <p>
          Each and every obligation under these Terms and Conditions shall be treated as a separate obligation and shall be severally enforceable as such and in the event of any obligation or obligations being or becoming unenforceable in whole or in part. To the extent that any provision or provisions of these Terms and Conditions are unenforceable, the Company may amend such clauses as may be necessary to make the provision or provisions valid and effective. Notwithstanding the foregoing any provision which cannot be amended as may be necessary to make it valid and effective, may be deleted by the Company from these Terms and Conditions and any such deletion shall not affect the enforceability of the remainder of this these Terms.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">GOVERNING LAW</h2>
        <p>
          These Terms and Conditions (including the incorporated Privacy Policy) shall be governed by the laws of India.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">DISPUTE RESOLUTION</h2>
        <ol className="list-decimal list-inside mb-4 space-y-2">
          <li>In the event of any dispute or difference between you and the Company arising out or in any way relating these Terms and Conditions (and/or the Privacy Policy), the same shall be referred to arbitration to be conducted by a sole arbitrator appointed by the Company. The seat and venue for the arbitration shall be Gurgaon and the entire arbitration proceedings shall be conducted in Gurgaon, in accordance with the provisions of the Arbitration and Conciliation Act, 1996.</li>
          <li>Subject to the arbitration provisions above, the courts in Gurgaon shall have exclusive jurisdiction in relation to these Terms and Conditions (and/or the Privacy Policy).</li>
        </ol>
      </div>
      <Footer />
    </>
  );
};

export default TermsOfService;
