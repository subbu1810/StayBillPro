import React from 'react';

/**
 * DailySummaryPage Component
 * Dashboard for daily sales performance
 */
export default function DailySummaryPage() {
  // Sample Data
  const stats = [
    { label: 'Total Sales', value: '₹1,45,200', change: '+12%', icon: '💰', color: 'primary' },
    { label: 'Total Invoices', value: '42', change: '+5', icon: '📝', color: 'success' },
    { label: 'Average Bill', value: '₹3,457', change: '-2%', icon: '📊', color: 'info' },
    { label: 'Pending Dues', value: '₹18,500', change: '+₹2k', icon: '⏳', color: 'danger' },
  ];

  const paymentBreakdown = [
    { mode: 'Cash', amount: 52400, percent: 36, color: '#10b981' },
    { mode: 'UPI / GPay', amount: 68000, percent: 47, color: '#14b8a6' },
    { mode: 'Card', amount: 24800, percent: 17, color: '#f59e0b' },
  ];

  const topItems = [
    { name: 'Samsung Galaxy S24', sold: 4, revenue: 319996 },
    { name: 'Logitech G502 Mouse', sold: 12, revenue: 54000 },
    { name: 'iPhone 15 Pro', sold: 2, revenue: 269800 },
    { name: 'Sony WH-1000XM5', sold: 3, revenue: 89970 },
  ];

  return (
    <div className="pos-summary-container animate-pos-fade">
      <div className="summary-header">
        <h1>Daily Sales Summary</h1>
        <div className="header-actions">
           <span className="date-badge">📅 17th April 2026</span>
           <button className="btn-print-summary">🖨️ Print EOD Report</button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="stats-grid">
        {stats.map(stat => (
          <div key={stat.label} className="stat-card">
            <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
            <div className="stat-info">
              <span className="stat-label">{stat.label}</span>
              <h2 className="stat-value">{stat.value}</h2>
              <span className={`stat-change ${stat.change.startsWith('+') ? 'pos' : 'neg'}`}>
                {stat.change} vs yesterday
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="summary-details-grid">
        {/* Payment Mode Breakdown */}
        <div className="summary-card payment-modes">
          <h3>Payment Mode Breakdown</h3>
          <div className="mode-list">
            {paymentBreakdown.map(pw => (
              <div key={pw.mode} className="mode-item">
                <div className="mode-info">
                  <span className="mode-name">{pw.mode}</span>
                  <span className="mode-amount">₹{pw.amount.toLocaleString()}</span>
                </div>
                <div className="meter-wrapper">
                  <div className="meter-fill" style={{ width: `${pw.percent}%`, background: pw.color }}></div>
                  <span className="percent-label">{pw.percent}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="chart-placeholder">
             {/* Dynamic donut chart would go here */}
             <div className="donut-preview">
                {paymentBreakdown.map((p, i) => <div key={i} style={{flex: p.percent, background: p.color}}></div>)}
             </div>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="summary-card top-items">
          <h3>Top Selling Items Today</h3>
          <div className="items-list">
            <div className="item-row header">
              <span>Item Name</span>
              <span>Qty Sold</span>
              <span className="cell-right">Revenue</span>
            </div>
            {topItems.map(item => (
              <div key={item.name} className="item-row">
                <span className="item-name">{item.name}</span>
                <span className="item-qty">{item.sold} items</span>
                <span className="item-rev cell-right">₹{item.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <button className="btn-full">View Full Inventory Report</button>
        </div>
      </div>

      <style jsx>{`
        .pos-summary-container {
          padding: 2rem;
          height: 100%;
          overflow: auto;
        }

        .summary-header {
           display: flex;
           justify-content: space-between;
           align-items: center;
           margin-bottom: 2.5rem;
        }

        .summary-header h1 { font-size: 1.875rem; font-weight: 800; }
        .header-actions { display: flex; gap: 1rem; align-items: center; }
        .date-badge { background: white; padding: 0.625rem 1rem; border-radius: 8px; font-weight: 700; border: 1.5px solid var(--pos-border); }
        .btn-print-summary { background: var(--pos-text-main); color: white; padding: 0.625rem 1.25rem; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: var(--pos-radius-lg);
          border: 1px solid var(--pos-border);
          display: flex;
          align-items: center;
          gap: 1.25rem;
          box-shadow: var(--pos-shadow-sm);
        }

        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }
        .stat-icon.primary { background: #eef2ff; }
        .stat-icon.success { background: #ecfdf5; }
        .stat-icon.info { background: #f0f9ff; }
        .stat-icon.danger { background: #fff1f2; }

        .stat-label { font-size: 0.85rem; color: var(--pos-text-muted); font-weight: 600; display: block; margin-bottom: 4px; }
        .stat-value { font-size: 1.5rem; font-weight: 900; margin: 0; color: var(--pos-text-main); }
        .stat-change { font-size: 0.75rem; font-weight: 700; margin-top: 4px; display: block; }
        .stat-change.pos { color: #10b981; }
        .stat-change.neg { color: #ef4444; }

        .summary-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .summary-card {
          background: white;
          padding: 2rem;
          border-radius: var(--pos-radius-lg);
          border: 1px solid var(--pos-border);
          box-shadow: var(--pos-shadow-sm);
        }

        .summary-card h3 { margin-top: 0; margin-bottom: 1.5rem; font-size: 1.1rem; font-weight: 800; border-bottom: 1px solid var(--pos-bg-main); padding-bottom: 1rem; }

        .mode-list { display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 2rem; }
        .mode-info { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
        .mode-name { font-weight: 700; color: var(--pos-text-main); }
        .mode-amount { font-weight: 800; color: var(--pos-text-main); }

        .meter-wrapper { height: 12px; background: var(--pos-bg-main); border-radius: 100px; display: flex; align-items: center; justify-content: space-between; overflow: hidden; position: relative; }
        .meter-fill { height: 100%; border-radius: 100px; }
        .percent-label { position: absolute; right: 8px; font-size: 0.7rem; font-weight: 800; color: var(--pos-text-muted); }

        .donut-preview { height: 20px; display: flex; border-radius: 100px; overflow: hidden; margin-top: 1rem; }

        .item-row { display: flex; justify-content: space-between; padding: 1rem 0; border-bottom: 1px dashed var(--pos-border); }
        .item-row.header { font-weight: 800; color: var(--pos-text-muted); font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid var(--pos-border); }
        .item-name { flex: 2; font-weight: 700; color: var(--pos-text-main); }
        .item-qty { flex: 1; font-weight: 600; color: var(--pos-text-muted); }
        .item-rev { flex: 1; font-weight: 800; color: var(--pos-primary); }
        .cell-right { text-align: right; }

        .btn-full { width: 100%; padding: 1rem; background: var(--pos-bg-main); border: 1.5px solid var(--pos-border); border-radius: 12px; margin-top: 1.5rem; font-weight: 700; cursor: pointer; }

        @media (max-width: 1000px) {
          .summary-details-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
