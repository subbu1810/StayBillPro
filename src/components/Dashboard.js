import React, { useMemo } from 'react';
import '../styles/Dashboard.css';
import { useService } from '../hooks/useService';

function Dashboard({ onCreateJob, onOpenJobs, onOpenCustomers, onOpenTechnicians, onViewJob, onOpenInventory, onOpenPOS }) {
  const { jobs = [], jobsLoaded, technicians = [], customers = [], lowStockSpares = [] } = useService();

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
    <div className="sb-dashboard-wrapper" style={{ padding: '8px', background: '#fff', color: '#1a1a1a', fontFamily: 'sans-serif' }}>
      
      {/* Header - Minimalist */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>StayBill Pro Dashboard</h1>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>Retail & Service Command Center</p>
        </div>
        <button onClick={onCreateJob} style={{ background: '#ff7e36', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
          + New Job
        </button>
      </div>

      {/* Top Stats - Clean Mini-Boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '16px' }}>
        {[
          { label: 'Today\'s Sales', val: 'Rs 1,45,200', icon: '💰' },
          { label: 'Service Rev.', val: `Rs ${dashboardData.pendingPayments}`, icon: '📈' },
          { label: 'Active Jobs', val: dashboardData.openJobs.length, icon: '🛠️' },
          { label: 'Sales Stock', val: `${dashboardData.salesStockAlerts.length} Alerts`, icon: '📦' },
          { label: 'Service Parts', val: `${dashboardData.serviceStockAlerts.length} Alerts`, icon: '⚙️' }
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid #eee', padding: '8px 12px', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#888', fontWeight: 'bold' }}>{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '1rem' }}>{s.icon}</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{s.val}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid - High Density */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={{ border: '1px solid #eee', borderRadius: '4px', background: 'white' }}>
          <div style={{ background: '#f8fafc', padding: '6px 12px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold' }}>Recent POS Invoices</h2>
            <button style={{ background: 'none', border: 'none', color: '#ff7e36', fontSize: '0.7rem', cursor: 'pointer' }} onClick={() => onOpenPOS()}>POS →</button>
          </div>
          <div style={{ padding: '0px' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
               <thead style={{ background: '#fafafa' }}>
                 <tr style={{ textAlign: 'left' }}>
                    <th style={{ padding: '8px', fontWeight: 'bold', color: '#777' }}>ID</th>
                    <th style={{ padding: '8px', fontWeight: 'bold', color: '#777' }}>Customer</th>
                    <th style={{ padding: '8px', fontWeight: 'bold', color: '#777' }}>Amount</th>
                 </tr>
               </thead>
               <tbody>
                  {[
                    { id: '#9021', name: 'Rahul S.', amt: '₹1,250' },
                    { id: '#9020', name: 'Walk-in', amt: '₹450' },
                    { id: '#9019', name: 'Anjali S.', amt: '₹8,900' }
                  ].map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                      <td style={{ padding: '8px' }}>{r.id}</td>
                      <td style={{ padding: '8px' }}>{r.name}</td>
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>{r.amt}</td>
                    </tr>
                  ))}
               </tbody>
             </table>
          </div>
        </div>

        <div style={{ border: '1px solid #eee', borderRadius: '4px', background: 'white' }}>
          <div style={{ background: '#f8fafc', padding: '6px 12px', borderBottom: '1px solid #eee' }}>
            <h2 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold' }}>Service Jobs Queue</h2>
          </div>
          <div style={{ padding: '0px' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
               <thead>
                 <tr style={{ textAlign: 'left', background: '#fafafa' }}>
                    <th style={{ padding: '8px', fontWeight: 'bold', color: '#777' }}>Tkt</th>
                    <th style={{ padding: '8px', fontWeight: 'bold', color: '#777' }}>Status</th>
                 </tr>
               </thead>
               <tbody>
                  {dashboardData.recentOpenJobs.slice(0, 3).map(j => (
                    <tr key={j.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                      <td style={{ padding: '8px', color: '#ff7e36', cursor: 'pointer' }} onClick={() => onViewJob(j.id)}>{j.ticketNo}</td>
                      <td style={{ padding: '8px' }}>
                        <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '99px', background: '#eee', fontWeight: 'bold' }}>{j.status}</span>
                      </td>
                    </tr>
                  ))}
               </tbody>
             </table>
          </div>
        </div>
      </div>

      {lowStockSpares.length > 0 && (
        <section className="sb-pro-alerts">
          <div className="sb-pro-alert-card inventory-alerts" style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '0.5rem', borderRadius: '4px' }}>
            <h2 style={{ fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>⚠️ Low Stock Alerts</h2>
            <div className="sb-pro-alert-grid" style={{ display: 'flex', gap: '1rem' }}>
              {lowStockSpares.map(item => (
                <div key={item.id} className="sb-pro-mini-alert" style={{ fontSize: '0.8rem' }}>
                  <strong>{item.name}:</strong> {item.stock} left
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="sb-pro-performance" style={{ background: 'white', border: '1px solid var(--sb-border)', padding: '0.75rem', borderRadius: '4px' }}>
            <h2 style={{ fontSize: '0.9rem', margin: '0 0 1rem 0' }}>Weekly Performance</h2>
            <div className="bar-chart-container" style={{ height: '120px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around' }}>
            {dashboardData.last7Days.map(day => (
              <div key={day.iso} className="chart-column" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="bar-group" style={{ display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
                  <div className="bar created" style={{ width: '8px', height: `${(day.created / dashboardData.maxChartValue) * 100}%`, background: '#f1f5f9' }}></div>
                  <div className="bar completed" style={{ width: '8px', height: `${(day.completed / dashboardData.maxChartValue) * 100}%`, background: 'var(--sb-primary)' }}></div>
                </div>
                <div className="chart-day" style={{ fontSize: '0.65rem', marginTop: '4px' }}>{day.dayName}</div>
              </div>
            ))}
          </div>
      </section>

      <section className="sb-pro-actions" style={{ background: 'white', border: '1px solid var(--sb-border)', padding: '0.75rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="sb-pro-action-group">
           <h3 style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>⚡ Sales & Billing</h3>
           <div className="sb-pro-btns" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="sb-pro-btn primary" onClick={onOpenPOS} style={{ padding: '0.4rem 0.75rem', borderRadius: '4px', border: '1px solid #ff7e36', background: '#ff7e36', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>🛒 Start New Bill</button>
              <button className="sb-pro-btn" onClick={() => onOpenPOS()} style={{ padding: '0.4rem 0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>📜 View Invoices</button>
              <button className="sb-pro-btn" onClick={onOpenInventory} style={{ padding: '0.4rem 0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>📦 Inventory Hub</button>
           </div>
        </div>
        <div className="sb-pro-action-group">
           <h3 style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>🛠️ Service Center</h3>
           <div className="sb-pro-btns" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="sb-pro-btn secondary" onClick={onCreateJob} style={{ padding: '0.4rem 0.75rem', borderRadius: '4px', border: '1px solid #3b82f6', background: '#eff6ff', color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>➕ New Service Ticket</button>
              <button className="sb-pro-btn" onClick={onOpenTechnicians} style={{ padding: '0.4rem 0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>👨‍🔧 Manage Techs</button>
              <button className="sb-pro-btn" onClick={onOpenCustomers} style={{ padding: '0.4rem 0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>👥 Customers Hub</button>
           </div>
        </div>
      </section>

      <div className="sb-pro-metrics-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        <div className="sb-pro-m-card" style={{ background: 'white', border: '1px solid var(--sb-border)', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
            <div className="m-label" style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Total Requests</div>
            <div className="m-value" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{jobs.length}</div>
        </div>
        <div className="sb-pro-m-card" style={{ background: 'white', border: '1px solid var(--sb-border)', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
            <div className="m-label" style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Pending</div>
            <div className="m-value" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{dashboardData.counts.pending + dashboardData.counts.scheduled}</div>
        </div>
        <div className="sb-pro-m-card" style={{ background: 'white', border: '1px solid var(--sb-border)', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
            <div className="m-label" style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>In Progress</div>
            <div className="m-value" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{dashboardData.counts.in_progress}</div>
        </div>
        <div className="sb-pro-m-card" style={{ background: 'white', border: '1px solid var(--sb-border)', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
            <div className="m-label" style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Completed</div>
            <div className="m-value" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{dashboardData.counts.completed}</div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
