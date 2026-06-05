import React, { useState, useEffect } from 'react';
import '../../styles/pos/POSBillingPage.css';
import {
  Search,
  ShoppingCart,
  User,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Receipt,
  PauseCircle,
  ScanLine,
  Maximize,
  Minimize
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default function POSBillingPage() {
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    try {
      const storedBranch = localStorage.getItem('selectedBranchId');
      const branchId = (storedBranch && storedBranch !== 'undefined' && storedBranch !== 'null') ? storedBranch : '1';
      
      const { productsAPI, sparesAPI } = require('../../services/api');
      
      // Fetch both products and spares concurrently
      const [prodRes, spareRes] = await Promise.all([
        productsAPI.getAll({ branch_id: branchId }),
        sparesAPI.getAll({ branch_id: branchId })
      ]);
      
      const extractResults = (res) => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.data)) return res.data;
        return [];
      };

      const prodResults = extractResults(prodRes);
      const spareResults = extractResults(spareRes);

      const combined = [...prodResults, ...spareResults];

      const formatted = combined.map(p => ({
        id: p.id,
        name: p.name || 'Unnamed Product',
        category: p.category_name || p.category || 'Uncategorized',
        price: parseFloat(p.price) || 0,
        wholesalePrice: parseFloat(p.wholesale_price) || parseFloat(p.price) || 0,
        stock: Math.max(0, parseInt(p.quantity || p.stock) || 0),
        gst: parseFloat(p.gst_rate) || 0,
        image: p.image || 'https://via.placeholder.com/300x200'
      }));
      
      setProducts(formatted);
    } catch (err) {
      console.error('Failed to fetch POS products:', err);
    }
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/customers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setCustomers(Array.isArray(data) ? data : (data.customers || []));
      } catch (err) {
        console.error('Failed to fetch customers:', err);
      }
    };

    const fetchSettings = async () => {
      try {
        const storedBranch = localStorage.getItem('selectedBranchId');
        const branchId = (storedBranch && storedBranch !== 'undefined' && storedBranch !== 'null') ? storedBranch : '1';
        const { posSettingsAPI } = require('../../services/api');
        const data = await posSettingsAPI.get(branchId);
        if (data && Object.keys(data).length > 0) {
          if (data.shop_name) setShopName(data.shop_name);
          if (data.gstin) setGstin(data.gstin);
          if (data.print_size) setPrintSize(data.print_size);
        }
      } catch (err) {
        console.error('Failed to fetch POS settings:', err);
      }
    };

    fetchProducts();
    fetchCustomers();
    fetchSettings();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [discount, setDiscount] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [custSearch, setCustSearch] = useState('');
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const [shopName, setShopName] = useState('Electronics Hub India');
  const [gstin, setGstin] = useState('27AAACH9999Z1Z5');
  const [printSize, setPrintSize] = useState('80mm');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    const elem = document.querySelector('.pos-wrapper');
    if (!document.fullscreenElement) {
      if (elem?.requestFullscreen) {
        elem.requestFullscreen().catch(err => {
          console.error("Error attempting to enable fullscreen:", err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(
    p =>
      (activeCategory === 'All' || p.category === activeCategory) &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = product => {
    const exists = cart.find(i => i.id === product.id);

    if (exists) {
      if (exists.qty >= product.stock) {
        showToast(`Cannot add more. Only ${product.stock} units available in stock.`, 'error');
        return;
      }
      setCart(
        cart.map(i =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i
        )
      );
    } else {
      if (product.stock <= 0) {
        showToast(`Product is out of stock.`, 'error');
        return;
      }
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (id, type) => {
    setCart(
      cart.map(item => {
        if (item.id === id) {
          let qty = item.qty;
          if (type === 'inc') {
            if (item.qty >= item.stock) {
              showToast(`Only ${item.stock} units available in stock.`, 'error');
              return item;
            }
            qty = item.qty + 1;
          } else {
            qty = Math.max(1, item.qty - 1);
          }
          return { ...item, qty };
        }
        return item;
      })
    );
  };

  const removeItem = id => {
    setCart(cart.filter(i => i.id !== id));
  };

  const subtotal = cart.reduce(
    (a, b) => a + b.price * b.qty,
    0
  );

  const gstTotal = cart.reduce((acc, item) => {
    const gst = Number(item.gst || 0);
    return acc + item.price * item.qty * (gst / 100);
  }, 0);

  const cgst = gstTotal / 2;
  const sgst = gstTotal / 2;

  const discountAmount = subtotal * ((Number(discount) || 0) / 100);
  const total = subtotal + gstTotal - discountAmount;

  const handleAddCustomer = async () => {
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      showToast('Name and Phone are required', 'error');
      return;
    }
    
    setAddingCustomer(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: newCustomerName,
          mobile: newCustomerPhone,
          billingAddress: newCustomerAddress
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Customer added successfully', 'success');
        setShowAddCustomerModal(false);
        setNewCustomerName('');
        setNewCustomerPhone('');
        setNewCustomerAddress('');
        
        const fetchRes = await fetch(`${API_BASE}/customers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const fetchData = await fetchRes.json();
        if (fetchRes.ok) {
          const fetchedCustomers = Array.isArray(fetchData) ? fetchData : (fetchData.customers || []);
          setCustomers(fetchedCustomers);
          if (data.id) {
            const newCust = fetchedCustomers.find(c => c.id === data.id);
            if (newCust) {
              setSelectedCustomer(newCust);
              setCustomerName(newCust.name);
              setCustomerPhone(newCust.phone || newCust.mobile || '');
            }
          }
        }
      } else {
        showToast(data.message || 'Error adding customer', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to add customer', 'error');
    } finally {
      setAddingCustomer(false);
    }
  };

  const handleCompletePayment = async () => {
    if (!paymentMode) {
      showToast('Please select a payment method', 'error');
      return;
    }

    if (cart.length === 0) {
      showToast('Cart is empty', 'error');
      return;
    }

    if (paymentMode === 'credit' && !selectedCustomer) {
      if (!customerName.trim() || !customerPhone.trim()) {
        showToast('Customer Name and Phone are required for Credit payments', 'error');
        return;
      }
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      let finalCustomerId = selectedCustomer ? selectedCustomer.id : null;
      let finalCustomerName = selectedCustomer ? selectedCustomer.name : customerName.trim();
      let finalCustomerPhone = selectedCustomer ? (selectedCustomer.phone || selectedCustomer.mobile || '') : customerPhone.trim();



      const payload = {
        customerId: finalCustomerId,
        customerName: finalCustomerName || 'Walk-in Customer',
        customerPhone: finalCustomerPhone || '',
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          qty: item.qty,
          price: item.price
        })),
        totalAmount: parseFloat(total.toFixed(2)),
        gstAmount: parseFloat(gstTotal.toFixed(2)),
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        paymentMethod: paymentMode,
        notes: notes
      };

      const response = await fetch(`${API_BASE}/billing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || 'Failed to save invoice', 'error');
        return;
      }

      showToast('Invoice created successfully!', 'success');
      
      // Auto-print receipt
      const printWindow = window.open('', '_blank');
      const invoiceId = data.invoiceId || (data.invoice && data.invoice.id) || 'NEW';
      
      let htmlContent = '';
      if (printSize === 'A4') {
        const tableRowsHtml = cart.map((item, idx) => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; text-align: center;">${idx + 1}</td>
            <td style="padding: 10px 0; font-weight: 600;">${item.name}</td>
            <td style="padding: 10px 0; text-align: right;">₹${item.price.toLocaleString('en-IN')}</td>
            <td style="padding: 10px 0; text-align: center;">${item.qty}</td>
            <td style="padding: 10px 0; text-align: center;">${item.gst}%</td>
            <td style="padding: 10px 0; text-align: right;">₹${(item.price * item.qty * (item.gst / 100)).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 600;">₹${(item.price * item.qty).toLocaleString('en-IN')}</td>
          </tr>
        `).join('');

        htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Tax Invoice - ${invoiceId}</title>
              <style>
                body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; margin: 0 auto; color: #1e293b; max-width: 210mm; }
                .invoice-header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; }
                .company-details h1 { margin: 0; font-size: 26px; color: #0f172a; }
                .company-details p { margin: 4px 0; font-size: 13px; color: #475569; }
                .invoice-meta { text-align: right; }
                .invoice-meta h2 { margin: 0; font-size: 22px; color: #0ea5e9; }
                .invoice-meta p { margin: 4px 0; font-size: 13px; color: #475569; }
                .billing-info { display: flex; justify-content: space-between; margin-bottom: 30px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
                .billing-info h3 { margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
                .billing-info p { margin: 4px 0; font-size: 14px; color: #1f2937; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th { background: #f1f5f9; padding: 10px; font-weight: 700; font-size: 13px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
                .summary-container { display: flex; justify-content: flex-end; margin-top: 20px; }
                .summary-table { width: 300px; margin-bottom: 0; }
                .summary-table td { padding: 8px 0; font-size: 14px; }
                .summary-table tr.total-row { border-top: 2px solid #cbd5e1; font-weight: bold; font-size: 16px; color: #0f172a; }
                .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; }
                @media print { body { padding: 0; } }
              </style>
            </head>
            <body>
              <div class="invoice-header">
                <div class="company-details">
                  <h1>${shopName}</h1>
                  <p>GSTIN: ${gstin}</p>
                </div>
                <div class="invoice-meta">
                  <h2>TAX INVOICE</h2>
                  <p><strong>Invoice ID:</strong> INV-${String(invoiceId).padStart(4, '0')}</p>
                  <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                </div>
              </div>
              <div class="billing-info">
                <div>
                  <h3>Bill To</h3>
                  <p><strong>Customer Name:</strong> ${finalCustomerName}</p>
                  <p><strong>Phone:</strong> ${finalCustomerPhone || '—'}</p>
                  <p><strong>Address:</strong> ${customerAddress || '—'}</p>
                </div>
                <div style="text-align: right;">
                  <h3>Payment Details</h3>
                  <p><strong>Payment Method:</strong> ${paymentMode.toUpperCase()}</p>
                  <p><strong>Status:</strong> ${paymentMode === 'credit' ? 'PENDING' : 'PAID'}</p>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 5%; text-align: center;">#</th>
                    <th style="width: 40%; text-align: left;">Item Description</th>
                    <th style="width: 13%; text-align: right;">Rate</th>
                    <th style="width: 10%; text-align: center;">Qty</th>
                    <th style="width: 10%; text-align: center;">GST %</th>
                    <th style="width: 12%; text-align: right;">GST Amt</th>
                    <th style="width: 10%; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRowsHtml}
                </tbody>
              </table>
              <div class="summary-container">
                <table class="summary-table">
                  <tr>
                    <td>Subtotal:</td>
                    <td style="text-align: right;">₹${subtotal.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td>GST Total:</td>
                    <td style="text-align: right;">₹${gstTotal.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td>Discount:</td>
                    <td style="text-align: right;">-₹${discountAmount.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr class="total-row">
                    <td>Grand Total:</td>
                    <td style="text-align: right;">₹${total.toLocaleString('en-IN')}</td>
                  </tr>
                </table>
              </div>
              <div class="footer">
                <p>Thank you for your business!</p>
              </div>
              <script>
                window.onload = function() { window.print(); window.close(); }
              </script>
            </body>
          </html>
        `;
      } else {
        const width = printSize === '50mm' ? '50mm' : '80mm';
        const itemsHtml = cart.map(item => `
          <tr>
            <td>${item.name.substring(0, 15)}</td>
            <td style="text-align: center;">${item.qty}</td>
            <td style="text-align: right;">${(item.price * item.qty).toLocaleString('en-IN')}</td>
          </tr>
        `).join('');

        htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invoice - ${invoiceId}</title>
              <style>
                body { font-family: 'Courier New', Courier, monospace; padding: 10px; margin: 0; color: #000; font-size: ${printSize === '50mm' ? '10px' : '12px'}; }
                .header { text-align: center; margin-bottom: 10px; }
                .header h2 { margin: 0; font-size: 16px; }
                .divider { border-bottom: 1px dashed #000; margin: 5px 0; }
                table { width: 100%; border-collapse: collapse; }
                th, td { text-align: left; padding: 2px 0; }
                .totals { margin-top: 10px; }
                .totals-row { display: flex; justify-content: space-between; }
                .bold { font-weight: bold; }
                .footer { text-align: center; margin-top: 20px; font-size: 10px; }
              </style>
            </head>
            <body>
              <div style="max-width: ${width}; margin: 0 auto;">
                <div class="header">
                  <h2>${shopName}</h2>
                  <div>TAX INVOICE</div>
                  <div>GSTIN: ${gstin}</div>
                  <div>INV-${String(invoiceId).padStart(4, '0')}</div>
                  <div>${new Date().toLocaleString()}</div>
                </div>
                <div class="divider"></div>
                <div>Customer: ${finalCustomerName}</div>
                <div>Payment: ${paymentMode.toUpperCase()}</div>
                <div class="divider"></div>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style="text-align: center;">Qty</th>
                      <th style="text-align: right;">Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
                <div class="divider"></div>
                <div class="totals">
                  <div class="totals-row">
                    <span>Subtotal:</span>
                    <span>${subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div class="totals-row">
                    <span>GST:</span>
                    <span>${gstTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div class="totals-row">
                    <span>Discount:</span>
                    <span>-${discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div class="divider"></div>
                  <div class="totals-row bold" style="font-size: 14px;">
                    <span>Total:</span>
                    <span>Rs. ${total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div class="footer">
                  <div>Thank you for your business!</div>
                </div>
              </div>
              <script>
                window.onload = function() { window.print(); window.close(); }
              </script>
            </body>
          </html>
        `;
      }
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      }
      
      // Refresh product stock levels from database
      await fetchProducts();

      // Reset cart
      setCart([]);
      setDiscount('');
      setNotes('');
      setPaymentMode('cash');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setSelectedCustomer(null);
      setPaymentModal(false);
    } catch (error) {
      console.error('Error:', error);
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const handleKey = e => {
      if (e.key === 'F9') {
        e.preventDefault();
        setPaymentModal(true);
      }
    };

    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  return (
    <div className="pos-wrapper">


      <div className="pos-layout">

        {/* LEFT */}

        <div className="left-panel">

          {/* SEARCH */}

          <div className="search-section">

            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search products, barcode..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="scanner-box">
              <ScanLine size={18} />
              Scanner Active
            </div>

            <button 
              onClick={toggleFullscreen}
              className="fullscreen-btn"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 12px', background: isFullscreen ? '#20b2aa' : '#f1f5f9', 
                color: isFullscreen ? '#fff' : '#475569',
                border: '1px solid #cbd5e1', borderRadius: '8px', 
                cursor: 'pointer', marginLeft: '10px', transition: 'all 0.2s'
              }}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>

          </div>

          {/* CATEGORIES */}

          <div className="categories">

            {categories.map(cat => (
              <button
                key={cat}
                className={activeCategory === cat ? 'active' : ''}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}

          </div>

          {/* PRODUCTS */}

          <div className="products-grid">

            {filteredProducts.map(product => {
              const isOutOfStock = product.stock <= 0;
              return (
                <div
                  key={product.id}
                  className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}
                  onClick={() => {
                    if (!isOutOfStock) {
                      addToCart(product);
                    }
                  }}
                  style={isOutOfStock ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >

                <div className="product-image">
                  <img src={product.image} alt={product.name} />
                </div>

                <div className="product-info">

                  <span className="category-tag">
                    {product.category}
                  </span>

                  <h4>{product.name}</h4>

                  <div className="price-row">
                    <span className="price">
                      ₹{product.price.toLocaleString()}
                    </span>

                    <span className="stock">
                      Stock: {product.stock}
                    </span>
                  </div>

                </div>

                </div>
              );
            })}

          </div>

        </div>

        {/* RIGHT PANEL */}

        <div className="right-panel">

          {/* CUSTOMER */}

          <div className="customer-card" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div className="avatar">
              <User size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <span className="small-text" style={{ display: 'block', marginBottom: '4px' }}>Customer</span>
              <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
                <div style={{ position: 'relative', flex: 1, width: '100%' }}>
                  <input
                    type="text"
                    placeholder="Search Customer by Name / Phone..."
                    value={showCustDropdown ? custSearch : (selectedCustomer ? `${selectedCustomer.name} ${selectedCustomer.phone ? `(${selectedCustomer.phone})` : ''}` : (customerName || 'Walk-in Customer'))}
                    onFocus={() => {
                      setShowCustDropdown(true);
                      setCustSearch('');
                    }}
                    onChange={(e) => setCustSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = custSearch.trim();
                        if (val) {
                          const matched = customers.find(c => c.name.toLowerCase() === val.toLowerCase());
                          if (matched) {
                            setSelectedCustomer(matched);
                            setCustomerName(matched.name);
                            setCustomerPhone(matched.phone || matched.mobile || '');
                          } else {
                            setSelectedCustomer(null);
                            setCustomerName(val);
                            setCustomerPhone('');
                            setCustomerAddress('');
                          }
                          setShowCustDropdown(false);
                        }
                      }
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', fontWeight: 'bold', backgroundColor: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' }}
                  />
                  {showCustDropdown && (
                    <>
                      <div 
                        onClick={() => {
                          const val = custSearch.trim();
                          if (val) {
                            const matched = customers.find(c => c.name.toLowerCase() === val.toLowerCase());
                            if (matched) {
                              setSelectedCustomer(matched);
                              setCustomerName(matched.name);
                              setCustomerPhone(matched.phone || matched.mobile || '');
                            } else {
                              setSelectedCustomer(null);
                              setCustomerName(val);
                              setCustomerPhone('');
                              setCustomerAddress('');
                            }
                          }
                          setShowCustDropdown(false);
                        }} 
                        style={{ position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, zIndex: 999 }} 
                      />
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 1000, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                        <div
                          onClick={() => {
                            setSelectedCustomer(null);
                            setCustomerName('');
                            setCustomerPhone('');
                            setShowCustDropdown(false);
                          }}
                          style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #f1f5f9', color: '#64748b', backgroundColor: '#f8fafc' }}
                        >
                          Walk-in Customer
                        </div>
                        {customers
                          .filter(c => 
                            c.name.toLowerCase().includes(custSearch.toLowerCase()) || 
                            (c.phone && c.phone.includes(custSearch))
                          )
                          .map(c => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setSelectedCustomer(c);
                                setCustomerName(c.name);
                                setCustomerPhone(c.phone || '');
                                setShowCustDropdown(false);
                              }}
                              style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}
                            >
                              {c.name} {c.phone ? `(${c.phone})` : ''}
                            </div>
                          ))
                        }
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CART */}

          <div className="cart-section">

            <div className="cart-header">
              <ShoppingCart size={18} />
              Cart Items ({cart.length})
            </div>

            <div className="cart-table-head">
              <span>Item</span>
              <span>Qty</span>
              <span>Total</span>
            </div>

            <div className="cart-items">

              {cart.length === 0 ? (
                <div className="empty-cart">
                  <Receipt size={60} />
                  <p>No items added</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="cart-row">

                    <div className="cart-product">

                      <img src={item.image} alt="" />

                      <div>
                        <h5>{item.name}</h5>
                        <span>₹{item.price}</span>
                      </div>

                    </div>

                    <div className="qty-box">

                      <button
                        onClick={() =>
                          updateQty(item.id, 'dec')
                        }
                      >
                        <Minus size={14} />
                      </button>

                      <span>{item.qty}</span>

                      <button
                        onClick={() =>
                          updateQty(item.id, 'inc')
                        }
                      >
                        <Plus size={14} />
                      </button>

                    </div>

                    <div className="row-total">
                      ₹{(item.price * item.qty).toLocaleString()}
                    </div>

                    <button
                      className="remove-btn"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 size={15} />
                    </button>

                  </div>
                ))
              )}

            </div>



            {/* TOTALS */}

            <div className="summary">

              <div>
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>

              <div>
                <span>CGST</span>
                <span>₹{cgst.toFixed(2)}</span>
              </div>

              <div>
                <span>SGST</span>
                <span>₹{sgst.toFixed(2)}</span>
              </div>

              <div>
                <span>Discount (%)</span>
                <input
                  type="number"
                  placeholder=""
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  style={{ width: '45px', padding: '2px 4px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right', outline: 'none' }}
                />
              </div>

              <div className="grand-total">
                <span>TOTAL</span>
                <span>₹{total.toLocaleString()}</span>
              </div>

            </div>

            {/* BUTTONS */}

            <div className="actions">

              <button className="hold-btn">
                <PauseCircle size={18} />
                Hold
              </button>

              <button
                className="pay-btn"
                onClick={() => setPaymentModal(true)}
                disabled={cart.length === 0 || loading}
              >
                <CreditCard size={18} />
                Pay (F9)
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* PAYMENT MODAL */}

      {paymentModal && (
        <div className="modal-overlay">

          <div className="payment-modal">

            <div className="modal-header">

              <h2>Payment</h2>

              <button onClick={() => setPaymentModal(false)}>
                ×
              </button>

            </div>

            <div className="payment-amount">
              ₹{total.toLocaleString()}
            </div>

            <div className="payment-methods">

              <button
                className={paymentMode === 'cash' ? 'active' : ''}
                onClick={() => setPaymentMode('cash')}
              >
                Cash
              </button>
              <button
                className={paymentMode === 'upi' ? 'active' : ''}
                onClick={() => setPaymentMode('upi')}
              >
                UPI
              </button>
              <button
                className={paymentMode === 'card' ? 'active' : ''}
                onClick={() => setPaymentMode('card')}
              >
                Card
              </button>
              <button
                className={paymentMode === 'credit' ? 'active' : ''}
                onClick={() => setPaymentMode('credit')}
              >
                Credit
              </button>
            </div>

            {paymentMode === 'credit' && !selectedCustomer && (
              <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Customer Name (Required)" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
                <input 
                  type="text" 
                  placeholder="Customer Phone (Required)" 
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
                <textarea 
                  placeholder="Customer Address (Optional)" 
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', minHeight: '60px', resize: 'vertical' }}
                />
              </div>
            )}



            <div className="payment-actions">

              <button
                className="cancel"
                onClick={() => setPaymentModal(false)}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                className="confirm"
                onClick={handleCompletePayment}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Complete Payment'}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="modal-overlay">
          <div className="payment-modal" style={{ maxWidth: '400px', width: '90%', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '8px' }}>
            <div className="modal-header">
              <h2>Add New Customer</h2>
              <button onClick={() => setShowAddCustomerModal(false)}>×</button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Name *</label>
                <input 
                  type="text" 
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Phone Number *</label>
                <input 
                  type="text" 
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Address</label>
                <textarea 
                  value={newCustomerAddress}
                  onChange={(e) => setNewCustomerAddress(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', minHeight: '80px', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  onClick={() => setShowAddCustomerModal(false)}
                  style={{ padding: '10px 15px', background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddCustomer}
                  disabled={addingCustomer}
                  style={{ padding: '10px 15px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {addingCustomer ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="pos-toast" style={{
          background: toast.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: toast.type === 'error' ? '#dc2626' : '#16a34a'
        }}>
          {toast.message}
        </div>
      )}

    </div>
  );
}