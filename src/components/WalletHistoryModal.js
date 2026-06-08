import React, { useState, useEffect } from 'react';
import { walletAPI } from '../services/api';
import { usePopup } from './ui/PopupProvider';
import { X, Clock, Receipt, CreditCard, RefreshCw, ChevronRight } from 'lucide-react';

export default function WalletHistoryModal({ onClose }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const popup = usePopup();

    useEffect(() => {
        fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchHistory = async () => {
        try {
            const data = await walletAPI.getHistory();
            if (data.success) {
                setTransactions(data.transactions);
            } else {
                popup.showError(data.message || 'Failed to fetch wallet history');
            }
        } catch (error) {
            console.error('Wallet History Error:', error);
            popup.showError('Could not fetch wallet history');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-IN', { 
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true 
        });
    };

    const getTransactionIcon = (type) => {
        switch(type) {
            case 'recharge': return <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}><CreditCard size={20} /></div>;
            case 'deduction': return <div style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', color: '#fff', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(244, 63, 94, 0.2)' }}><Receipt size={20} /></div>;
            case 'auto_recharge': return <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)' }}><RefreshCw size={20} /></div>;
            default: return <div style={{ background: '#94a3b8', color: '#fff', padding: '10px', borderRadius: '12px' }}><Clock size={20} /></div>;
        }
    };

    const totalScans = transactions.filter(t => t.type === 'deduction').length;

    return (
        <div className="crm-modal-overlay" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
            <div className="crm-modal" style={{ width: '650px', maxWidth: '95%', padding: 0, overflow: 'hidden', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                
                {/* Header Section */}
                <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', padding: '24px', color: '#fff', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Clock size={24} color="#a5b4fc" />
                                Transaction Ledger
                            </h2>
                            <p style={{ margin: '8px 0 0 0', color: '#e0e7ff', fontSize: '0.9rem' }}>Detailed history of your wallet activity and AI scans</p>
                        </div>
                        <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#fff', borderRadius: '50%', padding: '6px', display: 'flex', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Stats Card Overlay */}
                    <div style={{ display: 'flex', gap: '15px', marginTop: '24px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', flex: 1 }}>
                            <p style={{ margin: 0, color: '#e0e7ff', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Scans</p>
                            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>{loading ? '...' : totalScans}</h3>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', flex: 1 }}>
                            <p style={{ margin: 0, color: '#e0e7ff', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Transactions</p>
                            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>{loading ? '...' : transactions.length}</h3>
                        </div>
                    </div>
                </div>
                
                {/* Body Section */}
                <div style={{ maxHeight: '450px', overflowY: 'auto', padding: '24px', background: '#f8fafc' }}>
                    {loading ? (
                        <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
                            <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px auto' }}></div>
                            Loading history...
                        </div>
                    ) : transactions.length === 0 ? (
                        <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
                            <Receipt size={48} color="#cbd5e1" style={{ margin: '0 auto 15px auto', display: 'block' }} />
                            <p style={{ margin: 0, fontSize: '1.1rem', color: '#475569', fontWeight: '500' }}>No transactions yet</p>
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem' }}>Your wallet activity will appear here.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {transactions.map((tx) => (
                                <div key={tx.id} style={{ 
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                    padding: '16px', background: '#ffffff', borderRadius: '12px', 
                                    border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                                    transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)'; }}>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        {getTransactionIcon(tx.type)}
                                        <div>
                                            <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#0f172a', fontSize: '1rem' }}>{tx.description}</p>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {formatDate(tx.created_at)} 
                                                {tx.reference_id && <><ChevronRight size={12} /> Ref: {tx.reference_id}</>}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ 
                                            margin: 0, fontSize: '1.15rem', fontWeight: 'bold',
                                            color: tx.type === 'deduction' ? '#e11d48' : '#059669'
                                        }}>
                                            {tx.type === 'deduction' ? '-' : '+'}₹{parseFloat(tx.amount).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div style={{ padding: '16px 24px', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} style={{ 
                        background: '#f1f5f9', color: '#475569', border: 'none', 
                        padding: '10px 24px', borderRadius: '8px', fontWeight: '600', 
                        cursor: 'pointer', transition: 'background 0.2s' 
                    }} onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'} onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}>
                        Close Ledger
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
