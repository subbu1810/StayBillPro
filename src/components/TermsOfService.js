import React from 'react';
import '../styles/LegalPages.css';

function TermsOfService({ onBack }) {
    return (
        <div className="legal-page">
            <div className="legal-container">
                <button className="back-btn" onClick={onBack}>
                    ← Back to Home
                </button>

                <h1 className="legal-title">Terms of Service</h1>
                <p className="legal-subtitle">Last updated: December 6, 2024</p>

                <div className="legal-content">
                    <section>
                        <h2>1. Agreement to Terms</h2>
                        <p>
                            By accessing and using ServiceHub, provided by S Square G Tech Solutions ("Company," "we," "our," or "us"),
                            you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms,
                            please do not use our service.
                        </p>
                    </section>

                    <section>
                        <h2>2. Description of Service</h2>
                        <p>
                            ServiceHub is a cloud-based service management application designed for electronics service businesses.
                            Our platform enables you to:
                        </p>
                        <ul>
                            <li>Manage service requests and customer information</li>
                            <li>Track appliance details and service history</li>
                            <li>Generate reports and analytics</li>
                            <li>Communicate with customers</li>
                            <li>Access real-time dashboard and insights</li>
                        </ul>
                    </section>

                    <section>
                        <h2>3. Account Registration and Security</h2>
                        <h3>3.1 Registration</h3>
                        <p>To use ServiceHub, you must:</p>
                        <ul>
                            <li>Be at least 18 years of age</li>
                            <li>Provide accurate and complete registration information</li>
                            <li>Maintain and update your information as needed</li>
                            <li>Have the authority to bind your business to these Terms </li>
                        </ul>

                        <h3>3.2 Account Security</h3>
                        <p>You are responsible for:</p>
                        <ul>
                            <li>Maintaining the confidentiality of your account credentials</li>
                            <li>All activities that occur under your account</li>
                            <li>Notifying us immediately of any unauthorized access</li>
                            <li>Ensuring your password meets security requirements</li>
                        </ul>
                    </section>

                    <section>
                        <h2>4. Subscription and Payment</h2>
                        <h3>4.1 Subscription Plans</h3>
                        <p>
                            We offer various subscription plans (Starter, Professional, Enterprise) with different features
                            and pricing. You can view current plans and pricing on our website.
                        </p>

                        <h3>4.2 Payment Terms</h3>
                        <ul>
                            <li>Subscriptions are billed in advance on a monthly or annual basis</li>
                            <li>All fees are exclusive of applicable taxes (GST, etc.)</li>
                            <li>Payment will be charged to your chosen payment method</li>
                            <li>We reserve the right to change our pricing with 30 days notice</li>
                        </ul>

                        <h3>4.3 Refund Policy</h3>
                        <p>
                            We offer a 30-day money-back guarantee for new subscriptions. Refund requests must be submitted
                            within 30 days of the initial purchase. Renewals are non-refundable.
                        </p>

                        <h3>4.4 Cancellation</h3>
                        <p>
                            You may cancel your subscription at any time. Cancellation will be effective at the end of the
                            current billing period. No partial refunds will be provided for unused time.
                        </p>
                    </section>

                    <section>
                        <h2>5. Acceptable Use Policy</h2>
                        <p>You agree NOT to:</p>
                        <ul>
                            <li>Violate any applicable laws or regulations</li>
                            <li>Infringe on intellectual property rights</li>
                            <li>Upload malicious code or viruses</li>
                            <li>Attempt to gain unauthorized access to our systems</li>
                            <li>Use the service for illegal or fraudulent purposes</li>
                            <li>Reverse engineer or attempt to extract source code</li>
                            <li>Resell or redistribute the service without permission</li>
                            <li>Use automated systems to access the service excessively</li>
                        </ul>
                    </section>

                    <section>
                        <h2>6. Data Ownership and Usage</h2>
                        <h3>6.1 Your Data</h3>
                        <p>
                            You retain all ownership rights to the data you input into ServiceHub. We do not claim
                            ownership of your customer data, service records, or other business information.
                        </p>

                        <h3>6.2 License to Use</h3>
                        <p>
                            By using ServiceHub, you grant us a limited license to host, store, and process your data
                            solely for the purpose of providing the service to you.
                        </p>

                        <h3>6.3 Data Backup</h3>
                        <p>
                            While we perform regular backups, you are responsible for maintaining your own backup
                            copies of important data.
                        </p>
                    </section>

                    <section>
                        <h2>7. Intellectual Property Rights</h2>
                        <p>
                            ServiceHub, including all software, designs, text, graphics, and other content, is owned by
                            S Square G Tech Solutions and is protected by copyright, trademark, and other intellectual
                            property laws. You may not copy, modify, or create derivative works without our written permission.
                        </p>
                    </section>

                    <section>
                        <h2>8. Service Availability and Support</h2>
                        <h3>8.1 Uptime</h3>
                        <p>
                            We strive to maintain 99.9% uptime but do not guarantee uninterrupted service.
                            Scheduled maintenance will be communicated in advance when possible.
                        </p>

                        <h3>8.2 Support</h3>
                        <p>Support availability varies by subscription plan:</p>
                        <ul>
                            <li><strong>Starter:</strong> Email support during business hours</li>
                            <li><strong>Professional:</strong> Priority email support</li>
                            <li><strong>Enterprise:</strong> 24/7 phone and email support with dedicated account manager</li>
                        </ul>
                    </section>

                    <section>
                        <h2>9. Limitation of Liability</h2>
                        <p>
                            TO THE MAXIMUM EXTENT PERMITTED BY LAW, S SQUARE G TECH SOLUTIONS SHALL NOT BE LIABLE FOR:
                        </p>
                        <ul>
                            <li>Indirect, incidental, or consequential damages</li>
                            <li>Loss of profits, data, or business opportunities</li>
                            <li>Damages resulting from unauthorized access to your data</li>
                            <li>Damages exceeding the fees paid by you in the past 12 months</li>
                        </ul>
                    </section>

                    <section>
                        <h2>10. Indemnification</h2>
                        <p>
                            You agree to indemnify and hold harmless S Square G Tech Solutions from any claims, damages,
                            or expenses arising from your use of the service, violation of these Terms, or infringement
                            of any third-party rights.
                        </p>
                    </section>

                    <section>
                        <h2>11. Termination</h2>
                        <p>We may terminate or suspend your account if you:</p>
                        <ul>
                            <li>Violate these Terms of Service</li>
                            <li>Fail to pay applicable fees</li>
                            <li>Engage in fraudulent or illegal activities</li>
                            <li>Pose a security risk to our systems or other users</li>
                        </ul>
                        <p>
                            Upon termination, your right to use the service will cease immediately.
                            You may export your data within 30 days of termination.
                        </p>
                    </section>

                    <section>
                        <h2>12. Modifications to Service and Terms</h2>
                        <p>
                            We reserve the right to modify or discontinue the service at any time. We may also update
                            these Terms by posting the revised version. Continued use of the service after changes
                            constitutes acceptance of the new Terms.
                        </p>
                    </section>

                    <section>
                        <h2>13. Governing Law and Disputes</h2>
                        <p>
                            These Terms are governed by the laws of India. Any disputes arising from these Terms
                            or your use of the service shall be resolved through arbitration in accordance with
                            Indian Arbitration laws.
                        </p>
                    </section>

                    <section>
                        <h2>14. Contact Information</h2>
                        <p>For questions about these Terms of Service, please contact us:</p>
                        <div className="contact-info">
                            <p><strong>S Square G Tech Solutions</strong></p>
                            <p>Email: <a href="mailto:legal@ssquareg.com">legal@ssquareg.com</a></p>
                            <p>Website: <a href="https://ssquareg.com" target="_blank" rel="noopener noreferrer">ssquareg.com</a></p>
                        </div>
                    </section>

                    <section>
                        <h2>15. Entire Agreement</h2>
                        <p>
                            These Terms, together with our Privacy Policy, constitute the entire agreement between
                            you and S Square G Tech Solutions regarding the use of ServiceHub.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default TermsOfService;
