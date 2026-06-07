import React, { useState, useEffect, useRef } from 'react';
import '../styles/QuotationScreen.css';
import { Plus, Trash2, Download, Printer, Save, History, Edit, X } from 'lucide-react';
import { usePopup } from './ui/PopupProvider';
import { API_ENDPOINTS } from '../config/apiConfig';

export default function QuotationScreen() {
  const popup = usePopup();
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  
  const [items, setItems] = useState([
    { id: Date.now(), name: '', description: '', qty: 1, price: 0, tax: 0 }
  ]);
  
  const [terms, setTerms] = useState('1. Quotation is valid for 7 days.\n2. 50% advance payment required to begin work.\n3. Taxes as applicable.');
  const [validDays, setValidDays] = useState(7);
  
  const [products, setProducts] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  
  // For autocomplete
  const [activeDropdown, setActiveDropdown] = useState(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await fetch(API_ENDPOINTS.PRODUCTS.LIST, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchQuotations = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      // Using generic API path
      const url = API_ENDPOINTS.BASE_URL + '/quotations';
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setQuotations(data);
      }
    } catch (error) {
      console.error('Failed to fetch quotations:', error);
    }
  };

  const openHistory = () => {
    fetchQuotations();
    setShowHistory(true);
  };

  const loadQuotation = (quote) => {
    setCustomer({
      name: quote.customer_name || '',
      phone: quote.customer_phone || '',
      email: quote.customer_email || '',
      address: quote.customer_address || ''
    });
    setItems(typeof quote.items === 'string' ? JSON.parse(quote.items) : quote.items);
    setValidDays(quote.valid_days || 7);
    setTerms(quote.terms || '');
    setEditingId(quote.id);
    setShowHistory(false);
  };

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };
  
  const selectProduct = (id, product) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { 
            ...item, 
            name: product.name, 
            price: product.price || 0,
            tax: product.gst_rate || 0,
            description: product.description || ''
        };
      }
      return item;
    }));
    setActiveDropdown(null);
  };

  const addItem = () => {
    setItems(prev => [...prev, { id: Date.now(), name: '', description: '', qty: 1, price: 0, tax: 0 }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.qty || 0) * parseFloat(item.price || 0)), 0);
  };

  const calculateTotalTax = () => {
    return items.reduce((sum, item) => {
      const lineTotal = parseFloat(item.qty || 0) * parseFloat(item.price || 0);
      return sum + (lineTotal * (parseFloat(item.tax || 0) / 100));
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const taxTotal = calculateTotalTax();
  const grandTotal = subtotal + taxTotal;
  
  const saveQuotationToDb = async (generatePdf = false) => {
    if (!customer.name) {
      popup.showError("Please enter a customer name.");
      return;
    }
    
    if (items.some(i => !i.name || i.price <= 0)) {
      popup.showError("Please ensure all items have a name and a valid price.");
      return;
    }

    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    const quoteIdStr = editingId ? quotations.find(q => q.id === editingId)?.quote_id : `QUOTE-${Date.now().toString().slice(-6)}`;
    
    const payload = {
        quote_id: quoteIdStr,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email,
        customer_address: customer.address,
        items,
        subtotal,
        tax_total: taxTotal,
        grand_total: grandTotal,
        valid_days: validDays,
        terms
    };

    const url = editingId ? `${API_ENDPOINTS.BASE_URL}/quotations/${editingId}` : `${API_ENDPOINTS.BASE_URL}/quotations`;
    const method = editingId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            popup.showSuccess(editingId ? "Quotation updated!" : "Quotation saved!");
            if (generatePdf) {
                generatePDF(quoteIdStr);
            }
            // Reset the form
            setCustomer({ name: '', phone: '', email: '', address: '' });
            setItems([{ id: Date.now(), name: '', description: '', qty: 1, price: 0, tax: 0 }]);
            setTerms('1. Quotation is valid for 7 days.\n2. 50% advance payment required to begin work.\n3. Taxes as applicable.');
            setValidDays(7);
            setEditingId(null);
        } else {
            popup.showError("Failed to save quotation");
        }
    } catch (error) {
        popup.showError("Error saving quotation");
    }
  };
  const numberToWords = (amount) => {
    if (amount === 0) return "Zero Rupees Only";
    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const convertToWords = (num) => {
        if ((num = num.toString()).length > 9) return "Overflow";
        let n = ("000000000" + num).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return "";
        let str = "";
        str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + " Crore " : "";
        str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + " Lakh " : "";
        str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + " Thousand " : "";
        str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + " Hundred " : "";
        str += (n[5] != 0) ? ((str != "") ? "and " : "") + (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]]) : "";
        return str.trim();
    };
    const parts = Number(amount).toFixed(2).split(".");
    const rupees = parseInt(parts[0], 10);
    const paise = parseInt(parts[1], 10);
    let res = "";
    if (rupees > 0) res += convertToWords(rupees) + " Rupees";
    if (paise > 0) res += (rupees > 0 ? " and " : "") + convertToWords(paise) + " Paise";
    return res + " Only";
  };

  const generatePDF = (overrideQuoteId = null) => {
    if (!customer.name) {
      popup.showError("Please enter a customer name.");
      return;
    }
    
    if (items.some(i => !i.name || i.price <= 0)) {
      popup.showError("Please ensure all items have a name and a valid price.");
      return;
    }

    const quoteId = overrideQuoteId || (editingId ? quotations.find(q => q.id === editingId)?.quote_id : `QUOTE-${Date.now().toString().slice(-6)}`);
    const validUntilDate = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');
    const currentDate = new Date().toLocaleDateString('en-GB');

    const adminUserStr = localStorage.getItem('adminUser');
    const bProf = adminUserStr ? JSON.parse(adminUserStr) : {};
    const bName = bProf.business || 'StayBill Pro';
    const bPhone = bProf.phone || '';
    const bEmail = bProf.email || '';
    const bAddress = bProf.address || '';
    const gstin = bProf.gst_number || '';
    const bLogo = bProf.logo_url || '';
    
    const bBankName = bProf.bank_name || '';
    const bBankAccount = bProf.bank_account || '';
    const bIfsc = bProf.ifsc_code || '';
    const bUpiId = bProf.upi_id || '';
    const hasPaymentDetails = bBankName || bBankAccount || bIfsc || bUpiId;
    const upiString = bUpiId ? `upi://pay?pa=${bUpiId}&pn=${encodeURIComponent(bName)}&am=${grandTotal.toFixed(2)}&cu=INR` : '';
    const upiQrUrl = bUpiId ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiString)}` : '';

    let htmlContent = `
      <html>
      <head>
        <title>Quotation ${quoteId}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; color: #111; line-height: 1.5; font-size: 14px; font-weight: 500; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-container { max-width: 100%; margin: 0 auto; background: white; }
          .banner { color: #111; padding: 20px 40px; display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; border-bottom: 1px solid rgba(0,0,0,0.1); }
          .banner-col { flex: 1; font-size: 13px; }
          .banner-col.left { text-align: left; }
          .banner-col.center { text-align: left; padding-left: 20px; border-left: 1px solid rgba(0,0,0,0.1); }
          .banner-col.right { text-align: right; border-left: 1px solid rgba(0,0,0,0.1); padding-left: 20px; }
          .logo-placeholder { background-color: #6daaa9; width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; text-align: center; font-size: 14px; border: 3px solid #a8d4d3; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
          .banner-title { color: #2c5253; font-size: 12px; margin-bottom: 4px; font-weight: normal; }
          .banner-col strong.name { font-size: 14px; color: #000; display: block; margin-bottom: 4px; font-weight: 700; }
          .banner-col div { margin-bottom: 4px; }
          .quote-details-box { margin-top: 15px; }
          .quote-details-box div { margin-bottom: 6px; font-size: 12px; }
          .quote-details-box strong { color: #2c5253; font-weight: bold; margin-right: 5px; }
          
          .content-wrapper { padding: 20px 40px; }
          .quote-title { text-align: center; color: #437b7d; font-size: 12px; font-weight: bold; padding: 12px 0 8px 0; letter-spacing: 1.5px; text-transform: uppercase; background-color: white; border-bottom: 1px solid #e0e0e0; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #5a8a8c; font-size: 13px; }
          th { background-color: #62979a; color: white; text-align: center; padding: 6px 8px; font-weight: normal; border: 1px solid #5a8a8c; }
          td { padding: 6px 8px; border: 1px solid #5a8a8c; vertical-align: middle; text-align: center; }
          td.desc-col { text-align: left; }
          .item-desc { font-size: 12px; color: #555; margin-top: 4px; }
          
          .totals-wrapper { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
          .totals { width: 280px; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 12px; border: 1px solid #5a8a8c; border-top: none; font-size: 12px; }
          .total-row.grand { background-color: #62979a; color: white; font-weight: bold; font-size: 13px; }
          
          .footer-layout { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px; }
          .payment-section { width: 62%; font-size: 11px; }
          .payment-section h4 { color: #62979a; margin: 0 0 10px 0; font-size: 12px; font-weight: normal; }
          .payment-details { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 10px; border: 1px dashed #62979a; border-radius: 6px; background-color: #f8fbfc; }
          .payment-details .details-list { flex: 1; padding-right: 10px; }
          .payment-details .details-list div { margin-bottom: 4px; color: #333; display: flex; }
          .payment-details .details-list strong { color: #111; margin-right: 8px; width: 95px; flex-shrink: 0; }
          
          .qr-small { text-align: center; border-left: 1px dashed #ccc; padding-left: 15px; margin-left: 5px; flex-shrink: 0; }
          .qr-small img { width: 50px; height: 50px; display: block; margin: 0 auto 4px auto; }
          .qr-small div { font-size: 9px; color: #475569; font-weight: bold; }
          
          .terms-wrapper { font-size: 12px; }
          .terms-wrapper h4 { color: #62979a; margin: 0 0 10px 0; font-weight: normal; font-size: 14px; }
          .terms { white-space: pre-wrap; color: #475569; margin-left: 15px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="quote-title">Price Quote</div>
          <div class="banner">
            <!-- Left Column: Logo & Quote Details -->
            <div class="banner-col left">
              ${bLogo ? 
                  `<div style="height: 55px; max-width: 120px; display: flex; align-items: center; justify-content: flex-start;">
                      <img src="${bLogo}" alt="Business Logo" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                   </div>` 
                  : 
                  `<div class="logo-placeholder">
                    ${bName.substring(0, 10)}<br/>LOGO
                  </div>`
              }
              <div class="quote-details-box">
                <div><strong>Date:</strong> ${currentDate}</div>
                <div><strong>Quotation #:</strong> ${quoteId}</div>
                <div><strong>Valid Until:</strong> ${validUntilDate}</div>
              </div>
            </div>
            
            <!-- Middle Column: Quotation For -->
            <div class="banner-col center">
              <div class="banner-title">Quotation For:</div>
              <strong class="name">${customer.name}</strong>
              ${customer.address ? `<div>${customer.address.replace(/\n/g, '<br/>')}</div>` : ''}
              ${customer.phone ? `<div>${customer.phone}</div>` : ''}
              ${customer.email ? `<div>${customer.email}</div>` : ''}
            </div>

            <!-- Right Column: Quotation From -->
            <div class="banner-col right">
              <div class="banner-title">Quotation From:</div>
              <strong class="name">${bName}</strong>
              ${bAddress ? `<div>${bAddress.replace(/\n/g, '<br/>')}</div>` : ''}
              ${bPhone ? `<div>${bPhone}</div>` : ''}
              ${bEmail ? `<div>${bEmail}</div>` : ''}
              ${gstin ? `<div>GSTIN: ${gstin}</div>` : ''}
            </div>
          </div>
          
          <div class="content-wrapper">
            <table>
              <thead>
                <tr>
                  <th width="12%">Item No.</th>
                  <th width="38%">Description</th>
                  <th width="10%">Qty</th>
                  <th width="15%">Rate/Unit</th>
                  <th width="10%">Tax (GST)</th>
                  <th width="15%">Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item, idx) => {
                  const qty = parseFloat(item.qty || 0);
                  const price = parseFloat(item.price || 0);
                  const tax = parseFloat(item.tax || 0);
                  const lineTotal = qty * price;
                  const lineTotalWithTax = lineTotal + (lineTotal * (tax/100));
                  return `
                    <tr>
                      <td>00${idx + 1}</td>
                      <td class="desc-col">
                        <strong>${item.name || ''}</strong>
                        ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
                      </td>
                      <td>${qty}</td>
                      <td>₹${price.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td>${tax > 0 ? tax + '%' : '-'}</td>
                      <td>₹${lineTotalWithTax.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <div class="totals-wrapper">
              <div class="payment-section">
                ${hasPaymentDetails ? `
                  <h4>Payment Details:</h4>
                  <div class="payment-details">
                    <div class="details-list">
                      ${bBankName ? `<div><strong>Bank Name</strong>: ${bBankName}</div>` : ''}
                      ${bBankAccount ? `<div><strong>Account Number</strong>: ${bBankAccount}</div>` : ''}
                      ${bIfsc ? `<div><strong>IFSC Code</strong>: ${bIfsc}</div>` : ''}
                      ${bUpiId ? `<div><strong>UPI ID</strong>: ${bUpiId}</div>` : ''}
                    </div>
                    ${upiQrUrl ? `
                    <div class="qr-small">
                      <img src="${upiQrUrl}" alt="Scan to Pay" />
                      <div>Scan to Pay</div>
                    </div>
                    ` : ''}
                  </div>
                ` : ''}
              </div>

              <div class="totals">
                <div class="total-row">
                  <span>Subtotal</span>
                  <span>₹${subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div class="total-row">
                  <span>GST Amount</span>
                  <span>₹${taxTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div class="total-row grand">
                  <span>Total Quoted Amount</span>
                  <span>₹${grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div style="font-size: 10px; color: #555; text-align: right; margin-top: 8px;">
                  Amount in words:<br/>
                  <strong style="color: #437b7d; font-size: 11px;">${numberToWords(grandTotal)}</strong>
                </div>
              </div>
            </div>

            <div class="footer-layout">
              <div class="terms-wrapper" style="width: 100%;">
                <h4>Terms & Conditions:</h4>
                <div class="terms">${terms}</div>
              </div>
            </div>

          </div>
        </div>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-10000px';
    document.body.appendChild(iframe);

    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(htmlContent);
    iframe.contentWindow.document.close();

    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  };

  return (
    <div className="quotation-screen animate-fade-in" ref={wrapperRef}>
      <div className="quotation-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h1>Create Quotation</h1>
            <p>{editingId ? 'Editing existing quotation' : 'Generate professional, customized quotes for your clients without affecting inventory.'}</p>
        </div>
        <button className="btn-add-item" onClick={openHistory}>
            <History size={18} /> Quotation History
        </button>
      </div>

      <div className="quotation-form">
        {/* Customer Section */}
        <div className="form-section">
          <h2>👤 Customer Details</h2>
          <div className="grid-2">
            <div className="form-group">
              <label>Customer Name *</label>
              <input 
                type="text" 
                name="name" 
                value={customer.name} 
                onChange={handleCustomerChange} 
                placeholder="Enter customer name"
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input 
                type="tel" 
                maxLength="10"
                name="phone" 
                value={customer.phone} 
                onChange={handleCustomerChange} 
                placeholder="Enter phone number"
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                name="email" 
                value={customer.email} 
                onChange={handleCustomerChange} 
                placeholder="customer@example.com"
              />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Billing Address</label>
              <textarea 
                name="address" 
                value={customer.address} 
                onChange={handleCustomerChange} 
                placeholder="Enter full address"
                rows="2"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="form-section">
          <h2>📦 Line Items</h2>
          <div className="items-grid">
            <div className="items-grid-header">
              <div>Item Name</div>
              <div>Description</div>
              <div>Qty</div>
              <div>Unit Price (₹)</div>
              <div>Tax (%)</div>
              <div>Amount (₹)</div>
              <div></div>
            </div>
            
            {items.map((item, index) => {
              const itemTotal = (parseFloat(item.qty || 0) * parseFloat(item.price || 0)) * (1 + (parseFloat(item.tax || 0) / 100));
              
              // Autocomplete filtering
              const filteredProducts = products.filter(p => (p.name || '').toLowerCase().includes((item.name || '').toLowerCase()));

              return (
                <div key={item.id} className="items-grid-row" style={{ zIndex: items.length - index, position: 'relative' }}>
                  <div>
                    <div className="autocomplete-container">
                      <input 
                          type="text" 
                          placeholder="Search Item..." 
                          value={item.name} 
                          onChange={(e) => {
                              handleItemChange(item.id, 'name', e.target.value);
                              setActiveDropdown(item.id);
                          }}
                          onFocus={() => setActiveDropdown(item.id)}
                      />
                      {activeDropdown === item.id && filteredProducts.length > 0 && (
                          <div className="autocomplete-results">
                              {filteredProducts.map(p => (
                                  <div key={p.id} className="autocomplete-item" onClick={() => selectProduct(item.id, p)}>
                                      <strong>{p.name}</strong> - ₹{p.price}
                                  </div>
                              ))}
                          </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <input type="text" placeholder="Optional Description" value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} />
                  </div>
                  <div>
                    <input type="number" min="1" value={item.qty} onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)} />
                  </div>
                  <div>
                    <input type="number" step="0.01" min="0" value={item.price} onChange={(e) => handleItemChange(item.id, 'price', e.target.value)} />
                  </div>
                  <div>
                    <input type="number" step="0.1" min="0" value={item.tax} onChange={(e) => handleItemChange(item.id, 'tax', e.target.value)} />
                  </div>
                  <div>
                    <div className="item-total">₹{itemTotal.toFixed(2)}</div>
                  </div>
                  <div>
                    <button className="btn-remove" onClick={() => removeItem(item.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="btn-add-item" onClick={addItem}>
            <Plus size={16} /> Add Another Item
          </button>

          <div className="totals-section">
            <div className="totals-box">
              <div className="total-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="total-row">
                <span>GST Amount</span>
                <span>₹{taxTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="total-row grand-total">
                <span>Grand Total</span>
                <span>₹{grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Terms Section */}
        <div className="form-section">
          <h2>📝 Terms & Settings</h2>
          <div className="grid-2">
            <div className="form-group">
              <label>Validity Period (Days)</label>
              <input 
                type="number" 
                min="1" 
                value={validDays} 
                onChange={(e) => setValidDays(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Terms & Conditions</label>
              <textarea 
                value={terms} 
                onChange={(e) => setTerms(e.target.value)}
                rows="4"
              ></textarea>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button className="btn-add-item" onClick={() => saveQuotationToDb(false)}>
            <Save size={18} />
            {editingId ? 'Update Quotation' : 'Save Quotation'}
          </button>
          <button className="btn-primary" onClick={() => saveQuotationToDb(true)}>
            <Printer size={18} />
            Save & Download PDF
          </button>
        </div>
      </div>

      {showHistory && (
          <div className="modal-overlay">
              <div className="modal-content full-screen-modal">
                  <div className="modal-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <h2>Quotation History</h2>
                          <button onClick={() => setShowHistory(false)} className="btn-remove"><X size={20} /></button>
                      </div>
                      <div style={{ width: '100%' }}>
                          <input 
                              type="text" 
                              placeholder="Search by Quote ID, Customer, Date, or Total..." 
                              value={historySearchTerm}
                              onChange={(e) => setHistorySearchTerm(e.target.value)}
                              className="st-input"
                              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          />
                      </div>
                  </div>
                  {quotations.filter(q => 
                      (q.quote_id || '').toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                      (q.customer_name || '').toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                      new Date(q.created_at).toLocaleDateString().includes(historySearchTerm) ||
                      (q.grand_total || '').toString().includes(historySearchTerm)
                  ).length === 0 ? (
                      <p>No quotations found.</p>
                  ) : (
                      <div className="quotation-list">
                          <table>
                              <thead>
                                  <tr>
                                      <th>Quote ID</th>
                                      <th>Date</th>
                                      <th>Customer</th>
                                      <th>Total</th>
                                      <th>Actions</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {quotations.filter(q => 
                                      (q.quote_id || '').toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                                      (q.customer_name || '').toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                                      new Date(q.created_at).toLocaleDateString().includes(historySearchTerm) ||
                                      (q.grand_total || '').toString().includes(historySearchTerm)
                                  ).map(q => (
                                      <tr key={q.id}>
                                          <td>{q.quote_id}</td>
                                          <td>{new Date(q.created_at).toLocaleDateString()}</td>
                                          <td>{q.customer_name}</td>
                                          <td>₹{parseFloat(q.grand_total).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                          <td style={{ display: 'flex', gap: '8px' }}>
                                              <button className="btn-add-item" style={{padding: '6px 12px', fontSize: '12px'}} onClick={() => loadQuotation(q)}>
                                                  <Edit size={14} /> Edit
                                              </button>
                                              <button className="btn-add-item" style={{padding: '6px 12px', fontSize: '12px', backgroundColor: '#f0fdfa', borderColor: '#437b7d', color: '#437b7d'}} onClick={() => {
                                                  loadQuotation(q);
                                                  setTimeout(() => generatePDF(q.quote_id), 600);
                                              }}>
                                                  <Download size={14} /> Download
                                              </button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
}
