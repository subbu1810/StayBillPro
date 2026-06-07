import React, { useEffect, useState } from 'react';
import '../styles/TechniciansScreen.css';
import { techniciansAPI } from '../services/api';
import { usePopup } from './ui/PopupProvider';

const initialFormData = {
	name: '',
	email: '',
	mobile: '',
	skills: '',
	status: 'Available',
	areas: '',
};

export default function TechniciansScreen() {
	const popup = usePopup();
	const [technicians, setTechnicians] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const [selectedTech, setSelectedTech] = useState(null);
	const [showAddForm, setShowAddForm] = useState(false);
	const [editingTech, setEditingTech] = useState(null);
	const [formData, setFormData] = useState(initialFormData);

	const mapBackendToUI = (t) => {
		const skills = (t.specialization || '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);

		let status = 'Available';
		if (t.status === 'on_leave') status = 'On leave';
		else if (t.status === 'inactive') status = 'Busy';
		else status = 'Available';

		return {
			id: t.id,
			name: t.name || '',
			email: t.email || '',
			mobile: t.phone || '',
			skills,
			activeJobs: 0,
			todayJobs: 0,
			status,
			areas: t.notes || '',
		};
	};

	const mapUIToBackend = (fd) => {
		let status = 'active';
		if (fd.status === 'On leave') status = 'on_leave';
		else if (fd.status === 'Busy') status = 'inactive';
		else status = 'active';

		return {
			name: fd.name,
			email: fd.email,
			phone: fd.mobile,
			specialization: fd.skills,
			status,
			notes: fd.areas,
		};
	};

	const fetchTechnicians = async () => {
		try {
			setLoading(true);
			setError('');
			const data = await techniciansAPI.getAll();
			setTechnicians((data || []).map(mapBackendToUI));
		} catch (e) {
			console.error('Failed to fetch technicians:', e);
			setError('Failed to fetch technicians');
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => {
		setFormData(initialFormData);
		setEditingTech(null);
	};

	const closeForm = () => {
		setShowAddForm(false);
		resetForm();
	};

	const openAddForm = () => {
		setSelectedTech(null);
		setEditingTech(null);
		setFormData(initialFormData);
		setShowAddForm(true);
	};

	const openEditForm = (tech) => {
		if (!tech?.id) {
			popup.showError('Cannot edit technician: missing ID');
			return;
		}

		setSelectedTech(null);
		setEditingTech(tech);
		setFormData({
			name: tech.name || '',
			email: tech.email || '',
			mobile: tech.mobile || '',
			skills: (tech.skills || []).join(', '),
			status: tech.status || 'Available',
			areas: tech.areas || '',
		});
		setShowAddForm(true);
	};

	const handleDeleteTechnician = async (tech) => {
		if (!tech?.id) {
			popup.showError('Cannot delete technician: missing ID');
			return;
		}

		const ok = await popup.confirm({
			title: 'Delete Technician',
			message: `Delete technician "${tech.name}"?`,
			confirmText: 'Delete',
			cancelText: 'Cancel',
		});
		if (!ok) return;

		try {
			setLoading(true);
			setError('');
			await techniciansAPI.delete(tech.id);
			setTechnicians((prev) => prev.filter((t) => t.id !== tech.id));
			if (selectedTech?.id === tech.id) {
				setSelectedTech(null);
			}
		} catch (e) {
			console.error('Failed to delete technician:', e);
			popup.showError('Failed to delete technician');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTechnicians();
	}, []);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSaveTechnician = async (e) => {
		e.preventDefault();

		if (!formData.name || !formData.email || !formData.mobile || !formData.skills || !formData.areas) {
			popup.showInfo('Please fill in all fields');
			return;
		}

		try {
			setLoading(true);
			setError('');

			if (editingTech?.id) {
				const updated = await techniciansAPI.update(editingTech.id, mapUIToBackend(formData));
				const mapped = mapBackendToUI(updated);
				setTechnicians((prev) => prev.map((t) => (t.id === editingTech.id ? mapped : t)));
				if (selectedTech?.id === editingTech.id) {
					setSelectedTech(mapped);
				}
				closeForm();
				popup.showSuccess('Technician updated successfully!');
			} else {
				const created = await techniciansAPI.create(mapUIToBackend(formData));
				setTechnicians((prev) => [...prev, mapBackendToUI(created)]);
				closeForm();
				popup.showSuccess('Technician created successfully!');
			}
		} catch (e) {
			console.error('Failed to save technician:', e);
			popup.showError(editingTech?.id ? 'Failed to update technician' : 'Failed to create technician');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="technicians-screen">
			<div className="technicians-header">
				<h1>Technicians</h1>
				<button className="btn-primary" onClick={() => (showAddForm ? closeForm() : openAddForm())}>
					{showAddForm ? 'Cancel' : '+ Add Technician'}
				</button>
			</div>

			{showAddForm ? (
				<div className="add-technician-form">
					<h2>{editingTech ? 'Edit Technician' : 'Add New Technician'}</h2>
					<form className="technician-form" onSubmit={handleSaveTechnician}>
						<div className="form-group">
							<label>Name *</label>
							<input
								type="text"
								name="name"
								value={formData.name}
								onChange={handleInputChange}
								placeholder="Enter technician name"
								required
							/>
						</div>

						<div className="form-group">
							<label>Email *</label>
							<input
								type="email"
								name="email"
								value={formData.email}
								onChange={handleInputChange}
								placeholder="Enter email"
								required
							/>
						</div>

						<div className="form-group">
							<label>Mobile Number *</label>
							<input
								type="tel"
								maxLength="10"
								name="mobile"
								value={formData.mobile}
								onChange={handleInputChange}
								placeholder="Enter mobile number"
								required
							/>
						</div>

						<div className="form-group">
							<label>Skills * (comma-separated)</label>
							<input
								type="text"
								name="skills"
								value={formData.skills}
								onChange={handleInputChange}
								placeholder="e.g., AC, Fridge, TV"
								required
							/>
						</div>

						<div className="form-group">
							<label>Status</label>
							<select name="status" value={formData.status} onChange={handleInputChange}>
								<option value="Available">Available</option>
								<option value="Busy">Busy</option>
								<option value="On leave">On leave</option>
							</select>
						</div>

						<div className="form-group">
							<label>Service Areas * (comma-separated)</label>
							<input
								type="text"
								name="areas"
								value={formData.areas}
								onChange={handleInputChange}
								placeholder="e.g., Sector 1, 2, 3"
								required
							/>
						</div>

						<div className="form-actions">
							<button type="submit" className="btn-success" disabled={loading}>
								{editingTech ? 'Update Technician' : 'Add Technician'}
							</button>
							<button type="button" className="btn-secondary" onClick={closeForm}>Cancel</button>
						</div>
					</form>
				</div>
			) : !selectedTech ? (
				loading ? (
					<div style={{ padding: '16px' }}>Loading...</div>
				) : error ? (
					<div style={{ padding: '16px' }}>{error}</div>
				) : (
					<table className="technicians-table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Mobile</th>
								<th>Skills</th>
								<th>Active Jobs</th>
								<th>Today's Jobs</th>
								<th>Status</th>
								<th>Areas</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{technicians.map((t) => (
								<tr key={t.id}>
									<td>{t.name}</td>
									<td>{t.mobile}</td>
									<td>{t.skills.join(', ')}</td>
									<td>{t.activeJobs}</td>
									<td>{t.todayJobs}</td>
									<td><span className={`status-badge ${t.status.toLowerCase().replace(' ', '-')}`}>{t.status}</span></td>
									<td>{t.areas}</td>
									<td>
										<button className="btn-small" onClick={() => setSelectedTech(t)}>View</button>
										<button className="btn-small" onClick={() => openEditForm(t)}>Edit</button>
										<button
											className="btn-small"
											disabled={loading}
											onClick={() => handleDeleteTechnician(t)}
										>
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)
			) : (
				<div className="technician-detail">
					<button className="btn-secondary" onClick={() => setSelectedTech(null)}>{'<- Back'}</button>
					<h2>{selectedTech.name}</h2>
					<div className="detail-info">
						<div><strong>Mobile:</strong> {selectedTech.mobile}</div>
						<div><strong>Skills:</strong> {selectedTech.skills.join(', ')}</div>
						<div><strong>Status:</strong> {selectedTech.status}</div>
						<div><strong>Areas:</strong> {selectedTech.areas}</div>
					</div>
					<h3>Work History</h3>
					<p>Completed jobs and ratings would appear here.</p>
				</div>
			)}
		</div>
	);
}
