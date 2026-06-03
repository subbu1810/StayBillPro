import React, { useState } from 'react';

function ServicesList({ onAddClick }) {
  const [services, setServices] = useState([
    { id: 1, name: 'TV', icon: '📺' },
    { id: 2, name: 'Fridge', icon: '🧊' },
    { id: 3, name: 'AC', icon: '❄️' },
    { id: 4, name: 'Washing Machine', icon: '🌀' },
    { id: 5, name: 'Microwave', icon: '📻' },
  ]);

  const handleDelete = (id) => {
    setServices(services.filter(s => s.id !== id));
  };

  return (
    <div className="modern-card">
      <div className="card-header">
        <div className="header-icon">🔧</div>
        <div>
          <h2>Services</h2>
          <p className="header-subtitle">{services.length} service type{services.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="register-appliance-btn" onClick={onAddClick} title="Add Service">
          <span>➕</span>
        </button>
      </div>

      <div className="service-table-container">
        <div className="table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Icon</th>
                <th>Service Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td style={{ fontSize: '1.5rem' }}>{service.icon}</td>
                  <td>{service.name}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn" title="Delete" onClick={() => handleDelete(service.id)}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ServicesList;
