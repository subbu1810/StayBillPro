import React, { useState, useEffect } from 'react';
import { servicePaymentsAPI } from '../services/api';
import { usePopup } from './ui/PopupProvider';
import '../styles/JobsList.css'; 

function formatDateTime(value) {
    if (!value) return '-';
    const date = new Date(value);
    return date.toLocaleString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
      year: 'numeric', month: 'short', day: '2-digit',
    });
}

export default function ServicePaymentsScreen() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);

    const popup = usePopup();

    // Modal state
    const [manageJob, setManageJob] = useState(null);
    const [jobPayments, setJobPayments] = useState([]);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [showPayForm, setShowPayForm] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [payForm, setPayForm] = useState({ amount: '', payment_mode: 'cash', note: '', paid_at: '' });
    const [isSavingPay, setIsSavingPay] = useState(false);

    const loadLedger = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await servicePaymentsAPI.getLedger();
            setJobs(data || []);
        } catch (e) {
            setError(e.message || 'Failed to load payment ledger');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLedger();
    }, []);

    const openManageModal = async (job) => {
        setManageJob(job);
        setShowPayForm(false);
        setEditingPayment(null);
        setLoadingPayments(true);
        try {
            const data = await servicePaymentsAPI.getByJob(job.job_id);
            setJobPayments(data || []);
        } catch(e) {
            popup.showError(e.message || 'Failed to load payments');
        } finally {
            setLoadingPayments(false);
        }
    };

    const closeManageModal = () => {
        setManageJob(null);
        // Refresh the ledger to update balances if any payments were changed
        loadLedger();
    };

    const filtered = jobs.filter(j => {
        const t = searchTerm.toLowerCase();
        return (
            (j.job_number && j.job_number.toLowerCase().includes(t)) ||
            (j.customer_name && j.customer_name.toLowerCase().includes(t)) ||
            (j.customer_mobile && j.customer_mobile.includes(t))
        );
    });

    const totalRecords = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
    const startRecord = totalRecords === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const endRecord = Math.min(safePage * pageSize, totalRecords);

    return (
        <div className="jobs-list">
            <section className="filters-bar" style={{justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                    <h1 style={{margin: 0, fontSize: '1.25rem', color: '#111827', fontWeight: '600'}}>Service Payments Ledger</h1>
                </div>
                <div className="filters-group">
                    <input
                        type="text"
                        placeholder="Search ticket, customer, phone..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        style={{minWidth: '280px'}}
                    />
                </div>
            </section>

            {error && <div style={{color: 'red', padding: '10px'}}>{error}</div>}

            <section className="jobs-table-section">
                <table className="jobs-table">
                    <thead>
                        <tr>
                            <th style={{width:'40px', textAlign:'center'}}>#</th>
                            <th>Ticket No</th>
                            <th>Customer</th>
                            <th style={{textAlign:'right'}}>Total Job Cost</th>
                            <th style={{textAlign:'right'}}>Amount Paid</th>
                            <th style={{textAlign:'right'}}>Balance Due</th>
                            <th style={{textAlign:'center'}}>Status</th>
                            <th style={{textAlign:'center', width:'120px'}}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={{textAlign:'center', padding:'20px'}}>Loading payment ledger...</td></tr>
                        ) : paged.length === 0 ? (
                            <tr><td colSpan="8" style={{textAlign:'center', padding:'20px', color:'#6b7280'}}>No records found.</td></tr>
                        ) : (
                            paged.map((j, index) => {
                                const total = parseFloat(j.total_cost || 0);
                                const paid = parseFloat(j.total_paid || 0);
                                const balance = total - paid;
                                
                                let statusStr = 'Unpaid';
                                let statusColor = '#ef4444';
                                let statusBg = '#fee2e2';
                                
                                if (total > 0 && paid >= total) {
                                    statusStr = 'Paid';
                                    statusColor = '#10b981';
                                    statusBg = '#d1fae5';
                                } else if (paid > 0) {
                                    statusStr = 'Partial';
                                    statusColor = '#f59e0b';
                                    statusBg = '#fef3c7';
                                } else if (total === 0) {
                                    statusStr = 'No Cost';
                                    statusColor = '#6b7280';
                                    statusBg = '#f3f4f6';
                                }

                                return (
                                <tr key={j.job_id}>
                                    <td style={{textAlign:'center', color:'#9ca3af', fontSize:'0.78rem'}}>{(safePage - 1) * pageSize + index + 1}</td>
                                    <td style={{fontWeight:500, color:'#2563eb'}}>{j.job_number || 'N/A'}</td>
                                    <td>
                                        <div>{j.customer_name || 'Walk-in'}</div>
                                        {j.customer_mobile && <div style={{fontSize:'0.75rem', color:'#6b7280'}}>{j.customer_mobile}</div>}
                                    </td>
                                    <td style={{textAlign:'right', fontWeight:500}}>₹{total.toFixed(2)}</td>
                                    <td style={{textAlign:'right', fontWeight:500, color:'#10b981'}}>₹{paid.toFixed(2)}</td>
                                    <td style={{textAlign:'right', fontWeight:600, color: balance > 0 ? '#ef4444' : '#111827'}}>
                                        ₹{Math.max(0, balance).toFixed(2)}
                                    </td>
                                    <td style={{textAlign:'center'}}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            color: statusColor,
                                            backgroundColor: statusBg
                                        }}>
                                            {statusStr}
                                        </span>
                                    </td>
                                    <td style={{textAlign:'center'}}>
                                        <button 
                                            className="jd-bar-btn" 
                                            onClick={() => openManageModal(j)}
                                            style={{backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe'}}
                                        >
                                            Manage
                                        </button>
                                    </td>
                                </tr>
                            )})
                        )}
                    </tbody>
                </table>
                <div className="jl-pagination">
                    <div className="jl-page-info">
                        Showing <strong>{startRecord}–{endRecord}</strong> of <strong>{totalRecords}</strong> records
                    </div>
                    <div className="jl-page-controls">
                        <span className="jl-page-label">Rows:</span>
                        {[10, 25, 50, 100].map(n => (
                            <button
                                key={n}
                                className={`jl-page-size-btn${pageSize === n ? ' active' : ''}`}
                                onClick={() => { setPageSize(n); setCurrentPage(1); }}
                            >{n}</button>
                        ))}
                        <div className="jl-page-nav">
                            <button className="jl-nav-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>‹</button>
                            <span className="jl-page-num">{safePage} / {totalPages}</span>
                            <button className="jl-nav-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>›</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* MANAGE PAYMENTS MODAL */}
            {manageJob && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '600px',
                        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}>
                        <div style={{padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <div>
                                <h2 style={{margin: 0, fontSize: '1.25rem', color: '#111827'}}>Manage Payments</h2>
                                <p style={{margin: 0, fontSize: '0.875rem', color: '#6b7280', marginTop: '4px'}}>
                                    Ticket: <strong>{manageJob.job_number}</strong> &nbsp;|&nbsp; {manageJob.customer_name}
                                </p>
                            </div>
                            <button onClick={closeManageModal} style={{
                                background: 'none', border: 'none', fontSize: '1.5rem', color: '#9ca3af', cursor: 'pointer',
                                padding: '4px 8px'
                            }}>×</button>
                        </div>

                        <div style={{padding: '20px', overflowY: 'auto'}}>
                            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px'}}>
                                <div>
                                    <div style={{fontSize: '0.875rem', color: '#6b7280'}}>Total Job Cost: <strong style={{color:'#111827'}}>₹{parseFloat(manageJob.total_cost || 0).toFixed(2)}</strong></div>
                                </div>
                                {!showPayForm && (
                                    <button className="btn-primary" style={{padding:'6px 12px', fontSize:'0.875rem'}} onClick={() => {
                                        setEditingPayment(null);
                                        setPayForm({ amount: '', payment_mode: 'cash', note: '', paid_at: new Date().toISOString().slice(0,16) });
                                        setShowPayForm(true);
                                    }}>+ Collect Payment</button>
                                )}
                            </div>

                            {/* Payment Form */}
                            {showPayForm && (
                                <div style={{backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '20px'}}>
                                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px'}}>
                                        <label style={{fontSize: '0.875rem', fontWeight: 500}}>Amount (₹)
                                            <input type="number" min="0" step="0.01" placeholder="0.00"
                                                value={payForm.amount}
                                                onChange={e => setPayForm(f => ({...f, amount: e.target.value}))}
                                                style={{width:'100%', marginTop:'4px', padding:'6px', border:'1px solid #d1d5db', borderRadius:'4px'}}
                                            />
                                        </label>
                                        <label style={{fontSize: '0.875rem', fontWeight: 500}}>Mode
                                            <select value={payForm.payment_mode} onChange={e => setPayForm(f => ({...f, payment_mode: e.target.value}))}
                                                style={{width:'100%', marginTop:'4px', padding:'6px', border:'1px solid #d1d5db', borderRadius:'4px'}}>
                                                <option value="cash">Cash</option>
                                                <option value="upi">UPI</option>
                                                <option value="card">Card</option>
                                                <option value="bank_transfer">Bank Transfer</option>
                                                <option value="cheque">Cheque</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </label>
                                        <label style={{fontSize: '0.875rem', fontWeight: 500}}>Date &amp; Time
                                            <input type="datetime-local" value={payForm.paid_at}
                                                onChange={e => setPayForm(f => ({...f, paid_at: e.target.value}))}
                                                style={{width:'100%', marginTop:'4px', padding:'6px', border:'1px solid #d1d5db', borderRadius:'4px'}}
                                            />
                                        </label>
                                    </div>
                                    <div style={{display:'flex', gap:'8px'}}>
                                        <input placeholder="Note (optional)" value={payForm.note}
                                            onChange={e => setPayForm(f => ({...f, note: e.target.value}))}
                                            style={{flex: 1, padding:'6px', border:'1px solid #d1d5db', borderRadius:'4px'}}
                                        />
                                        <button className="btn-primary" disabled={!payForm.amount || isSavingPay}
                                            style={{padding: '6px 16px'}}
                                            onClick={async () => {
                                                setIsSavingPay(true);
                                                try {
                                                    const data = {
                                                        amount: parseFloat(payForm.amount),
                                                        payment_mode: payForm.payment_mode,
                                                        note: payForm.note || null,
                                                        paid_at: payForm.paid_at ? payForm.paid_at.replace('T',' ') + ':00' : null,
                                                    };
                                                    if (editingPayment) {
                                                        const updated = await servicePaymentsAPI.update(editingPayment.id, data);
                                                        setJobPayments(prev => prev.map(p => p.id === editingPayment.id ? updated : p));
                                                        popup.showSuccess('Payment updated');
                                                    } else {
                                                        const created = await servicePaymentsAPI.create(manageJob.job_id, data);
                                                        setJobPayments(prev => [created, ...prev]);
                                                        popup.showSuccess('Payment recorded');
                                                    }
                                                    setShowPayForm(false);
                                                    setEditingPayment(null);
                                                } catch(e) {
                                                    popup.showError(e.message || 'Failed to save payment');
                                                } finally {
                                                    setIsSavingPay(false);
                                                }
                                            }}
                                        >{isSavingPay ? 'Saving…' : editingPayment ? 'Update' : 'Save'}</button>
                                        <button onClick={() => { setShowPayForm(false); setEditingPayment(null); }}
                                            style={{padding: '6px 16px', border: '1px solid #d1d5db', backgroundColor: '#fff', borderRadius: '4px', cursor: 'pointer'}}
                                        >Cancel</button>
                                    </div>
                                </div>
                            )}

                            {/* Payment Records */}
                            {loadingPayments ? (
                                <p style={{textAlign: 'center', color: '#6b7280', padding: '20px'}}>Loading payments...</p>
                            ) : jobPayments.length > 0 ? (
                                <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem'}}>
                                    <thead>
                                        <tr style={{borderBottom: '2px solid #e5e7eb'}}>
                                            <th style={{textAlign: 'left', padding: '8px 4px', color: '#6b7280'}}>Date</th>
                                            <th style={{textAlign: 'left', padding: '8px 4px', color: '#6b7280'}}>Mode</th>
                                            <th style={{textAlign: 'left', padding: '8px 4px', color: '#6b7280'}}>Note</th>
                                            <th style={{textAlign: 'right', padding: '8px 4px', color: '#6b7280'}}>Amount</th>
                                            <th style={{textAlign: 'right', padding: '8px 4px', color: '#6b7280', width:'60px'}}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobPayments.map(p => (
                                            <tr key={p.id} style={{borderBottom: '1px solid #e5e7eb'}}>
                                                <td style={{padding: '12px 4px'}}>{formatDateTime(p.paid_at)}</td>
                                                <td style={{padding: '12px 4px', textTransform: 'capitalize'}}>{p.payment_mode}</td>
                                                <td style={{padding: '12px 4px', color: '#4b5563'}}>{p.note || '—'}</td>
                                                <td style={{padding: '12px 4px', textAlign: 'right', fontWeight: 600}}>₹{parseFloat(p.amount).toFixed(2)}</td>
                                                <td style={{padding: '12px 4px', textAlign: 'right'}}>
                                                    <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                                                        <button title="Edit" style={{background:'none',border:'none',cursor:'pointer',color:'#3b82f6'}} onClick={() => {
                                                            setEditingPayment(p);
                                                            setPayForm({ amount: p.amount, payment_mode: p.payment_mode, note: p.note || '', paid_at: p.paid_at ? p.paid_at.slice(0,16) : '' });
                                                            setShowPayForm(true);
                                                        }}>✎</button>
                                                        <button title="Delete" style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444'}} onClick={async () => {
                                                            const ok = await popup.confirm('Delete this payment entry?');
                                                            if (!ok) return;
                                                            try {
                                                                await servicePaymentsAPI.remove(p.id);
                                                                setJobPayments(prev => prev.filter(x => x.id !== p.id));
                                                                popup.showSuccess('Payment deleted');
                                                            } catch(e) { popup.showError(e.message); }
                                                        }}>✖</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="3" style={{padding: '12px 4px', fontWeight: 700, textAlign: 'right'}}>Total Collected:</td>
                                            <td style={{padding: '12px 4px', fontWeight: 700, textAlign: 'right', color: '#10b981'}}>
                                                ₹{jobPayments.reduce((s,p) => s + parseFloat(p.amount||0), 0).toFixed(2)}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            ) : (
                                <div style={{textAlign: 'center', padding: '40px 20px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db'}}>
                                    <p style={{margin: 0, color: '#6b7280'}}>No payments collected yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
