import React from 'react';
import '../styles/LegalPages.css';

function AboutUs({ onBack }) {
    return (
        <div className="legal-page">
            <div className="legal-container">
                <button className="back-btn" onClick={onBack}>
                    ← Back to Home
                </button>

                <h1 className="legal-title">About Us</h1>
                <p className="legal-subtitle">Empowering Service Businesses with Technology</p>

                <div className="legal-content">
                    <section>
                        <h2>Who We Are</h2>
                        <p>
                            <strong>S Square G Tech Solutions</strong> is a leading technology company specializing in
                            Business Process Outsourcing (BPO) and Application/Web Development. We are dedicated to
                            building innovative solutions that drive growth and efficiency for businesses across industries.
                        </p>
                        <p>
                            With expertise in both BPO services and cutting-edge software development, we understand
                            the unique challenges faced by service-oriented businesses. ServiceHub was born from this
                            understanding – a powerful yet simple platform designed specifically for electronics service
                            centers to streamline their operations and enhance customer satisfaction.
                        </p>
                    </section>

                    <section>
                        <h2>Our Mission</h2>
                        <p>
                            To empower electronics service businesses with technology that simplifies operations,
                            enhances customer experience, and drives sustainable growth. We believe that every service
                            center, regardless of size, deserves access to professional-grade management tools.
                        </p>
                    </section>

                    <section>
                        <h2>Our Vision</h2>
                        <p>
                            To become the leading service management platform for electronics service centers globally,
                            helping thousands of businesses transform their operations and achieve excellence in customer service.
                        </p>
                    </section>

                    <section>
                        <h2>What We Do</h2>
                        <h3>ServiceHub Platform</h3>
                        <p>ServiceHub is our flagship product designed to revolutionize how electronics service businesses operate:</p>
                        <ul>
                            <li><strong>Service Request Management:</strong> Track and manage all service requests in one centralized platform</li>
                            <li><strong>Customer Database:</strong> Maintain comprehensive customer profiles and service history</li>
                            <li><strong>Appliance Tracking:</strong> Keep detailed records of all appliances under service</li>
                            <li><strong>Real-time Analytics:</strong> Make data-driven decisions with powerful dashboards and reports</li>
                            <li><strong>Mobile Access:</strong> Manage your business from anywhere, anytime</li>
                            <li><strong>Automated Workflows:</strong> Save time with intelligent automation</li>
                        </ul>

                        <h3>BPO Services</h3>
                        <p>Through S Square G Tech Solutions, we offer comprehensive BPO services including:</p>
                        <ul>
                            <li>Customer support and helpdesk services</li>
                            <li>Data management and processing</li>
                            <li>Digital marketing solutions</li>
                            <li>IT support services</li>
                        </ul>

                        <h3>App & Web Development</h3>
                        <p>Our development expertise spans:</p>
                        <ul>
                            <li>Custom web application development</li>
                            <li>Mobile app development (iOS & Android)</li>
                            <li>Cloud-based solutions</li>
                            <li>Enterprise software solutions</li>
                            <li>UI/UX design</li>
                        </ul>
                    </section>

                    <section>
                        <h2>Why Choose Us</h2>
                        <div className="feature-grid">
                            <div className="about-feature">
                                <h3>🎯 Industry Expertise</h3>
                                <p>Deep understanding of service industry needs and challenges</p>
                            </div>
                            <div className="about-feature">
                                <h3>💡 Innovation</h3>
                                <p>Cutting-edge technology with user-friendly design</p>
                            </div>
                            <div className="about-feature">
                                <h3>🔒 Security</h3>
                                <p>Enterprise-grade security to protect your business data</p>
                            </div>
                            <div className="about-feature">
                                <h3>📈 Scalability</h3>
                                <p>Solutions that grow with your business</p>
                            </div>
                            <div className="about-feature">
                                <h3>🤝 Support</h3>
                                <p>Dedicated support team committed to your success</p>
                            </div>
                            <div className="about-feature">
                                <h3>💰 Value</h3>
                                <p>Affordable pricing with transparent, no-hidden-cost structure</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2>Our Values</h2>
                        <ul>
                            <li><strong>Customer First:</strong> Your success is our success. We prioritize customer satisfaction in everything we do.</li>
                            <li><strong>Innovation:</strong> We continuously evolve our platform with the latest technologies and best practices.</li>
                            <li><strong>Integrity:</strong> We operate with transparency, honesty, and ethical business practices.</li>
                            <li><strong>Excellence:</strong> We strive for excellence in our products, services, and customer support.</li>
                            <li><strong>Collaboration:</strong> We work closely with our customers to understand and meet their unique needs.</li>
                        </ul>
                    </section>

                    <section>
                        <h2>Our Impact</h2>
                        <div className="stats-section">
                            <div className="stat-box">
                                <h3>1000+</h3>
                                <p>Service Centers Trust Us</p>
                            </div>
                            <div className="stat-box">
                                <h3>50,000+</h3>
                                <p>Appliances Managed</p>
                            </div>
                            <div className="stat-box">
                                <h3>99.9%</h3>
                                <p>Platform Uptime</p>
                            </div>
                            <div className="stat-box">
                                <h3>24/7</h3>
                                <p>Support Available</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2>Technology Stack</h2>
                        <p>
                            ServiceHub is built with modern, reliable technology to ensure performance, security, and scalability:
                        </p>
                        <ul>
                            <li>Cloud-based infrastructure for global accessibility</li>
                            <li>Responsive design for desktop and mobile devices</li>
                            <li>Real-time synchronization across devices</li>
                            <li>Automated backups and disaster recovery</li>
                            <li>Regular security updates and monitoring</li>
                        </ul>
                    </section>

                    <section>
                        <h2>Join Our Growing Community</h2>
                        <p>
                            Thousands of electronics service centers across India and beyond trust ServiceHub to manage
                            their daily operations. From small independent repair shops to large service center chains,
                            our platform adapts to businesses of all sizes.
                        </p>
                        <p>
                            Ready to transform your service business? <a href="#contact">Contact us</a> today or
                            <a href="#pricing"> view our pricing plans</a> to get started.
                        </p>
                    </section>

                    <section>
                        <h2>Parent Company</h2>
                        <div className="contact-info">
                            <p><strong>S Square G Tech Solutions</strong></p>
                            <p>A technology company specializing in BPO services and App/Web Development</p>
                            <p>Website: <a href="https://ssquareg.com" target="_blank" rel="noopener noreferrer">www.ssquareg.com</a></p>
                            <p>Email: <a href="mailto:info@ssquareg.com">info@ssquareg.com</a></p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default AboutUs;
