import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Receipt, 
  User, 
  Phone, 
  CreditCard, 
  Printer, 
  Plus, 
  RotateCcw,
  QrCode,
  Tag,
  Hash,
  Sparkles,
  Percent,
  Building2,
  Wallet,
  Smartphone,
  CreditCard as CardIcon,
  Clock,
  Search,
  Check,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import API_BASE from '../../config/serverConfig';
import { usePopup } from '../ui/PopupProvider';
import { branchesAPI, posSettingsAPI } from '../../services/api';

const DEFAULT_UPI_ACCOUNTS = [
  { id: 'upi_1', name: 'Shop Primary Scanner', upiId: 'primary@upi', bank: 'Main Current A/C' },
  { id: 'upi_2', name: 'Counter 1 (HDFC)', upiId: 'counter1.hdfc@upi', bank: 'HDFC Bank' },
  { id: 'upi_3', name: 'Counter 2 (SBI QR)', upiId: 'counter2.sbi@upi', bank: 'State Bank of India' },
  { id: 'upi_4', name: 'Owner GPay / PhonePe', upiId: 'owner@okaxis', bank: 'Axis Bank' },
  { id: 'upi_5', name: 'ICICI QR POS', upiId: 'icici.pos@icici', bank: 'ICICI Bank' }
];

const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export default function DirectBillingPage() {
  const popup = usePopup();

  // Customer Management & Auto-complete
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [custSearch, setCustSearch] = useState('');
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const custDropdownRef = useRef(null);

  // Bill Config
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

  // Load Customers, Business info & saved UPI accounts
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

    const fetchCustomersList = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/customers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          const list = Array.isArray(data) ? data : (data.customers || []);
          setCustomers(list);
        }
      } catch (err) {
        console.error('Failed to load customers:', err);
      }
    };

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

    fetchCustomersList();
    fetchBranchAndPosSettings();
  }, []);

  // Close customer dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (custDropdownRef.current && !custDropdownRef.current.contains(e.target)) {
        setShowCustDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculation breakdown
  const rawAmt = parseFloat(amount) || 0;
  const discAmt = parseFloat(discountAmount) || 0;
  const baseTaxable = Math.max(0, rawAmt - discAmt);
  const taxRate = parseFloat(taxPercent) || 0;
  const calculatedTax = (baseTaxable * taxRate) / 100;
  const grandTotal = Math.round((baseTaxable + calculatedTax) * 100) / 100;

  const handleSelectCustomer = (c) => {
    if (!c) {
      setSelectedCustomer(null);
      setCustomerName('');
      setCustomerPhone('');
      setCustSearch('');
    } else {
      setSelectedCustomer(c);
      setCustomerName(c.name || '');
      setCustomerPhone(c.phone || '');
      setCustSearch(c.name || '');
    }
    setShowCustDropdown(false);
  };

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
    popup.showSuccess('New UPI Account added successfully!');
  };

  const handleResetForm = () => {
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustSearch('');
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

  const handleAddPresetAmount = (val) => {
    const current = parseFloat(amount) || 0;
    setAmount(String(current + val));
  };

  const handleGenerateDirectBill = async (e, shouldPrint = true) => {
    if (e && e.preventDefault) e.preventDefault();

    if (rawAmt <= 0) {
      popup.showError('Please enter a valid bill amount greater than 0');
      return;
    }

    if (paymentMode === 'credit' && !customerName.trim() && !selectedCustomer) {
      popup.showError('Please select or enter a Customer Name to record a Credit / Due bill');
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

      let chosenAccountLabel = '';
      if (paymentMode === 'upi') {
        const acc = upiAccounts.find(a => a.id === selectedUpiAccount);
        chosenAccountLabel = acc ? `${acc.name} (${acc.upiId})` : 'UPI QR';
      }

      const finalBillNumber = isCustomBillNo && customBillNo.trim() 
        ? customBillNo.trim() 
        : `DB-${Date.now().toString().slice(-6)}`;

      const payload = {
        customerId: selectedCustomer ? selectedCustomer.id : null,
        customerName: customerName.trim() || (selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'),
        customerPhone: customerPhone.trim() || (selectedCustomer ? selectedCustomer.phone : ''),
        items: [
          {
            id: null,
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
        notes: `[Direct Bill] ${paymentMode.toUpperCase()}${chosenAccountLabel ? ` - ${chosenAccountLabel}` : ''}${paymentMode === 'credit' ? ' [CREDIT DUE]' : ''}${notes ? ` | ${notes}` : ''}`
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

      const billData = {
        invoiceNumber: isCustomBillNo ? finalBillNumber : (data.invoiceId ? `POSINV${String(data.invoiceId).padStart(2, '0')}` : finalBillNumber),
        date: billDate,
        customerName: customerName.trim() || (selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'),
        customerPhone: customerPhone.trim() || (selectedCustomer ? selectedCustomer.phone : ''),
        customerId: selectedCustomer ? selectedCustomer.id : null,
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
      
      if (paymentMode === 'credit') {
        popup.showSuccess(`Bill #${billData.invoiceNumber} saved as CREDIT DUE on ${billData.customerName}'s account!`);
      } else {
        popup.showSuccess(`Bill #${billData.invoiceNumber} saved & recorded successfully in ${paymentMode.toUpperCase()}!`);
      }

      // Trigger Print only if requested
      if (shouldPrint) {
        printDirectBill(billData);
      }

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
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; color: #0f172a; max-width: 210mm; margin: 0 auto; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
            .shop-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; }
            .meta-box { text-align: right; }
            .invoice-tag { font-size: 18px; font-weight: 800; color: ${bill.paymentMode === 'credit' ? '#d97706' : '#0d9488'}; margin: 0 0 4px 0; }
            .cust-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #f1f5f9; padding: 10px; text-align: left; font-size: 12px; color: #475569; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            .total-section { display: flex; justify-content: flex-end; }
            .total-table { width: 300px; }
            .total-table td { padding: 6px 10px; }
            .grand-total { font-size: 17px; font-weight: 800; color: #0f172a; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="shop-title">${shopName}</h1>
              ${gstin ? `<p style="margin: 2px 0; color: #64748b; font-size: 13px;">GSTIN: ${gstin}</p>` : ''}
              <p style="margin: 2px 0; color: #64748b; font-size: 13px;">${branchDetails.address || ''} ${branchDetails.city ? `(${branchDetails.city})` : ''}</p>
              <p style="margin: 2px 0; color: #64748b; font-size: 13px;">Tel: ${branchDetails.phone || '—'}</p>
            </div>
            <div class="meta-box">
              <div class="invoice-tag">${bill.paymentMode === 'credit' ? 'CREDIT BILL (UNPAID)' : 'RETAIL BILL / RECEIPT'}</div>
              <p style="margin: 2px 0;"><strong>Bill No:</strong> ${bill.invoiceNumber}</p>
              <p style="margin: 2px 0;"><strong>Date:</strong> ${bill.date}</p>
              <p style="margin: 2px 0;"><strong>Payment:</strong> <span style="text-transform: uppercase; color: ${bill.paymentMode === 'credit' ? '#d97706' : '#0d9488'}; font-weight: bold;">${bill.paymentMode === 'credit' ? 'DUE / CREDIT' : bill.paymentMode}</span></p>
              ${bill.upiAccount ? `<p style="margin: 2px 0; font-size: 12px; color: #64748b;">A/C: ${bill.upiAccount}</p>` : ''}
            </div>
          </div>

          <div class="cust-box">
            <div>
              <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; display: block;">Customer Details</span>
              <strong style="font-size: 14px;">${bill.customerName}</strong>
              ${bill.customerPhone ? `<p style="margin: 2px 0; color: #475569;">Mobile: ${bill.customerPhone}</p>` : ''}
            </div>
            ${bill.notes ? `<div><span style="font-size: 11px; color: #64748b; font-weight: bold;">Notes:</span><p style="margin: 2px 0;">${bill.notes}</p></div>` : ''}
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
                <td>${bill.paymentMode === 'credit' ? 'Credit Due Amount:' : 'Grand Total:'}</td>
                <td style="text-align: right; font-weight: 800; color: #0f172a;">₹${bill.total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
        </html>
      `;
    } else {
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
            <span>Bill: <strong>${bill.invoiceNumber}</strong></span>
            <span>${bill.date}</span>
          </div>
          <div class="row">
            <span>Customer: ${bill.customerName}</span>
          </div>
          ${bill.customerPhone ? `<div class="row"><span>Ph: ${bill.customerPhone}</span></div>` : ''}
          <div class="row">
            <span>Status: <strong style="text-transform: uppercase;">${bill.paymentMode === 'credit' ? '*** CREDIT DUE ***' : bill.paymentMode}</strong></span>
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
            <span>${bill.paymentMode === 'credit' ? 'DUE AMOUNT:' : 'TOTAL:'}</span>
            <span>₹${bill.total.toFixed(2)}</span>
          </div>

          <div class="divider"></div>

          <div class="footer">
            <div>${bill.paymentMode === 'credit' ? 'Credit Recorded on Account' : 'Thank You! Visit Again'}</div>
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

  const filteredCustomers = customers.filter(c => {
    if (!custSearch.trim()) return true;
    const q = custSearch.toLowerCase();
    return (c.name && c.name.toLowerCase().includes(q)) || (c.phone && c.phone.includes(q));
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#0f172a'
    }}>
      
      {/* 1. TOP FAST ACTION BAR */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '10px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
            color: '#fff',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(13, 148, 136, 0.3)'
          }}>
            <Zap size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Direct Counter POS
              <span style={{ fontSize: '0.7rem', background: '#f0fdfa', color: '#0d9488', border: '1px solid #ccfbf1', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                Instant Sale
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Quick direct billing with customer credit & multi-bank ledger integration
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleResetForm}
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#475569',
              padding: '6px 14px',
              borderRadius: '7px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s'
            }}
          >
            <RotateCcw size={13} /> Reset Form
          </button>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN DESK LAYOUT */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.45fr) minmax(360px, 1fr)',
        gap: '16px',
        padding: '14px 18px',
        overflowY: 'auto'
      }}>
        
        {/* LEFT COLUMN: Entry Desk */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* STEP 1: Hero Amount Entry Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1.5px solid #ccfbf1',
            padding: '18px 20px',
            boxShadow: '0 4px 20px -4px rgba(13, 148, 136, 0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={15} /> Bill Amount & Description *
              </label>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Enter direct charge amount</span>
            </div>

            {/* Giant Amount Input */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <span style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1.6rem',
                fontWeight: 900,
                color: '#0d9488'
              }}>
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="1"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 42px',
                  borderRadius: '10px',
                  border: '2px solid #0d9488',
                  background: '#f0fdfa',
                  fontSize: '1.75rem',
                  fontWeight: 900,
                  color: '#0f172a',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}
              />
            </div>

            {/* Quick Currency Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', alignSelf: 'center', marginRight: '4px' }}>
                Quick Add:
              </span>
              {PRESET_AMOUNTS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleAddPresetAmount(p)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#334155',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  +₹{p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount('')}
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#ef4444',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            </div>

            {/* Item Particulars / Title */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                Item / Service Particulars (Printed on Receipt)
              </label>
              <input
                type="text"
                placeholder="e.g. Counter Sale / Hardware Supplies / Fast Repair"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.86rem',
                  outline: 'none',
                  background: '#fff'
                }}
              />
            </div>

            {/* Discount & GST Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                  Discount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.86rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                  Tax / GST Rate (%)
                </label>
                <select
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.86rem',
                    background: '#fff',
                    outline: 'none',
                    fontWeight: 600
                  }}
                >
                  <option value="0">0% (Exempt / No Tax)</option>
                  <option value="5">5% GST</option>
                  <option value="12">12% GST</option>
                  <option value="18">18% GST</option>
                  <option value="28">28% GST</option>
                </select>
              </div>
            </div>
          </div>

          {/* STEP 2: Customer Selection (Searchable Database + Walk-in) & Invoice Mode */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={15} color="#0d9488" /> Customer Details & Credit Balance
              </span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#0d9488', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isCustomBillNo}
                  onChange={(e) => setIsCustomBillNo(e.target.checked)}
                  style={{ accentColor: '#0d9488', width: '15px', height: '15px' }}
                />
                Manual Bill No.
              </label>
            </div>

            {/* Customer Search Auto-Suggest Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: isCustomBillNo ? '1.4fr 1fr 1fr' : '1.5fr 1fr', gap: '12px', position: 'relative' }} ref={custDropdownRef}>
              
              {/* Searchable Customer Input */}
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                  Customer Name / Search Database
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="🔍 Search existing customer (or type name)..."
                    value={selectedCustomer ? selectedCustomer.name : custSearch || customerName}
                    onChange={(e) => {
                      setSelectedCustomer(null);
                      setCustSearch(e.target.value);
                      setCustomerName(e.target.value);
                      setShowCustDropdown(true);
                    }}
                    onFocus={() => setShowCustDropdown(true)}
                    style={{
                      width: '100%',
                      padding: '8px 30px 8px 12px',
                      borderRadius: '8px',
                      border: selectedCustomer ? '1.5px solid #0d9488' : '1.5px solid #cbd5e1',
                      background: selectedCustomer ? '#f0fdfa' : '#fff',
                      fontSize: '0.85rem',
                      fontWeight: selectedCustomer ? 700 : 500
                    }}
                  />
                  {selectedCustomer && (
                    <button
                      type="button"
                      onClick={() => handleSelectCustomer(null)}
                      title="Clear selection"
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.85rem'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Dropdown Results - Only visible if there are matching customers or clicking on empty input */}
                {showCustDropdown && (!custSearch.trim() || filteredCustomers.length > 0) && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    marginTop: '4px',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)'
                  }}>
                    {!custSearch.trim() && (
                      <div
                        onClick={() => handleSelectCustomer(null)}
                        style={{
                          padding: '9px 12px',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          fontWeight: 'bold',
                          borderBottom: '1px solid #f1f5f9',
                          color: '#64748b',
                          backgroundColor: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>👤</span> Walk-in Customer (General)
                      </div>
                    )}
                    {filteredCustomers.slice(0, 15).map(c => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          style={{
                            padding: '9px 12px',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'background 0.1s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0fdfa'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                        >
                          <div>
                            <strong style={{ color: '#0f172a' }}>{c.name}</strong>
                            {c.phone && <span style={{ color: '#64748b', marginLeft: '6px', fontSize: '0.76rem' }}>({c.phone})</span>}
                          </div>
                          {parseFloat(c.balance) > 0 && (
                            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#dc2626', background: '#fef2f2', padding: '2px 6px', borderRadius: '4px' }}>
                              Due: ₹{parseFloat(c.balance).toLocaleString()}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Phone Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                  Mobile / Phone
                </label>
                <input
                  type="tel"
                  placeholder="Optional mobile"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              {/* Custom Bill No Input */}
              {isCustomBillNo && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#0d9488', marginBottom: '4px' }}>
                    Bill / Voucher # *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-902"
                    value={customBillNo}
                    onChange={(e) => setCustomBillNo(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #0d9488',
                      fontSize: '0.85rem',
                      background: '#f0fdfa',
                      fontWeight: 700
                    }}
                  />
                </div>
              )}
            </div>

            {/* Selected Customer Due Balance Info Pill */}
            {selectedCustomer && (
              <div style={{
                marginTop: '10px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                  <UserCheck size={14} color="#0d9488" />
                  <span>Selected: <strong>{selectedCustomer.name}</strong></span>
                  {selectedCustomer.city && <span style={{ color: '#64748b' }}>({selectedCustomer.city})</span>}
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Current Account Due: </span>
                  <strong style={{ color: parseFloat(selectedCustomer.balance) > 0 ? '#dc2626' : '#16a34a' }}>
                    ₹{parseFloat(selectedCustomer.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: Payment Modes & UPI Selector */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wallet size={15} color="#0d9488" /> Payment Mode & Settlement
              </span>
              {paymentMode === 'credit' && (
                <span style={{ fontSize: '0.74rem', background: '#fffbeb', color: '#d97706', border: '1px solid #fef3c7', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                  ⏳ Credit Due Selected (No immediate cash/UPI received)
                </span>
              )}
            </div>

            {/* Mode selection buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
              {[
                { id: 'cash', label: 'Cash', icon: Wallet, desc: 'Cash Register' },
                { id: 'upi', label: 'UPI / QR', icon: Smartphone, desc: 'Multi-Account QR' },
                { id: 'card', label: 'Card / POS', icon: CardIcon, desc: 'Card Swipe' },
                { id: 'credit', label: 'Credit / Due', icon: Clock, desc: 'Add to Customer Due' }
              ].map(m => {
                const Icon = m.icon;
                const isSelected = paymentMode === m.id;
                const isCredit = m.id === 'credit';
                return (
                  <div
                    key={m.id}
                    onClick={() => setPaymentMode(m.id)}
                    style={{
                      border: isSelected ? (isCredit ? '2px solid #d97706' : '2px solid #0d9488') : '1px solid #cbd5e1',
                      background: isSelected ? (isCredit ? '#fffbeb' : '#f0fdfa') : '#f8fafc',
                      borderRadius: '8px',
                      padding: '10px 8px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Icon size={18} color={isSelected ? (isCredit ? '#d97706' : '#0d9488') : '#64748b'} style={{ margin: '0 auto 4px auto', display: 'block' }} />
                    <div style={{ fontWeight: 800, fontSize: '0.82rem', color: isSelected ? (isCredit ? '#b45309' : '#0d9488') : '#1e293b' }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: isSelected ? (isCredit ? '#92400e' : '#0f766e') : '#64748b', marginTop: '2px' }}>
                      {m.desc}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* When CREDIT is selected, show helpful reminder */}
            {paymentMode === 'credit' && (
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fef3c7',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '12px',
                fontSize: '0.78rem',
                color: '#92400e',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} color="#d97706" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Credit Bill:</strong> This amount (₹{grandTotal.toLocaleString()}) will automatically increase <strong>{customerName || (selectedCustomer ? selectedCustomer.name : 'the customer')}</strong>'s outstanding ledger balance. You can collect payment later in Customer Due / Receipts.
                </span>
              </div>
            )}

            {/* Multi-UPI Account Selector (When UPI is selected) */}
            {paymentMode === 'upi' && (
              <div style={{
                background: '#f0fdfa',
                border: '1px solid #ccfbf1',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f766e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <QrCode size={14} /> Select Account / QR:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddUpiModal(true)}
                    style={{
                      background: '#0d9488',
                      color: '#fff',
                      border: 'none',
                      padding: '3px 8px',
                      borderRadius: '5px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <Plus size={11} /> New QR
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                  {upiAccounts.map(acc => (
                    <div
                      key={acc.id}
                      onClick={() => setSelectedUpiAccount(acc.id)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: selectedUpiAccount === acc.id ? '2px solid #0d9488' : '1px solid #cbd5e1',
                        background: selectedUpiAccount === acc.id ? '#fff' : '#f8fafc',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0f172a' }}>{acc.name}</span>
                        {selectedUpiAccount === acc.id && (
                          <span style={{ color: '#0d9488', fontSize: '0.7rem', fontWeight: 800 }}>✓ Active</span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{acc.upiId}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Note */}
            <div>
              <input
                type="text"
                placeholder="Optional internal remark (e.g. Paid via GPay Ref #8291 / Due for 15 days)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  background: '#f8fafc'
                }}
              />
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Receipt Preview & Terminal Actions */}
        <div>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            top: '10px'
          }}>
            
            {/* Header */}
            <div style={{
              background: '#0f172a',
              color: '#fff',
              padding: '12px 16px',
              borderRadius: '12px 12px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={16} color="#2dd4bf" />
                <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>Live Bill Receipt</span>
              </div>
              <span style={{
                fontSize: '0.72rem',
                background: paymentMode === 'credit' ? '#d97706' : 'rgba(255,255,255,0.15)',
                padding: '2px 8px',
                borderRadius: '4px',
                color: '#fff',
                fontWeight: 700
              }}>
                {paymentMode === 'credit' ? 'CREDIT BILL' : 'PRINT READY'}
              </span>
            </div>

            {/* Thermal / Visual Receipt Container */}
            <div style={{ padding: '16px' }}>
              <div style={{
                background: '#fafafa',
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '0.8rem',
                color: '#334155'
              }}>
                <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>{shopName.toUpperCase()}</div>
                  {gstin && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>GSTIN: {gstin}</div>}
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{branchDetails.city || 'Counter POS'}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Bill No:</span>
                  <strong style={{ color: '#0f172a' }}>{isCustomBillNo && customBillNo.trim() ? customBillNo.trim() : '(Auto Generated)'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Customer:</span>
                  <span style={{ fontWeight: selectedCustomer ? 700 : 500, color: selectedCustomer ? '#0f172a' : '#334155' }}>
                    {customerName.trim() || (selectedCustomer ? selectedCustomer.name : 'Walk-in')}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Mode:</span>
                  <span style={{ fontWeight: 800, textTransform: 'uppercase', color: paymentMode === 'credit' ? '#d97706' : '#0d9488' }}>
                    {paymentMode === 'credit' ? 'CREDIT / DUE' : paymentMode}
                  </span>
                </div>

                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ flex: 1, paddingRight: '8px' }}>{description.trim() || 'Direct Item'}</span>
                    <span style={{ fontWeight: 700 }}>₹{rawAmt.toFixed(2)}</span>
                  </div>

                  {discAmt > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', marginBottom: '2px' }}>
                      <span>Discount (−):</span>
                      <span>−₹{discAmt.toFixed(2)}</span>
                    </div>
                  )}

                  {calculatedTax > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', marginBottom: '2px' }}>
                      <span>GST ({taxPercent}%):</span>
                      <span>+₹{calculatedTax.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div style={{
                  borderTop: '2px solid #0f172a',
                  borderBottom: '2px solid #0f172a',
                  padding: '8px 0',
                  marginTop: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline'
                }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                    {paymentMode === 'credit' ? 'TOTAL DUE:' : 'TOTAL PAYABLE:'}
                  </span>
                  <span style={{ fontWeight: 900, fontSize: '1.25rem', color: paymentMode === 'credit' ? '#d97706' : '#0f766e' }}>
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Card Footer */}
            <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              {/* Primary: Save & Print Bill */}
              <button
                type="button"
                onClick={(e) => handleGenerateDirectBill(e, true)}
                disabled={loading || rawAmt <= 0}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  background: rawAmt > 0 
                    ? (paymentMode === 'credit' ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)')
                    : '#94a3b8',
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  cursor: rawAmt > 0 && !loading ? 'pointer' : 'not-allowed',
                  boxShadow: rawAmt > 0 ? (paymentMode === 'credit' ? '0 4px 14px rgba(217, 119, 6, 0.4)' : '0 4px 14px rgba(13, 148, 136, 0.4)') : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s'
                }}
              >
                {loading ? (
                  'Processing...'
                ) : (
                  <>
                    <Printer size={17} /> {paymentMode === 'credit' ? 'Save & Print Credit Bill' : 'Save & Print Bill'} (₹{grandTotal.toFixed(2)})
                  </>
                )}
              </button>

              {/* Secondary: Save Bill (No Print) */}
              <button
                type="button"
                onClick={(e) => handleGenerateDirectBill(e, false)}
                disabled={loading || rawAmt <= 0}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: rawAmt > 0 ? '#ffffff' : '#f8fafc',
                  color: rawAmt > 0 ? (paymentMode === 'credit' ? '#b45309' : '#0f766e') : '#94a3b8',
                  border: rawAmt > 0 ? (paymentMode === 'credit' ? '1.5px solid #d97706' : '1.5px solid #0d9488') : '1.5px solid #cbd5e1',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: rawAmt > 0 && !loading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s'
                }}
              >
                💾 Save Bill (Without Print)
              </button>

              {lastBill && (
                <button
                  type="button"
                  onClick={() => printDirectBill(lastBill)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    background: '#f8fafc',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Printer size={14} /> Re-print Bill #{lastBill.invoiceNumber}
                </button>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* MODAL: Add New UPI Account */}
      {showAddUpiModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '380px', width: '90%', background: '#fff', borderRadius: '10px' }}>
            <div className="modal-header" style={{ background: '#0f766e', color: '#fff', padding: '12px 16px' }}>
              <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>
                ➕ Register UPI QR
              </h3>
              <button
                type="button"
                onClick={() => setShowAddUpiModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.1rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddNewUpiAccount}>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Counter / Account Label *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Counter 3 GPay / Branch Scanner"
                    value={newUpiName}
                    onChange={(e) => setNewUpiName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    UPI ID / VPA (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. storename@okhdfc"
                    value={newUpiId}
                    onChange={(e) => setNewUpiId(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ padding: '10px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddUpiModal(false)}
                  style={{ padding: '6px 12px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '6px 14px', borderRadius: '6px', background: '#0f766e', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
                >
                  Save QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
