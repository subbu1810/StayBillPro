import React from 'react';
import { useService } from '../context/ServiceContext';

function ApplianceList({ onRegisterClick }) {
  const { appliances } = useService();

  // Get appliance icon based on type
  const getApplianceIcon = (type) => {
    const icons = {
      'Fridge': '🧊',
      'TV': '📺',
      'AC': '❄️',
      'Mixer Grinder': '🔪',
      'Inverter Battery': '🔋',
      'Washing Machine': '🌀',
      'Microwave': '📻',
      'Water Heater': '♨️'
    };
    return icons[type] || '📱';
  };

  // Check if warranty is active
  const isWarrantyActive = (warrantyDate) => {
    if (!warrantyDate) return false;
    return new Date(warrantyDate) > new Date();
  };

  return (
    <div className="modern-card appliance-list-card">
      <div className="card-header">
        <div className="header-icon">📋</div>
        <div>
          <h2>Registered Appliances</h2>
          <p className="header-subtitle">
            {appliances.length} device{appliances.length !== 1 ? 's' : ''} registered
          </p>
        </div>
      </div>

      {appliances.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon">📱</div>
          <h3>No Appliances Yet</h3>
          <p>Register your first appliance to start tracking service history</p>
          <button className="modern-button" onClick={onRegisterClick} style={{ marginTop: '1rem', maxWidth: '300px' }}>
            <span className="button-icon">➕</span>
            <span>Register Appliance</span>
          </button>
        </div>
      ) : (
        <div className="service-table-container">
          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>Purchase Date</th>
                  <th>Warranty Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appliances.map((appliance) => (
                  <tr key={appliance.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>{getApplianceIcon(appliance.type)}</span>
                        <span>{appliance.type}</span>
                      </div>
                    </td>
                    <td>{appliance.brand}</td>
                    <td className="table-id">{appliance.modelNumber || 'N/A'}</td>
                    <td className="table-date">
                      {appliance.purchaseDate
                        ? new Date(appliance.purchaseDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'N/A'}
                    </td>
                    <td>
                      {appliance.warrantyExpiry ? (
                        <span className={`warranty-badge ${isWarrantyActive(appliance.warrantyExpiry) ? 'active' : 'expired'}`}>
                          {isWarrantyActive(appliance.warrantyExpiry) ? '🛡️ Active' : '⚠️ Expired'}
                        </span>
                      ) : (
                        <span style={{ color: '#999' }}>No warranty</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn view-btn" title="View History">
                          📝
                        </button>
                        <button className="action-btn edit-btn" title="Service">
                          🔧
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplianceList;
