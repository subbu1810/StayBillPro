import React, { useState } from 'react';
import '../styles/Contact.css';

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
        console.log('Form submitted:', formData);
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        }, 3000);
    };

    return (
        <div className="contact-fullscreen-page">
            <div className="contact-left-pane">
                <button className="back-to-home-float" onClick={onBack}>
                    ← Back to Home
                </button>

                <h1>Let's Connect</h1>
                <p className="lead">
                    Have questions about StayBillPro? Need help with your account? Want to explore our enterprise solutions?
                    Our team is here to help you.
                </p>

                <div className="contact-info-cards">
                    <div className="info-card-item">
                        <div className="info-icon">📧</div>
                        <div className="info-details">
                            <h3>Email Support</h3>
                            <p>Support: <a href="mailto:support@ssquareg.com" style={{ color: 'white', textDecoration: 'underline' }}>support@ssquareg.com</a></p>
                            <p>Sales: <a href="mailto:sales@ssquareg.com" style={{ color: 'white', textDecoration: 'underline' }}>sales@ssquareg.com</a></p>
                        </div>
                    </div>

                    <div className="info-card-item">
                        <div className="info-icon">📞</div>
                        <div className="info-details">
                            <h3>Phone Support</h3>
                            <p>Customer Support: +91 76768 14367 & +91 99801 90691</p>
                            <p>Sales Hotline: +91 70224 77479</p>
                            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '5px' }}>Mon - Fri, 9:00 AM - 6:00 PM IST</p>
                        </div>
                    </div>

                    <div className="info-card-item">
                        <div className="info-icon">🏢</div>
                        <div className="info-details">
                            <h3>Office Location</h3>
                            <p>S Square G Tech Solutions</p>
                            <p> Near Anikethana Degree College,
                                Adarsh colony, Sindhanur,Raichur,Karnataka 584128</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="contact-right-pane">
                <div className="form-wrapper">
                    <h2>Send Us a Message</h2>
                    <p className="sub-text">Fill out the form below and we'll get back to you as soon as possible.</p>

                    {submitted && (
                        <div style={{ background: '#d4edda', color: '#155724', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
                            ✅ Thank you for your message! We'll get back to you soon.
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="fullscreen-form">
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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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
                                    placeholder="Brief reason"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">Message *</label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                placeholder="Tell us more about your inquiry..."
                            ></textarea>
                        </div>

                        <button type="submit" className="btn-submit-full">
                            Send Message
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Contact;
