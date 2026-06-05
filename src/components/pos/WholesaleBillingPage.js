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
  ScanLine
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const numberToWords = (num) => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const numString = Math.floor(num).toString();
  if (numString.length > 9) return 'Overflow';
  const n = ('000000000' + numString).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += n[1] !== '00' ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += n[2] !== '00' ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += n[3] !== '00' ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += n[4] !== '0' ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += n[5] !== '00' ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : 'Only';
  return str.trim();
};

export default function WholesaleBillingPage() {
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
        price: parseFloat(p.wholesale_price) || parseFloat(p.price) || 0,
        retailPrice: parseFloat(p.price) || 0,
        wholesalePrice: parseFloat(p.wholesale_price) || parseFloat(p.price) || 0,
        stock: Math.max(0, parseInt(p.quantity || p.stock) || 0),
        gst: parseFloat(p.gst_rate) || 0,
        image: p.image || 'https://via.placeholder.com/300x200',
        hsn: p.hsn_code || '—'
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

    if (!selectedCustomer && !customerName.trim()) {
      showToast('Please select a customer or enter a name for Wholesale billing', 'error');
      return;
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
        const totalUnits = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
        const roundedTotal = Math.round(total);
        const roundDiff = (roundedTotal - total).toFixed(2);
        const rupeesInWords = numberToWords(roundedTotal);

        // Group by GST tax rates for breakdown
        const taxGroups = {};
        cart.forEach(item => {
          const rate = Number(item.gst || 0);
          const amt = item.price * item.qty;
          if (!taxGroups[rate]) {
            taxGroups[rate] = { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 };
          }
          taxGroups[rate].taxable += amt;
          const itemGst = amt * (rate / 100);
          taxGroups[rate].cgst += itemGst / 2;
          taxGroups[rate].sgst += itemGst / 2;
          taxGroups[rate].totalTax += itemGst;
        });

        // Rows for the main items table
        const tableRowsHtml = cart.map((item, idx) => `
          <tr style="border-bottom: 1px solid #cbd5e1;">
            <td style="padding: 8px 4px; text-align: center; border-right: 1px solid #cbd5e1;">${idx + 1}</td>
            <td style="padding: 8px 6px; text-align: left; font-weight: 600; border-right: 1px solid #cbd5e1;">${item.name}</td>
            <td style="padding: 8px 4px; text-align: center; border-right: 1px solid #cbd5e1;">${item.hsn || '—'}</td>
            <td style="padding: 8px 4px; text-align: center; border-right: 1px solid #cbd5e1;">${item.gst}%</td>
            <td style="padding: 8px 4px; text-align: center; border-right: 1px solid #cbd5e1;">${item.qty.toFixed(2)}</td>
            <td style="padding: 8px 4px; text-align: center; border-right: 1px solid #cbd5e1;">Units</td>
            <td style="padding: 8px 6px; text-align: right; border-right: 1px solid #cbd5e1;">${(item.retailPrice || item.price).toFixed(2)}</td>
            <td style="padding: 8px 6px; text-align: right; border-right: 1px solid #cbd5e1;">${item.price.toFixed(2)}</td>
            <td style="padding: 8px 6px; text-align: right; font-weight: 600;">₹${(item.price * item.qty).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          </tr>
        `).join('');



        // Tax breakdown table rows
        const taxBreakdownRowsHtml = Object.keys(taxGroups).map(rate => {
          const group = taxGroups[rate];
          return `
            <tr style="border-bottom: 1px solid #cbd5e1;">
              <td style="padding: 4px 6px; border-right: 1px solid #cbd5e1; text-align: left;">${rate}%</td>
              <td style="padding: 4px 6px; border-right: 1px solid #cbd5e1; text-align: right;">₹${group.taxable.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              <td style="padding: 4px 6px; border-right: 1px solid #cbd5e1; text-align: right;">₹${group.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              <td style="padding: 4px 6px; border-right: 1px solid #cbd5e1; text-align: right;">₹${group.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              <td style="padding: 4px 6px; text-align: right;">₹${group.totalTax.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            </tr>
          `;
        }).join('');

        // CGST/SGST calculations rows for the right summary
        const gstTaxSummaryHtml = Object.keys(taxGroups).map(rate => {
          const group = taxGroups[rate];
          const halfRate = (Number(rate) / 2).toFixed(2);
          return `
            <tr>
              <td style="padding: 3px 0; text-align: left; font-weight: 500;">Add : CGST</td>
              <td style="padding: 3px 0; text-align: center; color: #475569;">@</td>
              <td style="padding: 3px 0; text-align: right; color: #475569;">${halfRate} %</td>
              <td style="padding: 3px 0; text-align: right; font-weight: 600;">${group.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; text-align: left; font-weight: 500;">Add : SGST</td>
              <td style="padding: 3px 0; text-align: center; color: #475569;">@</td>
              <td style="padding: 3px 0; text-align: right; color: #475569;">${halfRate} %</td>
              <td style="padding: 3px 0; text-align: right; font-weight: 600;">${group.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            </tr>
          `;
        }).join('');

        htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Tax Invoice - ${invoiceId}</title>
              <style>
                * { box-sizing: border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; margin: 0 auto; color: #000; font-size: 13px; max-width: 210mm; }
                .invoice-border { border: 1px solid #000; padding: 0; width: 100%; display: flex; flex-direction: column; }
                .header-section { border-bottom: 1px solid #000; padding: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
                .header-top { width: 100%; display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 5px; font-weight: bold; }
                .company-name { font-size: 22px; font-weight: 800; text-align: center; margin: 5px 0 2px 0; letter-spacing: 0.5px; }
                .company-details { font-size: 12px; text-align: center; margin: 2px 0; font-weight: 500; }
                
                .metadata-section { border-bottom: 1px solid #000; display: flex; width: 100%; }
                .meta-col { flex: 1; padding: 8px 10px; }
                .meta-col:first-child { border-right: 1px solid #000; }
                .meta-row { display: flex; margin-bottom: 4px; }
                .meta-label { width: 120px; font-weight: bold; }
                .meta-value { flex: 1; }

                .billing-section { border-bottom: 1px solid #000; display: flex; width: 100%; }
                .bill-box { flex: 1; padding: 8px 10px; min-height: 120px; }
                .bill-box:first-child { border-right: 1px solid #000; }
                .bill-title { font-weight: bold; text-decoration: underline; margin-bottom: 6px; font-style: italic; }
                .bill-details { line-height: 1.4; }

                .items-table { width: 100%; border-collapse: collapse; border-bottom: 1px solid #000; }
                .items-table th { background: #f1f5f9; padding: 8px 4px; font-weight: bold; font-size: 12px; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #000; text-align: center; }
                .items-table th:last-child { border-right: none; }

                .summary-outer { display: flex; width: 100%; border-bottom: 1px solid #000; }
                .summary-left { flex: 1.2; padding: 10px; border-right: 1px solid #000; display: flex; flex-direction: column; justify-content: flex-end; }
                .summary-right { flex: 0.8; padding: 10px; display: flex; flex-direction: column; justify-content: flex-end; }
                .summary-table { width: 100%; border-collapse: collapse; }
                
                .tax-breakdown-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; border: 1px solid #cbd5e1; }
                .tax-breakdown-table th { background: #f8fafc; padding: 4px; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; font-weight: bold; text-align: center; }
                .tax-breakdown-table td { padding: 4px; border-right: 1px solid #cbd5e1; }
                .tax-breakdown-table th:last-child, .tax-breakdown-table td:last-child { border-right: none; }

                .grand-total-row { border-top: 1px solid #000; border-bottom: 1px solid #000; font-weight: bold; font-size: 14px; background: #f8fafc; }
                .grand-total-row td { padding: 8px 0; }

                .words-section { border-bottom: 1px solid #000; padding: 8px 10px; font-weight: bold; font-size: 12px; }
                
                .footer-section { display: flex; width: 100%; min-height: 120px; }
                .terms-box { flex: 1.2; padding: 8px 10px; border-right: 1px solid #000; font-size: 11px; line-height: 1.4; }
                .terms-title { font-weight: bold; text-decoration: underline; margin-bottom: 4px; }
                .sign-box { flex: 0.8; padding: 8px 10px; display: flex; flex-direction: column; justify-content: space-between; }
                .auth-signature { text-align: right; margin-top: 40px; font-weight: bold; }

                @media print {
                  body { padding: 0; }
                  .invoice-border { border: 1px solid #000; }
                }
              </style>
            </head>
            <body>
              <div class="invoice-border">
                
                <!-- HEADER -->
                <div class="header-section">
                  <div class="header-top">
                    <div>GSTIN : ${gstin || '29AMEPP6614P1ZC'}</div>
                    <div style="font-size: 14px; text-decoration: underline;">TAX INVOICE</div>
                    <div>Original Copy</div>
                  </div>
                  <div class="company-name">${shopName.toUpperCase()}</div>
                  <div class="company-details">VENKATESHWARA NAGAR, SINDHANUR</div>
                  <div class="company-details">Tel. : 9845122669 &nbsp;&nbsp; email : mohan.mv2@gmail.com</div>
                </div>

                <!-- METADATA BOX -->
                <div class="metadata-section">
                  <div class="meta-col">
                    <div class="meta-row">
                      <div class="meta-label">Invoice No.</div>
                      <div class="meta-value">: ${String(invoiceId).padStart(4, '0')}</div>
                    </div>
                    <div class="meta-row">
                      <div class="meta-label">Dated</div>
                      <div class="meta-value">: ${new Date().toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>
                  <div class="meta-col">
                    <div class="meta-row">
                      <div class="meta-label">Place of Supply</div>
                      <div class="meta-value">: ${selectedCustomer?.state || 'Karnataka (29)'}</div>
                    </div>
                    <div class="meta-row">
                      <div class="meta-label">Reverse Charge</div>
                      <div class="meta-value">: N</div>
                    </div>
                  </div>
                </div>

                <!-- BILL TO / SHIP TO -->
                <div class="billing-section">
                  <div class="bill-box">
                    <div class="bill-title">Billed to :</div>
                    <div class="bill-details">
                      <strong>${finalCustomerName}</strong><br/>
                      ${customerAddress || '—'}<br/>
                      ${finalCustomerPhone ? `MOB : ${finalCustomerPhone}<br/>` : ''}
                      GSTIN / UIN &nbsp;&nbsp;: ${selectedCustomer?.gstin || '—'}
                    </div>
                  </div>
                  <div class="bill-box">
                    <div class="bill-title">Shipped to :</div>
                    <div class="bill-details">
                      <strong>${finalCustomerName}</strong><br/>
                      ${customerAddress || '—'}<br/>
                      ${finalCustomerPhone ? `MOB : ${finalCustomerPhone}<br/>` : ''}
                      GSTIN / UIN &nbsp;&nbsp;: ${selectedCustomer?.gstin || '—'}
                    </div>
                  </div>
                </div>

                <!-- ITEMS TABLE -->
                <table class="items-table">
                  <thead>
                    <tr>
                      <th style="width: 5%;">S.N.</th>
                      <th style="width: 45%;">Description of Goods</th>
                      <th style="width: 10%;">HSN</th>
                      <th style="width: 6%;">GST</th>
                      <th style="width: 8%;">Qty.</th>
                      <th style="width: 6%;">Unit</th>
                      <th style="width: 10%;">MRP</th>
                      <th style="width: 10%;">Price</th>
                      <th style="width: 10%;">Amount(₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tableRowsHtml}
                  </tbody>
                </table>

                <!-- SUMMARY SECTION -->
                <div class="summary-outer">
                  <div class="summary-left">
                    <div style="font-weight: bold; margin-bottom: 5px;">Tax Rate Breakdown:</div>
                    <table class="tax-breakdown-table">
                      <thead>
                        <tr>
                          <th>Tax Rate</th>
                          <th>Taxable Amt.</th>
                          <th>CGST Amt.</th>
                          <th>SGST Amt.</th>
                          <th>Total Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${taxBreakdownRowsHtml || '<tr><td colspan="5" style="text-align:center;">—</td></tr>'}
                      </tbody>
                    </table>
                  </div>
                  <div class="summary-right">
                    <table class="summary-table">
                      <tbody>
                        <tr style="border-bottom: 1px solid #cbd5e1; font-weight: bold;">
                          <td style="padding: 4px 0; text-align: left;">Subtotal</td>
                          <td></td>
                          <td></td>
                          <td style="padding: 4px 0; text-align: right;">₹${subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        </tr>
                        ${gstTaxSummaryHtml}
                        ${parseFloat(roundDiff) !== 0 ? `
                          <tr>
                            <td style="padding: 3px 0; text-align: left; font-weight: 500;">Less/Add: Rounded Off</td>
                            <td></td>
                            <td></td>
                            <td style="padding: 3px 0; text-align: right; font-weight: 600;">${parseFloat(roundDiff) > 0 ? `+` : ``}${roundDiff}</td>
                          </tr>
                        ` : ''}
                        <tr class="grand-total-row">
                          <td style="padding: 8px 0; text-align: left;">Grand Total</td>
                          <td colspan="2" style="text-align: center; font-size: 12px; font-weight: normal;">
                            <span style="font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 1px;">${totalUnits.toFixed(2)} Units</span>
                          </td>
                          <td style="padding: 8px 6px; text-align: right;">₹${roundedTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- RUPEES IN WORDS -->
                <div class="words-section">
                  Rupees ${rupeesInWords}
                </div>

                <!-- FOOTER / SIGNATURES -->
                <div class="footer-section">
                  <div class="terms-box">
                    <div class="terms-title">Terms & Conditions</div>
                    <div>E.& O.E.</div>
                    <div>1. Goods once sold will not be taken back.</div>
                    <div>2. Interest @ 18% p.a. will be charged if the payment is not made within the stipulated time.</div>
                    <div>3. Subject to 'Sindhanoor' Jurisdiction only.</div>
                  </div>
                  <div class="sign-box">
                    <div style="font-weight: bold;">Receiver's Signature :</div>
                    <div class="auth-signature">
                      <div style="font-size: 10px; font-weight: normal; margin-bottom: 30px;">For ${shopName.toUpperCase()}</div>
                      <div>Authorised Signatory</div>
                    </div>
                  </div>
                </div>

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
        if (!selectedCustomer) {
          showToast('Please select a customer first', 'error');
          return;
        }
        setPaymentModal(true);
      }
    };

    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('keydown', handleKey);
    };
  }, [selectedCustomer]);

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
                  <h3>{product.name}</h3>
                  <div className="price-stock">
                    <span className="price">₹{product.wholesalePrice.toLocaleString()}</span>
                    <span className="stock">Stock: {product.stock}</span>
                  </div>
                  <div className="wholesale-badge" style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px' }}>
                    Wholesale Price
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
                    placeholder="Select Customer..."
                    value={showCustDropdown ? custSearch : (selectedCustomer ? `${selectedCustomer.name} ${selectedCustomer.phone ? `(${selectedCustomer.phone})` : ''}` : (customerName || ''))}
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
                            setCustomerAddress(matched.billingAddress || matched.address || '');
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
                              setCustomerAddress(matched.billingAddress || matched.address || '');
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
                                setCustomerPhone(c.phone || c.mobile || '');
                                setCustomerAddress(c.billingAddress || c.address || '');
                                setShowCustDropdown(false);
                              }}
                              style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}
                            >
                              {c.name} {c.phone || c.mobile ? `(${c.phone || c.mobile})` : ''}
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
                disabled={cart.length === 0 || loading || !selectedCustomer}
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