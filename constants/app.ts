import Constants from 'expo-constants';

export const SUPPORT_EMAIL = 'parasmahzn@gmail.com';
export const APP_DEVELOPER = 'Paras Maharjan';
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

type LegalSection = { heading: string; body: string };

export const PRIVACY_POLICY_SECTIONS: LegalSection[] = [
  { heading: '1. Overview', body: 'Khu₹truke is a local-first expense tracking application. All data you enter stays on your device. We do not operate servers, collect analytics, or transmit any personal or financial information over the internet.' },
  { heading: '2. Data We Collect', body: "We do not collect any data. Your expenses, budget, profile name, and preferences are stored exclusively in your device's local storage (AsyncStorage and the device's secure store). None of this data leaves your device." },
  { heading: '3. Third-Party Services', body: 'Khu₹truke does not use any third-party analytics, advertising SDKs, or tracking libraries. No data is shared with any third party.' },
  { heading: '4. Camera & Photo Library', body: 'If you choose to attach a profile photo, the app requests access to your camera or photo library solely to let you pick or capture an image. The image URI is stored locally on your device and is never uploaded anywhere.' },
  { heading: '5. Data Retention & Deletion', body: 'You are in full control of your data. You can delete all app data at any time by tapping "Log out" on this screen. This permanently removes all expenses, budget settings, and profile information from the device.' },
  { heading: "6. Children's Privacy", body: 'This app is not directed at children under 13. We do not knowingly collect information from children.' },
  { heading: '7. Changes to This Policy', body: 'We may update this Privacy Policy occasionally. The "Last updated" date at the top reflects the most recent revision.' },
  { heading: '8. Contact', body: `If you have questions about this Privacy Policy, contact us at: ${SUPPORT_EMAIL}` },
];

export const TERMS_SECTIONS: LegalSection[] = [
  { heading: '1. Acceptance of Terms', body: 'By downloading or using Khu₹truke, you agree to be bound by these Terms of Use. If you do not agree, please do not use the app.' },
  { heading: '2. Use of the App', body: 'Khu₹truke is provided for personal, non-commercial expense tracking. You agree to use it only for lawful purposes and in a manner that does not infringe the rights of others.' },
  { heading: '3. Your Data', body: "All expense records, budgets, and settings you create are stored locally on your device. You are solely responsible for the accuracy of the data you enter. We do not have access to your data and cannot recover it if your device is lost or reset." },
  { heading: '4. No Financial Advice', body: 'Khu₹truke is a personal budgeting tool and does not provide financial, tax, or investment advice. Consult a qualified professional for advice specific to your financial situation.' },
  { heading: '5. Disclaimer of Warranties', body: 'The app is provided "as is" without warranty of any kind. We do not guarantee that the app will be error-free, uninterrupted, or free of viruses or other harmful components.' },
  { heading: '6. Limitation of Liability', body: 'To the fullest extent permitted by applicable law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the app.' },
  { heading: '7. Intellectual Property', body: 'All content, design, graphics, and code in Khu₹truke are the intellectual property of the developer. You may not copy, modify, or distribute any part of the app without prior written permission.' },
  { heading: '8. Changes to Terms', body: 'We reserve the right to modify these Terms of Use at any time. Continued use of the app after changes constitutes acceptance of the revised terms.' },
  { heading: '9. Governing Law', body: 'These Terms shall be governed by and construed in accordance with applicable laws. Any disputes shall be resolved in the courts of the applicable jurisdiction.' },
  { heading: '10. Contact', body: `If you have questions about these Terms, contact us at: ${SUPPORT_EMAIL}` },
];
