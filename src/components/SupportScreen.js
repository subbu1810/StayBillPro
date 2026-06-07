import React from 'react';
import '../styles/Contact.css'; // Reusing some basic styling if appropriate

export default function SupportScreen() {
    return (
        <div className="admin-screen support-screen" style={{ backgroundColor: '#f8fafc', minHeight: '100%', position: 'relative', padding: 0 }}>
            {/* Hero Banner */}
            <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '60px 40px 100px 40px', color: 'white', borderBottomLeftRadius: '30px', borderBottomRightRadius: '30px' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>How can we help?</h1>
                    <p style={{ fontSize: '1.15rem', margin: 0, opacity: 0.8, fontWeight: '400' }}>Our team is standing by to support your business operations.</p>
                </div>
            </div>

            {/* Overlapping Content */}
            <div style={{ maxWidth: '1000px', margin: '-60px auto 0 auto', padding: '0 20px 40px 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
                    
                    {/* Phone Card */}
                    <div style={{ background: 'white', padding: '40px 30px', borderRadius: '20px', boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.1)', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ width: '72px', height: '72px', background: '#fff7ed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', margin: '0 auto 24px auto', color: '#ea580c' }}>
                            📞
                        </div>
                        <h2 style={{ fontSize: '1.4rem', color: '#0f172a', marginBottom: '12px', fontWeight: '700' }}>Call Us Directly</h2>
                        <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '1rem', lineHeight: '1.5' }}>Speak with our technical experts for immediate assistance and troubleshooting.</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: 'auto' }}>
                            <a href="tel:+917676814367" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px', color: '#334155', fontWeight: '600', textDecoration: 'none', border: '1px solid #e2e8f0', fontSize: '1.1rem', transition: 'border-color 0.2s, background 0.2s' }} onMouseOver={(e) => {e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f1f5f9'}} onMouseOut={(e) => {e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'}}>+91 76768 14367</a>
                            <a href="tel:+919980190691" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px', color: '#334155', fontWeight: '600', textDecoration: 'none', border: '1px solid #e2e8f0', fontSize: '1.1rem', transition: 'border-color 0.2s, background 0.2s' }} onMouseOver={(e) => {e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f1f5f9'}} onMouseOut={(e) => {e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'}}>+91 99801 90691</a>
                            <a href="tel:+917022477479" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px', color: '#334155', fontWeight: '600', textDecoration: 'none', border: '1px solid #e2e8f0', fontSize: '1.1rem', transition: 'border-color 0.2s, background 0.2s' }} onMouseOver={(e) => {e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f1f5f9'}} onMouseOut={(e) => {e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'}}>+91 70224 77479</a>
                        </div>
                    </div>

                    {/* Digital Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* WhatsApp */}
                        <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.1)', display: 'flex', alignItems: 'center', gap: '24px', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
                            <div style={{ width: '64px', height: '64px', background: '#dcfce7', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>
                                💬
                            </div>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontSize: '1.2rem', color: '#0f172a', margin: '0 0 4px 0', fontWeight: '700' }}>WhatsApp Support</h2>
                                <p style={{ color: '#64748b', margin: '0 0 16px 0', fontSize: '0.95rem' }}>Fastest text assistance</p>
                                <a href="https://wa.me/917022477479" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '10px 24px', background: '#22c55e', color: 'white', borderRadius: '8px', fontWeight: '600', textDecoration: 'none', fontSize: '0.95rem', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#16a34a'} onMouseOut={(e) => e.currentTarget.style.background = '#22c55e'}>
                                    Message Us
                                </a>
                            </div>
                        </div>

                        {/* Email */}
                        <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.1)', display: 'flex', alignItems: 'center', gap: '24px', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
                            <div style={{ width: '64px', height: '64px', background: '#eff6ff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>
                                ✉️
                            </div>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontSize: '1.2rem', color: '#0f172a', margin: '0 0 4px 0', fontWeight: '700' }}>Email Us</h2>
                                <p style={{ color: '#64748b', margin: '0 0 10px 0', fontSize: '0.95rem' }}>For detailed inquiries</p>
                                <a href="mailto:info@ssquareg.com" style={{ color: '#3b82f6', fontWeight: '600', textDecoration: 'none', fontSize: '1.05rem', display: 'inline-block', wordBreak: 'break-all' }}>
                                    info@ssquareg.com
                                </a>
                            </div>
                        </div>

                        {/* Website */}
                        <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.1)', display: 'flex', alignItems: 'center', gap: '24px', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
                            <div style={{ width: '64px', height: '64px', background: '#fef3c7', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>
                                🌐
                            </div>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontSize: '1.2rem', color: '#0f172a', margin: '0 0 4px 0', fontWeight: '700' }}>Visit Website</h2>
                                <p style={{ color: '#64748b', margin: '0 0 10px 0', fontSize: '0.95rem' }}>Learn about our company</p>
                                <a href="https://ssquareg.com" target="_blank" rel="noopener noreferrer" style={{ color: '#d97706', fontWeight: '600', textDecoration: 'none', fontSize: '1.05rem' }}>
                                    ssquareg.com <span style={{ fontSize: '0.8em', marginLeft: '4px' }}>↗</span>
                                </a>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
