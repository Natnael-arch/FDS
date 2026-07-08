import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search, Truck } from 'lucide-react';
import { useAppStore } from '../../store';
import type { Delivery, DeliveryStatus } from '../../types';
import { DELIVERY_STATUS_STYLE, FUEL_TYPE_COLOR } from '../../types';

const STAGES: { label: string; status: DeliveryStatus | 'DISPATCHED'; key: string }[] = [
  { label: 'DISPATCHED', status: 'IN_TRANSIT', key: 'dispatched' },
  { label: 'IN TRANSIT', status: 'IN_TRANSIT', key: 'in_transit' },
  { label: 'ARRIVED', status: 'ARRIVED', key: 'arrived' },
  { label: 'RECEIVED', status: 'RECEIVED', key: 'received' },
];

function getStageIndex(d: Delivery): number {
  if (d.status === 'DISCREPANCY') return 3;
  return STAGES.findIndex((s) => s.status === d.status);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const StageTracker: React.FC<{ delivery: Delivery }> = ({ delivery }) => {
  const currentIdx = getStageIndex(delivery);
  const isDiscrepancy = delivery.status === 'DISCREPANCY';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: '12px' }}>
      {STAGES.map((stage, idx) => {
        const completed = idx < currentIdx;
        const active = idx === currentIdx && !isDiscrepancy;
        const fillColor = completed || active ? 'var(--accent-primary)' : 'var(--surface-border)';

        return (
          <React.Fragment key={stage.key}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: fillColor,
                  border: `2px solid ${active || completed ? 'var(--accent-primary)' : 'var(--surface-border)'}`,
                  transition: 'background 0.2s',
                }}
              />
              <span
                style={{
                  fontSize: '9px',
                  color: active || completed ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontWeight: active ? 700 : 500,
                  whiteSpace: 'nowrap',
                }}
              >
                {stage.label}
              </span>
            </div>
            {idx < STAGES.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  background: idx < currentIdx ? 'var(--accent-primary)' : 'var(--surface-border)',
                  margin: '0 4px',
                  marginBottom: '18px',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
      {isDiscrepancy && (
        <>
          <div style={{ flex: 1, height: '2px', background: 'transparent', margin: '0 4px', marginBottom: '18px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: 'var(--accent-danger)',
                border: '2px solid var(--accent-danger)',
              }}
            />
            <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent-danger)', whiteSpace: 'nowrap' }}>
              DISCREPANCY
            </span>
          </div>
        </>
      )}
    </div>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
    <span style={{ color: 'var(--text-secondary)', minWidth: '120px' }}>{label}</span>
    <span style={{ fontWeight: 500 }}>{value}</span>
  </div>
);

const FilterTab: React.FC<{
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}> = ({ label, active, count, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '6px 14px',
      background: active ? 'var(--accent-primary)' : 'transparent',
      color: active ? '#fff' : 'var(--text-secondary)',
      border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--surface-border)'}`,
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}
  >
    {label} ({count})
  </button>
);

export const DeliveryTracking: React.FC = () => {
  const deliveries = useAppStore((state) => state.deliveries);
  const receipts = useAppStore((state) => state.receipts);

  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: deliveries.length };
    for (const d of deliveries) {
      counts[d.status] = (counts[d.status] || 0) + 1;
    }
    return counts;
  }, [deliveries]);

  const filtered = useMemo(() => {
    let list = [...deliveries];
    list.sort((a, b) => new Date(b.dispatched_at).getTime() - new Date(a.dispatched_at).getTime());

    if (statusFilter !== 'ALL') {
      list = list.filter((d) => d.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((d) => d.tracking_code.toLowerCase().includes(q));
    }
    return list;
  }, [deliveries, statusFilter, search]);

  if (deliveries.length === 0) {
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
        <Truck size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0' }}>No Deliveries Yet</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Fuel deliveries will appear here once dispatched from a depot.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }}>Delivery Tracking</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {deliveries.length} delivery{deliveries.length !== 1 ? 'ies' : 'y'} total
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
          <FilterTab label="All" active={statusFilter === 'ALL'} count={statusCounts.ALL || 0} onClick={() => setStatusFilter('ALL')} />
          <FilterTab label="In Transit" active={statusFilter === 'IN_TRANSIT'} count={statusCounts.IN_TRANSIT || 0} onClick={() => setStatusFilter('IN_TRANSIT')} />
          <FilterTab label="Arrived" active={statusFilter === 'ARRIVED'} count={statusCounts.ARRIVED || 0} onClick={() => setStatusFilter('ARRIVED')} />
          <FilterTab label="Received" active={statusFilter === 'RECEIVED'} count={statusCounts.RECEIVED || 0} onClick={() => setStatusFilter('RECEIVED')} />
          <FilterTab label="Discrepancy" active={statusFilter === 'DISCREPANCY'} count={statusCounts.DISCREPANCY || 0} onClick={() => setStatusFilter('DISCREPANCY')} />
        </div>
        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search by tracking code..."
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
          No deliveries match this filter.
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
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>Tracking</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>Fuel</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>Quantity</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>Origin</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>ETA / Dispatched</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((delivery) => {
                const statusStyle = DELIVERY_STATUS_STYLE[delivery.status];
                const isExpanded = expandedId === delivery.id;
                const receipt = receipts.find((r) => r.delivery_id === delivery.id);

                return (
                  <React.Fragment key={delivery.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : delivery.id)}
                      style={{
                        borderBottom: '1px solid var(--surface-border)',
                        cursor: 'pointer',
                        background: isExpanded ? 'var(--surface-highlight)' : undefined,
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isExpanded ? <ChevronDown size={14} color="var(--text-tertiary)" /> : <ChevronRight size={14} color="var(--text-tertiary)" />}
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{delivery.tracking_code}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 600, fontSize: '12px', color: FUEL_TYPE_COLOR[delivery.fuel_type] }}>
                          {delivery.fuel_type}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600 }}>
                        {delivery.quantity_liters_ordered.toLocaleString()} L
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {delivery.origin_depot}
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
                          {delivery.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                        {(delivery.status === 'IN_TRANSIT' || delivery.status === 'ARRIVED') && delivery.eta !== '—'
                          ? `ETA: ${delivery.eta}`
                          : formatDate(delivery.dispatched_at)}
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
                              Delivery Details
                            </div>
                            <DetailRow label="Tracking Code" value={delivery.tracking_code} />
                            <DetailRow label="Request ID" value={delivery.request_id || '—'} />
                            <DetailRow label="Fuel Type" value={delivery.fuel_type} />
                            <DetailRow label="Quantity Ordered" value={`${delivery.quantity_liters_ordered.toLocaleString()} L`} />
                            <DetailRow label="Origin Depot" value={delivery.origin_depot} />
                            <DetailRow label="Dispatched At" value={formatDate(delivery.dispatched_at)} />
                            {(delivery.status === 'IN_TRANSIT' || delivery.status === 'ARRIVED') && (
                              <DetailRow label="ETA" value={delivery.eta} />
                            )}

                            <StageTracker delivery={delivery} />

                            {(delivery.status === 'RECEIVED' || delivery.status === 'DISCREPANCY') && receipt && (
                              <div
                                style={{
                                  marginTop: '16px',
                                  padding: '12px',
                                  background: 'var(--surface-raised)',
                                  borderRadius: '4px',
                                  border: '1px solid var(--surface-border)',
                                }}
                              >
                                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                                  Receipt Summary
                                </div>
                                <DetailRow label="Received Quantity" value={`${receipt.received_quantity_liters.toLocaleString()} L`} />
                                <DetailRow label="Signed By" value={receipt.signer_name} />
                                <DetailRow label="Signed At" value={formatDate(receipt.signed_at)} />
                                <DetailRow label="Synced" value={receipt.synced ? 'Yes' : 'Pending'} />
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
