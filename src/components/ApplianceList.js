import React, { useState, useEffect } from 'react';
import { appliancesAPI } from '../services/api';
import { useService } from '../hooks/useService';

function ApplianceList() {
  const { selectedBranchId } = useService();
  const [appliances, setAppliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentId, setCurrentId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    model: '',
    notes: ''
  });

  useEffect(() => {
    fetchAppliances();
    // eslint-disable-next-line
  }, [selectedBranchId]);

  const fetchAppliances = async () => {
    try {
      setLoading(true);
      const data = await appliancesAPI.getAll({ branch_id: selectedBranchId });
      setAppliances(data || []);
    } catch (error) {
      console.error("Failed to fetch appliances:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (mode, appliance = null) => {
    setModalMode(mode);
    if (mode === 'edit' && appliance) {
      setCurrentId(appliance.id);
      setFormData({
        name: appliance.name || '',
        category: appliance.category || '',
        brand: appliance.brand || '',
        model: appliance.model || '',
        notes: appliance.notes || ''
      });
    } else {
      setCurrentId(null);
      setFormData({ name: '', category: '', brand: '', model: '', notes: '' });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, branch_id: selectedBranchId };
      if (modalMode === 'edit' && currentId) {
        await appliancesAPI.update(currentId, payload);
      } else {
        await appliancesAPI.create(payload);
      }
      setShowModal(false);
      fetchAppliances();
    } catch (error) {
      console.error("Failed to save appliance:", error);
      alert("Failed to save. Please try again.");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await appliancesAPI.delete(id);
      fetchAppliances();
    } catch (error) {
      console.error("Failed to delete appliance:", error);
      alert("Failed to delete.");
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading appliances...</div>;

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #eef2f6', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>Master Appliance List</h3>
        <button 
          onClick={() => handleOpenModal('add')}
          style={{ padding: '8px 16px', background: '#14b8a6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          ＋ Add Appliance Type
        </button>
      </div>

      <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
        {appliances.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>No appliances added yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {appliances.map(app => (
              <div key={app.id} style={{ padding: '16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📦</div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{app.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {app.category ? `Category: ${app.category}` : 'General Appliance'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleOpenModal('edit', app)}
                    style={{ padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}
                  >✏️</button>
                  <button 
                    onClick={() => handleDelete(app.id, app.name)}
                    style={{ padding: '8px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', borderRadius: '8px', cursor: 'pointer' }}
                  >🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '400px', maxWidth: '90%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem' }}>{modalMode === 'add' ? 'Add Appliance Type' : 'Edit Appliance Type'}</h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Name *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name} 
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., TV, Fan, AC"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Category</label>
                <input 
                  type="text" 
                  name="category"
                  value={formData.category} 
                  onChange={handleInputChange}
                  placeholder="e.g., Electronics, Home"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ flex: 1, padding: '10px', background: '#14b8a6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplianceList;
