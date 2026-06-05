import React, { useState, useEffect, useMemo } from 'react';
import '../styles/Dashboard.css';
import { useService } from '../hooks/useService';
import EulaScreen from './EulaScreen';
import { adminAuthAPI } from '../services/api';

function Dashboard({ onCreateJob, onOpenJobs, onOpenCustomers, onOpenTechnicians, onViewJob, onOpenInventory, onOpenPOS, onLogout }) {
  const { jobs = [], jobsLoaded, technicians = [], customers = [], lowStockSpares = [] } = useService();
  const [showEula, setShowEula] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Show if explicitly false, 0, or undefined (for users who logged in before the update)
        if (!user.eula_accepted) {
          setShowEula(true);
        }
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }
  }, []);

  const handleAcceptEula = async () => {
    try {
      await adminAuthAPI.acceptEula();
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.eula_accepted = true;
        localStorage.setItem('user', JSON.stringify(user));
      }
      setShowEula(false);
    } catch (err) {
      console.error("Failed to accept EULA:", err);
      alert("There was an error saving your acceptance. Please try again.");
    }
  };

  const handleDeclineEula = () => {
    if (onLogout) onLogout();
  };

  const normalizeStatus = (value) => {
    const raw = (value || '').toLowerCase().trim();
    if (raw === 'new') return 'pending';
    if (raw === 'in progress') return 'in_progress';
    if (raw === 'on hold') return 'on_hold';
    return raw.replace(/\s+/g, '_');
  };

  const todayISO = new Date().toISOString().slice(0, 10);

  const dashboardData = useMemo(() => {
    const counts = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      on_hold: 0,
      scheduled: 0,
    };

    let jobsDueToday = 0;
    let pendingPayments = 0;

    for (const job of jobs) {
      const key = normalizeStatus(job.status);
      if (counts[key] !== undefined) counts[key] += 1;

      if ((job.dueDate || '').slice(0, 10) === todayISO) {
        jobsDueToday += 1;
      }

      const amount = Number(job.totalCost || 0);
      if (key === 'completed' && Number.isFinite(amount) && amount > 0) {
        pendingPayments += amount;
      }
    }

    const openJobs = jobs.filter((job) => {
      const key = normalizeStatus(job.status);
      return key !== 'completed' && key !== 'cancelled';
    });

    const recentOpenJobs = [...openJobs]
      .sort((a, b) => String(b.createdDate || '').localeCompare(String(a.createdDate || '')))
      .slice(0, 8);

    const todaysSchedule = [...jobs]
      .filter((job) => (job.dueDate || '').slice(0, 10) === todayISO)
      .sort((a, b) => String(a.dueDate || '').localeCompare(String(b.dueDate || '')))
      .slice(0, 6)
      .map((job) => ({
        id: job.id,
        technician: job.technician || 'Unassigned',
        customer: job.customer || '-',
        jobStatus: job.status || 'Pending',
        time: job.dueDate || '-',
      }));

    const activeTechnicians = technicians.filter((t) => {
      const status = (t.status || '').toLowerCase();
      return status === 'available' || status === 'active' || status === 'busy';
    }).length;

    // Last 7 days analytics calculation
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const created = jobs.filter(j => (j.createdDate || '').slice(0, 10) === iso).length;
      const completed = jobs.filter(j => (j.status || '').toLowerCase() === 'completed' && (j.dueDate || '').slice(0,10) === iso).length;

      return { iso, dayName, created, completed, max: Math.max(created, completed, 5) };
    }).reverse();

    const maxChartValue = Math.max(...last7Days.map(d => d.max), 10);

    return {
      counts,
      openJobs,
      recentOpenJobs,
      todaysSchedule,
      jobsDueToday,
      pendingPayments,
      activeTechnicians,
      last7Days,
      maxChartValue,
      completionRate: jobs.length ? Math.round((counts.completed / jobs.length) * 100) : 0,
      salesStockAlerts: (lowStockSpares || []).filter(s => (s.section || 'sales') === 'sales'),
      serviceStockAlerts: (lowStockSpares || []).filter(s => (s.section || 'sales') === 'service')
    };
  }, [jobs, technicians, todayISO]);

  return (
    <div className="os-dashboard">
      {showEula && <EulaScreen onAccept={handleAcceptEula} onDecline={handleDeclineEula} />}

      {/* Top Metrics Row */}
      <div className="os-metrics-grid">
        
        <div className="os-metric-card">
          <div className="os-metric-info">
            <span className="os-metric-label">Total Sales</span>
            <div className="os-metric-value">₹{dashboardData.pendingPayments.toLocaleString()}</div>
            <span className="os-metric-trend positive">+8.2%</span>
          </div>
          <div className="os-metric-chart placeholder-sparkline">
            <svg viewBox="0 0 100 40">
               <path d="M0 30 Q 15 10, 30 20 T 60 10 T 100 5 L 100 40 L 0 40 Z" fill="#ccfbf1" />
               <path d="M0 30 Q 15 10, 30 20 T 60 10 T 100 5" fill="none" stroke="#14b8a6" strokeWidth="3" />
            </svg>
          </div>
        </div>

        <div className="os-metric-card">
          <div className="os-metric-info">
            <span className="os-metric-label">Active Jobs</span>
            <div className="os-metric-value">{dashboardData.openJobs.length}</div>
          </div>
          <div className="os-metric-progress-wrapper">
             <div className="progress-labels">
                <span>Progress</span>
                <span>{dashboardData.completionRate}%</span>
             </div>
             <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{width: `${dashboardData.completionRate}%`}}></div>
             </div>
          </div>
        </div>

        <div className="os-metric-card">
          <div className="os-metric-info">
            <span className="os-metric-label">New Customers</span>
            <div className="os-metric-value">{customers.length}</div>
            <span className="os-metric-trend positive">+15%</span>
          </div>
        </div>

        <div className="os-metric-card">
          <div className="os-metric-info">
            <span className="os-metric-label">Pending Service</span>
            <div className="os-metric-value">{dashboardData.counts.pending + dashboardData.counts.scheduled}</div>
            <span className="os-metric-subtext">tickets</span>
          </div>
        </div>

        <div className="os-action-stack">
          <button className="os-btn primary" onClick={onOpenPOS}>
            + Create Invoice
          </button>
          <button className="os-btn outline" onClick={onCreateJob}>
            + New Service Ticket
          </button>
        </div>

      </div>

      {/* Main Chart Section */}
      <div className="os-chart-section">
         <div className="os-chart-header">
            <h2>Weekly Performance (Sales & Jobs)</h2>
            <select className="os-dropdown">
               <option>Last 7 Days</option>
            </select>
         </div>
         <div className="os-chart-legend">
            <span className="legend-item"><span className="dot teal"></span> Sales Revenue</span>
            <span className="legend-item"><span className="dot grey"></span> Completed Jobs</span>
         </div>
         <div className="os-chart-placeholder">
            {/* Visual representation of the dual line chart using CSS/SVG for demo */}
            <div className="chart-grid">
               {[2000, 1500, 1000, 500, 0].map(val => (
                 <div key={val} className="grid-line">
                    <span className="y-label">${val}</span>
                    <div className="line"></div>
                 </div>
               ))}
               <div className="x-labels">
                  {dashboardData.last7Days.map(d => (
                     <span key={d.iso}>{d.dayName}</span>
                  ))}
               </div>
            </div>
            
            <svg className="chart-lines" viewBox="0 0 800 250" preserveAspectRatio="none">
               {/* Sales Line - Teal */}
               <path d="M 0 220 C 150 180, 250 100, 400 150 C 500 200, 600 50, 800 100" fill="none" stroke="#14b8a6" strokeWidth="4" />
               <path d="M 0 220 C 150 180, 250 100, 400 150 C 500 200, 600 50, 800 100 L 800 250 L 0 250 Z" fill="rgba(20, 184, 166, 0.1)" />
               
               {/* Jobs Line - Grey */}
               <path d="M 0 250 C 150 100, 300 200, 500 150 C 650 50, 750 180, 800 150" fill="none" stroke="#9ca3af" strokeWidth="4" />
               <path d="M 0 250 C 150 100, 300 200, 500 150 C 650 50, 750 180, 800 150 L 800 250 L 0 250 Z" fill="rgba(156, 163, 175, 0.1)" />

               {/* Data Points */}
               <circle cx="400" cy="150" r="6" fill="#14b8a6" stroke="white" strokeWidth="3" />
               <circle cx="500" cy="150" r="6" fill="#9ca3af" stroke="white" strokeWidth="3" />
            </svg>
         </div>
      </div>
      
    </div>
  );
}

export default Dashboard;
