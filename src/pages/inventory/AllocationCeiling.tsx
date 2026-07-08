import React, { useMemo } from 'react';
import { useAppStore } from '../../store';
import type { FuelType } from '../../types';
import { FUEL_TYPE_COLOR } from '../../types';

const ALL_FUELS: FuelType[] = ['DIESEL', 'BENZINE', 'KEROSENE', 'HFO'];

function litersToMt(liters: number): string {
  return (liters * 0.00084).toFixed(1);
}

const AllocationBar: React.FC<{
  fuelType: FuelType;
  ceiling: number;
  delivered: number;
  inTransitRequested: number;
}> = ({ fuelType, ceiling, delivered, inTransitRequested }) => {
  const remaining = Math.max(0, ceiling - delivered - inTransitRequested);
  const deliveredPct = ceiling > 0 ? (delivered / ceiling) * 100 : 0;
  const inTransitPct = ceiling > 0 ? (inTransitRequested / ceiling) * 100 : 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '80px', fontWeight: 600, color: FUEL_TYPE_COLOR[fuelType] }}>
          {fuelType}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ height: '16px', background: '#E5E7EB', borderRadius: '8px', display: 'flex', overflow: 'hidden' }}>
            {delivered > 0 && (
              <div style={{ width: `${deliveredPct}%`, background: FUEL_TYPE_COLOR[fuelType], transition: 'width 0.3s' }} title={`Delivered: ${delivered.toLocaleString()} L`} />
            )}
            {inTransitRequested > 0 && (
              <div style={{ width: `${inTransitPct}%`, background: FUEL_TYPE_COLOR[fuelType], opacity: 0.5, transition: 'width 0.3s' }} title={`In transit / Requested: ${inTransitRequested.toLocaleString()} L`} />
            )}
            {remaining > 0 && (
              <div style={{ flex: 1, background: '#E5E7EB' }} title={`Remaining: ${remaining.toLocaleString()} L`} />
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)' }}>
            <span>
              <span style={{ color: FUEL_TYPE_COLOR[fuelType], fontWeight: 600 }}>
                {delivered.toLocaleString()} L
              </span>
              {' delivered'}
            </span>
            <span>
              <span style={{ fontWeight: 600 }}>
                {inTransitRequested.toLocaleString()} L
              </span>
              {' in transit'}
            </span>
            <span>
              <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                {remaining.toLocaleString()} L
              </span>
              {' remaining'}
            </span>
          </div>
        </div>
        <div style={{ width: '130px', textAlign: 'right' }}>
          <div style={{ fontSize: '14px', fontWeight: 700 }}>{ceiling.toLocaleString()} L</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>({litersToMt(ceiling)} MT)</div>
        </div>
      </div>
    </div>
  );
};

export const AllocationCeiling: React.FC = () => {
  const allocationPeriod = useAppStore((state) => state.currentAllocationPeriod);
  const deliveries = useAppStore((state) => state.deliveries);
  const receipts = useAppStore((state) => state.receipts);

  const deliveryMap = useMemo(() => new Map(deliveries.map((d) => [d.id, d])), [deliveries]);

  const fuelData = useMemo(() => {
    const allocMap = new Map(allocationPeriod.allocations.map((a) => [a.fuel_type, a.ceiling_liters]));

    const delivered: Record<string, number> = {};
    const inTransit: Record<string, number> = {};

    for (const f of ALL_FUELS) {
      delivered[f] = 0;
      inTransit[f] = 0;
    }

    for (const receipt of receipts) {
      const delivery = deliveryMap.get(receipt.delivery_id);
      if (delivery) {
        delivered[delivery.fuel_type] = (delivered[delivery.fuel_type] || 0) + receipt.received_quantity_liters;
      }
    }

    for (const delivery of deliveries) {
      if (delivery.status === 'IN_TRANSIT' || delivery.status === 'ARRIVED') {
        inTransit[delivery.fuel_type] = (inTransit[delivery.fuel_type] || 0) + delivery.quantity_liters_ordered;
      }
    }

    return { allocMap, delivered, inTransit };
  }, [allocationPeriod, deliveries, receipts, deliveryMap]);

  const totalAllocated = useMemo(
    () => allocationPeriod.allocations.reduce((s, a) => s + a.ceiling_liters, 0),
    [allocationPeriod]
  );

  const totalUsed = useMemo(
    () => ALL_FUELS.reduce((s, f) => s + (fuelData.delivered[f] || 0) + (fuelData.inTransit[f] || 0), 0),
    [fuelData]
  );

  const daysRemaining = useMemo(() => {
    const end = new Date(allocationPeriod.period_end);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / 86400000);
    return Math.max(0, diff);
  }, [allocationPeriod]);

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }}>Allocation Ceiling</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {allocationPeriod.period_label} · {daysRemaining} days remaining · Assigned by EPEA
        </p>
      </div>

      <div
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--surface-border)',
          padding: '20px 24px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '4px' }}>
              Total Allocated
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>
              {totalAllocated.toLocaleString()} L
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              ({litersToMt(totalAllocated)} MT)
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '4px' }}>
              Total Used / Committed
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-primary)' }}>
              {totalUsed.toLocaleString()} L
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {totalAllocated > 0 ? Math.round((totalUsed / totalAllocated) * 100) : 0}% of allocation
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '4px' }}>
              Total Remaining
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-success)' }}>
              {Math.max(0, totalAllocated - totalUsed).toLocaleString()} L
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {allocationPeriod.period_end}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--surface-border)',
          padding: '20px 24px',
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
            Breakdown by Fuel Type
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            Ceiling
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {ALL_FUELS.map((fuelType) => {
            const ceiling = fuelData.allocMap.get(fuelType) || 0;
            const delivered = fuelData.delivered[fuelType] || 0;
            const intransit = fuelData.inTransit[fuelType] || 0;

            if (ceiling === 0) return null;

            return (
              <AllocationBar
                key={fuelType}
                fuelType={fuelType}
                ceiling={ceiling}
                delivered={delivered}
                inTransitRequested={intransit}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
