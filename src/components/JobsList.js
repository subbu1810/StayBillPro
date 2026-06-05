import React, { useMemo, useState } from 'react';
import '../styles/JobsList.css';
import { useService } from '../hooks/useService';

export default function JobsList({ onViewJob, onCreateJob }) {
	const { jobs, jobsLoaded, technicians, availableProducts, allSpares, updateJob, deleteJob, jobsAPI } = useService();
	const [filters, setFilters] = useState({ status: 'all', product: 'all', technician: 'all', search: '' });
	const [editingJob, setEditingJob] = useState(null);
	const [editFormData, setEditFormData] = useState({
		status: 'pending',
		priority: 'medium',
		scheduledDate: '',
		problem: '',
		technician: '',
		// Customer fields
		customerName: '',
		customerMobile: '',
		customerEmail: '',
		address: '',
		// Product fields
		category: '',
		brand: '',
		model: '',
		serial: '',
		purchaseDate: '',
		warranty: 'no',
		// Service fields
		serviceType: 'repair',
		laborCost: '',
		partsCost: '',
		serviceCharge: '',
		selectedSpares: [], // Array of {id, name, price, quantity}
	});
	const [isFetchingJob, setIsFetchingJob] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const normalizeStatus = (value) => {
		const raw = (value || '').toLowerCase().trim();
		if (raw === 'new') return 'pending';
		if (raw === 'in progress') return 'in_progress';
		if (raw === 'on hold') return 'on_hold';
		return raw.replace(/\s+/g, '_');
	};

	const filterProducts = useMemo(() => {
		const productNamesFromJobs = (jobs || []).map((job) => (job.product || '').trim()).filter(Boolean);
		const productNamesFromCatalog = (availableProducts || [])
			.map((p) => [p.brand, p.name || p.model || p.category].filter(Boolean).join(' - ').trim())
			.filter(Boolean);
		return [...new Set([...productNamesFromJobs, ...productNamesFromCatalog])]
			.sort((a, b) => a.localeCompare(b));
	}, [jobs, availableProducts]);

	const filterTechnicians = useMemo(() => {
		const techFromJobs = (jobs || []).map((job) => (job.technician || '').trim()).filter(Boolean);
		const techFromApi = (technicians || []).map((t) => (t.name || '').trim()).filter(Boolean);
		return [...new Set([...techFromJobs, ...techFromApi])]
			.sort((a, b) => a.localeCompare(b));
	}, [jobs, technicians]);

	const filteredJobs = useMemo(() => {
		const search = (filters.search || '').trim().toLowerCase();
		return (jobs || []).filter((job) => {
			const status = normalizeStatus(job.status);
			const product = (job.product || '').toLowerCase();
			const technician = (job.technician || '').toLowerCase();
			const customer = (job.customer || '').toLowerCase();
			const ticket = (job.ticketNo || '').toLowerCase();
			const mobile = (job.customerMobile || '').toLowerCase();

			if (filters.status !== 'all' && status !== filters.status) return false;
			if (filters.product !== 'all' && product !== filters.product) return false;
			if (filters.technician !== 'all' && technician !== filters.technician) return false;
			if (search && !ticket.includes(search) && !customer.includes(search) && !mobile.includes(search) && !product.includes(search)) return false;
			return true;
		});
	}, [jobs, filters]);

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

	const openEditModal = async (jobSnippet) => {
		setEditingJob(jobSnippet);
		setIsFetchingJob(true);
		try {
			const fullJob = await jobsAPI.get(jobSnippet.id);
			const sr = fullJob.service_request || {};
			const appliance = sr.appliance || {};
			
			setEditFormData({
				status: fullJob.status || 'pending',
				priority: fullJob.priority || 'medium',
				scheduledDate: fullJob.scheduled_date ? String(fullJob.scheduled_date).slice(0, 10) : '',
				problem: fullJob.job_description || sr.issue_description || '',
				technician: fullJob.technician?.name || sr.technician_name || '',
				customerName: appliance.customer_name || '',
				customerMobile: appliance.phone || appliance.mobile || '',
				customerEmail: appliance.email || '',
				address: appliance.location || appliance.address || '',
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
			});
		} catch (error) {
			console.error('Failed to fetch job details:', error);
			// Fallback to snippet data if full fetch fails
			setEditFormData(prev => ({
				...prev,
				status: statusOptions.find((option) => option.label === jobSnippet.status)?.value || 'pending',
				priority: priorityOptions.find((option) => option.label.toLowerCase() === jobSnippet.priority)?.value || 'medium',
				scheduledDate: jobSnippet.dueDate,
				problem: jobSnippet.problem || '',
				customerName: jobSnippet.customer,
				customerMobile: jobSnippet.customerMobile,
			}));
		} finally {
			setIsFetchingJob(false);
		}
	};

	const checkRepeatJob = () => {
		if (!editFormData.customerMobile) return null;
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const previousJobs = jobs.filter(j => 
			j.id !== editingJob?.id && 
			j.customerMobile === editFormData.customerMobile &&
			normalizeStatus(j.status) === 'completed' &&
			new Date(j.createdDate) >= thirtyDaysAgo
		);

		return previousJobs.length > 0 ? previousJobs : null;
	};

	const repeatJobs = editingJob ? checkRepeatJob() : null;

	const closeEditModal = () => {
		setEditingJob(null);
	};

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
			work_done: editFormData.problem // Overloaded for now
		};

		try {
			await updateJob(editingJob.id, jobPayload);
			setEditingJob(null);
		} catch (error) {
			alert(error.message || 'Failed to update job');
		} finally {
			setIsSaving(false);
		}
	};

	const printInvoice = () => {
		const total = (Number(editFormData.laborCost || 0) + Number(editFormData.partsCost || 0) + Number(editFormData.serviceCharge || 0));
		const printWindow = window.open('', '_blank');
		printWindow.document.write(`
			<html>
				<head>
					<title>Invoice - ${editingJob.ticketNo}</title>
					<style>
						body { font-family: sans-serif; padding: 40px; color: #333; }
						.header { display: flex; justify-content: space-between; border-bottom: 2px solid #14b8a6; padding-bottom: 20px; }
						.invoice-info { text-align: right; }
						.section { margin-top: 30px; }
						table { width: 100%; border-collapse: collapse; margin-top: 10px; }
						th, td { border: 1px solid #eee; padding: 12px; text-align: left; }
						th { background: #fafafa; }
						.total { text-align: right; font-size: 1.5rem; font-weight: bold; margin-top: 30px; }
						.footer { margin-top: 50px; font-size: 0.8rem; color: #999; text-align: center; }
					</style>
				</head>
				<body>
					<div class="header">
						<div>
							<h1>SERVICE INVOICE</h1>
							<p><strong>Service Manager Pro</strong><br/>123 Tech Avenue, Silicon Valley</p>
						</div>
						<div class="invoice-info">
							<p><strong>Ticket No:</strong> ${editingJob.ticketNo}</p>
							<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
						</div>
					</div>
					
					<div class="section">
						<h3>Customer Details</h3>
						<p>${editFormData.customerName}<br/>${editFormData.customerMobile}<br/>${editFormData.address}</p>
					</div>

					<div class="section">
						<h3>Job Details</h3>
						<table>
							<thead>
								<tr>
									<th>Description</th>
									<th>Amount (₹)</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>Service Charge (${editFormData.serviceType})</td>
									<td>${editFormData.serviceCharge || 0}</td>
								</tr>
								<tr>
									<td>Labor Charges</td>
									<td>${editFormData.laborCost || 0}</td>
								</tr>
								<tr>
									<td>Parts/Spares Total</td>
									<td>${editFormData.partsCost || 0}</td>
								</tr>
							</tbody>
						</table>
					</div>

					<div class="total">Total Amount: ₹ ${total}</div>
					
					<div class="footer">Thank you for choosing our service. All repairs carry a 30-day warranty.</div>
					<script>window.print();</script>
				</body>
			</html>
		`);
		printWindow.document.close();
	};

	const handleDelete = async (jobId) => {
		if (!window.confirm('Are you sure you want to delete this job?')) return;
		try {
			await deleteJob(jobId);
		} catch (error) {
			alert(error.message || 'Failed to delete job');
		}
	};

	return (
		<div className="jobs-list">
			{/* Filters */}
			<section className="filters-bar">
				<div className="filters-group">
					<select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
						<option value="all">Status: All</option>
						<option value="pending">New</option>
						<option value="scheduled">Scheduled</option>
						<option value="in_progress">In Progress</option>
						<option value="completed">Completed</option>
						<option value="cancelled">Cancelled</option>
						<option value="on_hold">On Hold</option>
					</select>

					<select value={filters.product} onChange={(e) => setFilters({ ...filters, product: e.target.value })}>
						<option value="all">Product: All</option>
						{filterProducts.map((product) => (
							<option key={product} value={product.toLowerCase()}>
								{product}
							</option>
						))}
					</select>

					<select value={filters.technician} onChange={(e) => setFilters({ ...filters, technician: e.target.value })}>
						<option value="all">Technician: All</option>
						{filterTechnicians.map((tech) => (
							<option key={tech} value={tech.toLowerCase()}>
								{tech}
							</option>
						))}
					</select>

					<input
						type="text"
						placeholder="Search by Ticket / Mobile / Name"
						value={filters.search}
						onChange={(e) => setFilters({ ...filters, search: e.target.value })}
					/>
				</div>

				<button className="btn-primary" onClick={onCreateJob}>+ New Job</button>
			</section>

			{/* Jobs Table */}
			<section className="jobs-table-section">
				{!jobsLoaded && (
					<div className="nj-help-text">Loading jobs...</div>
				)}
				<table className="jobs-table">
					<thead>
						<tr>
							<th><input type="checkbox" /></th>
							<th>Ticket No</th>
							<th>Created Date</th>
							<th>Customer Name</th>
							<th>Product</th>
							<th>Problem</th>
							<th>Status</th>
							<th>Assigned Technician</th>
							<th>Due Date</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{filteredJobs.map((job) => (
							<tr key={job.id}>
								<td><input type="checkbox" /></td>
								<td className="ticket-link" onClick={() => onViewJob(job.id)}>{job.ticketNo}</td>
								<td>{job.createdDate}</td>
								<td>{job.customer}</td>
								<td>{job.product}</td>
								<td>{job.problem}</td>
								<td><span className={`status-badge ${job.status.toLowerCase().replace(' ', '-')}`}>{job.status}</span></td>
								<td>{job.technician}</td>
								<td>{job.dueDate}</td>
								<td>
									<button className="btn-small" onClick={() => onViewJob(job.id)}>View</button>
									<button className="btn-small" onClick={() => openEditModal(job)}>Edit</button>
									<button className="btn-small danger" onClick={() => handleDelete(job.id)}>Delete</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>
			{editingJob && (
				<div className="jobs-modal-backdrop">
					<div className="jobs-modal">
						<div className="jobs-modal-header">
							<h3>Edit Ticket: {editingJob.ticketNo}</h3>
							<button className="btn-close" onClick={closeEditModal}>✕</button>
						</div>

						<div className="jobs-modal-body">
							{isFetchingJob ? (
								<div className="nj-loading-container">Loading job details...</div>
							) : (
								<>
									{repeatJobs && (
										<div className="repeat-job-warning alert-card">
											<div className="alert-content">
												<span className="alert-icon">⚠️</span>
												<div>
													<p className="alert-title">Potential Repeat Job / Service Warranty</p>
													<p className="alert-desc">This customer had <strong>{repeatJobs.length} completed repair(s)</strong> in the last 30 days. Check previous work logs for warranty eligibility.</p>
												</div>
											</div>
										</div>
									)}

									{/* Customer Section */}
									<div className="modal-section">
										<h4>👤 Customer Details</h4>
										<div className="jobs-modal-row">
											<label>Customer Name</label>
											<input type="text" value={editFormData.customerName} onChange={(e) => setEditFormData({...editFormData, customerName: e.target.value})} />
										</div>
										<div className="jobs-modal-row">
											<label>Mobile</label>
											<input type="text" value={editFormData.customerMobile} onChange={(e) => setEditFormData({...editFormData, customerMobile: e.target.value})} />
										</div>
										<div className="jobs-modal-row">
											<label>Address</label>
											<textarea rows={2} value={editFormData.address} onChange={(e) => setEditFormData({...editFormData, address: e.target.value})} />
										</div>
									</div>

									{/* Product Section */}
									<div className="modal-section">
										<h4>📦 Product Details</h4>
										<div className="jobs-modal-row">
											<label>Brand & Category</label>
											<input type="text" value={`${editFormData.brand} ${editFormData.category}`} disabled />
										</div>
										<div className="jobs-modal-row">
											<label>Model</label>
											<input type="text" value={editFormData.model} onChange={(e) => setEditFormData({...editFormData, model: e.target.value})} />
										</div>
										<div className="jobs-modal-row">
											<label>Serial Number</label>
											<input type="text" value={editFormData.serial} onChange={(e) => setEditFormData({...editFormData, serial: e.target.value})} />
										</div>
										<div className="jobs-modal-row">
											<label>Warranty</label>
											<select value={editFormData.warranty} onChange={(e) => setEditFormData({...editFormData, warranty: e.target.value})}>
												<option value="yes">In Warranty</option>
												<option value="no">Out of Warranty</option>
												<option value="expired">Expired</option>
											</select>
										</div>
									</div>

									{/* Job Status Section */}
									<div className="modal-section">
										<h4>⚡ Job Status & Assignment</h4>
										<div className="jobs-modal-row">
											<label>Status</label>
											<select value={editFormData.status} onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}>
												{statusOptions.map((option) => (
													<option key={option.value} value={option.value}>{option.label}</option>
												))}
											</select>
										</div>
										<div className="jobs-modal-row">
											<label>Priority</label>
											<select value={editFormData.priority} onChange={(e) => setEditFormData({...editFormData, priority: e.target.value})}>
												{priorityOptions.map((option) => (
													<option key={option.value} value={option.value}>{option.label}</option>
												))}
											</select>
										</div>
										<div className="jobs-modal-row">
											<label>Due Date</label>
											<input type="date" value={editFormData.scheduledDate} onChange={(e) => setEditFormData({...editFormData, scheduledDate: e.target.value})} />
										</div>
										<div className="jobs-modal-row">
											<label>Technician</label>
											<select value={editFormData.technician} onChange={(e) => setEditFormData({...editFormData, technician: e.target.value})}>
												<option value="">Unassigned</option>
												{technicians.map(t => (
													<option key={t.id} value={t.name}>{t.name}</option>
												))}
											</select>
										</div>
									</div>

									{/* Billing Section */}
									<div className="modal-section">
										<div className="billing-header">
											<h4>💰 Billing & Invoicing</h4>
											<div className="billing-total">
												Total: ₹ {(Number(editFormData.laborCost || 0) + Number(editFormData.partsCost || 0) + Number(editFormData.serviceCharge || 0))}
											</div>
										</div>
										<div className="jobs-modal-row">
											<label>Service Charge (₹)</label>
											<input type="number" value={editFormData.serviceCharge} onChange={(e) => setEditFormData({...editFormData, serviceCharge: e.target.value})} />
										</div>
										<div className="jobs-modal-row">
											<label>Labor Cost (₹)</label>
											<input type="number" value={editFormData.laborCost} onChange={(e) => setEditFormData({...editFormData, laborCost: e.target.value})} />
										</div>
										
										<div className="spares-section">
											<label>Add Spares/Equipments</label>
											<div className="spares-selector">
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
										</div>

										<div className="jobs-modal-row">
											<label>Adjusted Parts Cost (₹)</label>
											<input type="number" value={editFormData.partsCost} onChange={(e) => setEditFormData({...editFormData, partsCost: e.target.value})} />
										</div>
										<div className="jobs-modal-row">
											<label>Work Done / Problem Description</label>
											<textarea rows={3} value={editFormData.problem} onChange={(e) => setEditFormData({...editFormData, problem: e.target.value})} />
										</div>
									</div>
								</>
							)}
						</div>

						<div className="jobs-modal-actions">
							<button className="btn-secondary" onClick={printInvoice} disabled={isSaving || isFetchingJob}>🖨 Print Invoice</button>
							<div className="spacer" style={{ flex: 1 }}></div>
							<button className="btn-secondary" onClick={closeEditModal} disabled={isSaving}>Cancel</button>
							<button className="btn-primary" onClick={handleSaveEdit} disabled={isSaving || isFetchingJob}>
								{isSaving ? 'Saving...' : 'Save Changes'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
