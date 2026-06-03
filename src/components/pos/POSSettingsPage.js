import React, { useState } from 'react';

/**
 * POSSettingsPage Component
 * Configuration for the POS module
 */
export default function POSSettingsPage() {
  const [shopName, setShopName] = useState('Electronics Hub India');
  const [gstin, setGstin] = useState('27AAACH9999Z1Z5');
  const [theme, setTheme] = useState('light');

  return (
    <div className="pos-settings-container animate-pos-fade">
      <div className="settings-header">
        <h1>POS Settings</h1>
        <p>Configure your shop details, taxes, and hardware</p>
      </div>

      <div className="settings-grid">
        {/* Shop Profile */}
        <div className="settings-section card">
          <div className="section-title">
            <span className="icon">🏪</span>
            <h3>Shop Profile</h3>
          </div>
          <div className="form-group">
            <label>Shop Display Name</label>
            <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>GSTIN Number</label>
            <input type="text" value={gstin} onChange={(e) => setGstin(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Address line</label>
            <textarea defaultValue="MG Road, Bengaluru, Karnataka - 560001"></textarea>
          </div>
        </div>

        {/* GST & Tax Config */}
        <div className="settings-section card">
           <div className="section-title">
             <span className="icon">⚖️</span>
             <h3>Tax Configurations</h3>
           </div>
           <div className="toggle-group">
             <div className="toggle-row">
               <span>Enable GST Calculation</span>
               <input type="checkbox" defaultChecked />
             </div>
             <div className="toggle-row">
               <span>Prices include GST (Inclusive)</span>
               <input type="checkbox" />
             </div>
             <div className="toggle-row">
               <span>Show HSN/SAC on Invoice</span>
               <input type="checkbox" defaultChecked />
             </div>
           </div>
           <div className="gst-presets">
             <label>Default GST Presets (%)</label>
             <div className="chips">
               <span>5%</span> <span>12%</span> <span className="active">18%</span> <span>28%</span>
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
             <label>Thermal Printer Size</label>
             <select>
               <option>80mm (Standard)</option>
               <option>58mm (Small)</option>
               <option>A4 (Full Page)</option>
             </select>
           </div>
           <div className="toggle-row">
             <span>Auto-print on checkout</span>
             <input type="checkbox" defaultChecked />
           </div>
           <div className="toggle-row">
             <span>Open Cash Drawer after payment</span>
             <input type="checkbox" />
           </div>
           <button className="btn-test">Test Print Page</button>
        </div>

        {/* UI & Theme */}
        <div className="settings-section card">
           <div className="section-title">
             <span className="icon">🎨</span>
             <h3>Interface Settings</h3>
           </div>
           <div className="theme-switcher">
             <label>Color Theme</label>
             <div className="theme-options">
               <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>☀️ Light</button>
               <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>🌙 Dark</button>
               <button>🌈 Custom</button>
             </div>
           </div>
           <div className="toggle-row">
             <span>Show Product Images in Grid</span>
             <input type="checkbox" defaultChecked />
           </div>
           <div className="toggle-row">
             <span>Enable Sound Effects</span>
             <input type="checkbox" defaultChecked />
           </div>
        </div>
      </div>

      <div className="settings-footer">
         <button className="btn-save">Save All Settings</button>
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
