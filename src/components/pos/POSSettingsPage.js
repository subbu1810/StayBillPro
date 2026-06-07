import React, { useState, useEffect } from 'react';
import { posSettingsAPI } from '../../services/api';
import { usePopup } from '../ui/PopupProvider';

/**
 * POSSettingsPage Component
 * Configuration for the POS module
 */
export default function POSSettingsPage() {
  const popup = usePopup();
  const [shopName, setShopName] = useState('Electronics Hub India');
  const [gstin, setGstin] = useState('27AAACH9999Z1Z5');
  const [theme, setTheme] = useState('light');
  const [printSize, setPrintSize] = useState('80mm');
  const [wholesalePrintSize, setWholesalePrintSize] = useState('A4');
  const [autoPrint, setAutoPrint] = useState(true);

  // Tax Configurations
  const [enableGst, setEnableGst] = useState(true);
  const [inclusiveGst, setInclusiveGst] = useState(false);
  const [showHsn, setShowHsn] = useState(true);
  const [defaultGstPreset, setDefaultGstPreset] = useState(18);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const storedBranch = localStorage.getItem('selectedBranchId');
      const branchId = (storedBranch && storedBranch !== 'undefined' && storedBranch !== 'null') ? storedBranch : '1';
      const data = await posSettingsAPI.get(branchId);
      if (data && Object.keys(data).length > 0) {
        if (data.shop_name) setShopName(data.shop_name);
        if (data.gstin) setGstin(data.gstin);
        if (data.theme) setTheme(data.theme);
        if (data.print_size) setPrintSize(data.print_size);
        if (data.wholesale_print_size) setWholesalePrintSize(data.wholesale_print_size);
        if (data.auto_print !== undefined) setAutoPrint(!!data.auto_print);
        if (data.enable_gst !== undefined) setEnableGst(!!data.enable_gst);
        if (data.inclusive_gst !== undefined) setInclusiveGst(!!data.inclusive_gst);
        if (data.show_hsn !== undefined) setShowHsn(!!data.show_hsn);
        if (data.default_gst_preset !== undefined) setDefaultGstPreset(data.default_gst_preset);
      }
    } catch (error) {
      console.error('Failed to fetch POS settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      const storedBranch = localStorage.getItem('selectedBranchId');
      const branchId = (storedBranch && storedBranch !== 'undefined' && storedBranch !== 'null') ? storedBranch : '1';
      
      await posSettingsAPI.update({
        branch_id: branchId,
        shop_name: shopName,
        gstin: gstin,
        theme: theme,
        print_size: printSize,
        wholesale_print_size: wholesalePrintSize,
        auto_print: autoPrint,
        enable_gst: enableGst,
        inclusive_gst: inclusiveGst,
        show_hsn: showHsn,
        default_gst_preset: defaultGstPreset
      });
      popup.showSuccess('Settings saved successfully to the backend!');
    } catch (error) {
      console.error('Failed to save POS settings:', error);
      popup.showError('Failed to save settings. Please try again.');
    }
  };

  const handleTestPrint = () => {
    const printWindow = window.open('', '_blank');
    let htmlContent = '';

    if (printSize === 'A4') {
      htmlContent = `
        <html>
          <head>
            <title>Test Print - A4</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; margin: 0 auto; color: #1e293b; line-height: 1.5; }
              .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
              h1 { margin: 0; color: #0f172a; font-size: 28px; }
              @media print { .print-btn { display: none; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Test Print (A4 Size)</h1>
              <p>Printer settings are working perfectly!</p>
            </div>
            <p>This is a full-page A4 test print. Your invoices will be printed using this format.</p>
            <button class="print-btn" onclick="window.print()" style="display: block; width: 200px; margin: 40px auto; padding: 12px; background: #0f172a; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">PRINT PAGE</button>
          </body>
        </html>
      `;
    } else {
      const width = printSize === '50mm' ? '50mm' : '80mm';
      htmlContent = `
        <html>
          <head>
            <title>Test Print - ${printSize}</title>
            <style>
              body { font-family: 'Courier New', Courier, monospace; width: 100%; max-width: 100%; padding: 10px; margin: 0 auto; color: #000; font-size: ${printSize === '50mm' ? '10px' : '12px'}; text-align: center; box-sizing: border-box; }
              .print-btn { display: block; width: 100%; padding: 10px; margin-top: 20px; background: #000; color: #fff; text-align: center; cursor: pointer; border: none; font-weight: bold; font-family: sans-serif; }
              @media print { 
                @page { margin: 0; }
                .print-btn { display: none; } 
                body { width: 100%; max-width: 100%; padding: 5px; } 
              }
            </style>
          </head>
          <body>
            <h2 style="margin: 0; font-size: ${printSize === '50mm' ? '16px' : '20px'};">Test Print</h2>
            <p style="margin: 4px 0;">Size: ${printSize}</p>
            <p style="margin: 20px 0;">Printer configuration is working perfectly!</p>
            <button class="print-btn" onclick="window.print()">PRINT</button>
          </body>
        </html>
      `;
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="pos-settings-container animate-pos-fade">
      <div className="settings-header">
        <h1>POS Settings</h1>
        <p>Configure your shop details, taxes, and hardware</p>
      </div>

      <div className="settings-grid">


        {/* GST & Tax Config */}
        <div className="settings-section card">
           <div className="section-title">
             <span className="icon">⚖️</span>
             <h3>Tax Configurations</h3>
           </div>
           <div className="toggle-group">
             <div className="toggle-row">
               <span>Enable GST Calculation</span>
               <input type="checkbox" checked={enableGst} onChange={(e) => setEnableGst(e.target.checked)} />
             </div>
             <div className="toggle-row">
               <span>Prices include GST (Inclusive)</span>
               <input type="checkbox" checked={inclusiveGst} onChange={(e) => setInclusiveGst(e.target.checked)} />
             </div>
             <div className="toggle-row">
               <span>Show HSN/SAC on Invoice</span>
               <input type="checkbox" checked={showHsn} onChange={(e) => setShowHsn(e.target.checked)} />
             </div>
           </div>
           <div className="gst-presets">
             <label>Default GST Presets (%)</label>
             <div className="chips">
               {[5, 12, 18, 28].map(preset => (
                 <span 
                   key={preset} 
                   className={defaultGstPreset === preset ? 'active' : ''}
                   onClick={() => setDefaultGstPreset(preset)}
                   style={{ cursor: 'pointer' }}
                 >
                   {preset}%
                 </span>
               ))}
             </div>
           </div>
        </div>

        {/* Printer & Hardware */}
        <div className="settings-section card">
           <div className="section-title">
             <span className="icon">🖨️</span>
             <h3>Printer & Hardware</h3>
           </div>
           <div className="form-group">
             <label>POS Billing Print Size</label>
             <select value={printSize} onChange={(e) => setPrintSize(e.target.value)}>
               <option value="80mm">80mm (Standard)</option>
               <option value="50mm">50mm (Small)</option>
               <option value="A4">A4 (Full Page)</option>
             </select>
           </div>
           <div className="form-group">
             <label>Wholesale Billing Print Size</label>
             <select value={wholesalePrintSize} onChange={(e) => setWholesalePrintSize(e.target.value)}>
               <option value="80mm">80mm (Standard)</option>
               <option value="50mm">50mm (Small)</option>
               <option value="A4">A4 (Full Page)</option>
             </select>
           </div>
           <div className="toggle-row">
             <span>Auto-print on checkout</span>
             <input type="checkbox" checked={autoPrint} onChange={(e) => setAutoPrint(e.target.checked)} />
           </div>
           <div className="toggle-row">
             <span>Open Cash Drawer after payment</span>
             <input type="checkbox" />
           </div>
           <button className="btn-test" onClick={handleTestPrint}>Test Print Page</button>
        </div>


      </div>

      <div className="settings-footer">
         <button className="btn-save" onClick={handleSave}>Save All Settings</button>
      </div>

      <style jsx>{`
        .pos-settings-container { padding: 2rem; height: 100%; overflow: auto; }
        .settings-header { margin-bottom: 2.5rem; }
        .settings-header h1 { font-size: 1.875rem; font-weight: 800; }
        .settings-header p { color: var(--pos-text-muted); }

        .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; margin-bottom: 5rem; }
        .card { background: white; padding: 2rem; border-radius: var(--pos-radius-lg); border: 1px solid var(--pos-border); box-shadow: var(--pos-shadow-sm); }

        .section-title { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--pos-bg-main); padding-bottom: 1rem; }
        .section-title .icon { font-size: 1.5rem; }
        .section-title h3 { margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--pos-text-main); }

        .form-group { margin-bottom: 1.25rem; }
        .form-group label { display: block; font-size: 0.85rem; font-weight: 700; color: var(--pos-text-muted); margin-bottom: 0.5rem; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.75rem; border: 1.5px solid var(--pos-border); border-radius: 8px; font-family: inherit; font-size: 0.9rem; }
        .form-group textarea { height: 80px; resize: none; }

        .toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px dashed var(--pos-border); font-size: 0.95rem; font-weight: 600; color: var(--pos-text-main); }
        .toggle-row:last-child { border-bottom: none; }

        .chips { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
        .chips span { padding: 4px 12px; border-radius: 6px; border: 1.5px solid var(--pos-border); font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .chips span.active { background: var(--pos-primary); color: white; border-color: var(--pos-primary); }

        .btn-test { width: 100%; margin-top: 1rem; padding: 0.75rem; background: var(--pos-bg-main); border: 1.5px solid var(--pos-border); border-radius: 8px; font-weight: 700; cursor: pointer; }

        .theme-options { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
        .theme-options button { flex: 1; padding: 0.75rem; background: white; border: 1.5px solid var(--pos-border); border-radius: 8px; font-weight: 700; cursor: pointer; }
        .theme-options button.active { border-color: var(--pos-primary); color: var(--pos-primary); background: var(--pos-primary-soft, #f5f3ff); }

        .settings-footer { position: sticky; bottom: 0; left: 0; right: 0; background: rgba(255,255,255,0.8); backdrop-filter: blur(8px); padding: 1.5rem 2rem; border-top: 1px solid var(--pos-border); display: flex; justify-content: flex-end; }
        .btn-save { padding: 1rem 3rem; background: var(--pos-gradient); color: white; border: none; border-radius: 12px; font-weight: 800; font-size: 1rem; cursor: pointer; box-shadow: 0 4px 15px var(--pos-primary-glow); }

        @media (max-width: 900px) { .settings-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
