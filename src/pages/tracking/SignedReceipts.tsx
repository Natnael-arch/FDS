import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search, CloudUpload, ScrollText } from 'lucide-react';
import { useAppStore } from '../../store';
import { FUEL_TYPE_COLOR } from '../../types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const SignedReceipts: React.FC = () => {
  const receipts = useAppStore((state) => state.receipts);
  const deliveries = useAppStore((state) => state.deliveries);
  const offlineQueue = useAppStore((state) => state.offlineQueue);

  const [search, setSearch] = useState('');
  const [syncFilter, setSyncFilter] = useState<'ALL' | 'SYNCED' | 'PENDING'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const deliveryMap = useMemo(() => {
    const map = new Map(deliveries.map((d) => [d.id, d]));
    return map;
  }, [deliveries]);

  const syncCounts = useMemo(() => {
    const synced = receipts.filter((r) => r.synced).length;
    const pending = receipts.length - synced;
    return { ALL: receipts.length, SYNCED: synced, PENDING: pending };
  }, [receipts]);

  const filtered = useMemo(() => {
    let list = [...receipts];
    list.sort((a, b) => new Date(b.signed_at).getTime() - new Date(a.signed_at).getTime());

    if (syncFilter === 'SYNCED') {
      list = list.filter((r) => r.synced);
    } else if (syncFilter === 'PENDING') {
      list = list.filter((r) => !r.synced);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => {
        const delivery = deliveryMap.get(r.delivery_id);
        const trackingMatch = delivery?.tracking_code.toLowerCase().includes(q);
        const signerMatch = r.signer_name.toLowerCase().includes(q);
        return trackingMatch || signerMatch;
      });
    }

    return list;
  }, [receipts, deliveryMap, syncFilter, search]);

  if (receipts.length === 0) {
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
        <ScrollText size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0' }}>No Receipts Signed Yet</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Signed delivery receipts will appear here once fuel is received at your site.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }}>Signed Receipts</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {receipts.length} receipt{receipts.length !== 1 ? 's' : ''} signed
          {offlineQueue.receipts_pending_sync > 0 && (
            <span style={{ color: 'var(--accent-warning)', fontWeight: 600 }}>
              {' '}· {offlineQueue.receipts_pending_sync} pending sync
            </span>
          )}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSyncFilter('ALL')}
            style={{
              padding: '6px 14px',
              background: syncFilter === 'ALL' ? 'var(--accent-primary)' : 'transparent',
              color: syncFilter === 'ALL' ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${syncFilter === 'ALL' ? 'var(--accent-primary)' : 'var(--surface-border)'}`,
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            All ({syncCounts.ALL})
          </button>
          <button
            onClick={() => setSyncFilter('SYNCED')}
            style={{
              padding: '6px 14px',
              background: syncFilter === 'SYNCED' ? 'var(--accent-primary)' : 'transparent',
              color: syncFilter === 'SYNCED' ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${syncFilter === 'SYNCED' ? 'var(--accent-primary)' : 'var(--surface-border)'}`,
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Synced ({syncCounts.SYNCED})
          </button>
          <button
            onClick={() => setSyncFilter('PENDING')}
            style={{
              padding: '6px 14px',
              background: syncFilter === 'PENDING' ? 'var(--accent-warning)' : 'transparent',
              color: syncFilter === 'PENDING' ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${syncFilter === 'PENDING' ? 'var(--accent-warning)' : 'var(--surface-border)'}`,
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Pending Sync ({syncCounts.PENDING})
          </button>
        </div>
        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search by tracking code or signer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              border: '1px solid var(--surface-border)',
              borderRadius: '4px',
              fontSize: '13px',
              background: 'var(--surface-raised)',
            }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--surface-border)',
            padding: '32px 24px',
            borderRadius: '8px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '14px',
          }}
        >
          {search.trim()
            ? 'No receipts match your search.'
            : syncFilter === 'PENDING'
              ? 'All receipts have been synced.'
              : 'No receipts match this filter.'}
        </div>
      ) : (
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
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>Delivery</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>Fuel</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>Received / Ordered</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>Signed By</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>Signed At</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((receipt) => {
                const delivery = deliveryMap.get(receipt.delivery_id);
                const isExpanded = expandedId === receipt.id;
                const qtyDiff = receipt.received_quantity_liters - receipt.quantity_ordered_liters;

                return (
                  <React.Fragment key={receipt.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : receipt.id)}
                      style={{
                        borderBottom: '1px solid var(--surface-border)',
                        cursor: 'pointer',
                        background: isExpanded ? 'var(--surface-highlight)' : undefined,
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isExpanded ? <ChevronDown size={14} color="var(--text-tertiary)" /> : <ChevronRight size={14} color="var(--text-tertiary)" />}
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                            {delivery?.tracking_code || receipt.delivery_id}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 600, fontSize: '12px', color: delivery ? FUEL_TYPE_COLOR[delivery.fuel_type] : 'var(--text-tertiary)' }}>
                          {delivery?.fuel_type || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600 }}>
                        <span style={{ color: receipt.has_discrepancy ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
                          {receipt.received_quantity_liters.toLocaleString()} L
                        </span>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', fontWeight: 400 }}>
                          {' '}/ {receipt.quantity_ordered_liters.toLocaleString()} L
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                        {receipt.signer_name}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                        {formatDate(receipt.signed_at)}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {receipt.has_discrepancy && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'var(--request-under-review)',
                              color: 'var(--accent-warning)',
                              marginRight: '6px',
                            }}
                          >
                            DISCREPANCY
                          </span>
                        )}
                        {receipt.synced ? (
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: 'var(--accent-success)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            ✓ Synced
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: 'var(--accent-warning)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <CloudUpload size={14} />
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} style={{ padding: '0' }}>
                          <div
                            style={{
                              padding: '16px 24px 20px 24px',
                              background: 'var(--surface-highlight)',
                              borderBottom: '1px solid var(--surface-border)',
                            }}
                          >
                            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
                              Receipt Details
                            </div>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
                              <span style={{ color: 'var(--text-secondary)', minWidth: '120px' }}>Receipt ID</span>
                              <span style={{ fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{receipt.id}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '13px', marginTop: '4px' }}>
                              <span style={{ color: 'var(--text-secondary)', minWidth: '120px' }}>Delivery</span>
                              <span style={{ fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                                {delivery?.tracking_code || receipt.delivery_id}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '13px', marginTop: '4px' }}>
                              <span style={{ color: 'var(--text-secondary)', minWidth: '120px' }}>Ordered Quantity</span>
                              <span style={{ fontWeight: 500 }}>{receipt.quantity_ordered_liters.toLocaleString()} L</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '13px', marginTop: '4px' }}>
                              <span style={{ color: 'var(--text-secondary)', minWidth: '120px' }}>Received Quantity</span>
                              <span style={{ fontWeight: 500, color: receipt.has_discrepancy ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
                                {receipt.received_quantity_liters.toLocaleString()} L
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '13px', marginTop: '4px' }}>
                              <span style={{ color: 'var(--text-secondary)', minWidth: '120px' }}>Difference</span>
                              <span style={{ fontWeight: 500, color: qtyDiff !== 0 ? 'var(--accent-danger)' : 'var(--text-tertiary)' }}>
                                {qtyDiff > 0 ? '+' : ''}{qtyDiff.toLocaleString()} L
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '13px', marginTop: '4px' }}>
                              <span style={{ color: 'var(--text-secondary)', minWidth: '120px' }}>Signed By</span>
                              <span style={{ fontWeight: 500 }}>{receipt.signer_name}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '13px', marginTop: '4px' }}>
                              <span style={{ color: 'var(--text-secondary)', minWidth: '120px' }}>Signed At</span>
                              <span style={{ fontWeight: 500 }}>{formatDate(receipt.signed_at)}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '13px', marginTop: '4px' }}>
                              <span style={{ color: 'var(--text-secondary)', minWidth: '120px' }}>Sync Status</span>
                              <span style={{ fontWeight: 500, color: receipt.synced ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                                {receipt.synced ? 'Synced' : 'Pending sync'}
                              </span>
                            </div>
                            {receipt.has_discrepancy && receipt.discrepancy_notes && (
                              <div
                                style={{
                                  marginTop: '12px',
                                  padding: '10px 12px',
                                  background: 'var(--request-under-review)',
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  color: 'var(--accent-warning)',
                                  fontWeight: 500,
                                }}
                              >
                                <strong>Discrepancy Notes:</strong> {receipt.discrepancy_notes}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
