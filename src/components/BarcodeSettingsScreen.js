import React, { useState, useEffect } from 'react';
import { barcodeSettingsAPI } from '../services/api';

const BarcodeSettingsScreen = () => {
    const [settings, setSettings] = useState({
        label_width_mm: 50,
        label_height_mm: 25,
        printer_type: 'Thermal'
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await barcodeSettingsAPI.get();
            if (res.success && res.settings) {
                setSettings(res.settings);
            }
        } catch (err) {
            console.error('Error fetching barcode settings:', err);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await barcodeSettingsAPI.update(settings);
            setMessage({ type: 'success', text: 'Barcode settings saved successfully!' });
        } catch (err) {
            console.error('Error saving barcode settings:', err);
            setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    return (
        <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                🖨️ Barcode Printer Configuration
            </h3>
            
            {message.text && (
                <div style={{ 
                    padding: '10px', 
                    marginBottom: '20px', 
                    borderRadius: '4px', 
                    background: message.type === 'error' ? '#fee2e2' : '#dcfce7', 
                    color: message.type === 'error' ? '#991b1b' : '#166534' 
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave} style={{ maxWidth: '600px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#34495e' }}>Printer Type</label>
                    <select 
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                        value={settings.printer_type}
                        onChange={e => setSettings({ ...settings, printer_type: e.target.value })}
                    >
                        <option value="Thermal">Thermal Label Printer (e.g. Zebra, TSC, Godex)</option>
                        <option value="Standard">Standard A4/Laser Printer (Sheet Labels)</option>
                    </select>
                    <p style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                        If you are using a Thermal printer, the browser will be forced to print at exactly the dimensions specified below.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#34495e' }}>Label Width (mm)</label>
                        <input 
                            type="number" 
                            required
                            min="10"
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                            value={settings.label_width_mm}
                            onChange={e => setSettings({ ...settings, label_width_mm: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#34495e' }}>Label Height (mm)</label>
                        <input 
                            type="number" 
                            required
                            min="10"
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                            value={settings.label_height_mm}
                            onChange={e => setSettings({ ...settings, label_height_mm: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        background: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {loading ? 'Saving...' : 'Save Configuration'}
                </button>
            </form>

            <div style={{ marginTop: '30px', padding: '15px', background: '#f8f9fa', borderRadius: '4px', borderLeft: '4px solid #3498db' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>💡 Common Label Sizes</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#555', lineHeight: '1.6' }}>
                    <li><strong>50mm x 25mm</strong> (2" x 1") - Standard for most inventory tracking</li>
                    <li><strong>38mm x 25mm</strong> (1.5" x 1") - Small items, components</li>
                    <li><strong>100mm x 150mm</strong> (4" x 6") - Shipping labels</li>
                </ul>
            </div>
        </div>
    );
};

export default BarcodeSettingsScreen;
