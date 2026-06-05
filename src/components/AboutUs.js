import React from 'react';
import '../styles/AboutUs.css';

function AboutUs({ onBack }) {
    return (
        <div className="about-page">
            <button className="about-back-btn" onClick={onBack}>
                ← Back to Home
            </button>

            {/* Hero Section */}
            <section className="about-hero">
                <h1>About Us</h1>
                <p className="subtitle">
                    Empowering Service Businesses with Technology
                </p>
            </section>

            <div className="about-container">
                {/* Introduction & Mission (Split Layout) */}
                <section className="about-section">
                    <div className="about-split">
                        <div className="about-split-content">
                            <h2>Who We Are</h2>
                            <p>
                                <strong>S Square G Tech Solutions</strong> is a leading technology company specializing in
                                Business Process Outsourcing (BPO) and Application/Web Development. We are dedicated to
                                building innovative solutions that drive growth and efficiency for businesses across industries.
                            </p>
                            <p>
                                With expertise in both BPO services and cutting-edge software development, we understand
                                the unique challenges faced by service-oriented businesses. StayBillPro was born from this
                                understanding – a powerful yet simple platform designed specifically for electronics service
                                centers to streamline their operations and enhance customer satisfaction.
                            </p>
                        </div>
                        <div className="about-split-content">
                            <h2>Our Mission</h2>
                            <p>
                                To empower electronics service businesses with technology that simplifies operations,
                                enhances customer experience, and drives sustainable growth. We believe that every service
                                center, regardless of size, deserves access to professional-grade management tools.
                            </p>
                            <br/>
                            <h2>Our Vision</h2>
                            <p>
                                To become the leading service management platform for electronics service centers globally,
                                helping thousands of businesses transform their operations and achieve excellence in customer service.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="about-section" style={{border: 'none', padding: '2rem 0'}}>
                    <div className="about-stats">
                        <div className="about-stat-card">
                            <h3>1000+</h3>
                            <p>Service Centers Trust Us</p>
                        </div>
                        <div className="about-stat-card">
                            <h3>50k+</h3>
                            <p>Appliances Managed</p>
                        </div>
                        <div className="about-stat-card">
                            <h3>99.9%</h3>
                            <p>Platform Uptime</p>
                        </div>
                        <div className="about-stat-card">
                            <h3>24/7</h3>
                            <p>Support Available</p>
                        </div>
                    </div>
                </section>

                {/* Why Choose Us */}
                <section className="about-section">
                    <h2 style={{textAlign: 'center', width: '100%'}}>Why Choose Us</h2>
                    <div className="about-grid">
                        <div className="about-card">
                            <div className="about-card-icon">🎯</div>
                            <h3>Industry Expertise</h3>
                            <p>Deep understanding of service industry needs and challenges, allowing us to build solutions that actually work for you.</p>
                        </div>
                        <div className="about-card">
                            <div className="about-card-icon">💡</div>
                            <h3>Innovation</h3>
                            <p>Cutting-edge technology combined with intuitive, user-friendly design that your team will love using every day.</p>
                        </div>
                        <div className="about-card">
                            <div className="about-card-icon">🔒</div>
                            <h3>Security</h3>
                            <p>Enterprise-grade cloud security protocols to protect your business data and customer information at all times.</p>
                        </div>
                        <div className="about-card">
                            <div className="about-card-icon">📈</div>
                            <h3>Scalability</h3>
                            <p>Whether you have one branch or fifty, our solutions are built to scale seamlessly as your business grows.</p>
                        </div>
                        <div className="about-card">
                            <div className="about-card-icon">🤝</div>
                            <h3>Dedicated Support</h3>
                            <p>Our expert support team is always on standby and fully committed to your operational success.</p>
                        </div>
                        <div className="about-card">
                            <div className="about-card-icon">💰</div>
                            <h3>Incredible Value</h3>
                            <p>Highly affordable and transparent pricing with absolutely no hidden costs or surprise fees.</p>
                        </div>
                    </div>
                </section>

                {/* What We Do */}
                <section className="about-section">
                    <h2>What We Do</h2>
                    <div className="services-container">
                        <div className="service-block">
                            <h3>StayBillPro Platform</h3>
                            <p>StayBillPro is our flagship product designed to revolutionize how electronics service businesses operate.</p>
                            <ul className="service-list">
                                <li>Service Request Management</li>
                                <li>Wholesale & POS Billing</li>
                                <li>Appliance Tracking</li>
                                <li>Real-time Analytics</li>
                                <li>Mobile Technician Access</li>
                                <li>Automated Notifications</li>
                            </ul>
                        </div>
                        <div className="service-block">
                            <h3>BPO Services</h3>
                            <p>Through S Square G Tech Solutions, we offer comprehensive Business Process Outsourcing.</p>
                            <ul className="service-list">
                                <li>Customer Support & Helpdesk</li>
                                <li>Data Management</li>
                                <li>Digital Marketing</li>
                                <li>IT Support Services</li>
                            </ul>
                        </div>
                        <div className="service-block">
                            <h3>App & Web Development</h3>
                            <p>We build tailored digital experiences for modern enterprises.</p>
                            <ul className="service-list">
                                <li>Custom Web Applications</li>
                                <li>iOS & Android Apps</li>
                                <li>Cloud-based Architecture</li>
                                <li>UI/UX Design</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Parent Company */}
                <section className="about-section" style={{border: 'none'}}>
                    <div className="parent-company-card">
                        <h3>Parent Company</h3>
                        <p><strong>S Square G Tech Solutions</strong><br/>A technology company specializing in BPO services and App/Web Development.</p>
                        <div className="parent-links">
                            <a href="https://ssquareg.com" target="_blank" rel="noopener noreferrer">
                                🌐 www.ssquareg.com
                            </a>
                            <a href="mailto:info@ssquareg.com">
                                ✉️ info@ssquareg.com
                            </a>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default AboutUs;
