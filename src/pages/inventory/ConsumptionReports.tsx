import React, { useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import { useAppStore, TANK_CAPACITY_LITERS } from '../../store';
import type { FuelType } from '../../types';
import { FUEL_TYPE_COLOR } from '../../types';

const ALL_FUELS: FuelType[] = ['DIESEL', 'BENZINE', 'KEROSENE', 'HFO'];

const CHART_WIDTH = 700;
const CHART_HEIGHT = 260;
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };

const FuelToggle: React.FC<{
  fuelType: FuelType;
  active: boolean;
  onClick: () => void;
}> = ({ fuelType, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      background: active ? FUEL_TYPE_COLOR[fuelType] : 'transparent',
      color: active ? '#fff' : FUEL_TYPE_COLOR[fuelType],
      border: `1px solid ${FUEL_TYPE_COLOR[fuelType]}`,
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 600,
    }}
  >
    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: FUEL_TYPE_COLOR[fuelType] }} />
    {fuelType}
  </button>
);

const ConsumptionChart: React.FC<{
  data: Array<{ date: string; values: Record<string, number> }>;
  activeFuels: Set<string>;
}> = ({ data, activeFuels }) => {
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const allValues = data.flatMap((d) =>
    ALL_FUELS.filter((f) => activeFuels.has(f)).map((f) => d.values[f] || 0)
  );
  const maxVal = Math.max(...allValues, 1);

  const yScale = (v: number) => PADDING.top + plotHeight - (v / maxVal) * plotHeight;
  const xScale = (i: number) => PADDING.left + (i / Math.max(data.length - 1, 1)) * plotWidth;

  const yTicks = 5;
  const yStep = Math.ceil(maxVal / yTicks / 50) * 50;

  return (
    <svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} style={{ display: 'block' }}>
      {/* Grid lines */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const val = yStep * i;
        const y = yScale(val);
        return (
          <g key={i}>
            <line x1={PADDING.left} x2={CHART_WIDTH - PADDING.right} y1={y} y2={y} stroke="var(--surface-border)" strokeWidth="1" />
            <text x={PADDING.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-tertiary)">
              {val.toLocaleString()}
            </text>
          </g>
        );
      })}

      {/* X axis labels */}
      {data.map((d, i) => {
        if (data.length <= 14 && i % 2 !== 0 && data.length > 7) return null;
        const x = xScale(i);
        const label = d.date.slice(5);
        return (
          <text key={i} x={x} y={CHART_HEIGHT - 8} textAnchor="middle" fontSize="9" fill="var(--text-tertiary)">
            {label}
          </text>
        );
      })}

      {/* Line series */}
      {ALL_FUELS.filter((f) => activeFuels.has(f)).map((fuelType) => {
        const color = FUEL_TYPE_COLOR[fuelType];
        const points = data.map((d, i) => ({ x: xScale(i), y: yScale(d.values[fuelType] || 0) }));

        const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

        return (
          <g key={fuelType}>
            <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} stroke="#fff" strokeWidth="1.5" />
            ))}
          </g>
        );
      })}
    </svg>
  );
};

function formatDateShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export const ConsumptionReports: React.FC = () => {
  const mockConsumptionLog = useAppStore((state) => state.mockConsumptionLog);
  const stockLevels = useAppStore((state) => {
    const receipts = state.receipts;
    const deliveries = state.deliveries;
    const consumptionLog = state.mockConsumptionLog;

    const deliveryMap = new Map(deliveries.map((d) => [d.id, d]));
    const received: Record<string, number> = {};
    for (const f of ALL_FUELS) received[f] = 0;
    for (const receipt of receipts) {
      const delivery = deliveryMap.get(receipt.delivery_id);
      if (delivery) received[delivery.fuel_type] = (received[delivery.fuel_type] || 0) + receipt.received_quantity_liters;
    }
    const consumed: Record<string, number> = {};
    for (const f of ALL_FUELS) consumed[f] = 0;
    for (const entry of consumptionLog) consumed[entry.fuel_type] = (consumed[entry.fuel_type] || 0) + entry.liters_consumed;

    return ALL_FUELS.map((f) => ({
      fuelType: f,
      currentLiters: Math.max(0, (received[f] || 0) - (consumed[f] || 0)),
      tankCapacity: TANK_CAPACITY_LITERS[f] || 0,
    }));
  });

  const [activeFuels, setActiveFuels] = useState<Set<string>>(new Set(ALL_FUELS));

  const toggleFuel = (fuel: FuelType) => {
    setActiveFuels((prev) => {
      const next = new Set(prev);
      if (next.has(fuel)) {
        if (next.size === 1) return prev;
        next.delete(fuel);
      } else {
        next.add(fuel);
      }
      return next;
    });
  };

  const chartData = useMemo(() => {
    const dateMap = new Map<string, Record<string, number>>();
    for (const entry of mockConsumptionLog) {
      if (!dateMap.has(entry.date)) {
        dateMap.set(entry.date, {});
      }
      dateMap.get(entry.date)![entry.fuel_type] = entry.liters_consumed;
    }
    const sorted = Array.from(dateMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    return sorted.map(([date, values]) => ({ date, values }));
  }, [mockConsumptionLog]);

  const summary = useMemo(() => {
    return ALL_FUELS.map((fuelType) => {
      const data = mockConsumptionLog.filter((e) => e.fuel_type === fuelType);
      const total = data.reduce((s, e) => s + e.liters_consumed, 0);
      const avgDaily = data.length > 0 ? total / data.length : 0;
      const stock = stockLevels.find((s) => s.fuelType === fuelType);
      const daysUntilEmpty = avgDaily > 0 && stock ? Math.floor(stock.currentLiters / avgDaily) : null;
      return { fuelType, total, avgDaily, daysUntilEmpty };
    });
  }, [mockConsumptionLog, stockLevels]);

  const handleDownloadCsv = () => {
    const header = 'Date,' + ALL_FUELS.join(',');
    const rows = chartData.map((d) => {
      const vals = ALL_FUELS.map((f) => d.values[f] || 0);
      return d.date + ',' + vals.join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'consumption_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }}>Consumption Reports</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Fuel consumption over the last {chartData.length} days
        </p>
      </div>

      {/* Summary Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {summary.map((s) => (
          <div
            key={s.fuelType}
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--surface-border)',
              padding: '16px',
              borderRadius: '8px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: FUEL_TYPE_COLOR[s.fuelType], marginBottom: '8px' }}>
              {s.fuelType}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>
              {s.total.toLocaleString()} L
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Avg: {Math.round(s.avgDaily).toLocaleString()} L/day
            </div>
            {s.daysUntilEmpty !== null && (
              <div
                style={{
                  fontSize: '11px',
                  marginTop: '2px',
                  color: s.daysUntilEmpty < 7 ? 'var(--accent-warning)' : 'var(--text-secondary)',
                  fontWeight: s.daysUntilEmpty < 7 ? 600 : 400,
                }}
              >
                {s.daysUntilEmpty} days until empty at current rate
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--surface-border)',
          padding: '20px 24px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Daily Consumption</h3>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {ALL_FUELS.map((f) => (
              <FuelToggle key={f} fuelType={f} active={activeFuels.has(f)} onClick={() => toggleFuel(f)} />
            ))}
          </div>
        </div>

        {activeFuels.size === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
            Select at least one fuel type to display.
          </div>
        ) : (
          <ConsumptionChart data={chartData} activeFuels={activeFuels} />
        )}
      </div>

      {/* Data Table */}
      <div
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--surface-border)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--surface-border)',
          }}
        >
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Daily Breakdown</h3>
          <button
            onClick={handleDownloadCsv}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: 'var(--surface-base)',
              border: '1px solid var(--surface-border)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
            }}
          >
            <Download size={14} />
            Download CSV
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-base)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Date</th>
                {ALL_FUELS.map((f) => (
                  <th key={f} style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, fontSize: '11px', color: FUEL_TYPE_COLOR[f], whiteSpace: 'nowrap' }}>
                    {f} (L)
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chartData.map((row) => (
                <tr key={row.date} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {formatDateShort(row.date)}
                  </td>
                  {ALL_FUELS.map((f) => (
                    <td key={f} style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {(row.values[f] || 0).toLocaleString()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
