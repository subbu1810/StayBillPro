// printHelpers.js - pure JS print utilities (no React needed)

export const printInvoiceHtml = (type, data) => {
  const {
    invoiceId,
    customerName,
    customerPhone,
    customerAddress,
    gstin,
    shopName,
    items,
    totalAmount,
    gstAmount,
    discountAmount,
    paymentMethod,
    notes,
    posSettings,
    date
  } = data;

  const invoiceDate = date ? new Date(date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const finalCustomerName = customerName || 'Walk-in Customer';
  const finalCustomerPhone = customerPhone || '';

  if (type === 'wholesale') {
    let tableRowsHtml = '';
    let subtotal = 0;
    
    const taxGroups = {};
    let totalTaxable = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let gstTotal = gstAmount || 0;
    
    items.forEach((item, index) => {
      const price = parseFloat(item.unit_price || item.price || 0);
      const qty = parseInt(item.quantity || item.qty || 0);
      const rate = Number(item.gst || item.gst_rate || 0);
      const amount = price * qty;
      subtotal += amount;
      
      const itemGst = amount * (rate / 100);
      const itemTaxable = amount;
      
      if (!taxGroups[rate]) {
        taxGroups[rate] = { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 };
      }
      taxGroups[rate].taxable += itemTaxable;
      taxGroups[rate].cgst += itemGst / 2;
      taxGroups[rate].sgst += itemGst / 2;
      taxGroups[rate].totalTax += itemGst;

      totalTaxable += itemTaxable;
      totalCGST += itemGst / 2;
      totalSGST += itemGst / 2;

      tableRowsHtml += `
        <tr>
          <td>${index + 1}</td>
          <td>${item.item_name || item.name}</td>
          <td>${item.hsn_code || '-'}</td>
          <td>${rate}%</td>
          <td>${qty}</td>
          <td>${item.unit || 'NOS'}</td>
          <td>${price.toFixed(2)}</td>
          <td>${price.toFixed(2)}</td>
          <td>${amount.toFixed(2)}</td>
        </tr>
      `;
    });

    const finalTotal = totalAmount || (subtotal + gstTotal - discountAmount);
    const paymentMode = paymentMethod || 'cash';
    const selectedCustomer = { gstin: '', state: 'Karnataka (29)' }; 

    ${wsHtml.replace('const htmlContent = ', 'const htmlContent = ')}

    printHTML(htmlContent);

  } else {
    // POS
    let subtotal = 0;
    let tableRowsHtml = '';
    let totalItems = 0;

    items.forEach(item => {
      const price = parseFloat(item.unit_price || item.price || 0);
      const qty = parseInt(item.quantity || item.qty || 0);
      const amount = price * qty;
      subtotal += amount;
      totalItems += qty;

      tableRowsHtml += `
        <tr class="item-row">
          <td colspan="3" style="padding-bottom: 2px;">${item.item_name || item.name}</td>
        </tr>
        <tr>
          <td>${qty} x ${price.toLocaleString('en-IN')}</td>
          <td></td>
          <td style="text-align: right;">₹${amount.toLocaleString('en-IN')}</td>
        </tr>
      `;
    });

    const finalTotal = totalAmount || (subtotal + gstAmount - discountAmount);
    const paymentMode = paymentMethod || 'cash';
    const address = posSettings?.address || 'Shop Address';
    const phone = posSettings?.phone || 'Shop Phone';
    const total = finalTotal;
    const gstTotal = gstAmount;

    ${posHtml.replace('const htmlContent = ', 'const htmlContent = ')}

    printHTML(htmlContent);
  }
};

const printHTML = (htmlContent) => {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  iframe.contentWindow.addEventListener('afterprint', () => {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  });
};
