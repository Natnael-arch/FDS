import React, { useMemo } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { useAppStore, TANK_CAPACITY_LITERS } from '../../store';
import type { FuelType } from '../../types';
import { FUEL_TYPE_COLOR } from '../../types';

const ALL_FUELS: FuelType[] = ['DIESEL', 'BENZINE', 'KEROSENE', 'HFO'];
const LOW_STOCK_THRESHOLD = 0.2;

const CircularGauge: React.FC<{ percentage: number; fuelType: FuelType }> = ({ percentage, fuelType }) => {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const fillLength = Math.min(percentage, 1) * circumference;
  const color = FUEL_TYPE_COLOR[fuelType];
  const bgColor = 'var(--surface-border)';

  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={radius} fill="none" stroke={bgColor} strokeWidth="10" />
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={`${fillLength} ${circumference - fillLength}`}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dasharray 0.5s' }}
      />
      <text x="60" y="56" textAnchor="middle" fontSize="20" fontWeight={700} fill="var(--text-primary)">
        {Math.round(percentage * 100)}%
      </text>
      <text x="60" y="74" textAnchor="middle" fontSize="10" fill="var(--text-tertiary)">
        fill
      </text>
    </svg>
  );
};

const StockCard: React.FC<{
  fuelType: FuelType;
  currentLiters: number;
  tankCapacity: number;
  lastUpdated: string;
}> = ({ fuelType, currentLiters, tankCapacity, lastUpdated }) => {
  const percentage = tankCapacity > 0 ? currentLiters / tankCapacity : 0;
  const isLow = percentage < LOW_STOCK_THRESHOLD;

  return (
    <div
      style={{
        background: 'var(--surface-raised)',
        border: `1px solid ${isLow ? 'var(--accent-warning)' : 'var(--surface-border)'}`,
        borderRadius: '8px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        position: 'relative',
      }}
    >
      {isLow && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--accent-warning)',
          }}
        >
          <AlertTriangle size={14} />
          Low
        </div>
      )}

      <CircularGauge percentage={percentage} fuelType={fuelType} />

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: FUEL_TYPE_COLOR[fuelType] }}>
          {fuelType}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          {currentLiters.toLocaleString()} L / {tankCapacity.toLocaleString()} L
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
          {(currentLiters * 0.00084).toFixed(1)} MT
        </div>
      </div>

      <div
        style={{
          width: '100%',
          padding: '8px 12px',
          background: 'var(--surface-base)',
          borderRadius: '4px',
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          textAlign: 'center',
        }}
      >
        Last updated: {lastUpdated}
      </div>
    </div>
  );
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const SiteStock: React.FC = () => {
  const receipts = useAppStore((state) => state.receipts);
  const deliveries = useAppStore((state) => state.deliveries);
  const mockConsumptionLog = useAppStore((state) => state.mockConsumptionLog);
  const allocationPeriod = useAppStore((state) => state.currentAllocationPeriod);

  const stockLevels = useMemo(() => {
    const deliveryMap = new Map(deliveries.map((d) => [d.id, d]));

    const received: Record<string, number> = {};
    const lastReceipt: Record<string, string> = {};

    for (const f of ALL_FUELS) {
      received[f] = 0;
    }

    for (const receipt of receipts) {
      const delivery = deliveryMap.get(receipt.delivery_id);
      if (delivery) {
        received[delivery.fuel_type] = (received[delivery.fuel_type] || 0) + receipt.received_quantity_liters;
        const existing = lastReceipt[delivery.fuel_type];
        if (!existing || new Date(receipt.signed_at) > new Date(existing)) {
          lastReceipt[delivery.fuel_type] = receipt.signed_at;
        }
      }
    }

    const consumed: Record<string, number> = {};
    for (const f of ALL_FUELS) {
      consumed[f] = 0;
    }
    for (const entry of mockConsumptionLog) {
      consumed[entry.fuel_type] = (consumed[entry.fuel_type] || 0) + entry.liters_consumed;
    }

    return ALL_FUELS.map((fuelType) => {
      const currentLiters = Math.max(0, (received[fuelType] || 0) - (consumed[fuelType] || 0));
      const tankCapacity = TANK_CAPACITY_LITERS[fuelType] || 0;
      const lastUpdated = lastReceipt[fuelType]
        ? formatDate(lastReceipt[fuelType])
        : formatDate(allocationPeriod.period_start);
      return { fuelType, currentLiters, tankCapacity, lastUpdated };
    });
  }, [receipts, deliveries, mockConsumptionLog, allocationPeriod]);

  const totalStock = useMemo(
    () => stockLevels.reduce((s, l) => s + l.currentLiters, 0),
    [stockLevels]
  );

  const totalCapacity = useMemo(
    () => stockLevels.reduce((s, l) => s + l.tankCapacity, 0),
    [stockLevels]
  );

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }}>Site Stock</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          On-site fuel inventory at Saddle Dam Site · {totalStock.toLocaleString()} L / {totalCapacity.toLocaleString()} L total
        </p>
      </div>

      <div
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--surface-border)',
          padding: '16px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: 'var(--text-tertiary)',
        }}
      >
        <Info size={14} />
        Stock levels are computed from signed receipts minus estimated consumption. This is not a live tank sensor reading.
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '20px',
        }}
      >
        {stockLevels.map((level) => (
          <StockCard
            key={level.fuelType}
            fuelType={level.fuelType}
            currentLiters={level.currentLiters}
            tankCapacity={level.tankCapacity}
            lastUpdated={level.lastUpdated}
          />
        ))}
      </div>
    </div>
  );
};
