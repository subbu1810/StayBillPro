import React, { useState } from 'react';
import { useService } from '../hooks/useService';

function ApplianceForm() {
  const { addAppliance, applianceCategories } = useService();
  const [type, setType] = useState('');
  const [brand, setBrand] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!type || !brand || !modelNumber) {
      return;
    }
    addAppliance({
      type,
      brand,
      modelNumber,
      purchaseDate,
      warrantyExpiry
    });

    // Reset form
    setType('');
    setBrand('');
    setModelNumber('');
    setPurchaseDate('');
    setWarrantyExpiry('');

    // Show success message
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="modern-card appliance-form-card">
      <div className="card-header">
        <div className="header-icon">📱</div>
        <div>
          <h2>Register New Appliance</h2>
          <p className="header-subtitle">Add a device to track service history</p>
        </div>
      </div>

      {showSuccess && (
        <div className="success-banner">
          <span className="success-icon">✓</span>
          Appliance registered successfully!
        </div>
      )}

      <form className="modern-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="modern-label">
              <span className="label-icon">🔖</span>
              <span>Appliance Type *</span>
            </label>
            <select
              className="modern-input"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            >
              <option value="">Choose type...</option>
              {applianceCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="modern-label">
              <span className="label-icon">🏷️</span>
              <span>Brand *</span>
            </label>
            <input
              type="text"
              className="modern-input"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g., Samsung, LG, Sony"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="modern-label">
              <span className="label-icon">🔢</span>
              <span>Model Number *</span>
            </label>
            <input
              type="text"
              className="modern-input"
              value={modelNumber}
              onChange={(e) => setModelNumber(e.target.value)}
              placeholder="e.g., RF28R7351SR"
              required
            />
          </div>

          <div className="form-group">
            <label className="modern-label">
              <span className="label-icon">📅</span>
              <span>Purchase Date</span>
            </label>
            <input
              type="date"
              className="modern-input"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="modern-label">
            <span className="label-icon">🛡️</span>
            <span>Warranty Expiry</span>
          </label>
          <input
            type="date"
            className="modern-input"
            value={warrantyExpiry}
            onChange={(e) => setWarrantyExpiry(e.target.value)}
          />
        </div>

        <button type="submit" className="modern-button">
          <span className="button-icon">➕</span>
          <span>Register Appliance</span>
        </button>
      </form>
    </div>
  );
}

export default ApplianceForm;
