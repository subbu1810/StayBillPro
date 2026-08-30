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

import API_BASE from '../../config/serverConfig';

export default function POSBillingPage({ mode = 'billing' }) {
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

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const unexpiredProducts = combined.filter(p => {
        if (!p.expiry_date) return true;
        const expDate = new Date(p.expiry_date);
        return expDate >= today;
      });

      const formatted = unexpiredProducts.map(p => ({
        id: p.id,
        name: p.name || 'Unnamed Product',
        category: p.category_name || p.category || 'Uncategorized',
        sku: p.sku || p.part_number || '',
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
          if (data.inclusive_gst !== undefined) setInclusiveGst(!!data.inclusive_gst);
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
  const adminUserStr = localStorage.getItem('adminUser');
  const bProf = adminUserStr ? JSON.parse(adminUserStr) : {};
  const [shopName, setShopName] = useState(bProf.business || bProf.business_name || '');
  const [gstin, setGstin] = useState(bProf.gst_number || '');
  const [printSize, setPrintSize] = useState('80mm');
  const [inclusiveGst, setInclusiveGst] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [showHeldCartsModal, setShowHeldCartsModal] = useState(false);
  const [heldCarts, setHeldCarts] = useState([]);

  useEffect(() => {
    const storedHeldCarts = localStorage.getItem('pos_held_carts');
    if (storedHeldCarts) {
      try {
        setHeldCarts(JSON.parse(storedHeldCarts));
      } catch (err) {
        console.error('Failed to parse held carts:', err);
      }
    }
  }, []);

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
    p => {
      if (activeCategory !== 'All' && p.category !== activeCategory) return false;
      const query = searchQuery.toLowerCase();
      if (!query) return true;
      
      return (
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.sku && p.sku.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query)) ||
        (p.price && p.price.toString().includes(query))
      );
    }
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

  const handleQtyChange = (id, value) => {
    let val = value === '' ? '' : parseInt(value);
    if (val === '') {
        setCart(cart.map(item => item.id === id ? { ...item, qty: '' } : item));
        return;
    }
    if (isNaN(val) || val < 1) val = 1;
    
    setCart(
      cart.map(item => {
        if (item.id === id) {
          if (val > item.stock) {
            showToast(`Only ${item.stock} units available in stock.`, 'error');
            return { ...item, qty: item.stock };
          }
          return { ...item, qty: val };
        }
        return item;
      })
    );
  };

  const removeItem = id => {
    setCart(cart.filter(i => i.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => {
    const gst = Number(item.gst || 0);
    if (inclusiveGst) {
      const basePrice = item.price / (1 + gst / 100);
      return acc + basePrice * item.qty;
    }
    return acc + item.price * item.qty;
  }, 0);

  const gstTotal = cart.reduce((acc, item) => {
    const gst = Number(item.gst || 0);
    if (inclusiveGst) {
      const basePrice = item.price / (1 + gst / 100);
      return acc + (item.price - basePrice) * item.qty;
    }
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
    if (mode !== 'quotation' && !paymentMode) {
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
          price: item.price,
          gst: item.gst
        })),
        totalAmount: parseFloat(total.toFixed(2)),
        gstAmount: parseFloat(gstTotal.toFixed(2)),
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        paymentMethod: paymentMode,
        notes: notes,
        invoiceType: 'pos'
      };

      let data = {};
      let invoiceId = 'NEW';
      
      if (mode !== 'quotation') {
        const response = await fetch(`${API_BASE}/billing`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        data = await response.json();

        if (!response.ok) {
          showToast(data.message || 'Failed to save invoice', 'error');
          return;
        }

        showToast('Invoice created successfully!', 'success');
        invoiceId = data.invoiceId || (data.invoice && data.invoice.id) || 'NEW';
      } else {
        showToast('Quotation generated successfully!', 'success');
        invoiceId = `QUOTE-${Date.now().toString().slice(-6)}`;
      }
      
      // Auto-print receipt
      
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
                  <p><strong>Invoice ID:</strong> POSINV${String(invoiceId).padStart(2, '0')}</p>
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
                  ${mode === 'quotation' ? `
                    <h3>Quote Details</h3>
                    <p><strong>Valid Until:</strong> ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                  ` : `
                    <h3>Payment Details</h3>
                    <p><strong>Payment Method:</strong> ${paymentMode.toUpperCase()}</p>
                    <p><strong>Status:</strong> ${paymentMode === 'credit' ? 'PENDING' : 'PAID'}</p>
                  `}
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
                window.onload = function() { window.print(); }
              </script>
            </body>
          </html>
        `;
      } else {
        const taxGroups = {};
        cart.forEach(item => {
          const rate = Number(item.gst || 0);
          const amt = inclusiveGst 
             ? (item.price / (1 + rate / 100)) * item.qty 
             : item.price * item.qty;
          if (!taxGroups[rate]) {
            taxGroups[rate] = { items: [], taxable: 0, cgst: 0, sgst: 0, totalTax: 0 };
          }
          taxGroups[rate].items.push(item);
          taxGroups[rate].taxable += amt;
          const itemGst = inclusiveGst
             ? (item.price - (item.price / (1 + rate / 100))) * item.qty
             : amt * (rate / 100);
          taxGroups[rate].cgst += itemGst / 2;
          taxGroups[rate].sgst += itemGst / 2;
          taxGroups[rate].totalTax += itemGst;
        });

        const totalItemsCount = cart.length;
        const totalQtyCount = cart.reduce((sum, i) => sum + Number(i.qty || 0), 0);

        let itemsHtml = '';
        let groupIndex = 1;
        for (const [rate, group] of Object.entries(taxGroups)) {
          const halfRate = (Number(rate) / 2).toFixed(2);
          itemsHtml += `
            <tr>
              <td colspan="4" style="padding: 4px 0 2px 0; font-weight: bold; font-style: italic;">
                ${groupIndex}) CGST @ ${halfRate}%, SGST @ ${halfRate}%
              </td>
            </tr>
          `;
          for (const item of group.items) {
            const itemRate = Number(item.gst || 0);
            const basePrice = inclusiveGst 
                 ? item.price / (1 + itemRate / 100) 
                 : item.price;
            itemsHtml += `
              <tr>
                <td style="padding-right: 2px;">${item.name.substring(0, 16)}</td>
                <td style="text-align: center; white-space: nowrap;">${item.qty}</td>
                <td style="text-align: right; white-space: nowrap;">${basePrice.toFixed(2)}</td>
                <td style="text-align: right; white-space: nowrap;">${(basePrice * item.qty).toFixed(2)}</td>
              </tr>
            `;
          }
          groupIndex++;
        }

        let taxBreakdownHtml = '';
        let taxIdx = 1;
        let grandTaxable = 0;
        let grandCgst = 0;
        let grandSgst = 0;
        let grandTotalWithTax = 0;

        for (const group of Object.values(taxGroups)) {
          taxBreakdownHtml += `
            <tr>
              <td>${taxIdx}</td>
              <td style="text-align: right; white-space: nowrap;">${group.taxable.toFixed(2)}</td>
              <td style="text-align: right; white-space: nowrap;">${group.cgst.toFixed(2)}</td>
              <td style="text-align: right; white-space: nowrap;">${group.sgst.toFixed(2)}</td>
              <td style="text-align: right; white-space: nowrap;">${(group.taxable + group.totalTax).toFixed(2)}</td>
            </tr>
          `;
          grandTaxable += group.taxable;
          grandCgst += group.cgst;
          grandSgst += group.sgst;
          grandTotalWithTax += (group.taxable + group.totalTax);
          taxIdx++;
        }
        
        taxBreakdownHtml += `
            <tr style="border-top: 1px dashed #000; font-weight: bold;">
              <td>T:</td>
              <td style="text-align: right; white-space: nowrap;">${grandTaxable.toFixed(2)}</td>
              <td style="text-align: right; white-space: nowrap;">${grandCgst.toFixed(2)}</td>
              <td style="text-align: right; white-space: nowrap;">${grandSgst.toFixed(2)}</td>
              <td style="text-align: right; white-space: nowrap;">${grandTotalWithTax.toFixed(2)}</td>
            </tr>
        `;

        htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invoice - ${invoiceId}</title>
              <style>
                body { font-family: 'Courier New', Courier, monospace; margin: 0 auto; color: #000; font-size: ${printSize === '50mm' ? '10px' : '12px'}; max-width: ${printSize === '50mm' ? '58mm' : '100%'}; box-sizing: border-box; }
                .center { text-align: center; }
                .header-name { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
                .header-address { font-size: 10px; margin-bottom: 2px; }
                .divider { border-bottom: 1px dashed #000; margin: 5px 0; }
                .flex-between { display: flex; flex-wrap: wrap; justify-content: space-between; }
                .flex-between span { margin-right: 5px; }
                table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                th, td { text-align: left; padding: 2px 0; word-wrap: break-word; vertical-align: top; }
                .bold { font-weight: bold; }
                .tax-table { font-size: 9px; margin-top: 10px; }
                .tax-table th { padding-bottom: 4px; }
                @media print { 
                  @page { margin: 0; }
                  body { width: 100%; max-width: 100%; padding: 0 5px; } 
                }
              </style>
            </head>
            <body>
              <div style="width: 100%; margin: 0 auto; padding: 10px 5px;">
                <div class="center">
                  <div class="header-name">${shopName}</div>
                  <div class="header-address">Phone: ${bProf.phone || finalCustomerPhone || '—'}</div>
                  <div class="header-address">GSTIN: ${gstin}</div>
                </div>
                <div class="divider"></div>
                <div class="center bold" style="font-size: 14px; margin: 4px 0;">${mode === 'quotation' ? 'QUOTATION' : 'TAX INVOICE'}</div>
                <div class="flex-between">
                  <span>${mode === 'quotation' ? 'Quote No' : 'Bill No'} : ${String(invoiceId).padStart(4, '0')}</span>
                  <span>Date : ${new Date().toLocaleDateString('en-GB')}</span>
                </div>
                <div class="divider"></div>
                <table>
                  <thead>
                    <tr style="border-bottom: 1px dashed #000;">
                      <th style="width: 44%;">Particulars</th>
                      <th style="width: 12%; text-align: center;">Qty</th>
                      <th style="width: 20%; text-align: right;">Rate</th>
                      <th style="width: 24%; text-align: right;">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
                <div class="divider"></div>
                <div class="flex-between" style="padding-top: 4px;">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div class="flex-between">
                  <span>CGST:</span>
                  <span>${cgst.toFixed(2)}</span>
                </div>
                <div class="flex-between">
                  <span>SGST:</span>
                  <span>${sgst.toFixed(2)}</span>
                </div>
                ${discountAmount > 0 ? `
                <div class="flex-between">
                  <span>Discount (${discount}%):</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
                ` : ''}
                <div class="divider"></div>
                <div class="flex-between bold" style="font-size: 14px; padding: 4px 0;">
                  <span>Items: ${totalItemsCount} &nbsp;&nbsp;&nbsp; Qty: ${totalQtyCount}</span>
                  <span>Total: ${total.toFixed(2)}</span>
                </div>
                <div class="divider"></div>
                
                <div class="center" style="font-size: 10px; margin-top: 8px;">
                  &lt;------- GST Breakup Details -------&gt;
                </div>
                <table class="tax-table">
                  <thead>
                    <tr style="border-bottom: 1px dashed #000;">
                      <th style="width: 10%;">GST<br>IND</th>
                      <th style="width: 25%; text-align: right;">Taxable<br>Amt</th>
                      <th style="width: 20%; text-align: right;">CGST<br>Amt</th>
                      <th style="width: 20%; text-align: right;">SGST<br>Amt</th>
                      <th style="width: 25%; text-align: right;">Total<br>Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${taxBreakdownHtml}
                  </tbody>
                </table>
                
                <div class="divider"></div>
                ${discountAmount > 0 ? `
                <div class="center bold" style="margin-top: 10px; margin-bottom: 5px; font-size: 13px; border: 1px dashed #000; padding: 4px; border-radius: 4px;">
                  *** YOU SAVED: ₹${discountAmount.toFixed(2)} ***
                </div>
                ` : ''}
                <div class="center bold" style="margin-top: 10px; font-style: italic; font-size: 14px;">
                  *** Thank You Visit Again ***
                </div>
                ${bProf.upi_id ? `
                <div class="center" style="margin-top: 15px;">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=${bProf.upi_id}&pn=${encodeURIComponent(shopName)}&am=${Number(total).toFixed(2)}&cu=INR`)}" alt="UPI QR Code" style="max-width: 100px; height: auto;" />
                  <div style="font-size: 10px; font-weight: bold; margin-top: 4px;">Scan to Pay</div>
                </div>
                ` : ''}
              </div>
              <script>
                window.onload = function() { 
                  window.print(); 
                }
              </script>
            </body>
          </html>
        `;
      }
      const wasFullscreen = !!document.fullscreenElement;
      
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      iframe.contentWindow.addEventListener('afterprint', () => {
        if (wasFullscreen && !document.fullscreenElement) {
          const elem = document.querySelector('.pos-wrapper');
          if (elem && elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => console.log('Fullscreen restore failed', err));
          }
        }
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      });

      // Fallback cleanup just in case afterprint doesn't fire
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 300000); // 10 seconds is usually enough time to let the user print
      
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

  const handleHoldCart = () => {
    if (cart.length === 0) {
      showToast('Cannot hold an empty cart.', 'error');
      return;
    }

    const newHeldCart = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      cart,
      customer: selectedCustomer || (customerName ? { name: customerName, phone: customerPhone } : { name: 'Walk-in Customer' }),
      discount,
      notes,
    };

    const updatedCarts = [...heldCarts, newHeldCart];
    setHeldCarts(updatedCarts);
    localStorage.setItem('pos_held_carts', JSON.stringify(updatedCarts));

    setCart([]);
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerPhone('');
    setDiscount('');
    setNotes('');
    showToast('Cart put on hold.', 'success');
  };

  const resumeHeldCart = (heldCart) => {
    setCart(heldCart.cart || []);
    if (heldCart.customer && heldCart.customer.name !== 'Walk-in Customer') {
      setSelectedCustomer(heldCart.customer);
      setCustomerName(heldCart.customer.name || '');
      setCustomerPhone(heldCart.customer.phone || '');
    } else {
      setSelectedCustomer(null);
      setCustomerName('');
      setCustomerPhone('');
    }
    setDiscount(heldCart.discount || '');
    setNotes(heldCart.notes || '');

    const updatedCarts = heldCarts.filter(c => c.id !== heldCart.id);
    setHeldCarts(updatedCarts);
    localStorage.setItem('pos_held_carts', JSON.stringify(updatedCarts));
    setShowHeldCartsModal(false);
  };

  const deleteHeldCart = (cartId) => {
    const updatedCarts = heldCarts.filter(c => c.id !== cartId);
    setHeldCarts(updatedCarts);
    localStorage.setItem('pos_held_carts', JSON.stringify(updatedCarts));
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const barcodeBuffer = React.useRef('');
  const barcodeTimeout = React.useRef(null);

  useEffect(() => {
    const handleKey = e => {
      // Ignore key events if the user is typing into an input or textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      if (e.key === 'F9') {
        e.preventDefault();
        setPaymentModal(true);
        return;
      }

      // Barcode Scanner Logic
      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        if (barcodeTimeout.current) clearTimeout(barcodeTimeout.current);
        barcodeTimeout.current = setTimeout(() => {
          barcodeBuffer.current = '';
        }, 50); // 50ms interval max between keys, normal typing is slower, scanner is faster
      } else if (e.key === 'Enter' && barcodeBuffer.current.length > 0) {
        e.preventDefault();
        
        const scannedSku = barcodeBuffer.current.trim();
        const product = products.find(p => p.sku && p.sku.toString().toLowerCase() === scannedSku.toLowerCase());
        
        if (product) {
            setCart(prevCart => {
                const exists = prevCart.find(i => i.id === product.id);
                if (exists) {
                    if (exists.qty >= product.stock) {
                        showToast(`Cannot add more. Only ${product.stock} units available in stock.`, 'error');
                        return prevCart;
                    }
                    return prevCart.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
                } else {
                    if (product.stock <= 0) {
                        showToast(`Product is out of stock.`, 'error');
                        return prevCart;
                    }
                    return [...prevCart, { ...product, qty: 1 }];
                }
            });
        } else {
            showToast(`Product with SKU ${scannedSku} not found`, 'error');
        }
        
        barcodeBuffer.current = '';
      }
    };

    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('keydown', handleKey);
      if (barcodeTimeout.current) clearTimeout(barcodeTimeout.current);
    };
  }, [products]);

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
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#94a3b8', marginBottom: '10px'}}>
                    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/>
                    <text x="12" y="16" fontSize="12" fontWeight="bold" stroke="none" fill="currentColor" textAnchor="middle" fontFamily="sans-serif">₹</text>
                  </svg>
                  <p>No items added</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="cart-row">

                    <div className="cart-product">

                      <img src={item.image} alt="" />

                      <div>
                        <h5 title={item.name}>{item.name}</h5>
                        <span>₹{item.price}</span>
                      </div>

                    </div>

                    <div className="qty-box" style={{ display: 'flex', alignItems: 'center' }}>

                      <button
                        onClick={() =>
                          updateQty(item.id, 'dec')
                        }
                      >
                        <Minus size={14} />
                      </button>

                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleQtyChange(item.id, e.target.value)}
                        onBlur={(e) => {
                          if (e.target.value === '' || isNaN(parseInt(e.target.value)) || parseInt(e.target.value) < 1) {
                            handleQtyChange(item.id, 1);
                          }
                        }}
                        style={{
                          width: '40px',
                          textAlign: 'center',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          padding: '2px',
                          margin: '0 5px',
                          outline: 'none'
                        }}
                      />

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
                  type="number" step="any"
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

            <div className="actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '10px' }}>

              <button className="hold-btn" onClick={handleHoldCart}>
                <PauseCircle size={18} />
                Hold
              </button>

              <button className="hold-btn" onClick={() => setShowHeldCartsModal(true)} style={{ background: '#f1f5f9', color: '#0f172a' }}>
                Held ({heldCarts.length})
              </button>

              <button
                className="pay-btn"
                onClick={() => mode === 'quotation' ? handleCompletePayment() : setPaymentModal(true)}
                disabled={cart.length === 0 || loading}
              >
                {mode === 'quotation' ? <Receipt size={18} /> : <CreditCard size={18} />}
                {mode === 'quotation' ? 'Print Quote (F9)' : 'Pay (F9)'}
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

      {/* HELD CARTS MODAL */}
      {showHeldCartsModal && (
        <div className="modal-overlay">
          <div className="payment-modal" style={{ maxWidth: '600px', width: '90%', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '8px' }}>
            <div className="modal-header">
              <h2>Held Carts</h2>
              <button onClick={() => setShowHeldCartsModal(false)}>×</button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '60vh', overflowY: 'auto' }}>
              {heldCarts.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b' }}>No held carts available.</div>
              ) : (
                heldCarts.map((c) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#0f172a' }}>{c.customer?.name || 'Walk-in Customer'}</div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{c.date} • {c.cart?.length || 0} items</div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => deleteHeldCart(c.id)}
                        style={{ padding: '8px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Delete
                      </button>
                      <button 
                        onClick={() => resumeHeldCart(c)}
                        style={{ padding: '8px 12px', background: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Resume
                      </button>
                    </div>
                  </div>
                ))
              )}
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
