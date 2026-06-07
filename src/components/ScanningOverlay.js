import React, { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';

const funnyQuotes = [
    "Teaching our AI how to read... please hold.",
    "Bribing the AI with digital cookies...",
    "Scanning the matrix for your numbers...",
    "Reticulating splines and calculating taxes...",
    "Polishing the AI's reading glasses...",
    "Extracting data at the speed of light...",
    "Translating human handwriting into machine code...",
    "Negotiating with the invoice for better prices...",
    "Waking up the hamsters that run our servers...",
    "Converting pixels into pure accounting magic..."
];

export default function ScanningOverlay() {
    const [quoteIndex, setQuoteIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setQuoteIndex(prev => (prev + 1) % funnyQuotes.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            animation: 'fadeIn 0.3s ease'
        }}>
            {/* Cool Robot/Scanner Animation */}
            <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    border: '4px solid transparent',
                    borderTopColor: '#6366f1',
                    borderBottomColor: '#a855f7',
                    borderRadius: '50%',
                    animation: 'spin 1.5s linear infinite'
                }}></div>
                <div style={{
                    position: 'absolute',
                    inset: '15px',
                    border: '4px solid transparent',
                    borderLeftColor: '#3b82f6',
                    borderRightColor: '#ec4899',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite reverse'
                }}></div>
                <Bot size={48} color="#ffffff" style={{ animation: 'pulse 2s infinite' }} />
            </div>

            <h2 style={{
                marginTop: '40px',
                fontSize: '2rem',
                fontWeight: 'bold',
                background: 'linear-gradient(to right, #60a5fa, #c084fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center'
            }}>
                AI Magic in Progress
            </h2>

            <p style={{
                marginTop: '20px',
                fontSize: '1.25rem',
                color: '#cbd5e1',
                textAlign: 'center',
                maxWidth: '600px',
                minHeight: '40px',
                transition: 'opacity 0.3s ease'
            }}>
                {funnyQuotes[quoteIndex]}
            </p>

            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes pulse { 
                    0% { transform: scale(0.95); opacity: 0.8; }
                    50% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(0.95); opacity: 0.8; }
                }
            `}</style>
        </div>
    );
}
