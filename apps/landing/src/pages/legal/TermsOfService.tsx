/**
 * Terms of Service Page
 *
 * Renders the Terms of Service legal document with consistent
 * marketing page styling.
 *
 * @since v0.9.2
 */

import DOMPurify from 'dompurify';
import { motion } from 'framer-motion';
import { MarketingLayout } from '@/components/marketing';

const sections = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: `
      <p>By creating an account or using CGraph, you agree to:</p>
      <ul>
        <li>These Terms of Service</li>
        <li>Our <a href="/privacy">Privacy Policy</a></li>
        <li>Our <a href="/cookies">Cookie Policy</a></li>
        <li>Our Community Guidelines</li>
      </ul>
      <p>If you do not agree, do not use the Service. We may update these Terms — your continued use after changes constitutes acceptance.</p>
    `,
  },
  {
    id: 'eligibility',
    title: '2. Eligibility',
    content: `
      <p>To use CGraph, you must:</p>
      <ul>
        <li>Be at least 13 years old (or the minimum age in your jurisdiction)</li>
        <li>Be at least 16 years old in the European Union</li>
        <li>Have the legal capacity to enter into a binding agreement</li>
        <li>Not be prohibited from using the Service under applicable law</li>
        <li>Not reside in a country subject to a comprehensive embargo by the European Union, United States, or United Nations</li>
      </ul>
      <p><strong>Parental Consent:</strong> If you are between 13-18 (or the age of majority in your jurisdiction), you must have parental or guardian consent. We may request proof of parental consent at any time.</p>
    `,
  },
  {
    id: 'account',
    title: '3. Your Account',
    content: `
      <h4>3.1 Account Creation</h4>
      <p>You may create an account using:</p>
      <ul>
        <li>Email and password</li>
        <li>Web3 wallet (Ethereum/Polygon)</li>
        <li>OAuth providers (Google, Apple, Facebook, TikTok)</li>
      </ul>
      <p>You agree to provide accurate, current, and complete information during registration. You may not create accounts with false information, impersonate another person, or create accounts on behalf of others without authorization.</p>
      
      <h4>3.2 Account Security</h4>
      <p>You are responsible for:</p>
      <ul>
        <li>Maintaining the confidentiality of your credentials</li>
        <li>All activities under your account, whether authorized by you or not</li>
        <li>Notifying us immediately of unauthorized access at <a href="mailto:security@cgraph.org">security@cgraph.org</a></li>
        <li>Using a strong, unique password</li>
      </ul>
      <p>CGraph will never ask for your password via email or messages.</p>
      
      <h4>3.3 Account Suspension & Termination</h4>
      <p><strong>By You:</strong> You may delete your account at any time via Settings → Account → Delete Account. Upon deletion, your data will be removed in accordance with our <a href="/privacy">Privacy Policy</a>.</p>
      <p><strong>By Us:</strong> We may suspend or terminate your account if you violate these Terms or Community Guidelines, engage in fraudulent or illegal activity, pose a security risk, fail to pay applicable fees, or have an account that has been inactive for more than 2 years.</p>
      <p><strong>Effect of Termination:</strong> Upon termination, your right to use the Service ceases immediately. We may retain certain data as required by law or for legitimate business purposes (e.g., fraud prevention).</p>
    `,
  },
  {
    id: 'use',
    title: '4. Use of the Service & Software License',
    content: `
      <h4>4.1 License Grant</h4>
      <p>Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to:</p>
      <ul>
        <li>Access and use the Service for personal, non-commercial purposes</li>
        <li>Download and install our mobile applications on devices you own or control</li>
        <li>Access and use our APIs in accordance with any published API documentation</li>
      </ul>
      <p>This license does not include the right to sublicense, resell, distribute, or commercially exploit the Service or any part thereof.</p>
      
      <h4>4.2 Restrictions</h4>
      <p>You agree NOT to:</p>
      <ul>
        <li>Reverse engineer, decompile, disassemble, or attempt to derive the source code of the Service</li>
        <li>Use the Service for illegal purposes or in violation of any applicable law</li>
        <li>Attempt to gain unauthorized access to the Service, other accounts, or computer systems</li>
        <li>Interfere with or disrupt the Service's security, integrity, or performance</li>
        <li>Create multiple accounts to evade bans, restrictions, or enforcement actions</li>
        <li>Use bots, scrapers, crawlers, or automated tools without prior written permission</li>
        <li>Impersonate others or misrepresent your affiliation with any person or entity</li>
        <li>Sell, resell, rent, lease, or commercially exploit access to the Service</li>
        <li>Remove, alter, or obscure any copyright, trademark, or proprietary notices</li>
        <li>Use the Service to send unsolicited communications (spam)</li>
        <li>Upload or transmit viruses, malware, or other harmful code</li>
      </ul>
      
      <h4>4.3 Service Availability</h4>
      <p>We strive to maintain high availability but do not guarantee uninterrupted access. The Service may be temporarily unavailable for maintenance, updates, or unforeseen circumstances. We will make reasonable efforts to provide advance notice of scheduled downtime.</p>
    `,
  },
  {
    id: 'content',
    title: '5. User Content',
    content: `
      <h4>5.1 Your Content</h4>
      <p>You retain ownership of content you create ("User Content"). By posting User Content, you grant CGraph a worldwide, non-exclusive, royalty-free, sublicensable license to:</p>
      <ul>
        <li>Host, store, cache, and display your content</li>
        <li>Distribute your content to intended recipients</li>
        <li>Create backups and redundant copies for service continuity</li>
        <li>Modify your content for formatting purposes (e.g., resizing images)</li>
      </ul>
      <p>This license terminates when you delete the content, subject to: (a) reasonable backup retention periods (up to 30 days), (b) other users having shared or stored your content, and (c) any legal obligations to retain the content.</p>
      
      <h4>5.2 Content Representations</h4>
      <p>You represent and warrant that:</p>
      <ul>
        <li>You own or have the necessary rights, licenses, and permissions to post the content</li>
        <li>Your content does not infringe any third party's intellectual property, publicity, privacy, or other rights</li>
        <li>Your content does not violate any applicable law, regulation, or these Terms</li>
        <li>Your content complies with our Community Guidelines</li>
      </ul>
      
      <h4>5.3 Content Removal & Moderation</h4>
      <p>We may (but are not obligated to) review, monitor, or remove content that:</p>
      <ul>
        <li>Violates these Terms or Community Guidelines</li>
        <li>Is subject to valid legal takedown requests (including DMCA notices)</li>
        <li>Poses a risk to user safety, minors, or the Service</li>
        <li>May create liability for CGraph</li>
      </ul>
      <p>We are not responsible for any User Content posted by you or other users.</p>
    `,
  },
  {
    id: 'feedback',
    title: '6. Feedback',
    content: `
      <p>If you provide us with feedback, suggestions, ideas, improvements, or other input regarding the Service ("Feedback"), you grant CGraph a perpetual, irrevocable, worldwide, royalty-free, fully paid-up, non-exclusive, sublicensable, transferable license to use, reproduce, modify, distribute, and otherwise exploit such Feedback for any purpose without compensation or attribution to you.</p>
      <p>You acknowledge that we may already be developing or may in the future develop features or products similar to your Feedback, and you waive any claims relating to such overlap.</p>
    `,
  },
  {
    id: 'encryption',
    title: '7. End-to-End Encryption',
    content: `
      <p>CGraph provides end-to-end encryption (E2EE) for direct messages using the Triple Ratchet protocol (PQXDH key agreement with ML-KEM-768 + hybrid post-quantum ratchet with AES-256-GCM). Important points:</p>
      <ul>
        <li><strong>We cannot access encrypted content</strong> — Only you and your conversation partners can read messages</li>
        <li><strong>No backdoors</strong> — We will not implement encryption backdoors for any party, including governments</li>
        <li><strong>Key responsibility</strong> — You are responsible for backing up your encryption keys. If you lose access to all devices without a backup, encrypted messages cannot be recovered</li>
        <li><strong>Scope</strong> — E2EE applies to direct messages. Community/server messages, forum posts, and publicly shared content are not end-to-end encrypted</li>
        <li><strong>Metadata</strong> — While message content is encrypted, metadata such as sender, recipient, and timestamps may be visible to us for service operation</li>
      </ul>
    `,
  },
  {
    id: 'guidelines',
    title: '8. Community Guidelines',
    content: `
      <p>You agree not to post or share content that:</p>
      <ul>
        <li>Is illegal, harmful, threatening, abusive, or promotes violence</li>
        <li>Harasses, bullies, intimidates, or threatens others</li>
        <li>Contains hate speech, discrimination, or incites hatred against protected groups</li>
        <li>Is sexually explicit, pornographic, or involves the exploitation of minors</li>
        <li>Infringes intellectual property rights (copyrights, trademarks, trade secrets)</li>
        <li>Contains malware, viruses, ransomware, or phishing attempts</li>
        <li>Spreads deliberate misinformation or disinformation that could cause real-world harm</li>
        <li>Violates others' privacy or shares personal information without consent (doxxing)</li>
        <li>Promotes self-harm, suicide, or dangerous activities</li>
        <li>Constitutes spam, scams, or deceptive practices</li>
      </ul>
      <p>Violations may result in content removal, temporary suspension, or permanent account termination at our discretion.</p>
    `,
  },
  {
    id: 'appeals',
    title: '9. Appeals & Moderation',
    content: `
      <p>If your content is removed or your account is suspended or terminated, you may appeal the decision:</p>
      
      <h4>9.1 Appeal Process</h4>
      <ol>
        <li><strong>Submit an appeal</strong> — Email <a href="mailto:appeals@cgraph.org">appeals@cgraph.org</a> within 30 days of the action, including your username and a description of why you believe the action was incorrect</li>
        <li><strong>Review</strong> — Our moderation team will review the appeal and the original decision within 15 business days</li>
        <li><strong>Decision</strong> — You will be notified of the outcome by email. The appeal decision is final</li>
      </ol>
      
      <h4>9.2 EU Users — Digital Services Act (DSA)</h4>
      <p>If you are located in the EU, you have additional rights under the DSA:</p>
      <ul>
        <li>You will receive a clear statement of reasons for any content moderation action</li>
        <li>You may use our internal complaint-handling system free of charge</li>
        <li>You may refer the matter to a certified out-of-court dispute settlement body</li>
        <li>You retain the right to seek judicial redress in your country of residence</li>
      </ul>
    `,
  },
  {
    id: 'premium',
    title: '10. Premium Features & Payments',
    content: `
      <h4>10.1 Subscription Tiers</h4>
      <p>CGraph offers free and paid subscription tiers. Premium features may include:</p>
      <ul>
        <li>Increased storage limits and file upload sizes</li>
        <li>Group video calls with more participants</li>
        <li>Custom badges, titles, and profile features</li>
        <li>Bonus XP, exclusive achievements, and seasonal rewards</li>
        <li>Priority support and advanced analytics</li>
      </ul>
      
      <h4>10.2 Payment Terms</h4>
      <ul>
        <li>Subscriptions renew automatically at the end of each billing period unless cancelled before renewal</li>
        <li>Prices may change with at least 30 days prior notice; the new price applies at the next renewal</li>
        <li>Refunds are available within 14 days of purchase for unused premium features</li>
        <li>Payments are processed securely via Stripe. CGraph does not store your payment card details</li>
        <li>If a payment fails, we may suspend premium features until payment is resolved</li>
      </ul>
      
      <h4>10.3 In-App Purchases</h4>
      <p>Purchases made through the Apple App Store or Google Play Store are subject to the respective store's terms and refund policies. CGraph cannot issue refunds for purchases made through these platforms — contact Apple or Google directly.</p>
      
      <h4>10.4 Free Tier</h4>
      <p>The free tier includes full messaging, end-to-end encryption, forums, and basic gamification. We will not retroactively remove core features from the free tier.</p>
    `,
  },
  {
    id: 'data-charges',
    title: '11. Data Charges & Connectivity',
    content: `
      <p>You are responsible for any mobile data, internet, or other charges incurred by your carrier or internet service provider as a result of using the Service. CGraph is not responsible for any such fees.</p>
      <p>Some features (e.g., voice/video calls, file uploads, screen sharing) may consume significant bandwidth. We recommend using a Wi-Fi connection for data-intensive features.</p>
    `,
  },
  {
    id: 'third-party',
    title: '12. Third-Party Services & Integrations',
    content: `
      <p>The Service may include or integrate with third-party services, bots, applications, or content ("Third-Party Services"). Your use of Third-Party Services is at your own risk.</p>
      <ul>
        <li>We are not responsible for the availability, accuracy, or content of Third-Party Services</li>
        <li>Your interactions with Third-Party Services are governed by their own terms and privacy policies</li>
        <li>We do not endorse or guarantee any Third-Party Service</li>
        <li>Third-Party Services may collect data according to their own privacy policies</li>
      </ul>
      <p>Links to third-party websites, products, or services do not constitute endorsement by CGraph. You access such resources at your own risk.</p>
    `,
  },
  {
    id: 'ip',
    title: '13. Intellectual Property',
    content: `
      <p>The Service and its original content (excluding User Content) remain the exclusive property of CGraph and its licensors. This includes but is not limited to:</p>
      <ul>
        <li>Software, source code, object code, and algorithms</li>
        <li>Visual design, user interface, and user experience</li>
        <li>Trademarks, service marks, logos, and branding</li>
        <li>Documentation, marketing materials, and written content</li>
        <li>Audio, graphics, and other media</li>
      </ul>
      <p>You may not use, reproduce, modify, distribute, or create derivative works from our intellectual property without our prior written consent. The CGraph name, logo, and all related marks are trademarks of CGraph.</p>
    `,
  },
  {
    id: 'dmca',
    title: '14. Copyright & DMCA Policy',
    content: `
      <h4>14.1 Respect for Copyright</h4>
      <p>CGraph respects the intellectual property rights of others and expects users to do the same. We respond to notices of alleged copyright infringement in accordance with the Digital Millennium Copyright Act (DMCA) and applicable international copyright laws.</p>
      
      <h4>14.2 Filing a DMCA Takedown Notice</h4>
      <p>If you believe your copyrighted work has been copied in a way that constitutes infringement, please send a written notice to our designated agent at <a href="mailto:dmca@cgraph.org">dmca@cgraph.org</a> containing:</p>
      <ol>
        <li>A physical or electronic signature of the copyright owner or authorized agent</li>
        <li>Identification of the copyrighted work claimed to be infringed</li>
        <li>Identification of the infringing material on the Service, with enough detail to locate it</li>
        <li>Your contact information (address, telephone number, email)</li>
        <li>A statement that you have a good-faith belief the use is not authorized</li>
        <li>A statement, under penalty of perjury, that the information is accurate and you are authorized to act on behalf of the copyright owner</li>
      </ol>
      
      <h4>14.3 Counter-Notification</h4>
      <p>If you believe your content was removed in error, you may submit a counter-notification with the required information to <a href="mailto:dmca@cgraph.org">dmca@cgraph.org</a>.</p>
      
      <h4>14.4 Repeat Infringers</h4>
      <p>We will terminate the accounts of users who are determined to be repeat copyright infringers.</p>
    `,
  },
  {
    id: 'disclaimer',
    title: '15. Disclaimers',
    content: `
      <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, CGRAPH DISCLAIMS ALL WARRANTIES INCLUDING BUT NOT LIMITED TO:</p>
      <ul>
        <li>IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT</li>
        <li>WARRANTIES REGARDING THE SECURITY, RELIABILITY, TIMELINESS, OR AVAILABILITY OF THE SERVICE</li>
        <li>WARRANTIES THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS</li>
        <li>WARRANTIES REGARDING THE ACCURACY OR COMPLETENESS OF ANY INFORMATION ON THE SERVICE</li>
      </ul>
      <p>Some jurisdictions do not allow the exclusion of implied warranties. In such jurisdictions, the above exclusions apply to the greatest extent permitted by applicable law.</p>
    `,
  },
  {
    id: 'no-emergency',
    title: '16. No Emergency Services',
    content: `
      <p><strong>CGraph is not a telecommunications service and cannot be used to contact emergency services (e.g., 911, 112, 999, or equivalent services in your jurisdiction).</strong></p>
      <p>The Service is designed for community communication and is not a replacement for your mobile phone, landline telephone, or other services that can be used to contact emergency personnel. You must ensure that you have access to a separate means of contacting emergency services.</p>
      <p>CGraph shall not be liable for any inability to contact emergency services through the Service.</p>
    `,
  },
  {
    id: 'liability',
    title: '17. Limitation of Liability',
    content: `
      <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:</p>
      <ul>
        <li>CGRAPH SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, GOODWILL, USE, OR OTHER INTANGIBLE LOSSES</li>
        <li>CGRAPH SHALL NOT BE LIABLE FOR DAMAGES ARISING FROM: (a) YOUR USE OF OR INABILITY TO USE THE SERVICE; (b) ANY UNAUTHORIZED ACCESS TO YOUR DATA; (c) CONDUCT OF ANY THIRD PARTY ON THE SERVICE; (d) USER CONTENT; OR (e) ANY INTERRUPTION OR CESSATION OF THE SERVICE</li>
      </ul>
      <p>OUR TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE GREATER OF: (a) THE AMOUNTS YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM, OR (b) ONE HUNDRED US DOLLARS ($100 USD).</p>
      <p><strong>EU/EEA/UK Consumers:</strong> This limitation does not apply where prohibited by mandatory consumer protection laws in your jurisdiction. Nothing in these Terms excludes or limits liability for death or personal injury caused by negligence, fraud, or fraudulent misrepresentation.</p>
    `,
  },
  {
    id: 'indemnification',
    title: '18. Indemnification',
    content: `
      <p>To the maximum extent permitted by applicable law, you agree to indemnify, defend, and hold harmless CGraph, its officers, directors, employees, agents, and affiliates from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable attorney's fees) arising out of or relating to:</p>
      <ul>
        <li>Your use of the Service</li>
        <li>Your User Content</li>
        <li>Your violation of these Terms</li>
        <li>Your violation of any third party's rights, including intellectual property rights and privacy</li>
        <li>Any dispute between you and another user</li>
      </ul>
      <p>CGraph reserves the right to assume the exclusive defense and control of any matter subject to indemnification, in which case you agree to cooperate with our defense.</p>
      <p><strong>EU/EEA Consumers:</strong> This indemnification clause applies only to the extent permitted by mandatory consumer protection laws in your jurisdiction.</p>
    `,
  },
  {
    id: 'export',
    title: '19. Export Controls & Sanctions',
    content: `
      <p>The Service may be subject to export control and sanctions laws of the European Union, United States, and other jurisdictions. You agree that you will not:</p>
      <ul>
        <li>Use, export, re-export, or transfer the Service in violation of applicable export control laws or regulations</li>
        <li>Use the Service if you are located in, or a national or resident of, any country subject to comprehensive sanctions by the EU, US (OFAC), or UN Security Council</li>
        <li>Use the Service if you are on any sanctioned person list, including the EU Consolidated List, US SDN List, or UN sanctions lists</li>
        <li>Use the Service for any purpose prohibited by applicable export control or sanctions laws, including development of weapons of mass destruction</li>
      </ul>
      <p>You represent and warrant that you are not located in, under the control of, or a national or resident of any sanctioned country, and are not listed on any sanctioned person list.</p>
    `,
  },
  {
    id: 'app-store',
    title: '20. App Store Terms',
    content: `
      <h4>20.1 Apple App Store</h4>
      <p>If you download or use the CGraph mobile application from the Apple App Store, the following terms apply:</p>
      <ul>
        <li>These Terms are between you and CGraph, not Apple. Apple has no obligation to provide maintenance or support for the app</li>
        <li>Apple is not responsible for addressing any claims relating to the app, including product liability, consumer protection, or intellectual property claims</li>
        <li>In the event of any third-party claim that the app infringes their intellectual property, CGraph (not Apple) is responsible for the investigation, defense, and settlement</li>
        <li>Apple and its subsidiaries are third-party beneficiaries of these Terms and may enforce them against you</li>
        <li>You must comply with any applicable third-party terms when using the app (e.g., your wireless data service agreement)</li>
      </ul>
      
      <h4>20.2 Google Play Store</h4>
      <p>If you download or use the CGraph mobile application from Google Play, your use of the app is also subject to the Google Play Terms of Service.</p>
    `,
  },
  {
    id: 'governing',
    title: '21. Governing Law & Disputes',
    content: `
      <p>These Terms shall be governed by and construed in accordance with the laws of <strong>Georgia</strong>, without regard to its conflict of law provisions.</p>
      
      <h4>21.1 Dispute Resolution</h4>
      <p>Any disputes arising from these Terms shall be resolved through:</p>
      <ol>
        <li><strong>Informal Resolution</strong> — Contact us first at <a href="mailto:legal@cgraph.org">legal@cgraph.org</a>. We will attempt to resolve any dispute within 30 days of receipt</li>
        <li><strong>Mediation</strong> — If informal resolution fails, disputes shall be submitted to mediation under the rules of an internationally recognized mediation body</li>
        <li><strong>Binding Arbitration</strong> — If mediation fails, disputes shall be resolved through binding arbitration (individual claims only). The arbitration shall be conducted in English</li>
        <li><strong>Small Claims Court</strong> — Either party may bring claims in small claims court in the jurisdiction where they reside, if the claim qualifies</li>
      </ol>
      
      <h4>21.2 Jurisdiction-Specific Provisions</h4>
      <ul>
        <li><strong>EU/EEA Users:</strong> Nothing in these Terms limits your rights under the GDPR, the Digital Services Act, or any mandatory consumer protection laws of your country of residence. You may bring claims in the courts of your country of residence. You may also use the European Commission's Online Dispute Resolution platform at <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a></li>
        <li><strong>UK Users:</strong> These Terms do not affect your statutory rights under UK consumer law. Claims may be brought in the courts of England and Wales, Scotland, or Northern Ireland</li>
        <li><strong>California Users:</strong> You retain all rights under the CCPA/CPRA. The arbitration clause does not apply to CCPA claims where prohibited by law</li>
        <li><strong>Canadian Users:</strong> These Terms are subject to PIPEDA and applicable provincial privacy legislation</li>
        <li><strong>Brazilian Users:</strong> Your rights under the LGPD and Brazilian Consumer Defense Code (CDC) are preserved</li>
      </ul>
      
      <p><strong>Class Action Waiver:</strong> To the extent permitted by applicable law, you agree to resolve disputes individually and waive the right to participate in class actions, class arbitrations, or consolidated proceedings. This waiver does not apply where prohibited by law.</p>
    `,
  },
  {
    id: 'severability',
    title: '22. Severability, Waiver & Assignment',
    content: `
      <h4>22.1 Severability</h4>
      <p>If any provision of these Terms is found to be unenforceable or invalid by a court of competent jurisdiction, that provision shall be modified to the minimum extent necessary to make it enforceable, or if modification is not possible, severed from these Terms. All remaining provisions shall continue in full force and effect.</p>
      
      <h4>22.2 No Waiver</h4>
      <p>Our failure to enforce any right or provision of these Terms shall not constitute a waiver of that right or provision. A waiver of any provision shall only be effective if made in writing and signed by CGraph.</p>
      
      <h4>22.3 Assignment</h4>
      <p>You may not assign or transfer these Terms, or any rights or obligations hereunder, without our prior written consent. CGraph may assign these Terms without restriction, including in connection with a merger, acquisition, reorganization, or sale of assets. Any attempted assignment in violation of this section shall be void.</p>
    `,
  },
  {
    id: 'survival',
    title: '23. Survival',
    content: `
      <p>The following sections shall survive termination or expiration of these Terms: User Content (Section 5), Feedback (Section 6), Intellectual Property (Section 13), Copyright & DMCA (Section 14), Disclaimers (Section 15), Limitation of Liability (Section 17), Indemnification (Section 18), Export Controls (Section 19), Governing Law & Disputes (Section 21), Severability (Section 22), this Survival clause (Section 23), Entire Agreement (Section 24), and any other provision that by its nature should survive.</p>
    `,
  },
  {
    id: 'entire-agreement',
    title: '24. Entire Agreement',
    content: `
      <p>These Terms, together with the <a href="/privacy">Privacy Policy</a>, <a href="/cookies">Cookie Policy</a>, <a href="/gdpr">GDPR Compliance</a> page, and any other policies referenced herein, constitute the entire agreement between you and CGraph regarding the Service. These Terms supersede all prior agreements, understandings, representations, and warranties, whether written or oral, regarding the Service.</p>
      <p>No additional or different terms proposed by you (including in any purchase order or other document) shall apply unless expressly agreed to in writing by CGraph.</p>
    `,
  },
  {
    id: 'changes',
    title: '25. Changes to Terms',
    content: `
      <p>We may update these Terms from time to time. When we do:</p>
      <ul>
        <li>We will update the "Last Updated" date at the top of this page</li>
        <li>Material changes will be notified at least 30 days in advance via email or prominent in-app notice</li>
        <li>Continued use of the Service after changes take effect constitutes acceptance of the updated Terms</li>
        <li>If you disagree with the changes, you must stop using the Service and may close your account before the changes take effect</li>
      </ul>
      <p>Non-material changes (e.g., formatting, corrections) may be made without advance notice.</p>
    `,
  },
  {
    id: 'contact',
    title: '26. Contact Us',
    content: `
      <p>If you have questions about these Terms, please contact us:</p>
      <ul>
        <li><strong>Company:</strong> CGraph, registered in Georgia</li>
        <li><strong>Founded:</strong> 2026</li>
        <li><strong>General inquiries:</strong> <a href="mailto:legal@cgraph.org">legal@cgraph.org</a></li>
        <li><strong>Support:</strong> <a href="mailto:support@cgraph.org">support@cgraph.org</a></li>
        <li><strong>DMCA notices:</strong> <a href="mailto:dmca@cgraph.org">dmca@cgraph.org</a></li>
        <li><strong>Security reports:</strong> <a href="mailto:security@cgraph.org">security@cgraph.org</a></li>
        <li><strong>Appeals:</strong> <a href="mailto:appeals@cgraph.org">appeals@cgraph.org</a></li>
        <li><strong>Data protection:</strong> <a href="mailto:dpo@cgraph.org">dpo@cgraph.org</a></li>
        <li><strong>Website:</strong> <a href="https://cgraph.org">cgraph.org</a></li>
      </ul>
    `,
  },
];

export default function TermsOfService() {
  return (
    <MarketingLayout
      title="Terms of Service"
      subtitle="Last updated: February 10, 2026 • Version 2.0"
      eyebrow="Service Agreement"
    >
      <section className="marketing-section marketing-section--alt">
        <div className="mx-auto max-w-4xl px-4">
          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="marketing-card"
            style={{ marginBottom: '3rem' }}
          >
            <p style={{ color: 'var(--color-gray)', fontSize: '1.125rem', lineHeight: 1.7 }}>
              Welcome to CGraph! CGraph is a company registered in Georgia, founded in 2026. These
              Terms of Service ("Terms") govern your access to and use of CGraph's mobile
              applications, websites, and services (collectively, the "Service"). By accessing or
              using the Service, you agree to be bound by these Terms. These Terms are designed to
              comply with applicable laws worldwide, including but not limited to the laws of
              Georgia, the European Union, the United States, Canada, Brazil, and other
              jurisdictions where our users are located.
            </p>
          </motion.div>

          {/* Table of Contents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="mb-4 text-xl font-semibold" style={{ color: 'var(--color-light)' }}>
              Table of Contents
            </h2>
            <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  style={{ color: 'var(--color-gray)', transition: 'color 0.2s' }}
                  className="hover:text-emerald-400"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </motion.div>

          {/* Sections */}
          {sections.map((section) => (
            <motion.section
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-12 scroll-mt-24"
            >
              <h2
                className="mb-6 font-zentry text-2xl font-bold"
                style={{ color: 'var(--color-light)' }}
              >
                {section.title}
              </h2>
              <div
                className="legal-content"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(section.content, { USE_PROFILES: { html: true } }),
                }}
              />
            </motion.section>
          ))}

          {/* Related Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="marketing-card"
          >
            <h3 className="mb-4 text-xl font-semibold" style={{ color: 'var(--color-light)' }}>
              Related Documents
            </h3>
            <div className="marketing-grid marketing-grid--3">
              <a href="/privacy" className="marketing-card" style={{ padding: '1rem' }}>
                <h4 className="font-medium" style={{ color: 'var(--color-light)' }}>
                  Privacy Policy
                </h4>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-gray)' }}>
                  How we handle your data
                </p>
              </a>
              <a href="/cookies" className="marketing-card" style={{ padding: '1rem' }}>
                <h4 className="font-medium" style={{ color: 'var(--color-light)' }}>
                  Cookie Policy
                </h4>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-gray)' }}>
                  How we use cookies
                </p>
              </a>
              <a href="/gdpr" className="marketing-card" style={{ padding: '1rem' }}>
                <h4 className="font-medium" style={{ color: 'var(--color-light)' }}>
                  GDPR Compliance
                </h4>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-gray)' }}>
                  Your data rights
                </p>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}
