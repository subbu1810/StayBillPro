import React from 'react';
import { useService } from '../context/ServiceContext';

function NavTabs({ activeTab, onChange }) {
  return (
    <div className="nav-tabs">
      <button
        type="button"
        className={activeTab === 'dashboard' ? 'tab active' : 'tab'}
        onClick={() => onChange('dashboard')}
      >
        <span className="tab-icon">📊</span>
        <span className="tab-label">Dashboard</span>
      </button>

      <button
        type="button"
        className={activeTab === 'appliances' ? 'tab active' : 'tab'}
        onClick={() => onChange('appliances')}
      >
        <span className="tab-icon">📱</span>
        <span className="tab-label">Appliances</span>
      </button>

      <button
        type="button"
        className={activeTab === 'createRequest' ? 'tab active' : 'tab'}
        onClick={() => onChange('createRequest')}
      >
        <span className="tab-icon">➕</span>
        <span className="tab-label">Create Request</span>
      </button>

      <button
        type="button"
        className={activeTab === 'allRequests' ? 'tab active' : 'tab'}
        onClick={() => onChange('allRequests')}
      >
        <span className="tab-icon">📋</span>
        <span className="tab-label">All Requests</span>
      </button>
    </div>
  );
}

export default NavTabs;
