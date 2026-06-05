import React, { useState } from 'react';
import '../styles/LandingPage.css';

function LandingPage({ onNavigateToAuth, onNavigateToRegister, onNavigateToPrivacy, onNavigateToTerms, onNavigateToAbout, onNavigateToContact, onNavigateToTrack }) {
    const [planType, setPlanType] = useState('both');

    const getPrices = () => {
        if (planType === 'both') {
            return { starter: 800, pro: 700, enterprise: 600, origStarter: 1600, origPro: 1400, origEnterprise: 1200 };
        } else {
            return { starter: 400, pro: 350, enterprise: 300, origStarter: 800, origPro: 700, origEnterprise: 600 };
        }
    };
    
    const prices = getPrices();

    return (
        <div className="landing-page">
            {/* Header */}
            <header className="landing-header">
                <div className="header-content">
                    <div className="logo">
                        <span className="logo-icon">🔧</span>
                        <span className="logo-text">StayBillPro</span>
                    </div>
                    <nav className="nav-menu">
                        <a href="#features">Features</a>
                        <a href="#pricing">Pricing</a>
                        <a href="#about" onClick={(e) => { e.preventDefault(); onNavigateToAbout(); }}>About</a>
                        <a href="#contact" onClick={(e) => { e.preventDefault(); onNavigateToContact(); }}>Contact</a>
                    </nav>
                    <button className="login-btn" onClick={onNavigateToAuth}>
                        Log In
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-left">
                        <div className="promo-badge">
                            <span className="badge-text">Limited Time Offer - Year End Sale!</span>
                        </div>
                        <h1 className="hero-title">
                            The Ultimate <span className="highlight">All-in-One</span><br />
                            Business Management Software
                        </h1>

                        <div className="feature-highlights">
                            <div className="highlight-item">
                                <span className="check-icon">✓</span>
                                <span>POS Billing & Inventory Management</span>
                            </div>
                            <div className="highlight-item">
                                <span className="check-icon">✓</span>
                                <span>Complete Service Request Tracking</span>
                            </div>
                            <div className="highlight-item">
                                <span className="check-icon">✓</span>
                                <span>Wholesale & Multi-Branch Operations</span>
                            </div>
                            <div className="highlight-item">
                                <span className="check-icon">✓</span>
                                <span>Real-time Analytics Dashboard</span>
                            </div>
                        </div>

                        <div className="price-section">
                            <div className="price-display">
                                <span className="currency">₹</span>
                                <span className="amount">{prices.enterprise}</span>
                                <span className="period">/mo</span>
                            </div>
                            <div className="price-note">Starting from (3-Year Plan)</div>
                        </div>

                        <div className="cta-buttons">
                            <button className="primary-btn" onClick={(e) => { e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }}>
                                View Plans
                            </button>
                        </div>

                        <div className="guarantee-badge">
                            <span className="guarantee-icon">✓</span>
                            <span>30-day money-back guarantee</span>
                        </div>
                    </div>

                    <div className="hero-right">
                        <div className="hero-image-container">
                            <div className="sale-badge">
                                <div className="sale-text">SAVE</div>
                                <div className="sale-percentage">50<sup>%</sup></div>
                                <div className="sale-off">OFF</div>
                            </div>
                            <div className="trust-indicators">
                                <div className="indicator">
                                    <div className="indicator-icon">☁️</div>
                                    <div className="indicator-text">Cloud-based system</div>
                                </div>
                                <div className="indicator">
                                    <div className="indicator-icon">⚡</div>
                                    <div className="indicator-text">Easy to use</div>
                                </div>
                                <div className="indicator">
                                    <div className="indicator-icon">🔒</div>
                                    <div className="indicator-text">Secure & reliable</div>
                                </div>
                            </div>
                            <div className="countries-served">
                                <div className="countries-title">Trusted by 1000+ service centers across India</div>
                                <div className="country-flags">
                                    <span className="flag">Proudly made in SINDHANUR ❤️</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section" id="features">
                <div className="section-container">
                    <h2 className="section-title">Why Choose StayBillPro?</h2>
                    <p className="section-subtitle">Everything you need to manage your electronics service business</p>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <div className="feature-icon">📊</div>
                            </div>
                            <h3>Real-time Dashboard</h3>
                            <p>Track all service requests and appliances in one place with powerful real-time analytics and insights.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <div className="feature-icon">🏬</div>
                            </div>
                            <h3>Multi-Branch Management</h3>
                            <p>Seamlessly scale your business by managing multiple service centers and inventory from a single master dashboard.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <div className="feature-icon">📦</div>
                            </div>
                            <h3>Wholesale & POS Billing</h3>
                            <p>Integrated Point-of-Sale (POS) and wholesale inventory management with direct barcode printing capabilities.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <div className="feature-icon">🛠️</div>
                            </div>
                            <h3>Service & Repair Tracking</h3>
                            <p>End-to-end lifecycle tracking for all service requests from initial booking to successful completion.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <div className="feature-icon">👥</div>
                            </div>
                            <h3>Customer Management</h3>
                            <p>Maintain detailed customer profiles, past service histories, and preferences for personalized service.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <div className="feature-icon">📱</div>
                            </div>
                            <h3>Mobile Friendly Access</h3>
                            <p>Empower your technicians with full mobile access to track jobs, update status, and manage their schedules.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <div className="feature-icon">🔐</div>
                            </div>
                            <h3>Role-based Access</h3>
                            <p>Secure operations by assigning specific roles and permissions to managers, technicians, and cashiers.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <div className="feature-icon">🔔</div>
                            </div>
                            <h3>Smart Notifications</h3>
                            <p>Automated SMS and email updates to keep your customers constantly informed about their repair status.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <div className="feature-icon">🛡️</div>
                            </div>
                            <h3>Enterprise-Grade Security</h3>
                            <p>Your business data and customer information is protected with state-of-the-art cloud security architecture.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="pricing-section-landing" id="pricing">
                <div className="section-container">
                    <h2 className="section-title">Choose Your Plan</h2>
                    <p className="section-subtitle">Get 50% off on all plans - Limited time offer!</p>

                    <div className="pricing-toggle-wrapper">
                        <div className="pricing-toggle">
                            <button className={`toggle-btn ${planType === 'billing' ? 'active' : ''}`} onClick={() => setPlanType('billing')}>POS Billing</button>
                            <button className={`toggle-btn ${planType === 'service' ? 'active' : ''}`} onClick={() => setPlanType('service')}>Service Center</button>
                            <button className={`toggle-btn ${planType === 'both' ? 'active' : ''}`} onClick={() => setPlanType('both')}>Both Features</button>
                        </div>
                    </div>

                    <div className="pricing-plans">
                        {/* 1 Year Plan */}
                        <div className="pricing-card-landing">
                            <div className="plan-header">
                                <h3 className="plan-name">Starter</h3>
                                <p className="plan-desc">Perfect for new businesses</p>
                            </div>

                            <div className="price-section-landing">
                                <div className="original-price">₹{prices.origStarter}<span className="price-period">/mo</span></div>
                                <div className="discount-badge">50% OFF</div>
                                <div className="current-price">
                                    <span className="rupee">₹</span>
                                    <span className="amount">{prices.starter}</span>
                                    <span className="period">/month</span>
                                </div>
                                <div className="price-details">
                                    <div className="price-note">For 1-Year plan</div>
                                    <div className="gst-note">+ GST charges</div>
                                </div>
                            </div>

                            <div className="plan-features">
                                <div className="feature">
                                    <span className="feature-check">✓</span>
                                    <span>Unlimited service requests</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-check">✓</span>
                                    <span>Customer management</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-check">✓</span>
                                    <span>Basic reports & analytics</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-check">✓</span>
                                    <span>Email support</span>
                                </div>
                            </div>

                            <button className="buy-now-btn" onClick={() => onNavigateToRegister('Starter (1-Year)', planType)}>Get Started</button>
                        </div>

                        {/* 2 Year Plan - BEST DEAL */}
                        <div className="pricing-card-landing featured">
                            <div className="best-deal-badge">BEST DEAL</div>
                            <div className="plan-header">
                                <h3 className="plan-name">Professional</h3>
                                <p className="plan-desc">Ideal for growing businesses</p>
                            </div>

                            <div className="price-section-landing">
                                <div className="original-price">₹{prices.origPro}<span className="price-period">/mo</span></div>
                                <div className="discount-badge">50% OFF</div>
                                <div className="current-price">
                                    <span className="rupee">₹</span>
                                    <span className="amount">{prices.pro}</span>
                                    <span className="period">/month</span>
                                </div>
                                <div className="price-details">
                                    <div className="price-note">For 2-Year plan</div>
                                    <div className="gst-note">+ GST charges</div>
                                </div>
                            </div>

                            <div className="plan-features">
                                <div className="feature">
                                    <span className="feature-check">✓</span>
                                    <span>Everything in Starter</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-check">✓</span>
                                    <span>Advanced analytics</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-check">✓</span>
                                    <span>Priority support</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-check">✓</span>
                                    <span>Custom branding</span>
                                </div>
                            </div>

                            <button className="buy-now-btn primary" onClick={() => onNavigateToRegister('Professional (2-Year)', planType)}>Get Started</button>
                        </div>

                        {/* 3 Year Plan */}
                        <div className="pricing-card-landing">
                            <div className="plan-header">
                                <h3 className="plan-name">Enterprise</h3>
                                <p className="plan-desc">Maximum savings for long-term</p>
                            </div>

                            <div className="price-section-landing">
                                <div className="original-price">₹{prices.origEnterprise}<span className="price-period">/mo</span></div>
                                <div className="discount-badge">50% OFF</div>
                                <div className="current-price">
                                    <span className="rupee">₹</span>
                                    <span className="amount">{prices.enterprise}</span>
                                    <span className="period">/month</span>
                                </div>
                                <div className="price-details">
                                    <div className="price-note">For 3-Year plan</div>
                                    <div className="gst-note">+ GST charges</div>
                                </div>
                            </div>

                            <div className="plan-features">
                                <div className="feature">
                                    <span className="feature-check">✓</span>
                                    <span>Everything in Professional</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-check">✓</span>
                                    <span>Dedicated account manager</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-check">✓</span>
                                    <span>24/7 phone support</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-check">✓</span>
                                    <span>Free data migration</span>
                                </div>
                            </div>

                            <button className="buy-now-btn" onClick={() => onNavigateToRegister('Enterprise (3-Year)', planType)}>Get Started</button>
                        </div>
                    </div>

                    <div className="pricing-footer">
                        <p>All plans include 30-day money-back guarantee • Same price at renewal • No hidden costs</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to Transform Your Service Business?</h2>
                    <p>Join thousands of service centers already using StayBillPro</p>
                    <button className="cta-btn" onClick={onNavigateToAuth}>
                        Get Started Now
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-top">
                        <div className="footer-col">
                            <div className="footer-logo">
                                <span className="logo-icon">🔧</span>
                                <span className="logo-text">StayBillPro</span>
                            </div>
                            <p>Manage your electronics service business with ease</p>
                        </div>
                        <div className="footer-col">
                            <h4>Product</h4>
                            <a href="#features">Features</a>
                            <a href="#pricing">Pricing</a>
                            <a href="#updates">Updates</a>
                        </div>
                        <div className="footer-col">
                            <h4>Company</h4>
                            <a href="#about" onClick={(e) => { e.preventDefault(); onNavigateToAbout(); }}>About Us</a>
                            <a href="#careers">Careers</a>
                            <a href="#contact" onClick={(e) => { e.preventDefault(); onNavigateToContact(); }}>Contact</a>
                        </div>
                        <div className="footer-col">
                            <h4>Support</h4>
                            <a href="#help">Help Center</a>
                            <a href="#docs">Documentation</a>
                            <a href="#api">API</a>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; {new Date().getFullYear()} StayBillPro by <a href="https://ssquareg.com" target="_blank" rel="noopener noreferrer" style={{ color: '#20b2aa' }}>S Square G Tech Solutions</a>. All rights reserved.</p>
                        <div className="footer-links">
                            <a href="#privacy" onClick={(e) => { e.preventDefault(); onNavigateToPrivacy(); }}>Privacy Policy</a>
                            <a href="#terms" onClick={(e) => { e.preventDefault(); onNavigateToTerms(); }}>Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
