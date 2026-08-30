import React from 'react';
import '../../styles/pos/POSTokens.css';
import POSBillingPage from './POSBillingPage';
import DirectBillingPage from './DirectBillingPage';
import WholesaleBillingPage from './WholesaleBillingPage';
import InvoiceHistoryPage from './InvoiceHistoryPage';
import ReturnsRefundPage from './ReturnsRefundPage';
import DailySummaryPage from './DailySummaryPage';
import POSSettingsPage from './POSSettingsPage';

/**
 * POSManager Component
 * Root component for the POS system handling navigation and overall state
 * Consolidated to use sidebar navigation
 */
export default function POSManager({ activeTab = 'billing' }) {
  
  const renderContent = () => {
    switch (activeTab) {
      case 'billing': return <POSBillingPage />;
      case 'direct': return <DirectBillingPage />;
      case 'wholesale': return <WholesaleBillingPage />;
      case 'history': return <InvoiceHistoryPage />;
      case 'returns': return <ReturnsRefundPage />;
      case 'summary': return <DailySummaryPage />;
      case 'settings': return <POSSettingsPage />;
      default: return <POSBillingPage />;
    }
  };

  return (
    <div className="pos-module animate-pos-fade">
      <main className="pos-main-content">
        {renderContent()}
      </main>

      <style jsx>{`
        .pos-module {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .pos-main-content {
          flex: 1;
          height: 100%;
          overflow: hidden;
          background: var(--pos-bg-main);
        }
      `}</style>
    </div>
  );
}
