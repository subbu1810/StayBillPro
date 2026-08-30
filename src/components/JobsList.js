import React, { useMemo, useState } from 'react';
import '../styles/JobsList.css';
import { useService } from '../hooks/useService';
import { usePopup } from './ui/PopupProvider';

export default function JobsList({ onViewJob, onCreateJob, onEditJob }) {
	const popup = usePopup();
	const { jobs, jobsLoaded, technicians, availableProducts, allSpares, updateJob, deleteJob, jobsAPI } = useService();
	const [filters, setFilters] = useState({ status: 'all', product: 'all', technician: 'all', search: '' });
	const [pageSize, setPageSize] = useState(10);
	const [currentPage, setCurrentPage] = useState(1);

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

	const totalRecords = filteredJobs.length;
	const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
	const safePage = Math.min(currentPage, totalPages);
	const pagedJobs = filteredJobs.slice((safePage - 1) * pageSize, safePage * pageSize);
	const startRecord = totalRecords === 0 ? 0 : (safePage - 1) * pageSize + 1;
	const endRecord = Math.min(safePage * pageSize, totalRecords);

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

	const handleDelete = async (jobId) => {
		const ok = await popup.confirm('Are you sure you want to delete this job?');
		if (!ok) return;
		try {
			await deleteJob(jobId);
		} catch (error) {
			popup.showError(error.message || 'Failed to delete job');
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
							<th style={{width:'40px', textAlign:'center'}}>#</th>
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
						{pagedJobs.map((job, index) => (
							<tr key={job.id}>
								<td style={{textAlign:'center', color:'#9ca3af', fontSize:'0.78rem'}}>{(safePage - 1) * pageSize + index + 1}</td>
								<td className="ticket-link" onClick={() => onViewJob(job.id)}>{job.ticketNo}</td>
								<td>{job.createdDate}</td>
								<td>{job.customer}</td>
								<td>{job.product}</td>
								<td>{job.problem}</td>
								<td><span className={`status-badge ${job.status.toLowerCase().replace(' ', '-')}`}>{job.status}</span></td>
								<td>{job.technician}</td>
								<td>{job.dueDate}</td>
								<td>
									<div className="jl-actions">
										<button className="jl-icon-btn" title="View" onClick={() => onViewJob(job.id)}>
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
												<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
												<circle cx="12" cy="12" r="3"/>
											</svg>
										</button>
										<button className="jl-icon-btn edit" title="Edit" onClick={() => onEditJob(job.id)}>
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
												<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
												<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
											</svg>
										</button>
										<button className="jl-icon-btn delete" title="Delete" onClick={() => handleDelete(job.id)}>
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
												<polyline points="3 6 5 6 21 6"/>
												<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
												<path d="M10 11v6M14 11v6"/>
												<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
											</svg>
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{/* Pagination Footer */}
				<div className="jl-pagination">
					<div className="jl-page-info">
						Showing <strong>{startRecord}–{endRecord}</strong> of <strong>{totalRecords}</strong> records
					</div>
					<div className="jl-page-controls">
						<span className="jl-page-label">Rows:</span>
						{[10, 25, 50, 100].map(n => (
							<button
								key={n}
								className={`jl-page-size-btn${pageSize === n ? ' active' : ''}`}
								onClick={() => { setPageSize(n); setCurrentPage(1); }}
							>{n}</button>
						))}
						<div className="jl-page-nav">
							<button className="jl-nav-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>‹</button>
							<span className="jl-page-num">{safePage} / {totalPages}</span>
							<button className="jl-nav-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>›</button>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
