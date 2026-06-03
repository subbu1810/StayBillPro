import React, { useState } from 'react';

/**
 * ReturnsRefundPage Component
 * Handle product returns and refund calculations
 */
export default function ReturnsRefundPage() {
  const [invoiceId, setInvoiceId] = useState('');
  const [invoiceData, setInvoiceData] = useState(null);
  const [returnItems, setReturnItems] = useState([]);

  // Mock search function
  const searchInvoice = (e) => {
    e.preventDefault();
    if (!invoiceId) return;
    
    // Mock Data found
    setInvoiceData({
      id: invoiceId,
      customer: 'Rahul Sharma',
      date: '2026-04-15',
      items: [
        { id: 1, name: 'Samsung Galaxy S24', price: 79999, qty: 1, gst: 18 },
        { id: 3, name: 'Logitech G502 Mouse', price: 4500, qty: 2, gst: 12 },
      ],
      total: 88999,
      mode: 'UPI'
    });
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
      const itemTotal = item.price * item.returnQty;
      const tax = itemTotal * (item.gst / 100);
      return acc + itemTotal + tax;
    }, 0);
  };

  const refundAmount = calculateRefund();

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
                  return (
                    <div key={item.id} className={`returnable-item ${isSelected ? 'selected' : ''}`} onClick={() => toggleItemForReturn(item)}>
                      <div className="checkbox-indicator">{isSelected ? '✓' : ''}</div>
                      <div className="item-info">
                        <span className="name">{item.name}</span>
                        <span className="meta">Bought: {item.qty} pcs @ ₹{item.price}</span>
                      </div>
                      <span className="item-price">₹{item.price * item.qty}</span>
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
                   <select>
                     <option>Original Mode (UPI)</option>
                     <option>Cash</option>
                     <option>Store Credit</option>
                   </select>
                </div>

                <div className="refund-reason">
                   <label>Reason for Return</label>
                   <textarea placeholder="e.g. Defective Product, Wrong Size..."></textarea>
                </div>

                <button className="btn-process-refund" onClick={() => alert("Refund Processed & Stock Updated!")}>
                  Complete Refund & Restock
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
