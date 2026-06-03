import React, { useState, useEffect } from 'react';
import { jobsAPI } from '../services/api';
import '../styles/Tables.css';
import '../styles/Forms.css';

export default function CalendarScreen() {
	const [scheduledJobs, setScheduledJobs] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchScheduledJobs = async () => {
			try {
				const allJobs = await jobsAPI.getAll();
				// Filter out only jobs with upcoming/active scheduled dates
				const active = allJobs.filter(j => j.status !== 'completed' && j.status !== 'cancelled');
				
				// Very basic grouping by date
				const grouped = active.reduce((acc, job) => {
					const d = job.scheduled_date || job.created_at || new Date().toISOString();
					const dateKey = String(d).slice(0, 10);
					if (!acc[dateKey]) acc[dateKey] = [];
					acc[dateKey].push(job);
					return acc;
				}, {});
				
				setScheduledJobs(grouped);
			} catch (error) {
				console.error('Failed fetching jobs for calendar', error);
			} finally {
				setLoading(false);
			}
		};
		fetchScheduledJobs();
	}, []);

	// Simple helper to get the upcoming 5 days
	const getUpcomingDays = () => {
		const days = [];
		for(let i=0; i<5; i++) {
			const d = new Date();
			d.setDate(d.getDate() + i);
			days.push(d.toISOString().slice(0, 10));
		}
		return days;
	};

	const displayDays = getUpcomingDays();

	return (
		<div className="admin-screen fade-in">
			<div className="screen-header">
				<div>
					<h2 className="section-title">
						<span className="title-icon">📅</span> Technician Schedule Map
					</h2>
					<p className="dashboard-subtitle">A calendar view to monitor dispatch schedules and repair routes.</p>
				</div>
			</div>

			<div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
				{loading ? (
					<p>Loading schedule...</p>
				) : (
					displayDays.map(dateStr => (
						<div key={dateStr} className="card" style={{ padding: '16px', background: '#fff', borderTop: `4px solid var(--primary-orange)` }}>
							<h3 style={{ fontSize: '1.1rem', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
								{new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
							</h3>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
								{scheduledJobs[dateStr] && scheduledJobs[dateStr].length > 0 ? (
									scheduledJobs[dateStr].map(job => (
										<div key={job.id} style={{ padding: '10px', background: 'var(--bg-light)', borderRadius: '8px', borderLeft: `3px solid var(--primary-orange)` }}>
											<div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>{job.job_number || 'JOB-###'}</div>
											<div style={{ fontSize: '0.85rem', color: 'var(--primary-orange)', margin: '4px 0' }}>
												{job.technician?.name || 'Unassigned'}
											</div>
											<div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
												{job.location || 'Location Pending'}
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
