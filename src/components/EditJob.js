import React, { useState, useEffect } from 'react';
import '../styles/NewJob.css';
import { useService } from '../hooks/useService';
import { usePopup } from './ui/PopupProvider';

export default function EditJob({ jobId, onBack, onSuccess }) {
	const popup = usePopup();
	const { jobs, technicians, allSpares, updateJob, jobsAPI } = useService();
	
	const [editingJob, setEditingJob] = useState(null);
	const [isFetchingJob, setIsFetchingJob] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [repeatJobs, setRepeatJobs] = useState(null);
	
	const [editFormData, setEditFormData] = useState({
		status: 'pending',
		priority: 'medium',
		scheduledDate: '',
		problem: '',
		technician: '',
		customerName: '',
		customerMobile: '',
		customerEmail: '',
		address: '',
		category: '',
		brand: '',
		model: '',
		serial: '',
		purchaseDate: '',
		warranty: 'no',
		serviceType: 'repair',
		laborCost: '',
		partsCost: '',
		serviceCharge: '',
	});

	const statusOptions = [
		{ label: 'New', value: 'pending' },
		{ label: 'Scheduled', value: 'scheduled' },
		{ label: 'In Progress', value: 'in_progress' },
		{ label: 'Completed', value: 'completed' },
		{ label: 'Cancelled', value: 'cancelled' },
		{ label: 'On Hold', value: 'on_hold' },
	];

	const priorityOptions = [
		{ label: 'Low', value: 'low' },
		{ label: 'Medium', value: 'medium' },
		{ label: 'High', value: 'high' },
		{ label: 'Urgent', value: 'urgent' },
	];
	
	const normalizeStatus = (value) => {
		const raw = (value || '').toLowerCase().trim();
		if (raw === 'new') return 'pending';
		if (raw === 'in progress') return 'in_progress';
		if (raw === 'on hold') return 'on_hold';
		return raw.replace(/\s+/g, '_');
	};

	useEffect(() => {
		if (!jobId) return;
		
		const fetchJob = async () => {
			setIsFetchingJob(true);
			try {
				const fullJob = await jobsAPI.get(jobId);
				setEditingJob(fullJob);
				
				const sr = fullJob.service_request || {};
				const appliance = sr.appliance || {};
				
				const formData = {
					status: fullJob.status || 'pending',
					priority: fullJob.priority || 'medium',
					scheduledDate: fullJob.scheduled_date ? String(fullJob.scheduled_date).slice(0, 10) : '',
					problem: fullJob.job_description || sr.issue_description || '',
					technician: fullJob.technician?.name || sr.technician_name || '',
					customerName: appliance.customer_name || '',
					customerMobile: appliance.phone || appliance.mobile || '',
					customerEmail: appliance.email || '',
					address: fullJob.location || appliance.address || '',
					category: appliance.category || '',
					brand: appliance.brand || '',
					model: appliance.model || '',
					serial: appliance.serial_number || '',
					purchaseDate: appliance.purchase_date ? String(appliance.purchase_date).slice(0, 10) : '',
					warranty: appliance.warranty_status || 'no',
					serviceType: sr.service_type || 'repair',
					laborCost: fullJob.labor_cost || '',
					partsCost: fullJob.parts_cost || '',
					serviceCharge: sr.cost || '',
				};
				setEditFormData(formData);
				
				// Check for repeat jobs
				if (formData.customerMobile) {
					const thirtyDaysAgo = new Date();
					thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
					const previousJobs = jobs.filter(j => 
						String(j.id) !== String(jobId) && 
						j.customerMobile === formData.customerMobile &&
						normalizeStatus(j.status) === 'completed' &&
						new Date(j.createdDate) >= thirtyDaysAgo
					);
					if (previousJobs.length > 0) {
						setRepeatJobs(previousJobs);
					}
				}
			} catch (error) {
				console.error('Failed to fetch job details:', error);
				popup.showError('Failed to load job details');
			} finally {
				setIsFetchingJob(false);
			}
		};
		
		fetchJob();
	}, [jobId, jobsAPI, popup, jobs]);

	const handleSaveEdit = async () => {
		if (!editingJob) return;
		setIsSaving(true);
		
		const totalCost = (Number(editFormData.laborCost || 0) + Number(editFormData.partsCost || 0) + Number(editFormData.serviceCharge || 0));

		const jobPayload = {
			status: editFormData.status,
			priority: editFormData.priority,
			scheduled_date: editFormData.scheduledDate ? `${editFormData.scheduledDate}T09:00:00` : undefined,
			job_description: editFormData.problem,
			labor_cost: editFormData.laborCost ? Number(editFormData.laborCost) : null,
			parts_cost: editFormData.partsCost ? Number(editFormData.partsCost) : null,
			total_cost: totalCost,
			work_done: editFormData.problem,
			// Include appliance/customer updates
			customerName: editFormData.customerName,
			customerMobile: editFormData.customerMobile,
			address: editFormData.address,
			model: editFormData.model,
			serial: editFormData.serial,
			warranty: editFormData.warranty
		};

		try {
			await updateJob(editingJob.id, jobPayload);
			popup.showSuccess('Job updated successfully');
			onSuccess();
		} catch (error) {
			popup.showError(error.message || 'Failed to update job');
		} finally {
			setIsSaving(false);
		}
	};



	if (isFetchingJob) {
		return <div className="nj-loading-container" style={{ padding: '40px', textAlign: 'center' }}>Loading job details...</div>;
	}

	if (!editingJob) {
		return <div className="nj-loading-container" style={{ padding: '40px', textAlign: 'center' }}>Job not found</div>;
	}

	return (
		<div className="new-job">
			<div className="new-job-header">
				<div className="header-titles">
					<h1>📋 Edit Ticket: {editingJob.ticket_no || editingJob.ticketNo}</h1>
					<p>Modify existing service job details</p>
				</div>
				<button type="button" className="nj-btn-close" onClick={onBack}>✕</button>
			</div>

			{repeatJobs && (
				<div className="repeat-job-warning alert-card" style={{ margin: '0 30px 20px' }}>
					<div className="alert-content">
						<span className="alert-icon">⚠️</span>
						<div>
							<p className="alert-title">Potential Repeat Job / Service Warranty</p>
							<p className="alert-desc">This customer had <strong>{repeatJobs.length} completed repair(s)</strong> in the last 30 days. Check previous work logs for warranty eligibility.</p>
						</div>
					</div>
				</div>
			)}

			<form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="new-job-layout">
				{/* Left Column */}
				<div className="job-column left-column">
					
					{/* Section A: Customer Details */}
					<div className="nj-form-card">
						<div className="nj-card-header">
							<h2>👤 Customer Details</h2>
						</div>
						<div className="card-content">
							<div className="nj-form-row">
								<label>Customer Name</label>
								<input type="text" value={editFormData.customerName} onChange={(e) => setEditFormData({...editFormData, customerName: e.target.value})} placeholder="Customer name" />
							</div>
							<div className="nj-form-row">
								<label>Mobile</label>
								<input type="text" maxLength="10" value={editFormData.customerMobile} onChange={(e) => setEditFormData({...editFormData, customerMobile: e.target.value})} placeholder="10 digit mobile" />
							</div>
							<div className="nj-form-row">
								<label>Address</label>
								<textarea rows={2} value={editFormData.address} onChange={(e) => setEditFormData({...editFormData, address: e.target.value})} placeholder="Customer address" />
							</div>
						</div>
					</div>

					{/* Section B: Job Status & Assignment */}
					<div className="nj-form-card">
						<div className="nj-card-header">
							<h2>⚡ Job Status & Assignment</h2>
						</div>
						<div className="card-content">
							<div className="nj-form-row-pair">
								<div className="nj-form-row">
									<label>Status</label>
									<select value={editFormData.status} onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}>
										{statusOptions.map((option) => (
											<option key={option.value} value={option.value}>{option.label}</option>
										))}
									</select>
								</div>
								<div className="nj-form-row">
									<label>Priority</label>
									<select value={editFormData.priority} onChange={(e) => setEditFormData({...editFormData, priority: e.target.value})}>
										{priorityOptions.map((option) => (
											<option key={option.value} value={option.value}>{option.label}</option>
										))}
									</select>
								</div>
							</div>
							<div className="nj-form-row-pair">
								<div className="nj-form-row">
									<label>Due Date</label>
									<input type="date" value={editFormData.scheduledDate} onChange={(e) => setEditFormData({...editFormData, scheduledDate: e.target.value})} />
								</div>
								<div className="nj-form-row">
									<label>Assign Technician</label>
									<select value={editFormData.technician} onChange={(e) => setEditFormData({...editFormData, technician: e.target.value})}>
										<option value="">Unassigned</option>
										{technicians.map(t => (
											<option key={t.id} value={t.name}>{t.name}</option>
										))}
									</select>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Right Column */}
				<div className="job-column right-column">
					{/* Section C: Product Details */}
					<div className="nj-form-card">
						<div className="nj-card-header">
							<h2>📦 Product Details</h2>
						</div>
						<div className="card-content">
							<div className="nj-form-row">
								<label>Brand & Category</label>
								<input type="text" value={`${editFormData.brand} ${editFormData.category}`} disabled />
							</div>
							<div className="nj-form-row-pair">
								<div className="nj-form-row">
									<label>Model</label>
									<input type="text" value={editFormData.model} onChange={(e) => setEditFormData({...editFormData, model: e.target.value})} />
								</div>
								<div className="nj-form-row">
									<label>Serial Number</label>
									<input type="text" value={editFormData.serial} onChange={(e) => setEditFormData({...editFormData, serial: e.target.value})} />
								</div>
							</div>
							<div className="nj-form-row">
								<label>Warranty</label>
								<select value={editFormData.warranty} onChange={(e) => setEditFormData({...editFormData, warranty: e.target.value})}>
									<option value="yes">In Warranty</option>
									<option value="no">Out of Warranty</option>
									<option value="expired">Expired</option>
								</select>
							</div>
						</div>
					</div>

					{/* Section D: Billing & Invoicing */}
					<div className="nj-form-card">
						<div className="nj-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<h2>💰 Billing & Invoicing</h2>
							<div className="billing-total" style={{ background: '#d1fae5', color: '#059669', padding: '4px 12px', borderRadius: '16px', fontWeight: 'bold', fontSize: '0.9rem' }}>
								Total: ₹ {(Number(editFormData.laborCost || 0) + Number(editFormData.partsCost || 0) + Number(editFormData.serviceCharge || 0))}
							</div>
						</div>
						<div className="card-content">
							<div className="nj-form-row-pair">
								<div className="nj-form-row">
									<label>Service Charge (₹)</label>
									<input type="number" value={editFormData.serviceCharge} onChange={(e) => setEditFormData({...editFormData, serviceCharge: e.target.value})} />
								</div>
								<div className="nj-form-row">
									<label>Labor Cost (₹)</label>
									<input type="number" value={editFormData.laborCost} onChange={(e) => setEditFormData({...editFormData, laborCost: e.target.value})} />
								</div>
							</div>
							
							<div className="nj-form-row" style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
								<label>Add Spares/Equipments</label>
								<select onChange={(e) => {
									const spare = allSpares.find(s => s.id === Number(e.target.value));
									if (spare) {
										setEditFormData({
											...editFormData,
											partsCost: Number(editFormData.partsCost || 0) + Number(spare.price)
										});
									}
								}}>
									<option value="">Select Spare Part...</option>
									{allSpares.map(s => (
										<option key={s.id} value={s.id}>{s.name} - ₹{s.price}</option>
									))}
								</select>
							</div>

							<div className="nj-form-row">
								<label>Adjusted Parts Cost (₹)</label>
								<input type="number" value={editFormData.partsCost} onChange={(e) => setEditFormData({...editFormData, partsCost: e.target.value})} />
							</div>
							<div className="nj-form-row">
								<label>Work Done / Problem Description</label>
								<textarea rows={2} value={editFormData.problem} onChange={(e) => setEditFormData({...editFormData, problem: e.target.value})} />
							</div>
						</div>
					</div>

					{/* Form Actions */}
					<div className="form-actions sticky-actions">
						<button type="button" className="btn-secondary" onClick={onBack} disabled={isSaving}>
							Cancel
						</button>
						<button type="submit" className="btn-primary" disabled={isSaving || isFetchingJob}>
							{isSaving ? 'Saving...' : 'Save Changes'}
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}
