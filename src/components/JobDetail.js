import React, { useEffect, useMemo, useState, useCallback } from 'react';
import '../styles/JobDetail.css';
import { jobsAPI, servicePaymentsAPI } from '../services/api';
import { usePopup } from './ui/PopupProvider';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
    year: 'numeric', month: 'short', day: '2-digit',
  });
}

const STATUS_COLORS = {
  pending:     { bg: '#fef3c7', color: '#92400e' },
  'in-progress': { bg: '#dbeafe', color: '#1d4ed8' },
  completed:   { bg: '#dcfce7', color: '#166534' },
  cancelled:   { bg: '#fee2e2', color: '#991b1b' },
};

export default function JobDetail({ jobId, onBack }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  // Payments
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null); // null = new, object = editing
  const [payForm, setPayForm] = useState({ amount: '', payment_mode: 'cash', note: '', paid_at: '' });
  const [isSavingPay, setIsSavingPay] = useState(false);

  const popup = usePopup();

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    jobsAPI.get(jobId)
      .then(r => { if (!cancelled) setJob(r); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    // Load payments
    servicePaymentsAPI.getByJob(jobId)
      .then(r => { if (!cancelled) setPayments(Array.isArray(r) ? r : []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [jobId]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsAddingNote(true);
    let parsed = [];
    try {
      if (job?.notes) {
        parsed = JSON.parse(job.notes);
        if (!Array.isArray(parsed)) parsed = [{ text: job.notes, timestamp: job.created_at }];
      }
    } catch { if (job?.notes?.trim()) parsed.push({ text: job.notes, timestamp: job.created_at }); }
    parsed.push({ text: newNote.trim(), timestamp: new Date().toISOString() });
    try {
      await jobsAPI.update(jobId, { notes: JSON.stringify(parsed) });
      setJob(prev => ({ ...prev, notes: JSON.stringify(parsed) }));
      setNewNote('');
      popup.showSuccess('Note added');
    } catch (e) { popup.showError(e.message || 'Failed'); }
    finally { setIsAddingNote(false); }
  };

  const handleCallCustomer = () => {
    if (customer?.phone) window.location.href = `tel:${customer.phone}`;
    else popup.showError('No phone number available.');
  };

  const handleViewMap = () => {
    if (customer?.address) window.open(`https://maps.google.com/?q=${encodeURIComponent(customer.address)}`, '_blank');
    else popup.showError('No address available.');
  };

  const handleMarkPayment = async () => {
    if (job?.payment_status === 'paid') {
      popup.showError('This job is already marked as paid.');
      return;
    }
    setIsMarkingPaid(true);
    try {
      await jobsAPI.update(jobId, { payment_status: 'paid' });
      setJob(prev => ({ ...prev, payment_status: 'paid' }));
      popup.showSuccess('Payment marked as received!');
    } catch (e) {
      popup.showError(e.message || 'Failed to mark payment');
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleCompleteJob = async () => {
    setShowCompleteConfirm(false);
    setIsCompleting(true);
    try {
      await jobsAPI.update(jobId, { status: 'completed' });
      setJob(prev => ({ ...prev, status: 'completed' }));
      popup.showSuccess('Job marked as completed.');
    } catch (e) { popup.showError(e.message || 'Failed'); }
    finally { setIsCompleting(false); }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate) { popup.showError('Please select a date.'); return; }
    setIsRescheduling(true);
    try {
      await jobsAPI.update(jobId, { scheduled_date: rescheduleDate, start_time: rescheduleTime || job?.start_time });
      setJob(prev => ({ ...prev, scheduled_date: rescheduleDate, start_time: rescheduleTime || prev?.start_time }));
      setShowReschedule(false);
      popup.showSuccess('Job rescheduled successfully.');
    } catch (e) { popup.showError(e.message || 'Failed'); }
    finally { setIsRescheduling(false); }
  };

  const renderedNotes = useMemo(() => {
    if (!job?.notes) return [];
    try {
      const p = JSON.parse(job.notes);
      return Array.isArray(p) ? p : [{ text: job.notes, timestamp: job.created_at }];
    } catch { return [{ text: job.notes, timestamp: job.created_at }]; }
  }, [job?.notes, job?.created_at]);

  if (loading) return (
    <div className="jd-loading">
      <div className="jd-spinner" />
      <p>Loading ticket details…</p>
    </div>
  );

  if (error) return (
    <div className="jd-error">
      <p>⚠ {error}</p>
      <button onClick={onBack}>Back to Jobs</button>
    </div>
  );

  const customer = job?.service_request?.appliance;
  const serviceInfo = job?.service_request;
  const status = (job?.status || 'pending').toLowerCase().replace(' ', '-');
  const statusStyle = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const totalCost = (Number(job?.labor_cost || 0) + Number(job?.parts_cost || 0) + Number(job?.service_request?.cost || 0)) || '-';

  return (
    <div className="jd-root">

      {/* ── Header ── */}
      <div className="jd-header">
        <div className="jd-header-left">
          <div>
            <p className="jd-ticket-label">Ticket</p>
            <h1 className="jd-ticket-no">#{job?.job_number || 'JOB-0001'}</h1>
          </div>
          <span className="jd-status" style={{ background: statusStyle.bg, color: statusStyle.color }}>
            {(job?.status || 'Pending').toUpperCase()}
          </span>
        </div>
        <div className="jd-header-actions">
          <button className="jd-btn-ghost" onClick={() => window.print()}>Print</button>
          <button className="jd-btn-ghost" onClick={() => {
            if (customer?.phone) popup.showSuccess(`SMS sent to ${customer.customer_name} (${customer.phone})`);
            else popup.showError('No phone number available.');
          }}>Send SMS</button>
          <button className="jd-btn-ghost" onClick={onBack}>← Back</button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="jd-body">

        {/* ── Main Column ── */}
        <div className="jd-main">

          {/* Customer + Product */}
          <div className="jd-panel">
            <div className="jd-panel-split">

              <div className="jd-section">
                <p className="jd-section-title">Customer</p>
                <table className="jd-table">
                  <tbody>
                    <tr><td className="jd-td-label">Name</td><td className="jd-td-value">{customer?.customer_name || '—'}</td></tr>
                    <tr><td className="jd-td-label">Mobile</td>
                      <td className="jd-td-value">
                        {customer?.phone || '—'}
                        {customer?.phone && (
                          <button className="jd-inline-call" onClick={handleCallCustomer} title="Call">📞</button>
                        )}
                      </td>
                    </tr>
                    <tr><td className="jd-td-label">Address</td><td className="jd-td-value">{customer?.address || '—'}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="jd-divider-v" />

              <div className="jd-section">
                <p className="jd-section-title">Product</p>
                <table className="jd-table">
                  <tbody>
                    <tr><td className="jd-td-label">Brand</td><td className="jd-td-value">{customer?.brand || '—'}</td></tr>
                    <tr><td className="jd-td-label">Model</td><td className="jd-td-value">{customer?.model || '—'}</td></tr>
                    <tr><td className="jd-td-label">Category</td><td className="jd-td-value">{customer?.category || '—'}</td></tr>
                    <tr><td className="jd-td-label">Serial No.</td><td className="jd-td-value">{customer?.serial_number || '—'}</td></tr>
                    <tr><td className="jd-td-label">Warranty</td><td className="jd-td-value">{customer?.warranty_status || '—'}</td></tr>
                  </tbody>
                </table>
              </div>

            </div>
          </div>

          {/* Service Info */}
          <div className="jd-panel">
            <p className="jd-section-title">Service Information</p>
            {(serviceInfo?.issue_description || job?.job_description) && (
              <p className="jd-description">{serviceInfo?.issue_description || job?.job_description}</p>
            )}
            <div className="jd-meta-grid">
              <div><p className="jd-td-label">Type</p><p className="jd-td-value">{serviceInfo?.service_type || '—'}</p></div>
              <div><p className="jd-td-label">Priority</p>
                <p className="jd-td-value">
                  <span className={`jd-priority jd-priority-${(job?.priority || 'medium').toLowerCase()}`}>
                    {job?.priority || 'medium'}
                  </span>
                </p>
              </div>
              <div><p className="jd-td-label">Technician</p><p className="jd-td-value">{job?.technician?.name || serviceInfo?.technician_name || '—'}</p></div>
              <div><p className="jd-td-label">Scheduled Date</p><p className="jd-td-value">{formatDate(job?.scheduled_date)}</p></div>
              <div><p className="jd-td-label">Created</p><p className="jd-td-value">{formatDateTime(job?.created_at)}</p></div>
              <div><p className="jd-td-label">Last Updated</p><p className="jd-td-value">{formatDateTime(job?.updated_at)}</p></div>
            </div>
          </div>

          {/* Notes */}
          <div className="jd-panel">
            <p className="jd-section-title">Notes</p>
            <div className="jd-note-input-row">
              <input
                className="jd-note-input"
                type="text"
                placeholder="Add a note and press Enter…"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                disabled={isAddingNote}
              />
              <button className="jd-btn-primary" onClick={handleAddNote} disabled={!newNote.trim() || isAddingNote}>
                {isAddingNote ? 'Adding…' : 'Add'}
              </button>
            </div>
            {renderedNotes.length > 0 ? (
              <div className="jd-notes">
                {renderedNotes.map((n, i) => (
                  <div key={i} className="jd-note-item">
                    <p className="jd-note-meta">{formatDateTime(n.timestamp)}</p>
                    <p className="jd-note-text">{n.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="jd-empty">No notes yet.</p>
            )}
          </div>

          {/* ── Payments ── */}
          <div className="jd-panel">
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px'}}>
              <p className="jd-section-title" style={{margin:0}}>Payments</p>
              <button className="jd-btn-primary" style={{padding:'4px 10px', fontSize:'0.78rem'}} onClick={() => {
                setEditingPayment(null);
                setPayForm({ amount: '', payment_mode: 'cash', note: '', paid_at: new Date().toISOString().slice(0,16) });
                setShowPayForm(true);
              }}>+ Collect Payment</button>
            </div>

            {/* Payment Form */}
            {showPayForm && (
              <div className="jd-pay-form">
                <div className="jd-pay-form-row">
                  <label>Amount (₹)
                    <input type="number" min="0" step="0.01" placeholder="0.00"
                      value={payForm.amount}
                      onChange={e => setPayForm(f => ({...f, amount: e.target.value}))}
                    />
                  </label>
                  <label>Mode
                    <select value={payForm.payment_mode} onChange={e => setPayForm(f => ({...f, payment_mode: e.target.value}))}>
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                  <label>Date &amp; Time
                    <input type="datetime-local" value={payForm.paid_at}
                      onChange={e => setPayForm(f => ({...f, paid_at: e.target.value}))}
                    />
                  </label>
                </div>
                <div style={{display:'flex', gap:'8px', marginTop:'8px'}}>
                  <input className="jd-note-input" placeholder="Note (optional)" value={payForm.note}
                    onChange={e => setPayForm(f => ({...f, note: e.target.value}))}
                  />
                  <button className="jd-btn-primary" disabled={!payForm.amount || isSavingPay}
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
                          setPayments(prev => prev.map(p => p.id === editingPayment.id ? updated : p));
                          popup.showSuccess('Payment updated');
                        } else {
                          const created = await servicePaymentsAPI.create(jobId, data);
                          setPayments(prev => [created, ...prev]);
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
                  <button className="jd-btn-ghost" onClick={() => { setShowPayForm(false); setEditingPayment(null); }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Payment Records */}
            {payments.length > 0 ? (
              <table className="jd-billing-table" style={{marginTop:'10px'}}>
                <thead>
                  <tr>
                    <th style={{padding:'4px 0', fontSize:'0.72rem', color:'#6b7280', fontWeight:600, textTransform:'uppercase', borderBottom:'1px solid #e8eaed'}}>Date</th>
                    <th style={{padding:'4px 0', fontSize:'0.72rem', color:'#6b7280', fontWeight:600, textTransform:'uppercase', borderBottom:'1px solid #e8eaed'}}>Mode</th>
                    <th style={{padding:'4px 0', fontSize:'0.72rem', color:'#6b7280', fontWeight:600, textTransform:'uppercase', borderBottom:'1px solid #e8eaed'}}>Note</th>
                    <th style={{padding:'4px 0', fontSize:'0.72rem', color:'#6b7280', fontWeight:600, textTransform:'uppercase', textAlign:'right', borderBottom:'1px solid #e8eaed'}}>Amount</th>
                    <th style={{padding:'4px 0', borderBottom:'1px solid #e8eaed'}}></th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td className="jd-td-label">{formatDateTime(p.paid_at)}</td>
                      <td className="jd-td-label" style={{textTransform:'capitalize'}}>{p.payment_mode}</td>
                      <td className="jd-td-label">{p.note || '—'}</td>
                      <td className="jd-bill-amt">₹{parseFloat(p.amount).toFixed(2)}</td>
                      <td style={{textAlign:'right', whiteSpace:'nowrap'}}>
                        <button className="jl-icon-btn edit" title="Edit" style={{width:'24px',height:'24px'}} onClick={() => {
                          setEditingPayment(p);
                          setPayForm({ amount: p.amount, payment_mode: p.payment_mode, note: p.note || '', paid_at: p.paid_at ? p.paid_at.slice(0,16) : '' });
                          setShowPayForm(true);
                        }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'13px',height:'13px'}}>
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button className="jl-icon-btn delete" title="Delete" style={{width:'24px',height:'24px'}} onClick={async () => {
                          const ok = await popup.confirm('Delete this payment entry?');
                          if (!ok) return;
                          try {
                            await servicePaymentsAPI.remove(p.id);
                            setPayments(prev => prev.filter(x => x.id !== p.id));
                            popup.showSuccess('Payment deleted');
                          } catch(e) { popup.showError(e.message); }
                        }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'13px',height:'13px'}}>
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" style={{paddingTop:'8px', fontWeight:700, fontSize:'0.85rem'}}>Total Collected</td>
                    <td className="jd-bill-amt" style={{paddingTop:'8px', fontWeight:700, borderTop:'1px solid #e8eaed'}}>₹{payments.reduce((s,p) => s + parseFloat(p.amount||0), 0).toFixed(2)}</td>
                    <td style={{borderTop:'1px solid #e8eaed'}}></td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p className="jd-empty">No payments recorded yet.</p>
            )}
          </div>

        </div>

        {/* ── Sidebar ── */}
        <div className="jd-sidebar">

          {/* Billing */}
          <div className="jd-panel">
            <p className="jd-section-title">Billing</p>
            <table className="jd-billing-table">
              <tbody>
                <tr>
                  <td className="jd-td-label">Service Charge</td>
                  <td className="jd-bill-amt">{job?.service_request?.cost ? `₹${job.service_request.cost}` : '—'}</td>
                </tr>
                <tr>
                  <td className="jd-td-label">Labour</td>
                  <td className="jd-bill-amt">{job?.labor_cost ? `₹${job.labor_cost}` : '—'}</td>
                </tr>
                <tr>
                  <td className="jd-td-label">Parts</td>
                  <td className="jd-bill-amt">{job?.parts_cost ? `₹${job.parts_cost}` : '—'}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="jd-billing-total-row">
                  <td>Total</td>
                  <td className="jd-bill-amt">{totalCost && totalCost !== '-' ? `₹${totalCost}` : '—'}</td>
                </tr>
              </tfoot>
            </table>
            <button 
              className={`jd-btn-pay${job?.payment_status === 'paid' ? ' jd-btn-pay-done' : ''}`}
              onClick={handleMarkPayment}
              disabled={isMarkingPaid || job?.payment_status === 'paid'}
            >
              {isMarkingPaid ? 'Saving…' : job?.payment_status === 'paid' ? '✓ Payment Received' : '✓ Mark Payment Received'}
            </button>
          </div>

          {/* Timeline */}
          <div className="jd-panel">
            <p className="jd-section-title">Timeline</p>
            <ul className="jd-timeline">
              {job?.created_at && (
                <li className="jd-tl-item">
                  <span className="jd-tl-dot" />
                  <div>
                    <p className="jd-tl-event">Job created</p>
                    <p className="jd-tl-time">{formatDateTime(job.created_at)}</p>
                  </div>
                </li>
              )}
              {job?.scheduled_date && (
                <li className="jd-tl-item">
                  <span className="jd-tl-dot" />
                  <div>
                    <p className="jd-tl-event">Scheduled</p>
                    <p className="jd-tl-time">{formatDate(job.scheduled_date)}</p>
                  </div>
                </li>
              )}
              {job?.updated_at && job.updated_at !== job.created_at && (
                <li className="jd-tl-item">
                  <span className="jd-tl-dot" />
                  <div>
                    <p className="jd-tl-event">Last updated</p>
                    <p className="jd-tl-time">{formatDateTime(job.updated_at)}</p>
                  </div>
                </li>
              )}
              {job?.status === 'completed' && (
                <li className="jd-tl-item">
                  <span className="jd-tl-dot jd-tl-dot-green" />
                  <div>
                    <p className="jd-tl-event">Completed</p>
                    <p className="jd-tl-time">{formatDateTime(job.updated_at)}</p>
                  </div>
                </li>
              )}
            </ul>
          </div>

          {/* Technician */}
          {(job?.technician?.name || serviceInfo?.technician_name) && (
            <div className="jd-panel">
              <p className="jd-section-title">Technician</p>
              <div className="jd-tech-row">
                <div className="jd-tech-avatar">🔧</div>
                <div>
                  <p className="jd-tech-name">{job?.technician?.name || serviceInfo?.technician_name}</p>
                  <p className="jd-td-label">{serviceInfo?.technician_mobile || '—'}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Bottom Action Bar ── */}
      <div className="jd-action-bar">
        <div className="jd-action-left">
          <button className="jd-bar-btn" onClick={handleCallCustomer}>📞 Call Customer</button>
          <button className="jd-bar-btn" onClick={handleViewMap}>📍 View on Map</button>
          <button className="jd-bar-btn" onClick={() => setShowReschedule(true)}>📅 Reschedule</button>
        </div>
        <button
          className="jd-bar-btn jd-bar-btn-complete"
          onClick={() => setShowCompleteConfirm(true)}
          disabled={isCompleting || job?.status === 'completed'}
        >
          {isCompleting ? 'Completing…' : '✓ Complete Job'}
        </button>
      </div>

      {/* Reschedule Modal */}
      {showReschedule && (
        <div className="jd-overlay">
          <div className="jd-modal">
            <h3>Reschedule Job</h3>
            <label>New Date
              <input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} />
            </label>
            <label>Time (optional)
              <input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} />
            </label>
            <div className="jd-modal-btns">
              <button className="jd-btn-ghost" onClick={() => setShowReschedule(false)}>Cancel</button>
              <button className="jd-btn-primary" onClick={handleReschedule} disabled={isRescheduling}>
                {isRescheduling ? 'Saving…' : 'Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Confirm Modal */}
      {showCompleteConfirm && (
        <div className="jd-overlay">
          <div className="jd-modal jd-modal-center">
            <p style={{ fontSize: '2rem', marginBottom: 8 }}>✅</p>
            <h3>Mark as Completed?</h3>
            <p className="jd-modal-sub">This action cannot be undone.</p>
            <div className="jd-modal-btns">
              <button className="jd-btn-ghost" onClick={() => setShowCompleteConfirm(false)}>Cancel</button>
              <button className="jd-btn-primary" onClick={handleCompleteJob}>Yes, Complete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
