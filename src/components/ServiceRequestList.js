import React, { useState } from 'react';
import { useService } from '../context/ServiceContext';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed'];

function ServiceRequestList() {
  const { serviceRequests, updateServiceStatus } = useService();
  const [filterStatus, setFilterStatus] = useState('All');

  // Get status icon
  const getStatusIcon = (status) => {
    const icons = {
      'Pending': '⏳',
      'In Progress': '🔧',
      'Completed': '✅'
    };
    return icons[status] || '📋';
  };

  // Get status color class
  const getStatusClass = (status) => {
    return status.toLowerCase().replace(' ', '-');
  };

  // Filter requests
  const filteredRequests = filterStatus === 'All'
    ? serviceRequests
    : serviceRequests.filter(req => req.status === filterStatus);

  // Count by status
  const statusCounts = {
    'All': serviceRequests.length,
    'Pending': serviceRequests.filter(r => r.status === 'Pending').length,
    'In Progress': serviceRequests.filter(r => r.status === 'In Progress').length,
    'Completed': serviceRequests.filter(r => r.status === 'Completed').length,
  };

  return (
    <div className="modern-card service-table-container">
      <div className="card-header">
        <div className="header-icon">📋</div>
        <div>
          <h2>All Service Requests</h2>
          <p className="header-subtitle">
            Manage and track all service requests
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="table-filters">
        {['All', 'Pending', 'In Progress', 'Completed'].map((status) => (
          <button
            key={status}
            className={`filter-tab ${filterStatus === status ? 'active' : ''}`}
            onClick={() => setFilterStatus(status)}
          >
            {status}
            <span className="filter-count">{statusCounts[status]}</span>
          </button>
        ))}
      </div>

      {filteredRequests.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon">📭</div>
          <h3>No Requests Found</h3>
          <p>No service requests match the selected filter</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Appliance</th>
                <th>Issue</th>
                <th>Address</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id} className="table-row">
                  <td className="table-id">#{request.id.substring(0, 6)}</td>
                  <td className="table-date">{request.date}</td>
                  <td className="table-customer">
                    <div className="customer-info">
                      <span className="customer-icon">👤</span>
                      {request.customerName}
                    </div>
                  </td>
                  <td className="table-phone">{request.phone || 'N/A'}</td>
                  <td className="table-appliance">
                    <span className="appliance-tag">{request.applianceType}</span>
                  </td>
                  <td className="table-issue">
                    <div className="issue-preview" title={request.issueDescription || request.issue}>
                      {(request.issueDescription || request.issue)?.substring(0, 50)}
                      {(request.issueDescription || request.issue)?.length > 50 ? '...' : ''}
                    </div>
                  </td>
                  <td className="table-address">
                    {request.address ? (
                      <div className="address-preview" title={request.address}>
                        📍 {request.address.substring(0, 30)}
                        {request.address.length > 30 ? '...' : ''}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="table-status">
                    <select
                      className={`status-select status-${getStatusClass(request.status)}`}
                      value={request.status}
                      onChange={(e) => updateServiceStatus(request.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {getStatusIcon(status)} {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="table-actions">
                    <div className="action-buttons">
                      <button className="action-btn view-btn" title="View Details">
                        👁️
                      </button>
                      <button className="action-btn edit-btn" title="Edit">
                        ✏️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ServiceRequestList;
