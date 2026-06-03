import React, { useState, useEffect } from 'react';
import { jobsAPI } from '../services/api';
import '../styles/Tables.css';
import '../styles/Forms.css';

export default function InvoicingScreen() {
	const [invoices, setInvoices] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchInvoices = async () => {
			try {
				const allJobs = await jobsAPI.getAll();
				// Render only jobs that are completed as invoices
				const completedJobs = allJobs.filter(j => j.status === 'completed');
				setInvoices(completedJobs);
			} catch (error) {
				console.error('Failed fetching invoicing data', error);
			} finally {
				setLoading(false);
			}
		};
		fetchInvoices();
	}, []);

	return (
		<div className="admin-screen fade-in">
			<div className="screen-header">
				<div>
					<h2 className="section-title">
						<span className="title-icon">🧾</span> Invoices & Estimates
					</h2>
					<p className="dashboard-subtitle">Generate final repair bills and track payment statuses.</p>
				</div>
			</div>

			<div className="table-wrapper" style={{ marginTop: '24px' }}>
				{loading ? (
					<p style={{ padding: '20px' }}>Loading invoices...</p>
				) : invoices.length === 0 ? (
					<div className="empty-state-card" style={{ padding: '40px' }}>
						<div className="icon">💳</div>
						<h3>No Generated Invoices</h3>
						<p>Complete a service job to automatically generate an invoice here.</p>
					</div>
				) : (
					<table className="modern-table">
						<thead>
							<tr>
								<th>Invoice #</th>
								<th>Related Job</th>
								<th>Amount</th>
								<th>Status</th>
								<th>Date Generated</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{invoices.map((inv) => (
								<tr key={inv.id}>
									<td style={{ fontWeight: 'bold' }}>INV-{inv.id.toString().padStart(4, '0')}</td>
									<td className="table-id">{inv.job_number}</td>
									<td style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
										₹{inv.total_cost || (inv.labor_cost + (inv.parts_cost || 0)) || 'Pending'}
									</td>
									<td>
										<span className="status-badge completed">Paid</span>
									</td>
									<td>{new Date(inv.updated_at || inv.created_at).toLocaleDateString()}</td>
									<td>
										<button className="action-btn primary" title="Download PDF" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
											⬇️ PDF
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
