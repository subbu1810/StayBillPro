import React, { useState, useEffect, useMemo } from 'react';
import '../styles/Dashboard.css';
import { useService } from '../hooks/useService';
import EulaScreen from './EulaScreen';
import { adminAuthAPI } from '../services/api';
import { usePopup } from './ui/PopupProvider';

function Dashboard({ onCreateJob, onOpenJobs, onOpenCustomers, onOpenTechnicians, onViewJob, onOpenInventory, onOpenPOS, onOpenGRN, onLogout }) {
  const popup = usePopup();
  const { jobs = [], technicians = [], customers = [], lowStockSpares = [], todaySummary = {}, invoiceSalesReport = [] } = useService();
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
      popup.showError("There was an error saving your acceptance. Please try again.");
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

  const getLocalDate = (d) => {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  const todayISO = getLocalDate(new Date());

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

    // Today's sales only — resets each day automatically
    const realTotalSales = Number(todaySummary.total_sales || 0);
    const realInvoiceCount = Number(todaySummary.total_invoices || 0);

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
      const iso = getLocalDate(d);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const created = jobs.filter(j => (j.createdDate || '').slice(0, 10) === iso).length;
      const completed = jobs.filter(j => (j.status || '').toLowerCase() === 'completed' && (j.dueDate || '').slice(0,10) === iso).length;

      // Get sales from invoiceSalesReport (array of { date, total_sales })
      const reportEntry = invoiceSalesReport.find(r => (r.date || '').slice(0, 10) === iso);
      const dailySales = reportEntry ? Number(reportEntry.total_sales || 0) : 0;

      return { iso, dayName, created, completed, sales: dailySales, max: Math.max(created, completed, 5) };
    }).reverse();

    const maxChartValue = Math.max(...last7Days.map(d => d.max), 10);
    const maxSalesValue = Math.max(...last7Days.map(d => d.sales), 1000); // minimum 1000 for scale
    
    // Generate dynamic SVG path for Sales Line
    // Y maps from 250 (0) to 50 (maxSalesValue)
    // X maps from 0 to 800 based on index (0 to 6)
    const generatePath = (data, maxValue) => {
        if (data.length === 0) return '';
        let path = '';
        data.forEach((point, i) => {
            const x = (i / (data.length - 1)) * 800;
            const y = 250 - (maxValue > 0 ? (point / maxValue) * 200 : 0);
            if (i === 0) {
                path += `M ${x} ${y} `;
            } else {
                // simple curve mapping, using previous point
                const prevX = ((i - 1) / (data.length - 1)) * 800;
                const prevY = 250 - (maxValue > 0 ? (data[i - 1] / maxValue) * 200 : 0);
                const cpX = (x + prevX) / 2;
                path += `C ${cpX} ${prevY}, ${cpX} ${y}, ${x} ${y} `;
            }
        });
        return path;
    };

    const salesPath = generatePath(last7Days.map(d => d.sales), maxSalesValue);
    const jobsPath = generatePath(last7Days.map(d => d.completed), maxChartValue);

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
      maxSalesValue,
      salesPath,
      jobsPath,
      realTotalSales,
      realInvoiceCount,
      completionRate: jobs.length ? Math.round((counts.completed / jobs.length) * 100) : 0,
      salesStockAlerts: (lowStockSpares || []).filter(s => (s.section || 'sales') === 'sales'),
      serviceStockAlerts: (lowStockSpares || []).filter(s => (s.section || 'sales') === 'service')
    };
  }, [jobs, technicians, todayISO, todaySummary, invoiceSalesReport, lowStockSpares]);

  return (
    <div className="os-dashboard">
      {showEula && <EulaScreen onAccept={handleAcceptEula} onDecline={handleDeclineEula} />}

      {/* Top Metrics Row */}
      <div className="os-metrics-grid">
        
        <div className="os-metric-card">
          <div className="os-metric-info">
            <span className="os-metric-label">Today's Sales</span>
            <div className="os-metric-value">₹{dashboardData.realTotalSales.toLocaleString()}</div>
            <span className="os-metric-trend neutral">Today only</span>
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
            <span className="os-metric-label">Today's Invoices</span>
            <div className="os-metric-value">{dashboardData.realInvoiceCount}</div>
            <span className="os-metric-subtext">today</span>
          </div>
        </div>

        <div className="os-action-stack">
          <button className="os-btn primary" onClick={onOpenPOS}>
            + POS
          </button>
          <button className="os-btn outline" onClick={onOpenGRN}>
            ✨ Scan with AI
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
               {[dashboardData.maxSalesValue, dashboardData.maxSalesValue * 0.75, dashboardData.maxSalesValue * 0.5, dashboardData.maxSalesValue * 0.25, 0].map(val => (
                 <div key={val} className="grid-line">
                    <span className="y-label">₹{Math.round(val).toLocaleString()}</span>
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
               <path d={dashboardData.salesPath} fill="none" stroke="#14b8a6" strokeWidth="4" />
               <path d={`${dashboardData.salesPath} L 800 250 L 0 250 Z`} fill="rgba(20, 184, 166, 0.1)" />
               
               {/* Jobs Line - Grey */}
               <path d={dashboardData.jobsPath} fill="none" stroke="#9ca3af" strokeWidth="4" />
               <path d={`${dashboardData.jobsPath} L 800 250 L 0 250 Z`} fill="rgba(156, 163, 175, 0.1)" />

               {/* Data Points */}
               {dashboardData.last7Days.map((d, i) => {
                  const x = (i / 6) * 800;
                  const salesY = 250 - (dashboardData.maxSalesValue > 0 ? (d.sales / dashboardData.maxSalesValue) * 200 : 0);
                  const jobsY = 250 - (dashboardData.maxChartValue > 0 ? (d.completed / dashboardData.maxChartValue) * 200 : 0);
                  return (
                      <React.Fragment key={d.iso}>
                          <circle cx={x} cy={salesY} r="5" fill="#14b8a6" stroke="white" strokeWidth="2" />
                          <circle cx={x} cy={jobsY} r="5" fill="#9ca3af" stroke="white" strokeWidth="2" />
                      </React.Fragment>
                  );
               })}
            </svg>
         </div>
      </div>
      
    </div>
  );
}

export default Dashboard;
