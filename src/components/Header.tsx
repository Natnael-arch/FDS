import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { WifiOff, Wifi, CloudUpload, Sun, LogOut } from 'lucide-react';

function getBreadcrumb(pathname: string): string {
  const routes: Record<string, string> = {
    '/dashboard': 'FDCS / Operations / Dashboard',
    '/receive': 'FDCS / Operations / Receive Fuel',
    '/requests/new': 'FDCS / Procurement / Request Delivery',
    '/requests': 'FDCS / Procurement / My Requests',
    '/approvals': 'FDCS / Procurement / Approve Requests',
  };
  return routes[pathname] ?? 'FDCS / Operations';
}

export const Header: React.FC = () => {
  const location = useLocation();
  const connectivity = useAppStore(state => state.connectivity);
  const offlineQueue = useAppStore(state => state.offlineQueue);
  const auth = useAppStore(state => state.auth);

  return (
    <header style={{ height: '58px', background: 'var(--surface-raised)', borderBottom: '1px solid var(--surface-border)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
        {getBreadcrumb(location.pathname)}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Connectivity Status */}
        {connectivity === 'ONLINE' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-success)', fontSize: '12px', fontWeight: 600 }}>
            <Wifi size={14} /> Online
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-warning)', fontSize: '12px', fontWeight: 600 }}>
            <WifiOff size={14} /> Offline
          </div>
        )}

        {/* Sync Queue */}
        {offlineQueue.receipts_pending_sync > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-warning)', cursor: 'pointer' }} title="Receipts pending sync">
            <CloudUpload size={18} />
            <span style={{ background: 'var(--accent-warning)', color: '#fff', borderRadius: '10px', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>
              {offlineQueue.receipts_pending_sync}
            </span>
          </div>
        )}

        <div style={{ borderLeft: '1px solid var(--surface-border)', height: '24px' }} />

        {/* User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>{auth?.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{auth?.role}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><Sun size={18} /></button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><LogOut size={18} /></button>
          </div>
        </div>
      </div>
    </header>
  );
};
