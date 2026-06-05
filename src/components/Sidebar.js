import React from 'react';

function Sidebar({ activeTab, onChange, onLogout }) {
  const menuItems = [
    { id: 'dashboard', icon: '⌂', label: 'Dashboard' },
    { id: 'appliances', icon: '📦', label: 'Inventory' },
    { id: 'allRequests', icon: '👥', label: 'Customers' },
    { id: 'createRequest', icon: '🔧', label: 'Service' }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">💠</span>
          <span className="logo-text">StayBill</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onChange(item.id)}
            title={item.label}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-item" onClick={onLogout} title="Logout">
          <span className="sidebar-icon">🚪</span>
          <span className="sidebar-label">Logout</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
