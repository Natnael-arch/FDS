import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './Dashboard';
import { RequestNew } from './pages/requests/RequestNew';
import { MyRequests } from './pages/requests/MyRequests';
import { Approvals } from './pages/requests/Approvals';
import { ReceiveFuel } from './pages/receive/ReceiveFuel';
import { DeliveryTracking } from './pages/tracking/DeliveryTracking';
import { SignedReceipts } from './pages/tracking/SignedReceipts';
import { AllocationCeiling } from './pages/inventory/AllocationCeiling';
import { SiteStock } from './pages/inventory/SiteStock';
import { ConsumptionReports } from './pages/inventory/ConsumptionReports';
import { useAppStore } from './store';
import { WifiOff } from 'lucide-react';

function App() {
  const connectivity = useAppStore(state => state.connectivity);
  const offlineQueue = useAppStore(state => state.offlineQueue);

  return (
    <div className="layout" style={{ flexDirection: 'row' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {connectivity === 'OFFLINE' && (
          <div style={{ background: 'var(--accent-warning)', color: '#fff', padding: '8px 24px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <WifiOff size={16} />
            Working offline — receipts will sync when connection returns ({offlineQueue.receipts_pending_sync} queued)
          </div>
        )}
        <Header />
        <main className="content" style={{ overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/receive" element={<ReceiveFuel />} />
            <Route path="/requests/new" element={<RequestNew />} />
            <Route path="/requests" element={<MyRequests />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/deliveries" element={<DeliveryTracking />} />
            <Route path="/receipts" element={<SignedReceipts />} />
            <Route path="/allocations" element={<AllocationCeiling />} />
            <Route path="/stock" element={<SiteStock />} />
            <Route path="/reports" element={<ConsumptionReports />} />
            {/* Fallback for other routes */}
            <Route path="*" element={<div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}><h2>Work in Progress</h2><p>This module is under construction.</p></div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
