import React, { useState } from 'react';
import { useService } from '../context/ServiceContext';

function ServiceRequestForm() {
  const { applianceCategories, addServiceRequest } = useService();
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [applianceType, setApplianceType] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!customerName || !phone || !applianceType || !issueDescription) {
      return;
    }

    addServiceRequest({
      customerName,
      phone,
      address,
      applianceType,
      issueDescription,
      date: new Date().toISOString().split('T')[0]
    });

    // Reset form
    setCustomerName('');
    setPhone('');
    setAddress('');
    setApplianceType('');
    setIssueDescription('');

    // Show success
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="modern-card service-form-card">
      <div className="card-header">
        <div className="header-icon">🛠️</div>
        <div>
          <h2>New Service Request</h2>
          <p className="header-subtitle">Create a repair or maintenance request</p>
        </div>
      </div>

      {showSuccess && (
        <div className="success-banner">
          <span className="success-icon">✓</span>
          Service request created successfully!
        </div>
      )}

      <form className="modern-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="modern-label">
              <span className="label-icon">👤</span>
              <span>Customer Name *</span>
            </label>
            <input
              type="text"
              className="modern-input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="form-group">
            <label className="modern-label">
              <span className="label-icon">📞</span>
              <span>Phone Number *</span>
            </label>
            <input
              type="tel"
              maxLength="10"
              className="modern-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., +1 (555) 123-4567"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="modern-label">
            <span className="label-icon">📍</span>
            <span>Service Address</span>
          </label>
          <input
            type="text"
            className="modern-input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter complete address"
          />
        </div>

        <div className="form-group">
          <label className="modern-label">
            <span className="label-icon">📱</span>
            <span>Appliance Type *</span>
          </label>
          <select
            className="modern-input"
            value={applianceType}
            onChange={(e) => setApplianceType(e.target.value)}
            required
          >
            <option value="">Select appliance type...</option>
            {applianceCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="modern-label">
            <span className="label-icon">📝</span>
            <span>Issue Description *</span>
          </label>
          <textarea
            className="modern-input modern-textarea"
            rows="4"
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            placeholder="Describe the problem in detail..."
            required
          />
        </div>

        <button type="submit" className="modern-button">
          <span className="button-icon">🚀</span>
          <span>Submit Request</span>
        </button>
      </form>
    </div>
  );
}

export default ServiceRequestForm;
