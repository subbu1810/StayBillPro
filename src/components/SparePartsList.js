import React, { useState } from 'react';

function SparePartsList({ onAddClick }) {
  const [spareParts, setSpareParts] = useState([
    { id: 1, name: 'Compressor', category: 'AC', price: 5000 },
    { id: 2, name: 'Capacitor', category: 'Fridge', price: 800 },
    { id: 3, name: 'Display Panel', category: 'TV', price: 3000 },
  ]);

  const handleDelete = (id) => {
    setSpareParts(spareParts.filter(p => p.id !== id));
  };

  return (
    <div className="modern-card">
      <div className="card-header">
        <div className="header-icon">⚙️</div>
        <div>
          <h2>Spare Parts</h2>
          <p className="header-subtitle">{spareParts.length} part{spareParts.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="register-appliance-btn" onClick={onAddClick} title="Add Spare Part">
          <span>➕</span>
        </button>
      </div>

      <div className="service-table-container">
        <div className="table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Part Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {spareParts.map((part) => (
                <tr key={part.id}>
                  <td>{part.name}</td>
                  <td>{part.category}</td>
                  <td>₹{part.price}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn" title="Delete" onClick={() => handleDelete(part.id)}>
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

export default SparePartsList;
