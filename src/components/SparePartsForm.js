import React, { useState } from 'react';

function SparePartsForm() {
  const [formData, setFormData] = useState({ name: '', category: '', price: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category.trim() || !formData.price) return;
    console.log('Spare part added:', formData);
    setFormData({ name: '', category: '', price: '' });
  };

  return (
    <div className="modern-card">
      <div className="card-header">
        <div className="header-icon">⚙️</div>
        <h2>Add New Spare Part</h2>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="modern-label">Part Name</label>
          <input
            type="text"
            className="modern-input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Compressor, Capacitor, Display Panel"
            required
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="modern-label">Category</label>
          <input
            type="text"
            className="modern-input"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., AC, Fridge, TV"
            required
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="modern-label">Price (₹)</label>
          <input
            type="number"
            className="modern-input"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="e.g., 5000"
            required
          />
        </div>

        <button type="submit" className="modern-button">
          <span className="button-icon">➕</span>
          <span>Add Spare Part</span>
        </button>
      </form>
    </div>
  );
}

export default SparePartsForm;
