export const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] !== '00') ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] !== '00') ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] !== '00') ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] !== '0') ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] !== '00') ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'only' : 'only';
    return str;
};

export const getWholesaleInvoiceHtml = (invoice) => {
  const cart = invoice.items || [];
  const total = invoice.total_amount || 0;
  const roundedTotal = Math.round(total);
  const rupeesInWords = numberToWords(roundedTotal);
  
  const taxGroups = {};
  cart.forEach(item => {
    const rate = Number(item.gst || item.gst_rate || 0);
    const amt = (item.price || item.unit_price) * (item.qty || item.quantity);
    if (!taxGroups[rate]) {
      taxGroups[rate] = { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 };
    }
    taxGroups[rate].taxable += amt;
    const itemGst = amt * (rate / 100);
    taxGroups[rate].cgst += itemGst / 2;
    taxGroups[rate].sgst += itemGst / 2;
    taxGroups[rate].totalTax += itemGst;
  });

  const tableRowsHtml = cart.map((item, idx) => `
    <tr style="border-bottom: 1px solid #cbd5e1; font-size: 11px;">
      <td style="padding: 3px 4px; text-align: center; border-right: 1px solid #cbd5e1;">${idx + 1}</td>
      <td style="padding: 3px 6px; text-align: left; font-weight: 600; border-right: 1px solid #cbd5e1;">${item.name || item.item_name}</td>
      <td style="padding: 3px 4px; text-align: center; border-right: 1px solid #cbd5e1;">${item.hsn || item.hsn_code || '—'}</td>
      <td style="padding: 3px 4px; text-align: center; border-right: 1px solid #cbd5e1;">${item.gst || item.gst_rate || 0}%</td>
      <td style="padding: 3px 4px; text-align: center; border-right: 1px solid #cbd5e1;">${Number(item.qty || item.quantity).toFixed(2)}</td>
      <td style="padding: 3px 4px; text-align: center; border-right: 1px solid #cbd5e1;">${item.unit || 'Units'}</td>
      <td style="padding: 3px 6px; text-align: right; border-right: 1px solid #cbd5e1;">${Number(item.retailPrice || item.price || item.unit_price || 0).toFixed(2)}</td>
      <td style="padding: 3px 6px; text-align: right; border-right: 1px solid #cbd5e1;">${Number(item.price || item.unit_price || 0).toFixed(2)}</td>
      <td style="padding: 3px 6px; text-align: right; font-weight: 600;">₹${(Number(item.price || item.unit_price || 0) * Number(item.qty || item.quantity || 0)).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
    </tr>
  `).join('');

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

  const adminUserStr = localStorage.getItem('adminUser');
  const bProf = adminUserStr ? JSON.parse(adminUserStr) : {};
      const bLogo = bProf.logo_url || '';
      const bUpiId = bProf.upi_id || '';
      const upiString = bUpiId ? `upi://pay?pa=${bUpiId}&pn=${encodeURIComponent(invoice.business_name || 'STAYBILL PRO')}&am=${Number(invoice.total_amount || 0).toFixed(2)}&cu=INR` : '';
      const upiQrUrl = bUpiId ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiString)}` : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Tax Invoice - ${invoice.id}</title>
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
          .items-table th { background: #f1f5f9; padding: 4px 4px; font-weight: bold; font-size: 11px; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #000; text-align: center; }
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
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #0ea5e9; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">🖨️ Print Invoice</button>
        </div>
        <div class="invoice-border">
          
          <div class="header-section">
            <div class="header-top">
              <div>GSTIN : ${invoice.corporate_gst || invoice.branch_gst || '29AMEPP6614P1ZC'}</div>
              <div style="font-size: 14px; text-decoration: underline;">TAX INVOICE</div>
              <div>Original Copy</div>
            </div>
            ${bLogo ? `<div style="position: absolute; left: 10px; top: 35px;"><img src="${bLogo}" alt="Logo" style="max-height: 70px; max-width: 150px; object-fit: contain;" /></div>` : ''}
            ${upiQrUrl ? `<div style="position: absolute; right: 10px; top: 35px; text-align: center;"><img src="${upiQrUrl}" alt="UPI QR" style="max-height: 70px; max-width: 70px;" /><div style="font-size: 8px; margin-top: 2px; font-weight: bold;">Scan to Pay</div></div>` : ''}
            <div class="company-name" style="margin-top: -5px;">${invoice.business_name || 'STAYBILL PRO'}</div>
            <div class="company-details">${invoice.branch_address || 'Address'}</div>
            <div class="company-details">Tel. : ${invoice.branch_phone || ''}</div>
          </div>

          <div class="metadata-section">
            <div class="meta-col">
              <div class="meta-row">
                <div class="meta-label">Invoice No.</div>
                <div class="meta-value">: POSINV${String(invoice.id).padStart(2, '0')}</div>
              </div>
              <div class="meta-row">
                <div class="meta-label">Dated</div>
                <div class="meta-value">: ${new Date(invoice.created_at).toLocaleDateString('en-IN')}</div>
              </div>
            </div>
            <div class="meta-col">
              <div class="meta-row">
                <div class="meta-label">Place of Supply</div>
                <div class="meta-value">: Karnataka (29)</div>
              </div>
              <div class="meta-row">
                <div class="meta-label">Reverse Charge</div>
                <div class="meta-value">: N</div>
              </div>
            </div>
          </div>

          <div class="billing-section">
            <div class="bill-box">
              <div class="bill-title">Billed to :</div>
              <div class="bill-details">
                <strong>${invoice.customer_name}</strong><br/>
                ${invoice.customer_phone ? `MOB : ${invoice.customer_phone}<br/>` : ''}
              </div>
            </div>
            <div class="bill-box">
              <div class="bill-title">Shipped to :</div>
              <div class="bill-details">
                <strong>${invoice.customer_name}</strong><br/>
                ${invoice.customer_phone ? `MOB : ${invoice.customer_phone}<br/>` : ''}
              </div>
            </div>
          </div>

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
                  ${taxBreakdownRowsHtml}
                </tbody>
              </table>
            </div>
            <div class="summary-right">
              <table class="summary-table">
                <tbody>
                  <tr>
                    <td style="padding: 3px 0; text-align: left; font-weight: 500;">Subtotal</td>
                    <td style="padding: 3px 0; text-align: center;"></td>
                    <td style="padding: 3px 0; text-align: right;"></td>
                    <td style="padding: 3px 0; text-align: right; font-weight: 600;">${(total - invoice.gst_amount).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  </tr>
                  ${gstTaxSummaryHtml}
                  <tr>
                    <td style="padding: 3px 0; text-align: left; font-weight: 500;">Discount</td>
                    <td style="padding: 3px 0; text-align: center;"></td>
                    <td style="padding: 3px 0; text-align: right;"></td>
                    <td style="padding: 3px 0; text-align: right; font-weight: 600; color: #dc2626;">-${(invoice.discount_amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  </tr>
                  <tr class="grand-total-row">
                    <td style="padding: 8px 0; text-align: left;">GRAND TOTAL</td>
                    <td style="padding: 8px 0;"></td>
                    <td style="padding: 8px 0;"></td>
                    <td style="padding: 8px 0; text-align: right; font-size: 16px;">₹${total.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="words-section">
            Amount in Words: INR ${rupeesInWords}
          </div>

          <div class="footer-section">
            <div class="terms-box">
              <div class="terms-title">Terms & Conditions:</div>
              <ol style="margin: 0; padding-left: 15px;">
                <li>Goods once sold will not be taken back or exchanged.</li>
                <li>Subject to local jurisdiction.</li>
                <li>E. & O.E.</li>
              </ol>
            </div>
            <div class="sign-box">
              <div style="font-size: 11px;">For <strong>${invoice.business_name || 'STAYBILL PRO'}</strong></div>
              <div class="auth-signature">Authorized Signatory</div>
            </div>
          </div>

        </div>
      </body>
    </html>
  `;
};


export const getPosInvoiceHtml = (invoice, printSize = '80mm') => {
  if (printSize === 'A4') {
    return getWholesaleInvoiceHtml(invoice);
  }

  const cart = invoice.items || [];
  const total = invoice.total_amount || 0;
  
  const taxGroups = {};
  cart.forEach(item => {
    const rate = Number(item.gst || item.gst_rate || 0);
    const amt = (item.price || item.unit_price) * (item.qty || item.quantity);
    if (!taxGroups[rate]) {
      taxGroups[rate] = { items: [], taxable: 0, cgst: 0, sgst: 0, totalTax: 0 };
    }
    taxGroups[rate].items.push(item);
    taxGroups[rate].taxable += amt;
    const itemGst = amt * (rate / 100);
    taxGroups[rate].cgst += itemGst / 2;
    taxGroups[rate].sgst += itemGst / 2;
    taxGroups[rate].totalTax += itemGst;
  });

  const totalItemsCount = cart.length;
  const totalQtyCount = cart.reduce((sum, i) => sum + Number(i.qty || i.quantity || 0), 0);

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
      const price = item.price || item.unit_price;
      const qty = item.qty || item.quantity;
      itemsHtml += `
        <tr>
          <td style="padding-right: 2px;">${(item.name || item.item_name).substring(0, 16)}</td>
          <td style="text-align: center; white-space: nowrap;">${qty}</td>
          <td style="text-align: right; white-space: nowrap;">${Number(price).toFixed(2)}</td>
          <td style="text-align: right; white-space: nowrap;">${(price * qty).toFixed(2)}</td>
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

  for (const [, group] of Object.entries(taxGroups)) {
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

  const adminUserStr = localStorage.getItem('adminUser');
  const bProf = adminUserStr ? JSON.parse(adminUserStr) : {};
  
  const shopName = invoice.business_name || invoice.branch_name || bProf.business || bProf.business_name || '';
  const gstin = invoice.corporate_gst || invoice.branch_gst || bProf.gst_number || '';
  const bUpiId = invoice.upi_id || bProf.upi_id || '';
  
  const upiString = bUpiId ? `upi://pay?pa=${bUpiId}&pn=${encodeURIComponent(shopName)}&am=${Number(total).toFixed(2)}&cu=INR` : '';
  const upiQrUrl = bUpiId ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(upiString)}` : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice - ${invoice.id}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; margin: 0 auto; color: #000; font-size: ${printSize === '50mm' ? '10px' : (printSize === '55mm' ? '11px' : '12px')}; max-width: ${printSize === '50mm' ? '58mm' : (printSize === '55mm' ? '65mm' : '100%')}; box-sizing: border-box; }
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
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #0ea5e9; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">🖨️ Print Invoice</button>
        </div>
        <div style="width: 100%; margin: 0 auto; padding: 10px 5px;">
          <div class="center">
            <div class="header-name">${shopName}</div>
            <div class="header-address">Phone: ${invoice.branch_phone || bProf.phone || '—'}</div>
            <div class="header-address">GSTIN: ${gstin}</div>
          </div>
          <div class="divider"></div>
          <div class="center bold" style="font-size: 14px; margin: 4px 0;">TAX INVOICE</div>
          <div class="flex-between">
            <span>Bill No : ${String(invoice.id).padStart(4, '0')}</span>
            <span>Bill Dt : ${new Date(invoice.created_at).toLocaleDateString('en-GB')}</span>
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
            <span>${grandTaxable.toFixed(2)}</span>
          </div>
          <div class="flex-between">
            <span>CGST:</span>
            <span>${grandCgst.toFixed(2)}</span>
          </div>
          <div class="flex-between">
            <span>SGST:</span>
            <span>${grandSgst.toFixed(2)}</span>
          </div>
          ${Number(invoice.discount_amount || 0) > 0 ? `
          <div class="flex-between">
            <span>Discount:</span>
            <span>-${Number(invoice.discount_amount || 0).toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="divider"></div>
          <div class="flex-between bold" style="font-size: 14px; padding: 4px 0;">
            <span>Items: ${totalItemsCount} &nbsp;&nbsp;&nbsp; Qty: ${totalQtyCount}</span>
            <span>Total: ${Number(total).toFixed(2)}</span>
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
          ${Number(invoice.discount_amount || 0) > 0 ? `
          <div class="center bold" style="margin-top: 10px; margin-bottom: 5px; font-size: 13px; border: 1px dashed #000; padding: 4px; border-radius: 4px;">
            *** YOU SAVED: ₹${Number(invoice.discount_amount || 0).toFixed(2)} ***
          </div>
          ` : ''}
          <div class="center bold" style="margin-top: 10px; font-style: italic; font-size: 14px;">
            *** Thank You Visit Again ***
          </div>
          ${upiQrUrl ? `
          <div class="center" style="margin-top: 15px;">
            <img src="${upiQrUrl}" alt="UPI QR Code" style="max-width: 100px; height: auto;" />
            <div style="font-size: 10px; font-weight: bold; margin-top: 4px;">Scan to Pay</div>
          </div>
          ` : ''}
        </div>
      </body>
    </html>
  `;
};

export const getSubscriptionInvoiceHtml = (invoice, adminUser = {}) => {
  const subtotal = invoice.amount || (invoice.total_paid / 1.18);
  const gst = invoice.gst_amount || (invoice.total_paid - subtotal);
  const total = invoice.total_paid;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Subscription Invoice - ${invoice.transaction_id || 'Invoice'}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #2563eb; }
          .invoice-details { display: flex; justify-content: space-between; margin-bottom: 40px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
          th { background: #f8fafc; }
          .totals { text-align: right; width: 300px; margin-left: auto; }
          .totals div { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .totals .grand-total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; border-bottom: none; }
          @media print {
            .no-print { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #0ea5e9; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">🖨️ Print Invoice</button>
        </div>
        <div class="header">
          <h1>S Square G Tech Solutions Pvt Ltd.</h1>
          <p style="margin: 5px 0;">Near Anikethana Degree College, Adarsh colony, Sindhanur, Raichur, Karnataka 584128</p>
          <p style="margin: 5px 0;">Phone: 7022477479, 7676814367</p>
          <h2 style="margin-top: 15px; color: #2563eb;">Subscription Tax Invoice</h2>
        </div>
        
        <div class="invoice-details">
          <div>
            <strong>Billed To:</strong><br/>
            ${adminUser.name ? `<strong>${adminUser.name}</strong><br/>` : ''}
            ${adminUser.business ? `${adminUser.business}<br/>` : ''}
            ${adminUser.address ? `${adminUser.address}<br/>` : ''}
            ${adminUser.phone ? `Phone: ${adminUser.phone}<br/>` : ''}
            ${adminUser.email ? `Email: ${adminUser.email}<br/>` : ''}
            ${adminUser.gst_number ? `GSTIN: ${adminUser.gst_number}<br/>` : ''}
            ${!adminUser.name && !adminUser.business ? 'Administrator<br/>' : ''}
          </div>
          <div>
            <strong>Invoice No:</strong> SUB-INV-${invoice.id || String(Math.floor(Math.random() * 10000)).padStart(4, '0')}<br/>
            <strong>Invoice Date:</strong> ${new Date(invoice.start_date || invoice.created_at || Date.now()).toLocaleDateString()}<br/>
            <strong>Transaction ID:</strong> ${invoice.transaction_id || 'N/A'}<br/>
            <strong>Payment Status:</strong> ${invoice.payment_status || 'Success'}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Features</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${invoice.plan_name} Subscription</td>
              <td>${invoice.features || 'Both Features'}</td>
              <td>₹${Number(subtotal).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <div>
            <span>Subtotal:</span>
            <span>₹${Number(subtotal).toFixed(2)}</span>
          </div>
          <div>
            <span>GST (18%):</span>
            <span>₹${Number(gst).toFixed(2)}</span>
          </div>
          <div class="grand-total">
            <span>Total Paid:</span>
            <span>₹${Number(total).toFixed(2)}</span>
          </div>
        </div>
        
        <div style="margin-top: 60px; font-size: 0.9em; color: #666; text-align: center;">
          <p>Thank you for subscribing with S Square G Tech Solutions Pvt Ltd.!</p>
          <p>This is a computer generated invoice and requires no physical signature.</p>
        </div>
      </body>
    </html>
  `;
};
