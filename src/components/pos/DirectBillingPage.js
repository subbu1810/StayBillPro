import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Receipt, 
  User, 
  Phone, 
  CreditCard, 
  Printer, 
  CheckCircle, 
  FileText, 
  Plus, 
  RotateCcw,
  Building,
  QrCode,
  Tag,
  Hash,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import API_BASE from '../../config/serverConfig';
import { usePopup } from '../ui/PopupProvider';
import { branchesAPI, posSettingsAPI } from '../../services/api';

const DEFAULT_UPI_ACCOUNTS = [
  { id: 'upi_1', name: 'Primary Shop UPI (Main QR)', upiId: 'primary@upi', bank: 'Main Account' },
  { id: 'upi_2', name: 'Counter 1 - HDFC Bank', upiId: 'counter1.hdfc@upi', bank: 'HDFC Bank' },
  { id: 'upi_3', name: 'Counter 2 - SBI QR', upiId: 'counter2.sbi@upi', bank: 'State Bank of India' },
  { id: 'upi_4', name: 'Manager / Owner GPay', upiId: 'manager@okaxis', bank: 'Axis Bank' },
  { id: 'upi_5', name: 'ICICI Current Account QR', upiId: 'icicicurrent@icici', bank: 'ICICI Bank' }
];

export default function DirectBillingPage() {
  const popup = usePopup();

  // Basic Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isCustomBillNo, setIsCustomBillNo] = useState(false);
  const [customBillNo, setCustomBillNo] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);

  // Billing Line Items (No DB item required, purely open free-text)
  const [description, setDescription] = useState('Counter Sale / General Purchase');
  const [amount, setAmount] = useState('');
  const [taxPercent, setTaxPercent] = useState('0');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [notes, setNotes] = useState('');

  // Payment Options
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash' | 'upi' | 'card' | 'credit'
  const [selectedUpiAccount, setSelectedUpiAccount] = useState('upi_1');
  const [customUpiLabel, setCustomUpiLabel] = useState('');
  const [upiAccounts, setUpiAccounts] = useState(DEFAULT_UPI_ACCOUNTS);
  const [showAddUpiModal, setShowAddUpiModal] = useState(false);
  const [newUpiName, setNewUpiName] = useState('');
  const [newUpiId, setNewUpiId] = useState('');

  // Business & Printer Settings
  const [shopName, setShopName] = useState('StayBillPro Store');
  const [gstin, setGstin] = useState('');
  const [branchDetails, setBranchDetails] = useState({ name: '', phone: '', address: '', city: '' });
  const [printSize, setPrintSize] = useState('80mm');
  const [loading, setLoading] = useState(false);
  const [lastBill, setLastBill] = useState(null);

  // Load Business info & saved UPI accounts from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('adminUser');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u.business || u.business_name) setShopName(u.business || u.business_name);
        if (u.gst_number) setGstin(u.gst_number);
      }

      const storedUpi = localStorage.getItem('direct_bill_upi_accounts');
      if (storedUpi) {
        setUpiAccounts(JSON.parse(storedUpi));
      }
    } catch (e) {
      console.error(e);
    }

    const fetchBranchAndPosSettings = async () => {
      try {
        const branchId = localStorage.getItem('selectedBranchId') || '1';
        const [settingsRes, branchesRes] = await Promise.allSettled([
          posSettingsAPI.get(branchId),
          branchesAPI.getAll()
        ]);

        if (settingsRes.status === 'fulfilled' && settingsRes.value) {
          if (settingsRes.value.shop_name) setShopName(settingsRes.value.shop_name);
          if (settingsRes.value.gstin) setGstin(settingsRes.value.gstin);
          if (settingsRes.value.print_size) setPrintSize(settingsRes.value.print_size);
        }

        if (branchesRes.status === 'fulfilled' && Array.isArray(branchesRes.value)) {
          const b = branchesRes.value.find(br => String(br.id) === String(branchId)) || branchesRes.value[0];
          if (b) {
            setBranchDetails({
              name: b.name || '',
              phone: b.phone || '',
              address: b.address || '',
              city: b.city || ''
            });
          }
        }
      } catch (err) {
        console.error('Failed to load branch & settings:', err);
      }
    };

    fetchBranchAndPosSettings();
  }, []);

  // Calculation breakdown
  const rawAmt = parseFloat(amount) || 0;
  const discAmt = parseFloat(discountAmount) || 0;
  const baseTaxable = Math.max(0, rawAmt - discAmt);
  const taxRate = parseFloat(taxPercent) || 0;
  const calculatedTax = (baseTaxable * taxRate) / 100;
  const grandTotal = Math.round((baseTaxable + calculatedTax) * 100) / 100;

  const handleAddNewUpiAccount = (e) => {
    e.preventDefault();
    if (!newUpiName.trim()) {
      popup.showError('Please enter an account or counter name');
      return;
    }
    const newAcc = {
      id: `upi_${Date.now()}`,
      name: newUpiName.trim(),
      upiId: newUpiId.trim() || `${newUpiName.toLowerCase().replace(/\s+/g, '')}@upi`,
      bank: 'Custom Account'
    };
    const updated = [...upiAccounts, newAcc];
    setUpiAccounts(updated);
    localStorage.setItem('direct_bill_upi_accounts', JSON.stringify(updated));
    setSelectedUpiAccount(newAcc.id);
    setShowAddUpiModal(false);
    setNewUpiName('');
    setNewUpiId('');
    popup.showSuccess('New UPI Account / QR added successfully!');
  };

  const handleResetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setIsCustomBillNo(false);
    setCustomBillNo('');
    setDescription('Counter Sale / General Purchase');
    setAmount('');
    setDiscountAmount('0');
    setTaxPercent('0');
    setNotes('');
    setPaymentMode('cash');
    setLastBill(null);
  };

  const handleGenerateDirectBill = async (e) => {
    e.preventDefault();

    if (rawAmt <= 0) {
      popup.showError('Please enter a valid bill amount greater than 0');
      return;
    }

    if (isCustomBillNo && !customBillNo.trim()) {
      popup.showError('Please enter your custom Bill / Invoice number');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const branchId = localStorage.getItem('selectedBranchId') || '1';

      // 1. Determine particulars & chosen UPI Account details
      let chosenAccountLabel = '';
      if (paymentMode === 'upi') {
        const acc = upiAccounts.find(a => a.id === selectedUpiAccount);
        chosenAccountLabel = acc ? `${acc.name} (${acc.upiId})` : 'UPI QR';
      }

      const finalBillNumber = isCustomBillNo && customBillNo.trim() 
        ? customBillNo.trim() 
        : `DB-${Date.now().toString().slice(-6)}`;

      // 2. Prepare payload for billing API (creates real invoice & ledger entry)
      const payload = {
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim() || '',
        items: [
          {
            id: null, // open billing without DB item
            name: description.trim() || 'Direct Counter Sale',
            qty: 1,
            price: rawAmt,
            gst: taxRate
          }
        ],
        totalAmount: grandTotal,
        gstAmount: calculatedTax,
        discountAmount: discAmt,
        paymentMethod: paymentMode,
        invoiceType: 'pos',
        customInvoiceNo: finalBillNumber,
        notes: `[Direct Bill] ${paymentMode.toUpperCase()}${chosenAccountLabel ? ` - ${chosenAccountLabel}` : ''}${notes ? ` | ${notes}` : ''}`
      };

      const res = await fetch(`${API_BASE}/billing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to generate direct bill');
      }

      const generatedInvoiceId = data.invoiceId || (data.invoice && data.invoice.id) || finalBillNumber;
      
      const billData = {
        invoiceNumber: isCustomBillNo ? finalBillNumber : (data.invoiceId ? `POSINV${String(data.invoiceId).padStart(2, '0')}` : finalBillNumber),
        date: billDate,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim() || '',
        description: description.trim() || 'Direct Counter Sale',
        amount: rawAmt,
        discount: discAmt,
        taxPercent: taxRate,
        taxAmount: calculatedTax,
        total: grandTotal,
        paymentMode: paymentMode,
        upiAccount: chosenAccountLabel,
        notes: notes.trim()
      };

      setLastBill(billData);
      popup.showSuccess(`Bill #${billData.invoiceNumber} generated & recorded into ledger successfully!`);

      // Trigger Instant Print
      printDirectBill(billData);

    } catch (err) {
      console.error(err);
      popup.showError('Error generating bill: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const printDirectBill = (bill = lastBill) => {
    if (!bill) return;

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to print receipt');
      return;
    }

    let receiptHtml = '';

    if (printSize === 'A4') {
      receiptHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice - ${bill.invoiceNumber}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; max-width: 210mm; margin: 0 auto; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; }
            .shop-title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
            .meta-box { text-align: right; }
            .invoice-tag { font-size: 20px; font-weight: 800; color: #0ea5e9; margin: 0 0 5px 0; }
            .cust-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            th { background: #f1f5f9; padding: 10px; text-align: left; font-size: 13px; color: #475569; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
            td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .total-section { display: flex; justify-content: flex-end; }
            .total-table { width: 320px; }
            .total-table td { padding: 6px 10px; }
            .grand-total { font-size: 18px; font-weight: 800; color: #0f172a; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="shop-title">${shopName}</h1>
              ${gstin ? `<p style="margin: 3px 0; color: #64748b; font-size: 13px;">GSTIN: ${gstin}</p>` : ''}
              <p style="margin: 3px 0; color: #64748b; font-size: 13px;">${branchDetails.address || ''} ${branchDetails.city ? `(${branchDetails.city})` : ''}</p>
              <p style="margin: 3px 0; color: #64748b; font-size: 13px;">Tel: ${branchDetails.phone || '—'}</p>
            </div>
            <div class="meta-box">
              <div class="invoice-tag">RETAIL BILL / RECEIPT</div>
              <p style="margin: 3px 0;"><strong>Bill No:</strong> ${bill.invoiceNumber}</p>
              <p style="margin: 3px 0;"><strong>Date:</strong> ${bill.date}</p>
              <p style="margin: 3px 0;"><strong>Payment:</strong> <span style="text-transform: uppercase; color: #16a34a; font-weight: bold;">${bill.paymentMode}</span></p>
              ${bill.upiAccount ? `<p style="margin: 3px 0; font-size: 12px; color: #64748b;">A/C: ${bill.upiAccount}</p>` : ''}
            </div>
          </div>

          <div class="cust-box">
            <div>
              <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: bold; display: block;">Customer Details</span>
              <strong style="font-size: 15px;">${bill.customerName}</strong>
              ${bill.customerPhone ? `<p style="margin: 2px 0; color: #475569;">Mobile: ${bill.customerPhone}</p>` : ''}
            </div>
            ${bill.notes ? `<div><span style="font-size: 12px; color: #64748b; font-weight: bold;">Notes:</span><p style="margin: 2px 0;">${bill.notes}</p></div>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 10%;">#</th>
                <th style="width: 50%;">Description</th>
                <th style="width: 15%; text-align: center;">Qty</th>
                <th style="width: 25%; text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td><strong>${bill.description}</strong></td>
                <td style="text-align: center;">1</td>
                <td style="text-align: right; font-weight: 600;">₹${bill.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              </tr>
            </tbody>
          </table>

          <div class="total-section">
            <table class="total-table">
              <tr>
                <td>Subtotal:</td>
                <td style="text-align: right; font-weight: 600;">₹${bill.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              </tr>
              ${bill.discount > 0 ? `
                <tr style="color: #dc2626;">
                  <td>Discount (−):</td>
                  <td style="text-align: right; font-weight: 600;">−₹${bill.discount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
              ` : ''}
              ${bill.taxAmount > 0 ? `
                <tr style="color: #059669;">
                  <td>GST / Tax (${bill.taxPercent}%):</td>
                  <td style="text-align: right; font-weight: 600;">+₹${bill.taxAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
              ` : ''}
              <tr class="grand-total">
                <td>Grand Total:</td>
                <td style="text-align: right; font-weight: 800; color: #0f172a;">₹${bill.total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <p>Thank you for your business! For queries, contact ${branchDetails.phone || 'our counter'}.</p>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
        </html>
      `;
    } else {
      // 80mm / 55mm Thermal Slip
      receiptHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${bill.invoiceNumber}</title>
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 100%; 
              max-width: ${printSize === '50mm' ? '180px' : (printSize === '55mm' ? '210px' : '280px')}; 
              margin: 0 auto; 
              padding: 10px 6px; 
              color: #000; 
              font-size: 12px;
              line-height: 1.35;
            }
            .center { text-align: center; }
            .shop-name { font-size: 15px; font-weight: bold; margin-bottom: 2px; }
            .divider { border-bottom: 1px dashed #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .bold { font-weight: bold; }
            .large { font-size: 14px; font-weight: bold; }
            .footer { text-align: center; margin-top: 12px; font-size: 11px; }
            @media print { body { padding: 4px; } }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="shop-name">${shopName.toUpperCase()}</div>
            ${gstin ? `<div>GSTIN: ${gstin}</div>` : ''}
            <div>${branchDetails.address || ''} ${branchDetails.city || ''}</div>
            ${branchDetails.phone ? `<div>Ph: ${branchDetails.phone}</div>` : ''}
          </div>

          <div class="divider"></div>

          <div class="row">
            <span>Bill No: <strong>${bill.invoiceNumber}</strong></span>
            <span>${bill.date}</span>
          </div>
          <div class="row">
            <span>Customer: ${bill.customerName}</span>
          </div>
          ${bill.customerPhone ? `<div class="row"><span>Ph: ${bill.customerPhone}</span></div>` : ''}
          <div class="row">
            <span>Pay Mode: <strong style="text-transform: uppercase;">${bill.paymentMode}</strong></span>
          </div>
          ${bill.upiAccount ? `<div style="font-size: 10px; color: #444;">A/C: ${bill.upiAccount}</div>` : ''}

          <div class="divider"></div>

          <div class="row bold">
            <span>Item Description</span>
            <span>Amount</span>
          </div>
          <div class="row" style="margin-top: 4px;">
            <span style="flex: 1; padding-right: 8px;">${bill.description}</span>
            <span class="bold">₹${bill.amount.toFixed(2)}</span>
          </div>

          <div class="divider"></div>

          ${bill.discount > 0 ? `
            <div class="row">
              <span>Discount:</span>
              <span>−₹${bill.discount.toFixed(2)}</span>
            </div>
          ` : ''}
          ${bill.taxAmount > 0 ? `
            <div class="row">
              <span>Tax (${bill.taxPercent}%):</span>
              <span>+₹${bill.taxAmount.toFixed(2)}</span>
            </div>
          ` : ''}

          <div class="row large" style="margin-top: 4px;">
            <span>TOTAL:</span>
            <span>₹${bill.total.toFixed(2)}</span>
          </div>

          <div class="divider"></div>

          <div class="footer">
            <div>Thank You! Visit Again</div>
            <div style="font-size: 9px; margin-top: 3px;">StayBillPro Quick POS</div>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
        </html>
      `;
    }

    printWin.document.open();
    printWin.document.write(receiptHtml);
    printWin.document.close();
  };

  return (
    <div className="direct-billing-container" style={{ padding: '24px', background: '#f8fafc', minHeight: '100%', overflowY: 'auto' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
        borderRadius: '16px',
        padding: '22px 28px',
        color: '#fff',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(20, 184, 166, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '12px',
            borderRadius: '12px',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap size={30} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, letterSpacing: '0.3px' }}>
              ⚡ Direct Open Billing (Quick Sale)
            </h1>
            <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '0.85rem' }}>
              Generate fast counter bills with direct amount entry, custom bill numbers, and multi-UPI account tracking — zero inventory feeding needed!
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleResetForm}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCcw size={15} /> Clear Form
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 0.95fr)', gap: '24px' }}>
        
        {/* LEFT COLUMN: Input Form */}
        <form onSubmit={handleGenerateDirectBill}>
          <div style={{
            background: '#fff',
            borderRadius: '14px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="#0f766e" /> 1. Customer & Bill Number Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Customer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar (or Walk-in)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Mobile / Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Bill Number Config */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Hash size={16} color="#0f766e" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                    Bill / Invoice Number Mode
                  </span>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#0f766e', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isCustomBillNo}
                    onChange={(e) => setIsCustomBillNo(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#0f766e' }}
                  />
                  Enter Bill # Manually
                </label>
              </div>

              {isCustomBillNo ? (
                <div>
                  <input
                    type="text"
                    placeholder="Enter manual bill number (e.g. INV-2026-088 or Bill #45)"
                    value={customBillNo}
                    onChange={(e) => setCustomBillNo(e.target.value)}
                    required={isCustomBillNo}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1.5px solid #0f766e',
                      fontSize: '0.85rem',
                      background: '#fff'
                    }}
                  />
                  <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    💡 Matches your physical counter receipt book / custom series.
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  ✨ Auto-generating sequential system invoice number automatically.
                </div>
              )}
            </div>
          </div>

          {/* ITEM & AMOUNT SECTION */}
          <div style={{
            background: '#fff',
            borderRadius: '14px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={18} color="#0f766e" /> 2. Sale Particulars & Direct Amount
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Item / Service Particulars
              </label>
              <input
                type="text"
                placeholder="e.g. General Hardware / Counter Sale / Urgent Service"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f766e', marginBottom: '6px' }}>
                  Bill Amount (₹) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  placeholder="e.g. 4000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '2px solid #0f766e',
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: '#0f172a'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Discount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  GST / Tax (%)
                </label>
                <select
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    background: '#fff'
                  }}
                >
                  <option value="0">0% (Exempt/None)</option>
                  <option value="5">5% GST</option>
                  <option value="12">12% GST</option>
                  <option value="18">18% GST</option>
                  <option value="28">28% GST</option>
                </select>
              </div>
            </div>
          </div>

          {/* PAYMENT MODE & MULTI-UPI */}
          <div style={{
            background: '#fff',
            borderRadius: '14px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} color="#0f766e" /> 3. Payment Mode & Account Selection
            </h3>

            {/* Mode selection buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '18px' }}>
              {[
                { id: 'cash', label: '💵 Cash in Hand', desc: 'Auto-adds to Cash Register' },
                { id: 'upi', label: '📱 UPI / QR Code', desc: 'Select Bank / Counter QR' },
                { id: 'card', label: '💳 Card Swipe / POS', desc: 'Card Terminal' },
                { id: 'credit', label: '⏳ Due / Credit', desc: 'Record in Customer Due' }
              ].map(m => (
                <div
                  key={m.id}
                  onClick={() => setPaymentMode(m.id)}
                  style={{
                    border: paymentMode === m.id ? '2px solid #0f766e' : '1.5px solid #e2e8f0',
                    background: paymentMode === m.id ? '#f0fdfa' : '#fff',
                    borderRadius: '10px',
                    padding: '12px 10px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: paymentMode === m.id ? '#0f766e' : '#1e293b' }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                    {m.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* Multi-UPI Account Selector (When UPI is selected) */}
            {paymentMode === 'upi' && (
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #ccfbf1',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f766e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <QrCode size={16} /> Select Received UPI Account / Counter QR:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddUpiModal(true)}
                    style={{
                      background: '#0f766e',
                      color: '#fff',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={13} /> Add New UPI QR
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  {upiAccounts.map(acc => (
                    <div
                      key={acc.id}
                      onClick={() => setSelectedUpiAccount(acc.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: selectedUpiAccount === acc.id ? '2px solid #0f766e' : '1px solid #cbd5e1',
                        background: selectedUpiAccount === acc.id ? '#fff' : '#f1f5f9',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>{acc.name}</span>
                        {selectedUpiAccount === acc.id && (
                          <span style={{ color: '#0f766e', fontSize: '0.75rem', fontWeight: 800 }}>● Selected</span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#64748b' }}>{acc.upiId}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optional Note */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Internal Bill Remark / Transaction Ref (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. UTR #3948291039 / Paid by Rahul"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>
        </form>

        {/* RIGHT COLUMN: Live Bill Preview & Action Card */}
        <div>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            position: 'sticky',
            top: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={20} color="#0f766e" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Bill Summary
                </h3>
              </div>
              <span style={{
                background: '#f0fdfa',
                color: '#0f766e',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1px solid #ccfbf1'
              }}>
                Instant Direct Mode
              </span>
            </div>

            {/* Bill Info Card */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '20px',
              border: '1px solid #e2e8f0',
              fontSize: '0.82rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Customer:</span>
                <strong style={{ color: '#0f172a' }}>{customerName.trim() || 'Walk-in Customer'}</strong>
              </div>
              {customerPhone && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Phone:</span>
                  <span>{customerPhone}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Invoice No:</span>
                <span style={{ fontWeight: 700, color: '#0f766e' }}>
                  {isCustomBillNo && customBillNo.trim() ? customBillNo.trim() : '(Auto Generate)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Payment Mode:</span>
                <span style={{ fontWeight: 700, textTransform: 'uppercase', color: '#0f172a' }}>{paymentMode}</span>
              </div>
              {paymentMode === 'upi' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#0f766e' }}>
                  <span>Account:</span>
                  <span>{upiAccounts.find(a => a.id === selectedUpiAccount)?.name}</span>
                </div>
              )}
            </div>

            {/* Calculation Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#475569' }}>
                <span>Subtotal Amount:</span>
                <span style={{ fontWeight: 600 }}>₹{rawAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              {discAmt > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#dc2626' }}>
                  <span>Discount:</span>
                  <span style={{ fontWeight: 600 }}>−₹{discAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              {calculatedTax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#059669' }}>
                  <span>GST ({taxPercent}%):</span>
                  <span style={{ fontWeight: 600 }}>+₹{calculatedTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div style={{
                borderTop: '2px dashed #cbd5e1',
                paddingTop: '12px',
                marginTop: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline'
              }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Grand Total:</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f766e' }}>
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleGenerateDirectBill}
              disabled={loading || rawAmt <= 0}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                background: rawAmt > 0 ? 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)' : '#94a3b8',
                color: '#fff',
                border: 'none',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: rawAmt > 0 && !loading ? 'pointer' : 'not-allowed',
                boxShadow: rawAmt > 0 ? '0 8px 20px -4px rgba(20, 184, 166, 0.4)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '10px'
              }}
            >
              {loading ? (
                'Generating Bill...'
              ) : (
                <>
                  <Printer size={18} /> Generate & Print Bill (₹{grandTotal.toLocaleString()})
                </>
              )}
            </button>

            {lastBill && (
              <button
                type="button"
                onClick={() => printDirectBill(lastBill)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Printer size={15} /> Re-print Last Bill (#{lastBill.invoiceNumber})
              </button>
            )}
          </div>
        </div>

      </div>

      {/* MODAL: Add New UPI Account */}
      {showAddUpiModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '420px', width: '90%', background: '#fff', borderRadius: '12px' }}>
            <div className="modal-header" style={{ background: '#0f766e', color: '#fff', padding: '14px 18px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                ➕ Register New UPI QR Account
              </h3>
              <button
                type="button"
                onClick={() => setShowAddUpiModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddNewUpiAccount}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Account / Counter Label *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Reception GPay / Counter 3 Scanner"
                    value={newUpiName}
                    onChange={(e) => setNewUpiName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    UPI ID / VPA (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. shopname@okhdfcbank"
                    value={newUpiId}
                    onChange={(e) => setNewUpiId(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ padding: '12px 18px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddUpiModal(false)}
                  style={{ padding: '8px 14px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '6px', background: '#0f766e', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                >
                  Save UPI Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
