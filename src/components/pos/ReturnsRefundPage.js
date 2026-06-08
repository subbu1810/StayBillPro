import React, { useState } from 'react';
import { usePopup } from '../ui/PopupProvider';

/**
 * ReturnsRefundPage Component
 * Handle product returns and refund calculations
 */
export default function ReturnsRefundPage() {
  const popup = usePopup();
  const [invoiceId, setInvoiceId] = useState('');
  const [invoiceData, setInvoiceData] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundMode, setRefundMode] = useState('');

  const API_BASE = process.env.REACT_APP_API_URL || "https://staybillproapi.ssquareg.tech/api";

  const searchInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceId) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/billing/details/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (res.ok && data.success && data.invoice) {
        setInvoiceData({
          id: data.invoice.id,
          customer: data.invoice.customer_name || 'Walk-in',
          date: data.invoice.created_at ? data.invoice.created_at.split('T')[0] : '',
          items: data.items.map(i => ({
            id: i.product_id,
            itemId: i.id, // The invoice_item id
            name: i.item_name,
            price: Number(i.unit_price),
            qty: i.quantity,
            returnedQty: Number(i.returned_qty) || 0,
            availableQty: i.quantity - (Number(i.returned_qty) || 0)
          })),
          total: Number(data.invoice.total_amount),
          mode: data.invoice.payment_method
        });
        setRefundMode(data.invoice.payment_method);
        setReturnItems([]);
      } else {
        popup.showError(data.message || 'Invoice not found');
        setInvoiceData(null);
      }
    } catch (err) {
      console.error(err);
      popup.showError('Error searching for invoice');
    } finally {
      setLoading(false);
    }
  };

  const toggleItemForReturn = (item) => {
    const isReturning = returnItems.find(i => i.id === item.id);
    if (isReturning) {
      setReturnItems(returnItems.filter(i => i.id !== item.id));
    } else {
      setReturnItems([...returnItems, { ...item, returnQty: 1 }]);
    }
  };

  const calculateRefund = () => {
    return returnItems.reduce((acc, item) => {
      // Assuming original invoice already included tax in unit_price or total,
      // here we just return unit_price * qty
      return acc + (item.price * item.returnQty);
    }, 0);
  };

  const refundAmount = calculateRefund();

  const processRefund = async () => {
    if (!invoiceData || returnItems.length === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      const payload = {
        invoiceId: invoiceData.id,
        reason: refundReason,
        paymentMethod: refundMode,
        items: returnItems.map(item => ({
          productId: item.id,
          quantity: item.returnQty,
          unitPrice: item.price,
          refundPrice: item.price
        }))
      };

      const res = await fetch(`${API_BASE}/returns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        popup.showSuccess('Refund Processed & Stock Updated!');
        // Reset form
        setInvoiceId('');
        setInvoiceData(null);
        setReturnItems([]);
        setRefundReason('');
      } else {
        popup.showError(data.message || 'Error processing refund');
      }
    } catch (err) {
      console.error(err);
      popup.showError('Network error while processing refund');
    }
  };

  return (
    <div className="pos-returns-container animate-pos-fade">
      <div className="returns-header">
        <h1>Sales Returns & Refunds</h1>
        <p>Process customer returns by searching for the original invoice</p>
      </div>

      <div className="returns-layout">
        {/* Left: Invoice Search */}
        <div className="returns-search-section cards-stack">
          <div className="returns-card">
            <h3>Find Invoice</h3>
            <form onSubmit={searchInvoice} className="search-form">
               <div className="input-with-button">
                 <input 
                   type="text" 
                   placeholder="Enter Invoice # (e.g. INV-1001)" 
                   value={invoiceId}
                   onChange={(e) => setInvoiceId(e.target.value)}
                 />
                 <button type="submit">Search</button>
               </div>
            </form>
          </div>

          {invoiceData && (
            <div className="returns-card invoice-preview-card animate-pos-slide-up">
              <div className="prev-header">
                <span className="inv-badge">{invoiceData.id}</span>
                <span className="inv-date">{invoiceData.date}</span>
              </div>
              <div className="prev-details">
                <div className="detail">
                  <span className="label">Customer</span>
                  <span className="value">{invoiceData.customer}</span>
                </div>
                <div className="detail">
                  <span className="label">Original Payment</span>
                  <span className="value">{invoiceData.mode}</span>
                </div>
              </div>

              <div className="items-to-select">
                <h4>Select Items to Return</h4>
                {invoiceData.items.map(item => {
                  const isSelected = returnItems.find(i => i.id === item.id);
                  const isFullyReturned = item.availableQty <= 0;
                  return (
                    <div 
                      key={item.id} 
                      className={`returnable-item ${isSelected ? 'selected' : ''}`} 
                      onClick={() => !isFullyReturned && toggleItemForReturn(item)}
                      style={isFullyReturned ? { opacity: 0.5, cursor: 'not-allowed', background: '#f9fafb', borderColor: '#e5e7eb' } : {}}
                    >
                      <div className="checkbox-indicator" style={isFullyReturned ? { borderColor: '#d1d5db', background: '#e5e7eb' } : {}}>
                        {isSelected ? '✓' : ''}
                      </div>
                      <div className="item-info">
                        <span className="name" style={isFullyReturned ? { color: '#9ca3af' } : {}}>
                          {item.name} {isFullyReturned ? '(Already Returned)' : ''}
                        </span>
                        <span className="meta">
                          Bought: {item.qty} pcs | Available to return: {item.availableQty} @ ₹{item.price}
                        </span>
                      </div>
                      <span className="item-price" style={isFullyReturned ? { color: '#9ca3af' } : {}}>
                        ₹{item.price * item.availableQty}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Refund Summary */}
        <div className="returns-refund-summary">
          <div className="returns-card summary-card">
            <h3>Refund Summary</h3>
            {returnItems.length === 0 ? (
              <div className="empty-summary">
                <span className="icon">🔄</span>
                <p>Select items from an invoice to calculate refund</p>
              </div>
            ) : (
              <div className="summary-content">
                <div className="return-items-list">
                  {returnItems.map(item => (
                    <div key={item.id} className="sum-item">
                      <span className="name">{item.name}</span>
                      <span className="val">₹{item.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                
                <div className="refund-totals">
                   <div className="row">
                     <span>Restocking Fee (0%)</span>
                     <span>₹0</span>
                   </div>
                   <div className="row grand">
                     <span>Total Refund Amount</span>
                     <span>₹{refundAmount.toLocaleString()}</span>
                   </div>
                </div>

                <div className="refund-mode">
                   <label>Refund Via</label>
                   <select value={refundMode} onChange={(e) => setRefundMode(e.target.value)}>
                     <option value="cash">Cash</option>
                     <option value="upi">UPI</option>
                     <option value="card">Card</option>
                     <option value="credit">Store Credit</option>
                   </select>
                </div>

                <div className="refund-reason">
                   <label>Reason for Return</label>
                   <textarea 
                     placeholder="e.g. Defective Product, Wrong Size..."
                     value={refundReason}
                     onChange={(e) => setRefundReason(e.target.value)}
                   ></textarea>
                </div>

                <button 
                  className="btn-process-refund" 
                  onClick={processRefund}
                  disabled={loading || returnItems.length === 0}
                >
                  {loading ? 'Processing...' : 'Complete Refund & Restock'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .pos-returns-container { padding: 2rem; height: 100%; overflow: auto; }
        .returns-header { margin-bottom: 2rem; }
        .returns-header h1 { font-size: 1.875rem; font-weight: 800; }
        .returns-header p { color: var(--pos-text-muted); }

        .returns-layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; align-items: start; }

        .returns-card { background: white; padding: 1.5rem; border-radius: var(--pos-radius-lg); border: 1px solid var(--pos-border); box-shadow: var(--pos-shadow-sm); }
        .returns-card h3 { margin-top: 0; margin-bottom: 1.25rem; font-size: 1.1rem; }

        .cards-stack { display: flex; flex-direction: column; gap: 1.5rem; }

        .input-with-button { display: flex; gap: 0.5rem; }
        .input-with-button input { flex: 1; padding: 0.75rem; border: 1.5px solid var(--pos-border); border-radius: 8px; font-size: 0.9rem; }
        .input-with-button button { padding: 0.75rem 1.5rem; background: var(--pos-primary); color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }

        .invoice-preview-card { border-left: 4px solid var(--pos-primary); }
        .prev-header { display: flex; justify-content: space-between; margin-bottom: 1rem; }
        .inv-badge { background: var(--pos-bg-main); padding: 4px 8px; border-radius: 4px; font-weight: 800; font-family: monospace; }
        .inv-date { color: var(--pos-text-muted); font-size: 0.85rem; }

        .prev-details { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--pos-bg-main); padding-bottom: 1rem; }
        .detail { display: flex; flex-direction: column; }
        .detail .label { font-size: 0.7rem; color: var(--pos-text-muted); font-weight: 700; text-transform: uppercase; }
        .detail .value { font-weight: 700; color: var(--pos-text-main); }

        .items-to-select h4 { font-size: 0.85rem; text-transform: uppercase; color: var(--pos-text-muted); margin-bottom: 1rem; }
        .returnable-item { display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border-radius: 8px; border: 1.5px solid var(--pos-border); margin-bottom: 0.75rem; cursor: pointer; transition: all 0.2s; }
        .returnable-item:hover { border-color: var(--pos-primary); background: var(--pos-bg-main); }
        .returnable-item.selected { border-color: var(--pos-primary); background: var(--pos-primary-soft, #f5f3ff); }
        .checkbox-indicator { width: 20px; height: 20px; border: 1.5px solid var(--pos-border); border-radius: 4px; background: white; display: flex; align-items: center; justify-content: center; font-weight: 900; color: var(--pos-primary); }
        .returnable-item.selected .checkbox-indicator { border-color: var(--pos-primary); }
        .item-info { flex: 1; display: flex; flex-direction: column; }
        .item-info .name { font-weight: 700; font-size: 0.9rem; }
        .item-info .meta { font-size: 0.75rem; color: var(--pos-text-muted); }
        .item-price { font-weight: 800; }

        .empty-summary { text-align: center; padding: 3rem 0; color: var(--pos-text-muted); }
        .empty-summary .icon { font-size: 3rem; opacity: 0.3; margin-bottom: 1rem; display: block; }

        .sum-item { display: flex; justify-content: space-between; padding: 0.5rem 0; font-size: 0.9rem; }
        .sum-item .name { font-weight: 600; }

        .refund-totals { border-top: 1px dashed var(--pos-border); margin-top: 1rem; padding-top: 1rem; }
        .refund-totals .row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem; }
        .refund-totals .row.grand { margin-top: 0.5rem; font-weight: 800; font-size: 1.25rem; color: var(--pos-danger); }

        .refund-mode, .refund-reason { margin-top: 1.5rem; }
        .refund-mode label, .refund-reason label { display: block; font-size: 0.8rem; font-weight: 800; color: var(--pos-text-muted); margin-bottom: 0.5rem; text-transform: uppercase; }
        .refund-mode select, .refund-reason textarea { width: 100%; padding: 0.75rem; border: 1.5px solid var(--pos-border); border-radius: 8px; font-family: inherit; }
        .refund-reason textarea { height: 80px; resize: none; }

        .btn-process-refund { width: 100%; margin-top: 2rem; padding: 1rem; background: var(--pos-danger); color: white; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.2); }
      `}</style>
    </div>
  );
}
