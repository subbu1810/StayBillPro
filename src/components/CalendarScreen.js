import React, { useState, useEffect } from 'react';
import { useService } from '../hooks/useService';
import '../styles/Tables.css';
import '../styles/Forms.css';

export default function CalendarScreen() {
	const { jobs, jobsLoaded } = useService();
	const [scheduledJobs, setScheduledJobs] = useState({});

	useEffect(() => {
		if (!jobsLoaded) return;
		
		// Filter out only jobs with upcoming/active scheduled dates
		const active = jobs.filter(j => j.status !== 'Completed' && j.status !== 'Cancelled');
		
		// Group by due date (which is already YYYY-MM-DD), fallback to createdDate
		const grouped = active.reduce((acc, job) => {
			const dateKey = job.dueDate || job.createdDate || new Date().toISOString().slice(0, 10);
			if (!acc[dateKey]) acc[dateKey] = [];
			acc[dateKey].push(job);
			return acc;
		}, {});
		
		setScheduledJobs(grouped);
	}, [jobs, jobsLoaded]);

	// Get upcoming 5 days in local timezone YYYY-MM-DD format
	const getUpcomingDays = () => {
		const days = [];
		for(let i=0; i<5; i++) {
			const d = new Date();
			d.setDate(d.getDate() + i);
			const yyyy = d.getFullYear();
			const mm = String(d.getMonth() + 1).padStart(2, '0');
			const dd = String(d.getDate()).padStart(2, '0');
			days.push(`${yyyy}-${mm}-${dd}`);
		}
		return days;
	};

	const displayDays = getUpcomingDays();

	return (
		<div className="admin-screen fade-in">


			<div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
				{!jobsLoaded ? (
					<p>Loading schedule...</p>
				) : (
					displayDays.map(dateStr => (
						<div key={dateStr} className="card" style={{ padding: '16px', background: '#fff', borderTop: `4px solid var(--primary-orange)` }}>
							<h3 style={{ fontSize: '1.1rem', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
								{new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
							</h3>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
								{scheduledJobs[dateStr] && scheduledJobs[dateStr].length > 0 ? (
									scheduledJobs[dateStr].map(job => (
										<div key={job.id} style={{ padding: '10px', background: 'var(--bg-light)', borderRadius: '8px', borderLeft: `3px solid var(--primary-orange)` }}>
											<div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>{job.ticketNo || 'JOB-###'}</div>
											<div style={{ fontSize: '0.85rem', color: 'var(--primary-orange)', margin: '4px 0' }}>
												{job.technician || 'Unassigned'}
											</div>
											<div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
												{job.customer || 'Unknown Customer'}
											</div>
										</div>
									))
								) : (
									<div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', padding: '10px', textAlign: 'center' }}>
										No dispatches scheduled.
									</div>
								)}
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
