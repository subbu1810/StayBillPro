import React, { useState } from 'react';
import '../styles/LegalPages.css';

function Contact({ onBack }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real application, you would send this data to your backend
        console.log('Form submitted:', formData);
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setFormData({
                name: '',
                email: '',
                phone: '',
                subject: '',
                message: ''
            });
        }, 3000);
    };

    return (
        <div className="legal-page">
            <div className="legal-container">
                <button className="back-btn" onClick={onBack}>
                    ← Back to Home
                </button>

                <h1 className="legal-title">Contact Us</h1>
                <p className="legal-subtitle">We'd love to hear from you</p>

                <div className="legal-content">
                    <section>
                        <h2>Get in Touch</h2>
                        <p>
                            Have questions about ServiceHub? Need help with your account? Want to explore our enterprise solutions?
                            Our team is here to help you. Reach out to us through any of the following channels:
                        </p>
                    </section>

                    <div className="contact-grid">
                        <div className="contact-methods">
                            <section className="contact-method">
                                <h3>📧 Email Support</h3>
                                <div className="contact-detail">
                                    <p><strong>General Inquiries:</strong></p>
                                    <p><a href="mailto:info@ssquareg.com">info@ssquareg.com</a></p>
                                </div>
                                <div className="contact-detail">
                                    <p><strong>Technical Support:</strong></p>
                                    <p><a href="mailto:support@ssquareg.com">support@ssquareg.com</a></p>
                                </div>
                                <div className="contact-detail">
                                    <p><strong>Sales & Pricing:</strong></p>
                                    <p><a href="mailto:sales@ssquareg.com">sales@ssquareg.com</a></p>
                                </div>
                                <div className="contact-detail">
                                    <p><strong>Business & Partnerships:</strong></p>
                                    <p><a href="mailto:business@ssquareg.com">business@ssquareg.com</a></p>
                                </div>
                            </section>

                            <section className="contact-method">
                                <h3>🌐 Website</h3>
                                <div className="contact-detail">
                                    <p><a href="https://ssquareg.com" target="_blank" rel="noopener noreferrer">www.ssquareg.com</a></p>
                                    <p className="text-muted">Visit our main website for more information about S Square G Tech Solutions</p>
                                </div>
                            </section>

                            <section className="contact-method">
                                <h3>📞 Phone Support</h3>
                                <div className="contact-detail">
                                    <p><strong>Customer Support:</strong></p>
                                    <p><a href="tel:+919876543210">+91 98765 43210</a></p>
                                </div>
                                <div className="contact-detail">
                                    <p><strong>Sales Hotline:</strong></p>
                                    <p><a href="tel:+919876543211">+91 98765 43211</a></p>
                                </div>
                                <div className="contact-detail">
                                    <p className="text-muted">Available: Monday - Friday, 9:00 AM - 6:00 PM IST</p>
                                </div>
                            </section>

                            <section className="contact-method">
                                <h3>💬 Support Hours</h3>
                                <div className="contact-detail">
                                    <p><strong>Starter Plan:</strong></p>
                                    <p>Email support: Monday - Friday, 9:00 AM - 6:00 PM IST</p>
                                </div>
                                <div className="contact-detail">
                                    <p><strong>Professional Plan:</strong></p>
                                    <p>Priority email support: Monday - Saturday, 9:00 AM - 8:00 PM IST</p>
                                </div>
                                <div className="contact-detail">
                                    <p><strong>Enterprise Plan:</strong></p>
                                    <p>24/7 phone and email support with dedicated account manager</p>
                                </div>
                            </section>

                            <section className="contact-method">
                                <h3>📍 Office Location</h3>
                                <div className="contact-detail">
                                    <p><strong>S Square G Tech Solutions</strong></p>
                                    <p>India</p>
                                    <p className="text-muted">For specific office address details, please contact us via email</p>
                                </div>
                            </section>

                            <section className="contact-method">
                                <h3>🚀 Quick Links</h3>
                                <div className="contact-detail">
                                    <ul className="quick-links">
                                        <li><a href="#help">Help Center & FAQ</a></li>
                                        <li><a href="#documentation">Documentation</a></li>
                                        <li><a href="#pricing">View Pricing Plans</a></li>
                                        <li><a href="#updates">Product Updates</a></li>
                                    </ul>
                                </div>
                            </section>
                        </div>

                        <div className="contact-form-section">
                            <h2>Send Us a Message</h2>
                            <p>Fill out the form below and we'll get back to you as soon as possible.</p>

                            {submitted && (
                                <div className="success-message">
                                    ✅ Thank you for your message! We'll get back to you soon.
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="contact-form">
                                <div className="form-group">
                                    <label htmlFor="name">Your Name *</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">Email Address *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="your@email.com"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone">Phone Number</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="subject">Subject *</label>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        placeholder="What is this regarding?"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="message">Message *</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows="6"
                                        placeholder="Tell us more about your inquiry..."
                                    ></textarea>
                                </div>

                                <button type="submit" className="submit-button">
                                    Send Message
                                </button>
                            </form>
                        </div>
                    </div>

                    <section className="faq-section">
                        <h2>Frequently Asked Questions</h2>
                        <div className="faq-grid">
                            <div className="faq-item">
                                <h3>How quickly can I expect a response?</h3>
                                <p>
                                    We typically respond to all inquiries within 24 hours during business days.
                                    Enterprise customers with 24/7 support receive responses within 2-4 hours.
                                </p>
                            </div>
                            <div className="faq-item">
                                <h3>Do you offer phone support?</h3>
                                <p>
                                    Phone support is available for Professional and Enterprise plan subscribers.
                                    Enterprise customers receive a dedicated phone number and account manager.
                                </p>
                            </div>
                            <div className="faq-item">
                                <h3>Can I schedule a demo?</h3>
                                <p>
                                    Yes! Email us at <a href="mailto:sales@ssquareg.com">sales@ssquareg.com</a> to
                                    schedule a personalized demo of ServiceHub.
                                </p>
                            </div>
                            <div className="faq-item">
                                <h3>Is there a help center?</h3>
                                <p>
                                    Yes, we have comprehensive documentation and video tutorials available in our
                                    Help Center. Access it from your account dashboard.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="emergency-support">
                        <h2>🚨 Emergency Support</h2>
                        <p>
                            For critical issues affecting your service operations (available for Professional and Enterprise plans only):
                        </p>
                        <p><strong>Emergency Email:</strong> <a href="mailto:emergency@ssquareg.com">emergency@ssquareg.com</a></p>
                        <p className="text-muted">Please use emergency contact only for urgent production issues</p>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default Contact;
