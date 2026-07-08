import React from 'react';
import { Link } from 'react-router-dom';
import { CloudOff, PlusCircle } from 'lucide-react';
import { useAppStore } from '../../store';
import { FUEL_TYPE_COLOR, REQUEST_STATUS_STYLE } from '../../types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

export const MyRequests: React.FC = () => {
  const auth = useAppStore((state) => state.auth);
  const allRequests = useAppStore((state) => state.requests);

  const myRequests = allRequests
    .filter((r) => r.requested_by_user_id === auth?.user_id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (myRequests.length === 0) {
    return (
      <div
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--surface-border)',
          padding: '48px 24px',
          borderRadius: '8px',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0' }}>No Requests Yet</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
          You haven&apos;t submitted any fuel delivery requests.
        </p>
        {auth?.permissions.includes('site.requests.create') && (
          <Link
            to="/requests/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'var(--accent-primary)',
              color: '#fff',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            <PlusCircle size={16} />
            Request Delivery
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }}>My Requests</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {myRequests.length} request{myRequests.length !== 1 ? 's' : ''} submitted
          </p>
        </div>
        {auth?.permissions.includes('site.requests.create') && (
          <Link
            to="/requests/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'var(--accent-primary)',
              color: '#fff',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            <PlusCircle size={16} />
            New Request
          </Link>
        )}
      </div>

      <div
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--surface-border)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-base)', borderBottom: '1px solid var(--surface-border)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>Request ID</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>Fuel</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>Quantity</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>Delivery Date</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>Priority</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {myRequests.map((req) => {
              const statusStyle = REQUEST_STATUS_STYLE[req.status];
              return (
                <tr key={req.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{req.id}</span>
                      {req.pending_sync && (
                        <span title="Pending sync" style={{ display: 'flex', color: 'var(--accent-warning)' }}>
                          <CloudOff size={14} />
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '12px',
                        color: FUEL_TYPE_COLOR[req.fuel_type],
                      }}
                    >
                      {req.fuel_type}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600 }}>
                    {req.quantity_liters.toLocaleString()} L
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {formatDate(req.requested_delivery_date)}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: req.priority === 'URGENT' ? 'var(--accent-danger)' : 'var(--text-secondary)',
                      }}
                    >
                      {req.priority}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: statusStyle.background,
                        color: statusStyle.color,
                      }}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {formatRelative(req.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
