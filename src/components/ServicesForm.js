import React, { useState } from 'react';

function ServicesForm() {
  const [formData, setFormData] = useState({ name: '', icon: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    console.log('Service added:', formData);
    setFormData({ name: '', icon: '' });
  };

  return (
    <div className="modern-card">
      <div className="card-header">
        <div className="header-icon">🔧</div>
        <h2>Add New Service</h2>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="modern-label">Service Name</label>
          <input
            type="text"
            className="modern-input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., TV, Fridge, AC, Cooler"
            required
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="modern-label">Icon (Emoji)</label>
          <input
            type="text"
            className="modern-input"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            placeholder="e.g., 📺, 🧊, ❄️"
            maxLength="2"
          />
        </div>

        <button type="submit" className="modern-button">
          <span className="button-icon">➕</span>
          <span>Add Service</span>
        </button>
      </form>
    </div>
  );
}

export default ServicesForm;
