import React, { useState, useEffect, useCallback } from 'react';
import '../styles/CustomersScreen.css';
import CustomerFormModal from './CustomersForm';
import { usePopup } from './ui/PopupProvider';

import API_BASE from '../config/serverConfig';

/* ─────────────────────────────────────────────────────────────
   LedgerTab — full customer ledger with running balance
───────────────────────────────────────────────────────────── */
function LedgerTab({ customers, onCustomerUpdated }) {
  const popup = usePopup();
  const [customerId, setCustomerId] = useState('');
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // Ledger Toolbar Searchable Customer Dropdown State
  const [toolbarSearchQuery, setToolbarSearchQuery] = useState('');
  const [isToolbarDropdownOpen, setIsToolbarDropdownOpen] = useState(false);

  // Add Dues Modal State
  const [showDuesModal, setShowDuesModal] = useState(false);
  const [duesForm, setDuesForm] = useState({
    customerId: '',
    openingBalance: '',
    balanceType: 'receivable',
    asOfDate: new Date().toISOString().split('T')[0],
    description: '',
    items: []
  });
  const [duesSaving, setDuesSaving] = useState(false);

  // Receive Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    customerId: '',
    amount: '',
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    note: ''
  });
  const [paymentSaving, setPaymentSaving] = useState(false);

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const loadLedger = useCallback(async (cid, f, t) => {
    if (!cid) { setLedgerData(null); return; }
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (f) params.append('from', f);
      if (t) params.append('to', t);
      const res = await fetch(`${API_BASE}/customers/${cid}/ledger?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch ledger');
      const rawData = await res.json();

      // Recalculate true accounting ledger entries to handle both POS sales, direct dues, and payment receipts
      const openingBal = Number(rawData.customer?.openingBalance || 0);
      const invoices = rawData.invoices || [];

      let runningBal = openingBal;
      const computedRows = [];

      if (openingBal !== 0) {
        computedRows.push({
          date: rawData.customer.asOfDate || rawData.customer.created_at,
          type: 'opening',
          description: 'Opening Balance',
          invoiceNo: null,
          debit: openingBal > 0 ? openingBal : 0,
          credit: openingBal < 0 ? Math.abs(openingBal) : 0,
          balance: runningBal,
          status: null,
          paymentMethod: null,
        });
      }

      let totalSalesAmt = 0;
      let totalPaidAmt = 0;
      let totalPendingAmt = 0;

      invoices.forEach(inv => {
        const amt = Number(inv.total_amount || 0);
        const invNumber = `POSINV${String(inv.id).padStart(2, '0')}`;
        const isPaymentReceipt = (inv.invoice_type === 'payment_receipt') || 
                                 (inv.items_summary && inv.items_summary.toLowerCase().includes('payment'));

        if (isPaymentReceipt) {
          // It's a pure payment receipt: Credit the account (reduces balance)
          runningBal -= amt;
          totalPaidAmt += amt;
          computedRows.push({
            date: inv.created_at,
            type: 'payment',
            description: inv.items_summary || `Payment received (${inv.payment_method || 'cash'})`,
            invoiceNo: invNumber,
            debit: 0,
            credit: amt,
            balance: runningBal,
            status: 'paid',
            paymentMethod: inv.payment_method || 'cash',
          });
        } else if (inv.status === 'paid') {
          // Regular paid POS invoice: +Sale (Debit) and then -Payment (Credit) -> Net change 0
          totalSalesAmt += amt;
          totalPaidAmt += amt;
          runningBal += amt;
          computedRows.push({
            date: inv.created_at,
            type: 'sale',
            description: inv.items_summary ? `Invoice — ${inv.items_summary}` : 'Invoice',
            invoiceNo: invNumber,
            debit: amt,
            credit: 0,
            balance: runningBal,
            status: inv.status,
            paymentMethod: inv.payment_method,
          });
          runningBal -= amt;
          computedRows.push({
            date: inv.created_at,
            type: 'payment',
            description: `Payment received (${inv.payment_method || 'cash'})`,
            invoiceNo: invNumber,
            debit: 0,
            credit: amt,
            balance: runningBal,
            status: inv.status,
            paymentMethod: inv.payment_method,
          });
        } else if (inv.status === 'pending') {
          // Unpaid / Credit invoice or Due entry: +Sale (Debit increases due)
          totalSalesAmt += amt;
          totalPendingAmt += amt;
          runningBal += amt;
          computedRows.push({
            date: inv.created_at,
            type: 'sale',
            description: inv.items_summary ? `Invoice — ${inv.items_summary}` : 'Due Entry',
            invoiceNo: invNumber,
            debit: amt,
            credit: 0,
            balance: runningBal,
            status: inv.status,
            paymentMethod: inv.payment_method || 'credit',
          });
        } else if (inv.status === 'cancelled') {
          computedRows.push({
            date: inv.created_at,
            type: 'cancelled',
            description: 'Invoice Cancelled',
            invoiceNo: invNumber,
            debit: 0,
            credit: 0,
            balance: runningBal,
            status: inv.status,
            paymentMethod: null,
          });
        }
      });

      setLedgerData({
        ...rawData,
        ledgerRows: computedRows,
        summary: {
          ...rawData.summary,
          openingBalance: openingBal,
          totalSales: totalSalesAmt,
          totalPaid: totalPaidAmt,
          totalPending: totalPendingAmt,
          currentDues: runningBal
        }
      });
    } catch (err) {
      setError('Could not load ledger. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectToolbarCustomer = (c) => {
    if (!c) {
      setCustomerId('');
      setToolbarSearchQuery('');
      setLedgerData(null);
      setIsToolbarDropdownOpen(false);
      return;
    }
    const nameStr = (c.name && c.name.trim()) 
      ? c.name.trim() 
      : (c.mobile ? `Customer (${c.mobile})` : `Customer #${c.id}`);
    setCustomerId(c.id);
    setToolbarSearchQuery(nameStr);
    setIsToolbarDropdownOpen(false);
    loadLedger(c.id, from, to);
  };

  const handleFilter = () => loadLedger(customerId, from, to);

  const openAddDuesModal = () => {
    const selectedCust = customers.find(c => String(c.id) === String(customerId));
    const initialCid = customerId || '';
    const activeCust = selectedCust || null;

    setDuesForm({
      customerId: initialCid,
      openingBalance: activeCust ? (activeCust.openingBalance || '') : '',
      balanceType: activeCust ? (activeCust.balanceType || 'receivable') : 'receivable',
      asOfDate: activeCust?.asOfDate ? activeCust.asOfDate.split('T')[0] : new Date().toISOString().split('T')[0],
      description: '',
      items: []
    });
    setShowDuesModal(true);
  };

  const handleAddItemRow = () => {
    setDuesForm(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, price: '' }]
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...duesForm.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-calculate total opening balance from items if items exist
    const totalFromItems = updatedItems.reduce((sum, it) => {
      const q = parseFloat(it.quantity) || 0;
      const p = parseFloat(it.price) || 0;
      return sum + (q * p);
    }, 0);

    setDuesForm(prev => ({
      ...prev,
      items: updatedItems,
      openingBalance: totalFromItems > 0 ? totalFromItems.toFixed(2) : prev.openingBalance
    }));
  };

  const handleRemoveItemRow = (index) => {
    const updatedItems = duesForm.items.filter((_, i) => i !== index);
    const totalFromItems = updatedItems.reduce((sum, it) => {
      const q = parseFloat(it.quantity) || 0;
      const p = parseFloat(it.price) || 0;
      return sum + (q * p);
    }, 0);

    setDuesForm(prev => ({
      ...prev,
      items: updatedItems,
      openingBalance: updatedItems.length > 0 ? totalFromItems.toFixed(2) : prev.openingBalance
    }));
  };

  const handleSaveDues = async (e) => {
    e.preventDefault();
    if (!duesForm.customerId) {
      popup.showError('Please select a customer.');
      return;
    }
    setDuesSaving(true);
    try {
      const token = localStorage.getItem('token');
      let res = await fetch(`${API_BASE}/customers/${duesForm.customerId}/dues`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          openingBalance: parseFloat(duesForm.openingBalance) || 0,
          balanceType: duesForm.balanceType,
          asOfDate: duesForm.asOfDate,
          description: duesForm.description,
          items: duesForm.items
        })
      });

      // Fallback if Hostinger remote backend doesn't have the new /dues route deployed yet
      // Create a pending bill/invoice on Hostinger so it shows as a historical DEBIT line in the Ledger
      if (res.status === 404) {
        const custObj = customers.find(c => String(c.id) === String(duesForm.customerId));
        if (custObj) {
          const dueAmt = parseFloat(duesForm.openingBalance) || 0;
          const billingItems = (duesForm.items && duesForm.items.length > 0)
            ? duesForm.items.map(it => {
                const q = parseFloat(it.quantity) || 1;
                const p = parseFloat(it.price) || 0;
                return {
                  id: null,
                  name: it.name || 'Due Item',
                  qty: q,
                  price: p,
                  gst: 0
                };
              })
            : [{
                id: null,
                name: duesForm.description ? `Due Entry (${duesForm.description})` : 'Opening Dues',
                qty: 1,
                price: dueAmt,
                gst: 0
              }];

          res = await fetch(`${API_BASE}/billing`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              customerId: custObj.id || null,
              customerName: custObj.name || 'Customer',
              customerPhone: custObj.mobile || '',
              items: billingItems,
              totalAmount: dueAmt,
              gstAmount: 0,
              discountAmount: 0,
              paymentMethod: 'credit', // sets status to 'pending' -> becomes Debit row in ledger!
              invoiceType: 'due_entry'
            })
          });
        }
      }

      const data = await res.json();
      if (res.ok) {
        popup.showSuccess('Customer dues added to ledger successfully!');
        setShowDuesModal(false);
        if (onCustomerUpdated) onCustomerUpdated();
        if (String(customerId) === String(duesForm.customerId)) {
          loadLedger(customerId, from, to);
        } else {
          setCustomerId(duesForm.customerId);
          loadLedger(duesForm.customerId, from, to);
        }
      } else {
        popup.showError(data.message || 'Failed to update dues');
      }
    } catch (err) {
      popup.showError('Error connecting to server.');
    } finally {
      setDuesSaving(false);
    }
  };

  const openReceivePaymentModal = () => {
    const curDue = ledgerData?.summary?.currentDues || 0;
    setPaymentForm({
      customerId: customerId || '',
      amount: curDue > 0 ? String(curDue) : '',
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString().split('T')[0],
      note: ''
    });
    setShowPaymentModal(true);
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.customerId) {
      popup.showError('Please select a customer.');
      return;
    }
    const payAmt = parseFloat(paymentForm.amount);
    if (!payAmt || payAmt <= 0) {
      popup.showError('Please enter a valid payment amount.');
      return;
    }
    setPaymentSaving(true);
    try {
      const token = localStorage.getItem('token');
      let res = await fetch(`${API_BASE}/customers/${paymentForm.customerId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentForm)
      });

      // Fallback if hostinger remote backend doesn't have the /payments route deployed yet:
      // Create a paid billing invoice for this customer on Hostinger so it shows as a historical CREDIT (Payment received) in the ledger!
      if (res.status === 404) {
        const custObj = customers.find(c => String(c.id) === String(paymentForm.customerId));
        if (custObj) {
          res = await fetch(`${API_BASE}/billing`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              customerId: custObj.id || null,
              customerName: custObj.name || 'Customer',
              customerPhone: custObj.mobile || '',
              items: [{
                id: null,
                name: paymentForm.note ? `Payment: ${paymentForm.note}` : 'Payment Received against Dues',
                qty: 1,
                price: payAmt,
                gst: 0
              }],
              totalAmount: payAmt,
              gstAmount: 0,
              discountAmount: 0,
              paymentMethod: paymentForm.paymentMethod || 'cash', // 'cash', 'upi' etc. sets status to 'paid' -> becomes Credit row in ledger!
              invoiceType: 'payment_receipt'
            })
          });
        }
      }

      const data = await res.json();
      if (res.ok) {
        popup.showSuccess('Payment of ₹' + payAmt.toLocaleString() + ' recorded successfully!');
        setShowPaymentModal(false);
        if (onCustomerUpdated) onCustomerUpdated();
        loadLedger(paymentForm.customerId, from, to);
      } else {
        popup.showError(data.message || 'Failed to record payment');
      }
    } catch (err) {
      popup.showError('Error connecting to server.');
    } finally {
      setPaymentSaving(false);
    }
  };

  const rowStyle = (type) => {
    if (type === 'opening')  return { background: '#eff6ff' };
    if (type === 'payment')  return { background: '#f0fdf4' };
    if (type === 'cancelled') return { background: '#fafafa', opacity: 0.6 };
    return {};
  };

  const s = ledgerData?.summary;

  return (
    <div>
      {/* ── Add / Adjust Dues Modal ── */}
      {showDuesModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            width: '100%',
            maxWidth: 550,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            animation: 'cf-in 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.2rem' }}>💰</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Add / Adjust Dues</h3>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>Add due amount, items breakdown and notes</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDuesModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.1rem',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 4,
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDues} style={{ padding: '16px 18px', overflowY: 'auto', flex: 1 }}>
              {/* Fixed Customer Info Display */}
              <div style={{
                marginBottom: 14,
                padding: '10px 12px',
                borderRadius: 8,
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                    Customer
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                    {customers.find(c => String(c.id) === String(duesForm.customerId))?.name || 'Customer'}
                  </span>
                  {customers.find(c => String(c.id) === String(duesForm.customerId))?.mobile && (
                    <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: 6 }}>
                      ({customers.find(c => String(c.id) === String(duesForm.customerId))?.mobile})
                    </span>
                  )}
                </div>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 20,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  background: '#ccfbf1',
                  color: '#0f766e'
                }}>
                  Selected
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Total Due Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={duesForm.openingBalance}
                    onChange={(e) => setDuesForm({ ...duesForm, openingBalance: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Balance Type
                  </label>
                  <select
                    value={duesForm.balanceType}
                    onChange={(e) => setDuesForm({ ...duesForm, balanceType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  >
                    <option value="receivable">Receivable (Customer owes you)</option>
                    <option value="payable">Payable (Advance / You owe customer)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    As of Date
                  </label>
                  <input
                    type="date"
                    value={duesForm.asOfDate}
                    onChange={(e) => setDuesForm({ ...duesForm, asOfDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Description / Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Previous pending service bill"
                    value={duesForm.description}
                    onChange={(e) => setDuesForm({ ...duesForm, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Items Breakdown Section */}
              <div style={{
                marginTop: 10,
                marginBottom: 16,
                padding: 12,
                borderRadius: 8,
                background: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>
                    📦 Due Items Breakdown (Optional)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    style={{
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      background: '#e0f2fe',
                      color: '#0369a1',
                      border: '1px solid #bae6fd',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    + Add Item Row
                  </button>
                </div>

                {duesForm.items.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    No specific items added. The total due amount above will be set directly.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {duesForm.items.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Item / Part / Service Name"
                          value={it.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          required
                          style={{
                            flex: 2,
                            padding: '6px 8px',
                            fontSize: '0.78rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: 4,
                            outline: 'none',
                            background: '#fff'
                          }}
                        />
                        <input
                          type="number"
                          placeholder="Qty"
                          step="1"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          required
                          style={{
                            width: 60,
                            padding: '6px 8px',
                            fontSize: '0.78rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: 4,
                            outline: 'none',
                            background: '#fff'
                          }}
                        />
                        <input
                          type="number"
                          placeholder="Price ₹"
                          step="0.01"
                          min="0"
                          value={it.price}
                          onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                          required
                          style={{
                            width: 85,
                            padding: '6px 8px',
                            fontSize: '0.78rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: 4,
                            outline: 'none',
                            background: '#fff'
                          }}
                        />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f766e', minWidth: 65, textAlign: 'right' }}>
                          ₹{((parseFloat(it.quantity) || 0) * (parseFloat(it.price) || 0)).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: 4,
                            padding: '4px 7px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowDuesModal(false)}
                  disabled={duesSaving}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={duesSaving}
                  style={{
                    padding: '7px 18px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#0d9488',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: duesSaving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {duesSaving ? 'Saving…' : 'Save Dues'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Receive Payment Modal ── */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            width: '100%',
            maxWidth: 480,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            animation: 'cf-in 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid #e2e8f0',
              background: '#f0fdf4',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.2rem' }}>💵</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#166534' }}>Receive Customer Payment</h3>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#15803d' }}>Record payment received and reduce customer dues</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.1rem',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 4,
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePayment} style={{ padding: '16px 18px', overflowY: 'auto', flex: 1 }}>
              {/* Customer Info */}
              <div style={{
                marginBottom: 14,
                padding: '10px 12px',
                borderRadius: 8,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                    Customer
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                    {customers.find(c => String(c.id) === String(paymentForm.customerId))?.name || 'Customer'}
                  </span>
                  {customers.find(c => String(c.id) === String(paymentForm.customerId))?.mobile && (
                    <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: 6 }}>
                      ({customers.find(c => String(c.id) === String(paymentForm.customerId))?.mobile})
                    </span>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                    Current Due
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: (ledgerData?.summary?.currentDues || 0) > 0 ? '#dc2626' : '#15803d' }}>
                    {fmt(ledgerData?.summary?.currentDues || 0)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Amount Paid (₹) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#15803d',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Payment Mode <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  >
                    <option value="cash">💵 Cash</option>
                    <option value="upi">📱 UPI / QR</option>
                    <option value="card">💳 Card</option>
                    <option value="bank">🏦 Bank Transfer</option>
                    <option value="cheque">📄 Cheque</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Note / Reference #
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref #983829, Cash given by Subbu"
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Live Balance Remaining Preview */}
              {paymentForm.amount && !isNaN(parseFloat(paymentForm.amount)) && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  marginBottom: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem'
                }}>
                  <span style={{ color: '#64748b' }}>Remaining Due after this payment:</span>
                  <strong style={{ color: Math.max(0, (ledgerData?.summary?.currentDues || 0) - parseFloat(paymentForm.amount)) > 0 ? '#ea580c' : '#16a34a' }}>
                    {fmt(Math.max(0, (ledgerData?.summary?.currentDues || 0) - parseFloat(paymentForm.amount)))}
                  </strong>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={paymentSaving}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSaving}
                  style={{
                    padding: '7px 18px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#16a34a',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: paymentSaving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {paymentSaving ? 'Recording…' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Filters bar ── */}
      <div className="crm-toolbar" style={{ marginBottom: 8, gap: 6, position: 'relative', overflow: 'visible', zIndex: 100 }}>
        {/* Searchable Customer Dropdown */}
        <div style={{ position: 'relative', minWidth: 200, zIndex: 101 }}>
          <input
            type="text"
            placeholder="Select / Search Customer…"
            value={toolbarSearchQuery}
            onFocus={() => setIsToolbarDropdownOpen(true)}
            onChange={(e) => {
              setToolbarSearchQuery(e.target.value);
              setIsToolbarDropdownOpen(true);
            }}
            style={{
              width: '100%',
              padding: '5px 24px 5px 10px',
              fontSize: '0.78rem',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              outline: 'none',
              background: '#fff'
            }}
          />
          <span
            onClick={() => setIsToolbarDropdownOpen(!isToolbarDropdownOpen)}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: 'pointer',
              fontSize: '0.68rem',
              color: '#64748b'
            }}
          >
            {isToolbarDropdownOpen ? '▲' : '▼'}
          </span>

          {/* Options Dropdown Menu */}
          {isToolbarDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              minWidth: 220,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              maxHeight: 220,
              overflowY: 'auto',
              zIndex: 9999,
              marginTop: 3,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
            }}>
              <div
                onClick={() => handleSelectToolbarCustomer(null)}
                style={{
                  padding: '7px 10px',
                  fontSize: '0.78rem',
                  color: '#64748b',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f1f5f9',
                  background: !customerId ? '#f8fafc' : '#fff'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = !customerId ? '#f8fafc' : '#fff'; }}
              >
                — Clear / Select Customer —
              </div>
              {customers
                .filter(c => {
                  const q = (toolbarSearchQuery || '').toLowerCase();
                  return (c.name || '').toLowerCase().includes(q) || (c.mobile || '').includes(q);
                })
                .map((c) => {
                  const hasRealName = Boolean(c.name && c.name.trim());
                  const displayName = hasRealName ? c.name.trim() : (c.mobile ? `Customer (${c.mobile})` : `Customer #${c.id}`);
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectToolbarCustomer(c)}
                      style={{
                        padding: '7px 10px',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid #f8fafc',
                        background: String(customerId) === String(c.id) ? '#f0fdfa' : '#fff',
                        color: String(customerId) === String(c.id) ? '#0f766e' : '#1e293b',
                        fontWeight: String(customerId) === String(c.id) ? 600 : 400
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={(e) => { 
                        e.currentTarget.style.background = String(customerId) === String(c.id) ? '#f0fdfa' : '#fff'; 
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600 }}>{displayName}</span>
                        {hasRealName && c.mobile && (
                          <span style={{ color: '#64748b', marginLeft: 5, fontSize: '0.72rem' }}>({c.mobile})</span>
                        )}
                      </div>
                      {c.state && <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>{c.state}</span>}
                    </div>
                  );
                })}
              {customers.filter(c => {
                const q = (toolbarSearchQuery || '').toLowerCase();
                return (c.name || '').toLowerCase().includes(q) || (c.mobile || '').includes(q);
              }).length === 0 && (
                <div style={{ padding: '8px 10px', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                  No customer matching "{toolbarSearchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
        <span className="crm-filter-label" style={{ fontSize: '0.72rem' }}>From:</span>
        <input type="date" className="crm-filter-date" style={{ fontSize: '0.78rem', padding: '5px 8px' }} value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="crm-filter-label" style={{ fontSize: '0.72rem' }}>To:</span>
        <input type="date" className="crm-filter-date" style={{ fontSize: '0.78rem', padding: '5px 8px' }} value={to} onChange={(e) => setTo(e.target.value)} />
        <button className="btn-primary" style={{ padding: '5px 12px', fontSize: '0.78rem' }} onClick={handleFilter} disabled={!customerId}>Apply</button>
        {(from || to || customerId) ? (
          <button 
            className="btn-primary" 
            style={{ background: '#6b7280', padding: '5px 10px', fontSize: '0.78rem' }} 
            onClick={() => { 
              setFrom(''); 
              setTo(''); 
              setCustomerId('');
              setToolbarSearchQuery('');
              setLedgerData(null);
            }}
          >
            Clear
          </button>
        ) : null}

        {/* Add Dues Button */}
        <button 
          className="btn-primary"
          style={{ 
            background: customerId ? '#0d9488' : '#94a3b8', 
            padding: '5px 12px', 
            fontSize: '0.78rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 4,
            fontWeight: 600,
            cursor: customerId ? 'pointer' : 'not-allowed'
          }}
          onClick={() => {
            if (!customerId) {
              popup.showError('Please select a customer from the dropdown above first.');
              return;
            }
            openAddDuesModal();
          }}
          disabled={!customerId}
          title={customerId ? "Add dues for the selected customer" : "Select a customer first to add dues"}
        >
          ➕ Add Dues
        </button>

        {/* Receive Payment Button */}
        <button 
          className="btn-primary"
          style={{ 
            background: customerId ? '#16a34a' : '#94a3b8', 
            padding: '5px 12px', 
            fontSize: '0.78rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 4,
            fontWeight: 600,
            cursor: customerId ? 'pointer' : 'not-allowed'
          }}
          onClick={() => {
            if (!customerId) {
              popup.showError('Please select a customer from the dropdown above first.');
              return;
            }
            openReceivePaymentModal();
          }}
          disabled={!customerId}
          title={customerId ? "Record payment received from customer" : "Select a customer first to record payment"}
        >
          💵 Receive Payment
        </button>
        
        {/* Action Buttons */}
        {ledgerData && (
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            <button 
              className="btn-primary" 
              style={{ background: '#3b82f6', padding: '5px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }} 
              onClick={() => {
                const customerName = ledgerData.customer.name;
                const printWindow = window.open('', '_blank');
                const rowsHtml = ledgerData.ledgerRows.map(row => `
                  <tr style="${row.type === 'opening' ? 'background-color: #eff6ff;' : row.type === 'payment' ? 'background-color: #f0fdf4;' : row.type === 'cancelled' ? 'background-color: #fafafa; opacity: 0.6;' : ''}">
                    <td>${new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td style="font-weight: bold;">${row.type.toUpperCase()}</td>
                    <td>${row.description || ''}</td>
                    <td>${row.invoiceNo || '—'}</td>
                    <td>${row.paymentMethod || '—'}</td>
                    <td style="text-align: right; color: #c2410c;">${row.debit > 0 ? fmt(row.debit) : '—'}</td>
                    <td style="text-align: right; color: #15803d;">${row.credit > 0 ? fmt(row.credit) : '—'}</td>
                    <td style="text-align: right; font-weight: bold; color: ${row.balance > 0 ? '#dc2626' : '#10b981'};">${fmt(row.balance)}</td>
                    <td>${row.status ? row.status.toUpperCase() : '—'}</td>
                  </tr>
                `).join('');
                
                printWindow.document.write(`
                  <html>
                    <head>
                      <title>Ledger Statement - ${customerName}</title>
                      <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                        body { 
                          font-family: 'Inter', -apple-system, sans-serif; 
                          padding: 40px; 
                          color: #1f2937; 
                          background-color: #fff;
                          line-height: 1.5;
                        }
                        .header-container {
                          display: flex;
                          justify-content: space-between;
                          align-items: flex-start;
                          border-bottom: 2px solid #f3f4f6;
                          padding-bottom: 20px;
                          margin-bottom: 25px;
                        }
                        .brand-title {
                          font-size: 1.8rem;
                          font-weight: 800;
                          color: #111827;
                          letter-spacing: -0.025em;
                          margin: 0;
                        }
                        .brand-subtitle {
                          font-size: 0.85rem;
                          color: #6b7280;
                          margin: 2px 0 0 0;
                        }
                        .info-grid { 
                          display: grid; 
                          grid-template-columns: repeat(4, 1fr); 
                          gap: 16px; 
                          margin-bottom: 25px; 
                          background-color: #f9fafb;
                          border: 1px solid #e5e7eb; 
                          padding: 16px; 
                          border-radius: 8px; 
                        }
                        .info-item { }
                        .info-label { 
                          color: #9ca3af; 
                          text-transform: uppercase; 
                          font-weight: 700; 
                          font-size: 0.65rem; 
                          letter-spacing: 0.05em;
                          margin-bottom: 4px;
                        }
                        .info-value {
                          font-size: 0.9rem;
                          font-weight: 600;
                          color: #1f2937;
                        }
                        .summary-grid { 
                          display: grid; 
                          grid-template-columns: repeat(6, 1fr); 
                          gap: 12px; 
                          margin-bottom: 30px; 
                        }
                        .card { 
                          border: 1px solid #e5e7eb;
                          border-left: 4px solid #ddd; 
                          padding: 12px 14px; 
                          background: #fff; 
                          border-radius: 6px;
                          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                        }
                        .card-label {
                          font-size: 0.68rem;
                          font-weight: 700;
                          color: #6b7280;
                          text-transform: uppercase;
                          letter-spacing: 0.025em;
                          margin-bottom: 4px;
                        }
                        .card-value {
                          font-size: 1.05rem;
                          font-weight: 700;
                        }
                        table { 
                          width: 100%; 
                          border-collapse: collapse; 
                          margin-top: 10px; 
                          font-size: 0.85rem; 
                        }
                        th, td { 
                          border-bottom: 1px solid #e5e7eb; 
                          padding: 12px 14px; 
                          text-align: left; 
                        }
                        th { 
                          background-color: #f8fafc; 
                          font-weight: 600; 
                          color: #475569;
                          font-size: 0.75rem;
                          text-transform: uppercase;
                          letter-spacing: 0.05em;
                          border-top: 1px solid #e5e7eb;
                        }
                        .amount {
                          font-family: 'Courier New', Courier, monospace;
                          font-weight: 600;
                        }
                        @media print {
                          .no-print { display: none !important; }
                          body { padding: 0; }
                        }
                      </style>
                    </head>
                    <body>
                      <div class="header-container">
                        <div>
                          <h1 class="brand-title">${ledgerData.admin?.business_name || 'Ledger Statement'}</h1>
                          <p class="brand-subtitle">Financial Account Statement</p>
                        </div>
                        <div style="text-align: right;">
                          <button class="no-print" onclick="window.print()" style="padding: 8px 18px; background: #111827; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);">Print Statement</button>
                          <p style="font-size: 0.78rem; margin: 8px 0 0 0; color: #6b7280;">Statement Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                      </div>
                      
                      <!-- Two Column Info Section: Our Profile vs Customer Profile -->
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                        <!-- Our Business Details -->
                        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background-color: #fcfcfc;">
                          <div style="font-size: 0.7rem; color: #9ca3af; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; border-bottom: 1px solid #f3f4f6; padding-bottom: 6px; margin-bottom: 8px;">Statement From (Our Details)</div>
                          <div style="font-size: 0.95rem; font-weight: 700; color: #111827;">${ledgerData.admin?.business_name || 'StayBillPro'}</div>
                          <div style="font-size: 0.8rem; color: #4b5563; margin-top: 4px;">
                            ${ledgerData.admin?.address ? ledgerData.admin.address + ', ' : ''}
                            ${ledgerData.admin?.city ? ledgerData.admin.city + ' - ' : ''}${ledgerData.admin?.pincode || ''}<br/>
                            ${ledgerData.admin?.state || ''}<br/>
                            <strong>Mobile:</strong> ${ledgerData.admin?.phone || '—'}<br/>
                            <strong>Email:</strong> ${ledgerData.admin?.email || '—'}<br/>
                            <strong>GSTIN:</strong> ${ledgerData.admin?.gst_number || '—'}
                          </div>
                        </div>

                        <!-- Customer Details -->
                        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background-color: #fcfcfc;">
                          <div style="font-size: 0.7rem; color: #9ca3af; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; border-bottom: 1px solid #f3f4f6; padding-bottom: 6px; margin-bottom: 8px;">Statement To (Customer Details)</div>
                          <div style="font-size: 0.95rem; font-weight: 700; color: #111827;">${ledgerData.customer.name}</div>
                          <div style="font-size: 0.8rem; color: #4b5563; margin-top: 4px;">
                            ${ledgerData.customer.billingAddress || '—'}<br/>
                            <strong>Billing State:</strong> ${ledgerData.customer.state || '—'}<br/>
                            <strong>Mobile:</strong> ${ledgerData.customer.mobile || '—'}<br/>
                            <strong>Email:</strong> ${ledgerData.customer.email || '—'}<br/>
                            <strong>GSTIN:</strong> ${ledgerData.customer.gstin || '—'}
                          </div>
                        </div>
                      </div>

                      <div class="summary-grid">
                        <div class="card" style="border-left-color: #14b8a6;"><div class="card-label">Opening Bal.</div><div class="card-value" style="color: #14b8a6;">${fmt(s.openingBalance)}</div></div>
                        <div class="card" style="border-left-color: #0ea5e9;"><div class="card-label">Total Sales</div><div class="card-value" style="color: #0ea5e9;">${fmt(s.totalSales)}</div></div>
                        <div class="card" style="border-left-color: #10b981;"><div class="card-label">Total Paid</div><div class="card-value" style="color: #10b981;">${fmt(s.totalPaid)}</div></div>
                        <div class="card" style="border-left-color: #f59e0b;"><div class="card-label">Pending</div><div class="card-value" style="color: #f59e0b;">${fmt(s.totalPending)}</div></div>
                        <div class="card" style="border-left-color: #8b5cf6;"><div class="card-label">Discount</div><div class="card-value" style="color: #8b5cf6;">${fmt(s.totalDiscount)}</div></div>
                        <div class="card" style="border-left-color: ${s.currentDues > 0 ? '#ef4444' : '#10b981'};"><div class="card-label">Current Dues</div><div class="card-value" style="color: ${s.currentDues > 0 ? '#ef4444' : '#10b981'};">${fmt(s.currentDues)}</div></div>
                      </div>

                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Invoice #</th>
                            <th>Payment</th>
                            <th style="text-align: right;">Debit (Dr)</th>
                            <th style="text-align: right;">Credit (Cr)</th>
                            <th style="text-align: right;">Balance</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${rowsHtml}
                        </tbody>
                        <tfoot>
                          <tr style="background: #f8fafc; font-weight: 700; border-top: 2px solid #e5e7eb;">
                            <td colspan="5" style="color: #1e293b;">Closing Statement Balance</td>
                            <td style="text-align: right; color: #c2410c;" class="amount">${fmt(ledgerData.summary.totalSales)}</td>
                            <td style="text-align: right; color: #15803d;" class="amount">${fmt(ledgerData.summary.totalPaid)}</td>
                            <td style="text-align: right; color: ${s.currentDues > 0 ? '#dc2626' : '#10b981'};" class="amount">${fmt(s.currentDues)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </body>
                  </html>
                `);
                printWindow.document.close();
              }}
            >
              📥 PDF
            </button>
            
            <button 
              className="btn-primary" 
              style={{ background: '#25d366', padding: '5px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => {
                const phone = ledgerData.customer.mobile ? ledgerData.customer.mobile.replace(/\D/g, '') : '';
                // Pre-formatted international prefix if missing (assuming 91 for standard Indian numbers or direct use)
                const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
                const message = `Hello ${ledgerData.customer.name},\nHere is your ledger summary statement:\n*Opening Balance:* ${fmt(s.openingBalance)}\n*Total Sales:* ${fmt(s.totalSales)}\n*Total Paid:* ${fmt(s.totalPaid)}\n*Current Dues:* ${fmt(s.currentDues)}\nThank you!`;
                window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
              }}
              disabled={!ledgerData.customer.mobile}
            >
              💬 WhatsApp
            </button>
            
            <button 
              className="btn-primary" 
              style={{ background: '#ea4335', padding: '5px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={async () => {
                if (!ledgerData.customer.email) {
                  popup.showError('This customer does not have an email address configured.');
                  return;
                }
                const confirmSend = await popup.confirm(`Send ledger statement email directly to ${ledgerData.customer.email}?`);
                if (!confirmSend) return;

                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch(`${API_BASE}/customers/${customerId}/ledger/email`, {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({ from, to })
                  });
                  const data = await res.json();
                  if (res.ok) {
                    popup.showSuccess('Email sent successfully directly to the customer!');
                  } else {
                    popup.showError(`Failed to send email: ${data.message || 'Unknown error'}`);
                  }
                } catch (err) {
                  console.error(err);
                  popup.showError('Error sending email. Please verify backend configurations.');
                }
              }}
            >
              ✉ Direct Email
            </button>
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && <div className="crm-error" style={{ marginBottom: 12 }}>⚠ {error}</div>}

      {/* ── No customer selected ── */}
      {!customerId && (
        <div className="crm-content">
          <div className="crm-empty">
            <div className="crm-empty-icon">📒</div>
            <p>Select a customer above to view their ledger statement.</p>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && <div className="crm-content"><div className="crm-loading">Loading ledger…</div></div>}

      {/* ── Ledger content ── */}
      {!loading && ledgerData && (
        <>
          {/* Customer info strip */}
          <div style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
            padding: '7px 14px', marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700, marginBottom: 1 }}>Customer</div>
              <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.82rem' }}>{ledgerData.customer.name}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700, marginBottom: 1 }}>Mobile</div>
              <div style={{ fontWeight: 500, fontSize: '0.78rem' }}>{ledgerData.customer.mobile || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700, marginBottom: 1 }}>GSTIN</div>
              <div style={{ fontWeight: 500, fontSize: '0.78rem' }}>{ledgerData.customer.gstin || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700, marginBottom: 1 }}>State</div>
              <div style={{ fontWeight: 500, fontSize: '0.78rem' }}>{ledgerData.customer.state || '—'}</div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="summary-cards-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: 8, gap: 8 }}>
            {[
              { label: 'Opening Bal.', value: fmt(s.openingBalance), color: '#14b8a6' },
              { label: 'Total Sales',  value: fmt(s.totalSales),      color: '#0ea5e9' },
              { label: 'Total Paid',   value: fmt(s.totalPaid),       color: '#10b981' },
              { label: 'Pending',      value: fmt(s.totalPending),    color: '#f59e0b' },
              { label: 'Discount',     value: fmt(s.totalDiscount),   color: '#8b5cf6' },
              { label: 'Current Dues', value: fmt(s.currentDues),     color: s.currentDues > 0 ? '#ef4444' : '#10b981' },
            ].map((card) => (
              <div key={card.label} className="summary-card" style={{ borderLeft: `3px solid ${card.color}`, padding: '8px 10px' }}>
                <p className="summary-card-label" style={{ fontSize: '0.62rem', marginBottom: 3 }}>{card.label}</p>
                <p className="summary-card-value" style={{ color: card.color, fontSize: '0.85rem' }}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Invoice counts */}
          <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: 8 }}>
            <strong>{s.totalInvoices}</strong> invoices &nbsp;·&nbsp;
            <strong style={{ color: '#10b981' }}>{s.paidInvoices}</strong> paid &nbsp;·&nbsp;
            <strong style={{ color: '#f59e0b' }}>{s.pendingInvoices}</strong> pending
          </div>

          {/* Ledger table */}
          <div className="crm-content">
            {ledgerData.ledgerRows.length === 0 ? (
              <div className="crm-empty">
                <div className="crm-empty-icon">📄</div>
                <p>No transactions found{from || to ? ' for the selected date range' : ''}.</p>
              </div>
            ) : (
              <div className="crm-table-wrap">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Invoice #</th>
                      <th>Payment</th>
                      <th style={{ textAlign: 'right' }}>Debit (Dr)</th>
                      <th style={{ textAlign: 'right' }}>Credit (Cr)</th>
                      <th style={{ textAlign: 'right' }}>Balance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerData.ledgerRows.map((row, idx) => (
                      <tr key={idx} style={rowStyle(row.type)}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                          {new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td>
                          <span style={{
                            padding: '2px 7px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700,
                            background: row.type === 'opening' ? '#eff6ff'
                              : row.type === 'payment'  ? '#f0fdf4'
                              : row.type === 'sale'     ? '#fff7ed'
                              : '#f3f4f6',
                            color: row.type === 'opening' ? '#1d4ed8'
                              : row.type === 'payment'  ? '#15803d'
                              : row.type === 'sale'     ? '#c2410c'
                              : '#6b7280',
                          }}>
                            {row.type === 'opening'   ? 'Opening'
                              : row.type === 'payment' ? 'Payment'
                              : row.type === 'sale'    ? 'Sale'
                              : 'Cancelled'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: '#374151', maxWidth: 220 }}>{row.description}</td>
                        <td style={{ fontSize: '0.78rem', color: '#14b8a6', fontWeight: 600 }}>
                          {row.invoiceNo || '—'}
                        </td>
                        <td style={{ fontSize: '0.78rem', textTransform: 'capitalize', color: '#6b7280' }}>
                          {row.paymentMethod || '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#c2410c', fontSize: '0.85rem' }}>
                          {row.debit > 0 ? fmt(row.debit) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#15803d', fontSize: '0.85rem' }}>
                          {row.credit > 0 ? fmt(row.credit) : '—'}
                        </td>
                        <td style={{
                          textAlign: 'right', fontWeight: 700, fontSize: '0.88rem',
                          color: row.balance > 0 ? '#dc2626' : '#10b981',
                        }}>
                          {fmt(row.balance)}
                        </td>
                        <td>
                          {row.status ? (
                            <span style={{
                              padding: '2px 7px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700,
                              background: row.status === 'paid' ? '#dcfce7' : row.status === 'pending' ? '#fef9c3' : '#f3f4f6',
                              color: row.status === 'paid' ? '#15803d' : row.status === 'pending' ? '#a16207' : '#6b7280',
                            }}>
                              {row.status.toUpperCase()}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Closing balance row */}
                  <tfoot>
                    <tr style={{ background: '#f9fafb', fontWeight: 700 }}>
                      <td colSpan={5} style={{ fontWeight: 700, fontSize: '0.82rem', color: '#111827', padding: '8px 10px' }}>
                        Closing Balance
                      </td>
                      <td style={{ textAlign: 'right', color: '#c2410c', fontSize: '0.85rem', padding: '8px 10px' }}>
                        {fmt(ledgerData.summary.totalSales)}
                      </td>
                      <td style={{ textAlign: 'right', color: '#15803d', fontSize: '0.85rem', padding: '8px 10px' }}>
                        {fmt(ledgerData.summary.totalPaid)}
                      </td>
                      <td style={{
                        textAlign: 'right', fontSize: '0.9rem', fontWeight: 800, padding: '8px 10px',
                        color: s.currentDues > 0 ? '#dc2626' : '#10b981',
                      }}>
                        {fmt(s.currentDues)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function CustomersScreen({ defaultTab }) {
  const popup = usePopup();
  const [viewMode, setViewMode] = useState(defaultTab || 'manage');
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');



  useEffect(() => {
    if (defaultTab) setViewMode(defaultTab);
  }, [defaultTab]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch customers');
      setCustomers(await res.json());
    } catch {
      setError('Could not load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Payments state
  const [payments, setPayments] = useState([]);
  const [payFilterCustomer, setPayFilterCustomer] = useState('');
  const [payFilterFrom, setPayFilterFrom] = useState('');
  const [payFilterTo, setPayFilterTo] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  const fetchPayments = useCallback(async () => {
    setPayLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (payFilterCustomer) params.append('customerId', payFilterCustomer);
      if (payFilterFrom) params.append('from', payFilterFrom);
      if (payFilterTo) params.append('to', payFilterTo);

      const res = await fetch(`${API_BASE}/customers/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch payments');
      setPayments(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setPayLoading(false);
    }
  }, [payFilterCustomer, payFilterFrom, payFilterTo]);

  useEffect(() => {
    if (viewMode === 'payments') {
      fetchPayments();
    }
  }, [viewMode, fetchPayments]);

  // Returns state
  const [returnsList, setReturnsList] = useState([]);
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [returnFilterCustomer, setReturnFilterCustomer] = useState('');
  const [returnFilterFrom, setReturnFilterFrom] = useState('');
  const [returnFilterTo, setReturnFilterTo] = useState('');

  const fetchReturnsHistory = useCallback(async () => {
    setReturnsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (returnFilterCustomer) params.append('customerId', returnFilterCustomer);
      if (returnFilterFrom) params.append('startDate', returnFilterFrom);
      if (returnFilterTo) params.append('endDate', returnFilterTo);

      const res = await fetch(`${API_BASE}/returns?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch returns');
      const data = await res.json();
      setReturnsList(data.returns || []);
    } catch (err) {
      console.error(err);
    } finally {
      setReturnsLoading(false);
    }
  }, [returnFilterCustomer, returnFilterFrom, returnFilterTo]);

  useEffect(() => {
    if (viewMode === 'returns') {
      fetchReturnsHistory();
    }
  }, [viewMode, fetchReturnsHistory]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const openAdd = () => { setEditData(null); setShowModal(true); };
  const openEdit = (c) => { setEditData(c); setShowModal(true); };

  const handleFormSuccess = () => {
    setShowModal(false);
    setEditData(null);
    setSuccessMsg('Customer saved successfully!');
    fetchCustomers();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDelete = async (id) => {
    const ok = await popup.confirm('Delete this customer? This cannot be undone.');
    if (!ok) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/customers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch {
      popup.showError('Failed to delete customer.');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.mobile || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.state || '').toLowerCase().includes(q) ||
      (c.gstin || '').toLowerCase().includes(q)
    );
  });

  const typeBadgeClass = (type) => {
    if (!type) return 'default';
    const t = type.toLowerCase();
    if (t === 'consumer') return 'consumer';
    if (t === 'business') return 'business';
    if (t === 'distributor') return 'distributor';
    return 'default';
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const pageTitle = {
    manage: 'Manage Customers',
    ledger: 'Customer Ledger',
    dues: 'Outstanding Dues',
    payments: 'Payment History',
    orders: 'Order History',
    returns: 'Return History',
  }[viewMode] || 'Customers';

  return (
    <div className="customers-screen">

      {showModal && (
        <CustomerFormModal
          onClose={() => { setShowModal(false); setEditData(null); }}
          onSuccess={handleFormSuccess}
          editData={editData}
        />
      )}

      {/* ── Page Header ── */}
      <div className="crm-header">
        <h1 className="crm-page-title">{pageTitle}</h1>
        <p className="crm-page-sub">
          {viewMode === 'manage' && `${customers.length} total customer${customers.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* ══════════════════════════════════
          MANAGE TAB
      ══════════════════════════════════ */}
      {viewMode === 'manage' && (
        <>
          {/* Toast / Error */}
          {successMsg && (
            <div className="crm-toast">✓ {successMsg}</div>
          )}
          {error && (
            <div className="crm-error">⚠ {error}</div>
          )}

          {/* Toolbar */}
          <div className="crm-toolbar">
            <input
              type="text"
              className="crm-search"
              placeholder="Search by name, phone, email, state, GSTIN…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn-add-customer" onClick={openAdd}>
              + Add Customer
            </button>
          </div>

          {/* Table Card */}
          <div className="crm-content">
            {loading ? (
              <div className="crm-loading">Loading customers…</div>
            ) : (
              <>
                <div className="crm-table-wrap">
                  <table className="crm-table">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th>Customer</th>
                        <th>Mobile</th>
                        <th>Email</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>GSTIN</th>
                        <th>State</th>
                        <th>Opening Bal.</th>
                        <th>Balance Type</th>
                        <th>Credit Limit</th>
                        <th>Balance</th>
                        <th style={{ width: 80 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={13}>
                            <div className="crm-empty">
                              <div className="crm-empty-icon">
                                {customers.length === 0 ? '👤' : '🔍'}
                              </div>
                              <p>
                                {customers.length === 0
                                  ? 'No customers yet. Click "+ Add Customer" to get started.'
                                  : 'No results match your search.'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filtered.map((c, idx) => (
                          <tr key={c.id}>
                            {/* # */}
                            <td><span className="cell-num">{idx + 1}</span></td>

                            {/* Customer name */}
                            <td>
                              <div className="cell-name">{c.name || '—'}</div>
                            </td>

                            {/* Mobile */}
                            <td>
                              <span className="cell-phone">{c.mobile || c.phone || <span className="cell-muted">—</span>}</span>
                            </td>

                            {/* Email */}
                            <td className="cell-email">
                              {c.email
                                ? <a href={`mailto:${c.email}`}>{c.email}</a>
                                : <span className="cell-muted">—</span>}
                            </td>

                            {/* Category */}
                            <td>
                              {c.category
                                ? <span className="cat-badge">{c.category}</span>
                                : <span className="cell-muted">—</span>}
                            </td>

                            {/* Customer Type */}
                            <td>
                              <span className={`type-badge ${typeBadgeClass(c.customerType)}`}>
                                {c.customerType || 'Consumer'}
                              </span>
                            </td>

                            {/* GSTIN */}
                            <td>
                              {c.gstin
                                ? <span className="cell-gstin">{c.gstin}</span>
                                : <span className="cell-muted">—</span>}
                            </td>

                            {/* State */}
                            <td style={{ fontSize: '0.85rem', color: '#374151' }}>
                              {c.state || <span className="cell-muted">—</span>}
                            </td>

                            {/* Opening Balance */}
                            <td style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500 }}>
                              {fmt(c.openingBalance)}
                            </td>

                            {/* Balance Type */}
                            <td>
                              {c.balanceType ? (
                                <span className="cat-badge" style={{
                                  background: c.balanceType === 'receivable' ? '#eff6ff' : '#fff7ed',
                                  color: c.balanceType === 'receivable' ? '#1d4ed8' : '#c2410c',
                                }}>
                                  {c.balanceType.charAt(0).toUpperCase() + c.balanceType.slice(1)}
                                </span>
                              ) : <span className="cell-muted">—</span>}
                            </td>

                            {/* Credit Limit */}
                            <td>
                              <span className="cell-credit">
                                {c.creditLimit ? fmt(c.creditLimit) : <span className="cell-muted">—</span>}
                              </span>
                            </td>

                            {/* Balance */}
                            <td>
                              <span className={`cell-balance ${Number(c.balance) > 0 ? 'positive' : 'zero'}`}>
                                {fmt(c.balance)}
                              </span>
                            </td>

                            {/* Actions */}
                            <td>
                              <div className="cell-actions">
                                <button
                                  className="btn-icon-edit"
                                  title="Edit customer"
                                  onClick={() => openEdit(c)}
                                >
                                  ✏
                                </button>
                                <button
                                  className="btn-icon-del"
                                  title="Delete customer"
                                  onClick={() => handleDelete(c.id)}
                                  disabled={deletingId === c.id}
                                >
                                  {deletingId === c.id ? '…' : '🗑'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table footer */}
                {customers.length > 0 && (
                  <div className="crm-table-footer">
                    <span className="crm-count">
                      Showing <strong>{filtered.length}</strong> of <strong>{customers.length}</strong> customers
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════
          LEDGER TAB
      ══════════════════════════════════ */}
      {viewMode === 'ledger' && (
        <LedgerTab customers={customers} onCustomerUpdated={fetchCustomers} />
      )}

      {/* ══════════════════════════════════
          DUES TAB
      ══════════════════════════════════ */}
      {viewMode === 'dues' && (
        <>
          <div className="summary-cards-grid">
            {[
              { label: 'Total Outstanding', value: fmt(customers.reduce((s, c) => s + Number(c.balance || 0), 0)), color: '#dc2626' },
              { label: 'Customers with Dues', value: customers.filter((c) => c.balance > 0).length, color: '#f59e0b' },
              { label: 'Total Customers', value: customers.length, color: '#0f766e' },
            ].map((card) => (
              <div key={card.label} className="summary-card" style={{ borderLeft: `3px solid ${card.color}` }}>
                <p className="summary-card-label">{card.label}</p>
                <p className="summary-card-value" style={{ color: card.color }}>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="crm-content">
            <div className="crm-table-wrap">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Mobile</th>
                    <th>State</th>
                    <th>Outstanding</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.filter((c) => c.balance > 0).length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="crm-empty">
                          <div className="crm-empty-icon">✅</div>
                          <p>No outstanding dues. All customers are settled!</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    customers.filter((c) => c.balance > 0).map((c) => (
                      <tr key={c.id}>
                        <td><span className="cell-name">{c.name}</span></td>
                        <td className="cell-phone">{c.mobile || '—'}</td>
                        <td>{c.state || <span className="cell-muted">—</span>}</td>
                        <td><span className="cell-balance positive">{fmt(c.balance)}</span></td>
                        <td>
                          <button 
                            className="btn-primary" 
                            style={{ padding: '4px 10px', fontSize: '0.72rem', background: '#25d366', border: 'none', cursor: 'pointer' }}
                            onClick={() => {
                              const mobileNum = c.mobile || c.phone || '';
                              const cleanPhone = mobileNum.replace(/\D/g, '');
                              if (!cleanPhone) {
                                popup.showError('Customer phone number is invalid.');
                                return;
                              }
                              const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                              const message = `Hello ${c.name},\nThis is a friendly reminder that you have outstanding dues of *${fmt(c.balance)}* in your account statement.\nPlease clear it at your earliest convenience.\nThank you!`;
                              
                              // Use api.whatsapp.com which opens robustly on desktop apps, browsers, and mobile devices
                              const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
                              window.open(url, '_blank');
                            }}
                          >
                            💬 Send Reminder
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════
          PAYMENTS TAB
      ══════════════════════════════════ */}
      {/* ══════════════════════════════════
          PAYMENTS TAB
      ══════════════════════════════════ */}
      {viewMode === 'payments' && (
        <>
          {/* Summary cards for payments */}
          <div className="summary-cards-grid" style={{ marginBottom: 12 }}>
            {[
              { label: 'Total Payments Collected', value: fmt(payments.reduce((s, p) => s + Number(p.total_amount || 0), 0)), color: '#10b981' },
              { label: 'Total Payments Received Count', value: payments.length, color: '#14b8a6' },
            ].map((card) => (
              <div key={card.label} className="summary-card" style={{ borderLeft: `3px solid ${card.color}` }}>
                <p className="summary-card-label">{card.label}</p>
                <p className="summary-card-value" style={{ color: card.color }}>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="crm-toolbar" style={{ marginBottom: 12, gap: 8 }}>
            <span className="crm-filter-label" style={{ fontSize: '0.75rem' }}>From:</span>
            <input 
              type="date" 
              className="crm-filter-date" 
              value={payFilterFrom} 
              onChange={(e) => setPayFilterFrom(e.target.value)} 
              style={{ fontSize: '0.78rem', padding: '5px' }}
            />
            <span className="crm-filter-label" style={{ fontSize: '0.75rem' }}>To:</span>
            <input 
              type="date" 
              className="crm-filter-date" 
              value={payFilterTo} 
              onChange={(e) => setPayFilterTo(e.target.value)} 
              style={{ fontSize: '0.78rem', padding: '5px' }}
            />
            <select 
              className="crm-filter-select" 
              value={payFilterCustomer} 
              onChange={(e) => setPayFilterCustomer(e.target.value)} 
              style={{ minWidth: 180, fontSize: '0.78rem', padding: '5px' }}
            >
              <option value="">All Customers</option>
              {customers.map((c) => {
                const displayName = (c.name && c.name.trim()) 
                  ? c.name.trim() 
                  : (c.mobile ? `Customer (${c.mobile})` : `Customer #${c.id}`);
                return (
                  <option key={c.id} value={c.id}>{displayName}</option>
                );
              })}
            </select>
            <button className="btn-primary" onClick={fetchPayments} style={{ padding: '5px 12px', fontSize: '0.78rem' }}>Filter</button>
            {(payFilterFrom || payFilterTo || payFilterCustomer) && (
              <button 
                className="btn-primary" 
                style={{ background: '#6b7280', padding: '5px 10px', fontSize: '0.78rem' }} 
                onClick={() => {
                  setPayFilterCustomer('');
                  setPayFilterFrom('');
                  setPayFilterTo('');
                  // Clear calls dynamically
                  setTimeout(() => fetchPayments(), 0);
                }}
              >
                Clear
              </button>
            )}
          </div>

          <div className="crm-content">
            {payLoading ? (
              <div className="crm-loading">Loading payment history…</div>
            ) : payments.length === 0 ? (
              <div className="crm-empty">
                <div className="crm-empty-icon">💳</div>
                <p>No payment records found.</p>
              </div>
            ) : (
              <div className="crm-table-wrap">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Mobile</th>
                      <th>Invoice #</th>
                      <th>Payment Method</th>
                      <th style={{ textAlign: 'right' }}>Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((pay, idx) => (
                      <tr key={pay.invoice_id}>
                        <td><span className="cell-num">{idx + 1}</span></td>
                        <td>{new Date(pay.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td><span className="cell-name">{pay.customer_name}</span></td>
                        <td className="cell-phone">{pay.customer_phone || '—'}</td>
                        <td style={{ color: '#14b8a6', fontWeight: 600 }}>POSINV{String(pay.invoice_id).padStart(2, '0')}</td>
                        <td>
                          <span style={{ 
                            textTransform: 'capitalize',
                            background: '#f3f4f6',
                            color: '#475569',
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: '0.72rem',
                            fontWeight: 600
                          }}>
                            {pay.payment_method || 'Cash'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#15803d' }}>{fmt(pay.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════
          RETURNS TAB
      ══════════════════════════════════ */}
      {viewMode === 'returns' && (
        <>
          <div className="crm-toolbar" style={{ marginBottom: 12, gap: 8 }}>
            <span className="crm-filter-label" style={{ fontSize: '0.75rem' }}>From:</span>
            <input 
              type="date" 
              className="crm-filter-date" 
              value={returnFilterFrom} 
              onChange={(e) => setReturnFilterFrom(e.target.value)} 
              style={{ fontSize: '0.78rem', padding: '5px' }}
            />
            <span className="crm-filter-label" style={{ fontSize: '0.75rem' }}>To:</span>
            <input 
              type="date" 
              className="crm-filter-date" 
              value={returnFilterTo} 
              onChange={(e) => setReturnFilterTo(e.target.value)} 
              style={{ fontSize: '0.78rem', padding: '5px' }}
            />
            <select 
              className="crm-filter-select" 
              value={returnFilterCustomer} 
              onChange={(e) => setReturnFilterCustomer(e.target.value)} 
              style={{ minWidth: 180, fontSize: '0.78rem', padding: '5px' }}
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button className="btn-primary" onClick={fetchReturnsHistory} style={{ padding: '5px 12px', fontSize: '0.78rem' }}>Filter</button>
            {(returnFilterFrom || returnFilterTo || returnFilterCustomer) && (
              <button 
                className="btn-primary" 
                style={{ background: '#6b7280', padding: '5px 10px', fontSize: '0.78rem' }} 
                onClick={() => {
                  setReturnFilterCustomer('');
                  setReturnFilterFrom('');
                  setReturnFilterTo('');
                  setTimeout(() => fetchReturnsHistory(), 0);
                }}
              >
                Clear
              </button>
            )}
          </div>

          <div className="crm-content">
          {returnsLoading ? (
            <div className="crm-loading">Loading return history…</div>
          ) : returnsList.length === 0 ? (
            <div className="crm-empty">
              <div className="crm-empty-icon">🔄</div>
              <p>No product returns or credit notes found.</p>
            </div>
          ) : (
            <div className="crm-table-wrap">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Original Invoice</th>
                    <th>Refund Amount</th>
                    <th>Payment Method</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {returnsList.map((ret) => (
                    <tr key={ret.id}>
                      <td>{new Date(ret.return_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td><span className="cell-name">{ret.customer_name || 'Walk-in'}</span></td>
                      <td style={{ color: '#14b8a6', fontWeight: 600 }}>POSINV{String(ret.invoice_id).padStart(2, '0')}</td>
                      <td style={{ fontWeight: 700, color: '#dc2626' }}>{fmt(ret.total_refund_amount)}</td>
                      <td style={{ textTransform: 'capitalize' }}>
                         <span style={{ 
                            background: '#f3f4f6',
                            color: '#475569',
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: '0.72rem',
                            fontWeight: 600
                          }}>
                           {ret.payment_method}
                         </span>
                      </td>
                      <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ret.reason || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
      )}

      {/* ══════════════════════════════════
          ORDERS TAB
      ══════════════════════════════════ */}
      {viewMode === 'orders' && (
        <div className="crm-content" style={{ padding: 20 }}>
          <div className="crm-empty">
            <div className="crm-empty-icon">📦</div>
            <p>Customer order history & service jobs will appear here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
