const fs = require('fs');

const codeToAppend = `

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
    itemsHtml += \`
      <tr>
        <td colspan="4" style="padding: 4px 0 2px 0; font-weight: bold; font-style: italic;">
          \${groupIndex}) CGST @ \${halfRate}%, SGST @ \${halfRate}%
        </td>
      </tr>
    \`;
    group.items.forEach(item => {
      const price = item.price || item.unit_price;
      const qty = item.qty || item.quantity;
      itemsHtml += \`
        <tr>
          <td style="padding-right: 2px;">\${(item.name || item.item_name).substring(0, 16)}</td>
          <td style="text-align: center; white-space: nowrap;">\${qty}</td>
          <td style="text-align: right; white-space: nowrap;">\${Number(price).toFixed(2)}</td>
          <td style="text-align: right; white-space: nowrap;">\${(price * qty).toFixed(2)}</td>
        </tr>
      \`;
    });
    groupIndex++;
  }

  let taxBreakdownHtml = '';
  let taxIdx = 1;
  let grandTaxable = 0;
  let grandCgst = 0;
  let grandSgst = 0;
  let grandTotalWithTax = 0;

  for (const [rate, group] of Object.entries(taxGroups)) {
    taxBreakdownHtml += \`
      <tr>
        <td>\${taxIdx}</td>
        <td style="text-align: right; white-space: nowrap;">\${group.taxable.toFixed(2)}</td>
        <td style="text-align: right; white-space: nowrap;">\${group.cgst.toFixed(2)}</td>
        <td style="text-align: right; white-space: nowrap;">\${group.sgst.toFixed(2)}</td>
        <td style="text-align: right; white-space: nowrap;">\${(group.taxable + group.totalTax).toFixed(2)}</td>
      </tr>
    \`;
    grandTaxable += group.taxable;
    grandCgst += group.cgst;
    grandSgst += group.sgst;
    grandTotalWithTax += (group.taxable + group.totalTax);
    taxIdx++;
  }
  
  taxBreakdownHtml += \`
      <tr style="border-top: 1px dashed #000; font-weight: bold;">
        <td>T:</td>
        <td style="text-align: right; white-space: nowrap;">\${grandTaxable.toFixed(2)}</td>
        <td style="text-align: right; white-space: nowrap;">\${grandCgst.toFixed(2)}</td>
        <td style="text-align: right; white-space: nowrap;">\${grandSgst.toFixed(2)}</td>
        <td style="text-align: right; white-space: nowrap;">\${grandTotalWithTax.toFixed(2)}</td>
      </tr>
  \`;

  const shopName = invoice.business_name || 'STAYBILL PRO';
  const gstin = invoice.corporate_gst || invoice.branch_gst || '29AMEPP6614P1ZC';

  return \`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice - \${invoice.id}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; margin: 0 auto; color: #000; font-size: \${printSize === '50mm' ? '10px' : '12px'}; max-width: \${printSize === '50mm' ? '58mm' : '100%'}; box-sizing: border-box; }
          .center { text-align: center; }
          .header-name { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
          .header-address { font-size: 10px; margin-bottom: 2px; }
          .divider { border-bottom: 1px dashed #000; margin: 5px 0; }
          .flex-between { display: flex; justify-content: space-between; }
          .flex-between span { white-space: nowrap; }
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
            <div class="header-name">\${shopName}</div>
            <div class="header-address">Phone: \${invoice.branch_phone || '—'}</div>
            <div class="header-address">GSTIN: \${gstin}</div>
          </div>
          <div class="divider"></div>
          <div class="center bold" style="font-size: 14px; margin: 4px 0;">TAX INVOICE</div>
          <div class="flex-between">
            <span>Bill No : \${String(invoice.id).padStart(4, '0')}</span>
            <span>Bill Dt : \${new Date(invoice.created_at).toLocaleDateString('en-GB')}</span>
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
              \${itemsHtml}
            </tbody>
          </table>
          <div class="divider"></div>
          <div class="flex-between bold" style="font-size: 14px; padding: 4px 0;">
            <span>Items: \${totalItemsCount} &nbsp;&nbsp;&nbsp; Qty: \${totalQtyCount}</span>
            <span>\${Number(total).toFixed(2)}</span>
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
              \${taxBreakdownHtml}
            </tbody>
          </table>
          
          <div class="divider"></div>
          <div class="center bold" style="margin-top: 15px; font-style: italic; font-size: 14px;">
            *** Thank You Visit Again ***
          </div>
        </div>
      </body>
    </html>
  \`;
};
`;

fs.appendFileSync('src/utils/printFormat.js', codeToAppend);
console.log('Done appending');
