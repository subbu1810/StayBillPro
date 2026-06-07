import React, { useState, useEffect } from 'react';
import '../styles/InvoiceHistory.css';
import { getWholesaleInvoiceHtml, getPosInvoiceHtml } from '../utils/printFormat';
import {
  Search,
  Download,
  Eye,
  Trash2,
  Filter,
  Calendar,
  CreditCard,
  AlertCircle,
  RefreshCw,
  FileText
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default function InvoiceHistory({ invoiceType }) {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [toast, setToast] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  const [printSize, setPrintSize] = useState('80mm');

  // Fetch invoices
  const fetchInvoices = async (pageNum = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      let url = `${API_BASE}/billing/search/advanced?page=${pageNum}&limit=${limit}`;

      if (searchTerm) {
        url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
      }

      if (filterStatus !== 'all') {
        url += `&status=${filterStatus}`;
      }

      if (filterPayment !== 'all') {
        url += `&paymentMethod=${filterPayment}`;
      }

      if (dateFrom) {
        url += `&startDate=${dateFrom}`;
      }

      if (dateTo) {
        url += `&endDate=${dateTo}`;
      }

      if (invoiceType) {
        url += `&invoiceType=${invoiceType}`;
      }

      console.log('Fetching invoices from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Invoice API Response:', data);

      if (!response.ok) {
        console.error('API Error:', data);
        showToast(data.message || 'Failed to fetch invoices', 'error');
        setInvoices([]);
        setFilteredInvoices([]);
        return;
      }

      setInvoices(data.invoices || []);
      setFilteredInvoices(data.invoices || []);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Fetch Error:', error);
      showToast('Network error. Please try again.', 'error');
      setInvoices([]);
      setFilteredInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchInvoices(1);
    
    // Fetch printSize setting
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedBranch = localStorage.getItem('selectedBranchId');
        const branchId = (storedBranch && storedBranch !== 'undefined' && storedBranch !== 'null') ? storedBranch : '1';
        const response = await fetch(`${API_BASE}/settings/pos/${branchId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data && data.print_size) {
          setPrintSize(data.print_size);
        }
      } catch (error) {
        console.error('Failed to fetch print settings', error);
      }
    };
    fetchSettings();
  }, []);

  // Search and filter
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, filterStatus, filterPayment, dateFrom, dateTo]);

  const handleRefresh = () => {
    fetchInvoices(page);
    showToast('Invoices refreshed!', 'success');
  };

  const handleViewDetails = async (invoiceId) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/billing/details/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || 'Failed to fetch invoice details', 'error');
        return;
      }

      setSelectedInvoice({
        ...data.invoice,
        items: data.items || []
      });
      setShowModal(true);
    } catch (error) {
      console.error('Error:', error);
      showToast('Error fetching invoice details', 'error');
    }
  };

  const handlePrintInvoice = async (invoiceId) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/billing/details/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || 'Failed to fetch invoice details for printing', 'error');
        return;
      }

      setSelectedInvoice({
        ...data.invoice,
        items: data.items || []
      });
      setIsPrinting(true);
      setShowModal(true);
      
      setTimeout(() => {
        if (data.invoice.invoice_type === 'wholesale') {
          const html = getWholesaleInvoiceHtml({ ...data.invoice, items: data.items || [] });
          const printWindow = window.open('', 'PRINT', 'height=600,width=800');
          if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.onload = function() {
              printWindow.focus();
              printWindow.print();
              printWindow.close();
            };
            setTimeout(() => {
              if (!printWindow.closed) {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
              }
            }, 2500);
          }
        } else if (data.invoice.invoice_type === 'pos') {
          const html = getPosInvoiceHtml({ ...data.invoice, items: data.items || [] }, printSize);
          const printWindow = window.open('', 'PRINT', 'height=600,width=800');
          if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.onload = function() {
              printWindow.focus();
              printWindow.print();
              printWindow.close();
            };
            setTimeout(() => {
              if (!printWindow.closed) {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
              }
            }, 2500);
          }
        } else {
          window.print();
        }
        setIsPrinting(false);
        setShowModal(false);
      }, 300);
    } catch (error) {
      console.error('Error:', error);
      showToast('Error generating receipt', 'error');
    }
  };

  const handleCancelInvoice = (invoiceId) => {
    setInvoiceToCancel(invoiceId);
  };

  const confirmCancelInvoice = async () => {
    if (!invoiceToCancel) return;

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/billing/${invoiceToCancel}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || 'Failed to cancel invoice', 'error');
        setInvoiceToCancel(null);
        return;
      }

      showToast('Invoice cancelled successfully', 'success');
      setInvoiceToCancel(null);
      fetchInvoices(page);
    } catch (error) {
      console.error('Error:', error);
      showToast('Error cancelling invoice', 'error');
      setInvoiceToCancel(null);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getPaymentMethodColor = (method) => {
    switch (method) {
      case 'cash':
        return '#3b82f6';
      case 'card':
        return '#8b5cf6';
      case 'upi':
        return '#ec4899';
      case 'credit':
        return '#06b6d4';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="invoice-history-wrapper">
      {/* HEADER */}
      <div className="ih-header">
        <div>
          <h1>{invoiceType === 'wholesale' ? 'Wholesale History' : 'POS History'}</h1>
          <p>Search and manage your generated {invoiceType === 'wholesale' ? 'wholesale bills' : 'retail bills'}</p>
        </div>
        <button className="refresh-btn" onClick={handleRefresh}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="ih-filters">
        <div className="search-box-ih">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by Invoice # or Customer name/phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Payment Mode</label>
            <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
              <option value="all">All Modes</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="credit">Credit</option>
            </select>
          </div>

          <div className="filter-group">
            <label>From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="ih-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <FileText size={20} />
          </div>
          <div>
            <span className="stat-label">Total Invoices</span>
            <span className="stat-value">{invoices.length}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CreditCard size={20} />
          </div>
          <div>
            <span className="stat-label">Total Amount</span>
            <span className="stat-value">
              ₹{(invoices ?? [])
                .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)
                .toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* INVOICE TABLE */}
      <div className="ih-table-wrapper">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={48} />
            <h3>No invoices found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <table className="invoices-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Customer</th>
                  <th>Date & Time</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Payment Mode</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td className="invoice-id">
                      <strong>INV-{String(invoice.id).padStart(4, '0')}</strong>
                    </td>
                    <td>
                      <div className="customer-info">
                        <div className="customer-name">{invoice.customer_name}</div>
                        <div className="customer-phone">{invoice.customer_phone || 'N/A'}</div>
                      </div>
                    </td>
                    <td>
                      <div className="date-time">
                        {new Date(invoice.created_at).toLocaleDateString()}
                        <span>{new Date(invoice.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td>
                      <span className="items-count">
                        {invoice.item_count || 0} items
                      </span>
                    </td>
                    <td className="amount">
                      <strong>₹{invoice.total_amount.toLocaleString()}</strong>
                    </td>
                    <td>
                      <span
                        className="badge payment-method"
                        style={{ backgroundColor: getPaymentMethodColor(invoice.payment_method) + '20', color: getPaymentMethodColor(invoice.payment_method) }}
                      >
                        {invoice.payment_method.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{ color: getStatusColor(invoice.status), fontWeight: '700' }}
                      >
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="actions">
                      <button
                        className="action-btn view"
                        title="View Details"
                        onClick={() => handleViewDetails(invoice.id)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="action-btn download"
                        title="Print Invoice"
                        onClick={() => handlePrintInvoice(invoice.id)}
                      >
                        <Download size={16} />
                      </button>
                      {invoice.status !== 'cancelled' && (
                        <button
                          className="action-btn delete"
                          title="Cancel Invoice"
                          onClick={() => handleCancelInvoice(invoice.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </>
        )}
      </div>

      {/* INVOICE DETAILS MODAL */}
      {showModal && selectedInvoice && (
        <div className={`modal-overlay-ih ${isPrinting ? 'visually-hidden-for-print' : ''}`}>
          <div className="modal-content-ih invoice-paper-modal">
            <div className="modal-header-ih no-print">
              <h2>Invoice Preview</h2>
              <button onClick={() => setShowModal(false)}>×</button>
            </div>

            {selectedInvoice.invoice_type === 'wholesale' ? (
            <div style={{ width: '100%', height: 'calc(100vh - 150px)', border: 'none' }}>
              <iframe 
                srcDoc={getWholesaleInvoiceHtml(selectedInvoice)} 
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Wholesale Invoice Preview"
              />
            </div>
          ) : selectedInvoice.invoice_type === 'pos' ? (
            <div style={{ width: '100%', height: 'calc(100vh - 150px)', border: 'none', display: 'flex', justifyContent: 'center' }}>
              <iframe 
                srcDoc={getPosInvoiceHtml(selectedInvoice, printSize)} 
                style={{ width: printSize === '80mm' ? '350px' : '100%', height: '100%', border: printSize === '80mm' ? '1px solid #ccc' : 'none', boxShadow: printSize === '80mm' ? '0 0 10px rgba(0,0,0,0.1)' : 'none' }}
                title="POS Invoice Preview"
              />
            </div>
          ) : (
            <div className="invoice-paper" id="printable-invoice">
              <div className="invoice-header-company">
                <div className="company-details">
                  <h2>{selectedInvoice.business_name || selectedInvoice.branch_name || 'Business Name'}</h2>
                  <p>{selectedInvoice.branch_address || 'Business Address'}</p>
                  <p>Phone: {selectedInvoice.branch_phone || 'N/A'}</p>
                  <p>GSTIN: {selectedInvoice.corporate_gst || selectedInvoice.branch_gst || 'N/A'}</p>
                </div>
                <div className="invoice-title">
                  <h1>TAX INVOICE</h1>
                </div>
              </div>
              
              <div className="invoice-customer-details">
                <div className="billed-to">
                  <h3>Billed To:</h3>
                  <p><strong>{selectedInvoice.customer_name}</strong></p>
                  <p>Phone: {selectedInvoice.customer_phone || 'N/A'}</p>
                </div>
                <div className="invoice-meta">
                  <p><strong>Invoice No:</strong> INV-{String(selectedInvoice.id).padStart(4, '0')}</p>
                  <p><strong>Date:</strong> {new Date(selectedInvoice.created_at).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {new Date(selectedInvoice.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p><strong>Payment Mode:</strong> {selectedInvoice.payment_method.toUpperCase()}</p>
                </div>
              </div>

              <div className="invoice-items-section">
                <table className="invoice-items-table">
                  <thead>
                    <tr>
                      <th className="text-center" style={{ width: '60px' }}>S.No.</th>
                      <th>Item Description</th>
                      <th className="text-center" style={{ width: '80px' }}>Qty</th>
                      <th className="text-right" style={{ width: '120px' }}>Rate</th>
                      <th className="text-right" style={{ width: '120px' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                      selectedInvoice.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="text-center">{idx + 1}</td>
                          <td>{item.item_name}</td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-right">₹{item.unit_price.toLocaleString()}</td>
                          <td className="text-right">₹{item.total_price.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center" style={{ padding: '2rem' }}>No items available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="invoice-footer-section">
                <div className="invoice-notes">
                  <h4>Terms & Conditions</h4>
                  <p>1. Goods once sold will not be taken back.</p>
                  <p>2. Warranty as per manufacturer terms.</p>
                  <p>3. Subject to local jurisdiction.</p>
                </div>
                <div className="invoice-totals-box">
                  <div className="totals-row">
                    <span>Subtotal:</span>
                    <span>₹{(selectedInvoice.total_amount - selectedInvoice.gst_amount + selectedInvoice.discount_amount).toLocaleString()}</span>
                  </div>
                  <div className="totals-row">
                    <span>GST (18%):</span>
                    <span>₹{selectedInvoice.gst_amount.toLocaleString()}</span>
                  </div>
                  <div className="totals-row">
                    <span>Discount:</span>
                    <span>-₹{selectedInvoice.discount_amount.toLocaleString()}</span>
                  </div>
                  <div className="totals-row grand-total">
                    <span>Grand Total:</span>
                    <span>₹{selectedInvoice.total_amount.toLocaleString()}</span>
                  </div>
                  <div className="totals-row payment-status">
                    <span>Status:</span>
                    <span style={{ color: getStatusColor(selectedInvoice.status), fontWeight: 'bold' }}>
                      {selectedInvoice.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="invoice-signature">
                <p>Authorized Signatory</p>
              </div>
            </div>
          )}

            <div className="modal-actions-ih no-print">
              <button className="btn-print" onClick={() => handlePrintInvoice(selectedInvoice.id)}>
                <Download size={16} />
                Print Invoice
              </button>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM CANCEL MODAL */}
      {invoiceToCancel && (
        <div className="modal-overlay-ih">
          <div className="modal-content-ih confirm-modal" style={{ maxWidth: '400px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Cancel Invoice</h3>
            <p style={{ margin: '0 0 24px 0', color: '#64748b' }}>
              Are you sure you want to cancel this invoice? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setInvoiceToCancel(null)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', cursor: 'pointer', fontWeight: '500' }}
              >
                No, Keep it
              </button>
              <button 
                onClick={confirmCancelInvoice}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: '500' }}
              >
                Yes, Cancel it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="toast-ih" style={{
          background: toast.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: toast.type === 'error' ? '#dc2626' : '#16a34a'
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
