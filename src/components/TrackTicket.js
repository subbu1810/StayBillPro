import React, { useState } from 'react';
import '../styles/TrackTicket.css';
import { jobsAPI } from '../services/api';

export default function TrackTicket({ onBack }) {
	const [ticketNo, setTicketNo] = useState('');
	const [loading, setLoading] = useState(false);
	const [jobDetails, setJobDetails] = useState(null);
	const [error, setError] = useState('');

	const handleSearch = async (e) => {
		e.preventDefault();
		if (!ticketNo.trim()) return;

		try {
			setLoading(true);
			setError('');
			setJobDetails(null);
			// Assume jobsAPI.getAll or a specific search endpoint will resolve this
			const allJobs = await jobsAPI.getAll();
			const foundJob = allJobs.find(
				(j) => j.job_number === ticketNo || j.jobNumber === ticketNo || j.id.toString() === ticketNo
			);

			if (foundJob) {
				setJobDetails(foundJob);
			} else {
				setError('We could not find a service request matching that ID.');
			}
		} catch (err) {
			console.error(err);
			setError('Could not connect to service portal. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="track-ticket-page">
			<div className="track-navbar">
				<div className="track-brand" onClick={onBack}>
					<span className="brand-logo">🔧</span>
					<h1>Service Manager</h1>
				</div>
				<button className="back-btn" onClick={onBack}>Back to Home</button>
			</div>

			<main className="track-main-container fade-in">
				<div className="track-hero">
					<h2>Track Your Repair Status</h2>
					<p>Enter your Job ID or Ticket Number to see realtime updates on your appliance.</p>

					<form className="track-search-card" onSubmit={handleSearch}>
						<input
							type="text"
							placeholder="e.g. JOB-20261018-0912"
							value={ticketNo}
							onChange={(e) => setTicketNo(e.target.value)}
							className="track-input"
							required
						/>
						<button type="submit" className="track-submit-btn" disabled={loading}>
							{loading ? 'Searching...' : 'Search Status'}
						</button>
					</form>
					{error && <div className="track-error">{error}</div>}
				</div>

				{jobDetails && (
					<div className="track-results slide-up">
						<div className="track-result-header">
							<h3>Ticket: {jobDetails.job_number || jobDetails.jobNumber || ticketNo}</h3>
							<span className={`status-pill ${jobDetails.status.toLowerCase()}`}>
								{jobDetails.status.toUpperCase()}
							</span>
						</div>

						<div className="track-timeline">
							<div className="timeline-connector"></div>
							{/* Request Logged */}
							<div className="timeline-step completed">
								<div className="step-badge">1</div>
								<div className="step-content">
									<h4>Request Logged</h4>
									<p>Your repair ticket was created successfully.</p>
									<span className="step-date">{new Date(jobDetails.created_at || Date.now()).toLocaleDateString()}</span>
								</div>
							</div>

							{/* Technician Assigned */}
							<div className={`timeline-step ${['assigned', 'in_progress', 'completed'].includes((jobDetails.status || '').toLowerCase()) ? 'completed' : 'active'}`}>
								<div className="step-badge">2</div>
								<div className="step-content">
									<h4>Technician Assigned</h4>
									<p>{jobDetails.technician?.name ? `Technician ${jobDetails.technician.name} is assigned.` : 'Finding the best technician for your repair...'}</p>
								</div>
							</div>

							{/* Repair Ongoing */}
							<div className={`timeline-step ${['in_progress', 'completed'].includes((jobDetails.status || '').toLowerCase()) ? 'completed' : (jobDetails.status || '').toLowerCase() === 'assigned' ? 'active' : 'pending'}`}>
								<div className="step-badge">3</div>
								<div className="step-content">
									<h4>Repair Ongoing</h4>
									<p>Your appliance is being diagnosed and repaired.</p>
								</div>
							</div>

							{/* Completed */}
							<div className={`timeline-step ${(jobDetails.status || '').toLowerCase() === 'completed' ? 'completed' : (jobDetails.status || '').toLowerCase() === 'in_progress' ? 'active' : 'pending'}`}>
								<div className="step-badge">4</div>
								<div className="step-content">
									<h4>Service Completed</h4>
									<p>The repair is finished and ready for pickup/dispatch.</p>
								</div>
							</div>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}
