import React, { useState, useEffect } from 'react';
import Barcode from 'react-barcode';
import '../styles/AddItemModal.css';
import { barcodeSettingsAPI } from '../services/api';

const PrintBarcodeModal = ({ isOpen, onClose, items }) => {
    const [settings, setSettings] = useState({
        label_width_mm: 50,
        label_height_mm: 25,
        printer_type: 'Thermal'
    });

    useEffect(() => {
        if (isOpen) {
            fetchSettings();
        }
    }, [isOpen]);

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

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        
        // Dynamically build the CSS based on settings
        let pageCss = '';
        if (settings.printer_type === 'Thermal') {
            pageCss = `@page { size: ${settings.label_width_mm}mm ${settings.label_height_mm}mm; margin: 0; }`;
        } else {
            pageCss = `@page { margin: 10mm; }`; // Standard A4 layout
        }
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Barcodes</title>
                    <style>
                        body { font-family: sans-serif; display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; padding: 20px; }
                        .barcode-container { text-align: center; border: 1px dashed #ccc; padding: 10px; border-radius: 8px; width: fit-content; }
                        .item-name { font-size: 12px; margin-top: 5px; font-weight: bold; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                        .supplier-name { font-size: 10px; color: #666; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                        @media print {
                            body { margin: 0; padding: 0; }
                            .barcode-container { break-inside: avoid; border: none; }
                            ${pageCss}
                        }
                    </style>
                </head>
                <body>
                    ${document.getElementById('barcode-printable-area').innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
                <div className="modal-header">
                    <h2>Print Barcodes</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {items.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '20px' }}>Please select at least one item using the checkboxes before printing barcodes.</p>
                    ) : (
                        <div id="barcode-printable-area" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
                            {items.map((item, index) => {
                                // Defaulting the barcode value to the GRN Number or item ID
                                const barcodeValue = `GRN-${item.grn_item_id}`;
                                return (
                                    <div key={index} className="barcode-container" style={{ textAlign: 'center', border: '1px dashed #ccc', padding: '10px', borderRadius: '8px' }}>
                                        <Barcode value={barcodeValue} width={1.5} height={40} fontSize={12} displayValue={true} />
                                        <div className="item-name" style={{ fontSize: '12px', marginTop: '5px', fontWeight: 'bold' }}>{item.item_name}</div>
                                        <div className="supplier-name" style={{ fontSize: '10px', color: '#666' }}>{item.supplier_name}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="modal-footer" style={{ marginTop: '20px' }}>
                    <button className="btn-secondary" onClick={onClose}>Close</button>
                    {items.length > 0 && (
                        <button className="btn-primary" onClick={handlePrint} style={{ background: '#e74c3c' }}>Print Document</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrintBarcodeModal;
