import React from 'react';
import '../styles/LegalPages.css';

function PrivacyPolicy({ onBack }) {
    return (
        <div className="legal-page">
            <div className="legal-container">
                <button className="back-btn" onClick={onBack}>
                    ← Back to Home
                </button>

                <h1 className="legal-title">Privacy Policy</h1>
                <p className="legal-subtitle">Last updated: December 6, 2024</p>

                <div className="legal-content">
                    <section>
                        <h2>1. Introduction</h2>
                        <p>
                            Welcome to ServiceHub, provided by S Square G Tech Solutions ("we," "our," or "us").
                            We are committed to protecting your personal information and your right to privacy.
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your information
                            when you use our service management application.
                        </p>
                    </section>

                    <section>
                        <h2>2. Information We Collect</h2>
                        <h3>2.1 Personal Information</h3>
                        <p>We collect personal information that you voluntarily provide to us when you:</p>
                        <ul>
                            <li>Register for an account</li>
                            <li>Use our service management features</li>
                            <li>Contact our support team</li>
                            <li>Subscribe to our newsletter</li>
                        </ul>
                        <p>This information may include:</p>
                        <ul>
                            <li>Business name and contact information</li>
                            <li>Name and email address</li>
                            <li>Phone number</li>
                            <li>Business registration details</li>
                            <li>Payment information (processed securely through third-party payment processors)</li>
                        </ul>

                        <h3>2.2 Customer and Service Data</h3>
                        <p>As you use ServiceHub to manage your electronics service business, we collect:</p>
                        <ul>
                            <li>Customer information you input</li>
                            <li>Service request details</li>
                            <li>Appliance information</li>
                            <li>Service history and notes</li>
                        </ul>

                        <h3>2.3 Automatically Collected Information</h3>
                        <p>When you access our application, we automatically collect:</p>
                        <ul>
                            <li>Device information (browser type, operating system)</li>
                            <li>IP address and location data</li>
                            <li>Usage data and analytics</li>
                            <li>Cookies and similar tracking technologies</li>
                        </ul>
                    </section>

                    <section>
                        <h2>3. How We Use Your Information</h2>
                        <p>We use the collected information for:</p>
                        <ul>
                            <li><strong>Service Provision:</strong> To provide, maintain, and improve ServiceHub</li>
                            <li><strong>Account Management:</strong> To manage your account and subscription</li>
                            <li><strong>Communication:</strong> To send you service updates, technical notices, and support messages</li>
                            <li><strong>Analytics:</strong> To understand how our service is used and improve user experience</li>
                            <li><strong>Security:</strong> To protect against fraud and unauthorized access</li>
                            <li><strong>Compliance:</strong> To comply with legal obligations</li>
                        </ul>
                    </section>

                    <section>
                        <h2>4. Data Sharing and Disclosure</h2>
                        <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
                        <ul>
                            <li><strong>Service Providers:</strong> With trusted third-party service providers who help us operate our service</li>
                            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                            <li><strong>Business Transfers:</strong> In connection with any merger, sale, or acquisition</li>
                            <li><strong>With Your Consent:</strong> When you give us explicit permission</li>
                        </ul>
                    </section>

                    <section>
                        <h2>5. Data Security</h2>
                        <p>
                            We implement appropriate technical and organizational security measures to protect your
                            personal information. However, no method of transmission over the internet is 100% secure.
                            We use:
                        </p>
                        <ul>
                            <li>SSL/TLS encryption for data transmission</li>
                            <li>Regular security audits and updates</li>
                            <li>Access controls and authentication</li>
                            <li>Secure backup and disaster recovery procedures</li>
                        </ul>
                    </section>

                    <section>
                        <h2>6. Data Retention</h2>
                        <p>
                            We retain your personal information only for as long as necessary to provide our services
                            and comply with legal obligations. Service data is retained as long as your account is active
                            or as needed to provide you services.
                        </p>
                    </section>

                    <section>
                        <h2>7. Your Rights</h2>
                        <p>You have the right to:</p>
                        <ul>
                            <li><strong>Access:</strong> Request access to your personal information</li>
                            <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                            <li><strong>Export:</strong> Request a copy of your data in a portable format</li>
                            <li><strong>Opt-out:</strong> Opt-out of marketing communications</li>
                        </ul>
                    </section>

                    <section>
                        <h2>8. Cookies and Tracking</h2>
                        <p>
                            We use cookies and similar tracking technologies to enhance your experience.
                            You can control cookies through your browser settings. Types of cookies we use:
                        </p>
                        <ul>
                            <li><strong>Essential Cookies:</strong> Required for the service to function</li>
                            <li><strong>Analytics Cookies:</strong> Help us understand how you use our service</li>
                            <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                        </ul>
                    </section>

                    <section>
                        <h2>9. Children's Privacy</h2>
                        <p>
                            ServiceHub is not intended for use by children under 18 years of age.
                            We do not knowingly collect personal information from children.
                        </p>
                    </section>

                    <section>
                        <h2>10. International Data Transfers</h2>
                        <p>
                            Your information may be transferred to and processed in countries other than your own.
                            We ensure appropriate safeguards are in place for such transfers.
                        </p>
                    </section>

                    <section>
                        <h2>11. Changes to This Privacy Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of any changes
                            by posting the new Privacy Policy on this page and updating the "Last updated" date.
                        </p>
                    </section>

                    <section>
                        <h2>12. Contact Us</h2>
                        <p>If you have questions about this Privacy Policy, please contact us:</p>
                        <div className="contact-info">
                            <p><strong>S Square G Tech Solutions</strong></p>
                            <p>Email: <a href="mailto:support@ssquareg.com">support@ssquareg.com</a></p>
                            <p>Website: <a href="https://ssquareg.com" target="_blank" rel="noopener noreferrer">ssquareg.com</a></p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default PrivacyPolicy;
