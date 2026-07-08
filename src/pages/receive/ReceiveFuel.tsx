import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store';
import type { Delivery } from '../../types';
import { DELIVERY_STATUS_STYLE, FUEL_TYPE_COLOR } from '../../types';

function litersToMt(liters: number): string {
  return (liters * 0.00084).toFixed(1);
}

interface DeliveryCardProps {
  delivery: Delivery;
  expandable?: boolean;
}

const DeliveryCard: React.FC<DeliveryCardProps> = ({ delivery, expandable = false }) => {
  const auth = useAppStore((state) => state.auth);
  const connectivity = useAppStore((state) => state.connectivity);
  const receipts = useAppStore((state) => state.receipts);
  const signReceipt = useAppStore((state) => state.signReceipt);

  const [expanded, setExpanded] = useState(false);
  const [receivedQuantity, setReceivedQuantity] = useState(String(delivery.quantity_liters_ordered));
  const [signerName, setSignerName] = useState(auth?.name ?? '');
  const [discrepancyNotes, setDiscrepancyNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const receipt = receipts.find((r) => r.delivery_id === delivery.id);
  const statusStyle = DELIVERY_STATUS_STYLE[delivery.status];
  const parsedQuantity = parseInt(receivedQuantity, 10);
  const hasDiscrepancy =
    receivedQuantity !== '' && !isNaN(parsedQuantity) && parsedQuantity !== delivery.quantity_liters_ordered;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setError('Please enter a valid received quantity.');
      return;
    }
    if (!signerName.trim()) {
      setError('Please enter your name to sign the receipt.');
      return;
    }
    if (hasDiscrepancy && !discrepancyNotes.trim()) {
      setError('Discrepancy notes are required when received quantity differs from ordered.');
      return;
    }

    setSubmitting(true);
    await signReceipt(
      delivery.id,
      parsedQuantity,
      signerName.trim(),
      hasDiscrepancy ? discrepancyNotes.trim() : undefined
    );
    setSubmitting(false);
    setExpanded(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--surface-border)',
    borderRadius: '4px',
    fontSize: '14px',
    background: 'var(--surface-base)',
    fontFamily: 'var(--font-ui)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
  };

  return (
    <div
      style={{
        padding: '12px',
        borderLeft: `4px solid ${statusStyle.borderColor}`,
        background: 'var(--surface-base)',
        borderRadius: '0 4px 4px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: receipt ? '12px' : '8px',
          cursor: expandable && !receipt ? 'pointer' : 'default',
        }}
        onClick={() => {
          if (expandable && !receipt) setExpanded((v) => !v);
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {expandable && !receipt && (
            expanded ? <ChevronDown size={14} color="var(--text-tertiary)" /> : <ChevronRight size={14} color="var(--text-tertiary)" />
          )}
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: statusStyle.color,
              background: statusStyle.background,
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            {delivery.status}
          </span>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          {delivery.tracking_code}
        </span>
      </div>

      <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
        {delivery.quantity_liters_ordered.toLocaleString()} L ({litersToMt(delivery.quantity_liters_ordered)} MT) —{' '}
        <span style={{ color: FUEL_TYPE_COLOR[delivery.fuel_type] }}>{delivery.fuel_type}</span>
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
        From {delivery.origin_depot}
        {(delivery.status === 'IN_TRANSIT' || delivery.status === 'ARRIVED') && ` · ETA: ${delivery.eta}`}
      </div>

      {receipt && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px 12px',
            background: 'var(--request-delivered)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} color="var(--accent-success)" />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-success)' }}>
              Signed — {receipt.synced ? 'synced' : 'pending sync'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {receipt.received_quantity_liters.toLocaleString()} L received · Signed by {receipt.signer_name}
            </div>
          </div>
        </div>
      )}

      {expandable && expanded && !receipt && (
        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--surface-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <label style={labelStyle} htmlFor={`qty-${delivery.id}`}>
              Received Quantity (Liters)
            </label>
            <input
              id={`qty-${delivery.id}`}
              type="number"
              min="1"
              step="1"
              value={receivedQuantity}
              onChange={(e) => setReceivedQuantity(e.target.value)}
              style={inputStyle}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              Ordered: {delivery.quantity_liters_ordered.toLocaleString()} L
            </div>
          </div>

          {hasDiscrepancy && (
            <div
              style={{
                padding: '10px 12px',
                background: 'var(--request-under-review)',
                borderRadius: '4px',
                fontSize: '13px',
                color: 'var(--accent-warning)',
                fontWeight: 500,
              }}
            >
              Quantity discrepancy detected — received amount differs from ordered by{' '}
              {Math.abs(parsedQuantity - delivery.quantity_liters_ordered).toLocaleString()} L
            </div>
          )}

          {hasDiscrepancy && (
            <div>
              <label style={labelStyle} htmlFor={`notes-${delivery.id}`}>
                Discrepancy Notes (required)
              </label>
              <textarea
                id={`notes-${delivery.id}`}
                value={discrepancyNotes}
                onChange={(e) => setDiscrepancyNotes(e.target.value)}
                rows={3}
                placeholder="Explain the quantity difference..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          )}

          <div>
            <label style={labelStyle} htmlFor={`signer-${delivery.id}`}>
              Signer Name (typed signature)
            </label>
            <input
              id={`signer-${delivery.id}`}
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              style={{
                ...inputStyle,
                fontFamily: 'var(--font-mono)',
                fontStyle: 'italic',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: '10px 12px',
                background: 'var(--request-rejected)',
                color: 'var(--accent-danger)',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '10px 20px',
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: submitting ? 'wait' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              alignSelf: 'flex-start',
            }}
          >
            {submitting ? 'Signing…' : 'Sign Receipt'}
          </button>

          {connectivity === 'OFFLINE' && (
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
              Offline — receipt will be queued for sync when connection returns.
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export const ReceiveFuel: React.FC = () => {
  const auth = useAppStore((state) => state.auth);
  const deliveries = useAppStore((state) => state.deliveries);
  const [showReceived, setShowReceived] = useState(false);

  const siteDeliveries = deliveries.filter((d) => d.site_id === auth?.site_id);

  const awaitingReceipt = siteDeliveries.filter(
    (d) => d.status === 'IN_TRANSIT' || d.status === 'ARRIVED'
  );

  const receivedDeliveries = siteDeliveries.filter(
    (d) => d.status === 'RECEIVED' || d.status === 'DISCREPANCY'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--surface-border)',
          padding: '20px 24px',
          borderRadius: '8px',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }}>Receive Fuel</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Sign delivery receipts for incoming fuel at {auth?.site_name}
        </p>

        <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 16px 0' }}>Awaiting Receipt</h3>

        {awaitingReceipt.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              background: 'var(--surface-base)',
              borderRadius: '4px',
            }}
          >
            No deliveries awaiting receipt at this site.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {awaitingReceipt.map((delivery) => (
              <DeliveryCard key={delivery.id} delivery={delivery} expandable />
            ))}
          </div>
        )}
      </div>

      {receivedDeliveries.length > 0 && (
        <div
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--surface-border)',
            padding: '16px 24px',
            borderRadius: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => setShowReceived((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              width: '100%',
              textAlign: 'left',
            }}
          >
            {showReceived ? (
              <ChevronDown size={16} color="var(--text-secondary)" />
            ) : (
              <ChevronRight size={16} color="var(--text-secondary)" />
            )}
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Received This Session ({receivedDeliveries.length})
            </span>
          </button>

          {showReceived && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {receivedDeliveries.map((delivery) => (
                <DeliveryCard key={delivery.id} delivery={delivery} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
