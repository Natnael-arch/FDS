import React from 'react';

export const Dashboard: React.FC = () => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      
      {/* Allocation Hero Panel */}
      <div style={{ gridColumn: '1 / -1', background: 'var(--surface-raised)', border: '1px solid var(--surface-border)', padding: '20px 24px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }}>Bulk Allocation — Current Period</h2>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>14 days remaining · Assigned by EPEA</div>
          </div>
          <button style={{ padding: '6px 12px', background: 'var(--surface-base)', border: '1px solid var(--surface-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}>Full Detail &rarr;</button>
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Diesel Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '80px', fontWeight: 600, color: 'var(--fuel-diesel)' }}>DIESEL</div>
            <div style={{ flex: 1, height: '14px', background: '#E5E7EB', borderRadius: '7px', display: 'flex', overflow: 'hidden' }}>
              <div style={{ width: '40%', background: 'var(--fuel-diesel)' }} title="Delivered: 40%" />
              <div style={{ width: '15%', background: 'var(--fuel-diesel)', opacity: 0.5 }} title="Requested: 15%" />
            </div>
            <div style={{ width: '130px', textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>45,000 L</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>(37.6 MT)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Incoming Deliveries */}
      <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--surface-border)', padding: '20px 24px', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>Incoming Deliveries</h3>
        <div style={{ padding: '12px', borderLeft: '4px solid var(--accent-primary)', background: 'var(--surface-base)', borderRadius: '0 4px 4px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-primary)', background: '#E0E7FF', padding: '2px 6px', borderRadius: '4px' }}>IN_TRANSIT</span>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>DEL-2941-XYZ</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>45,000 L (37.6 MT) — DIESEL</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>From Addis Ababa Depot · ETA: 2 hours</div>
        </div>
      </div>

      {/* Pending Requests */}
      <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--surface-border)', padding: '20px 24px', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>Pending Requests</h3>
        <div style={{ padding: '12px', borderLeft: '4px solid var(--accent-warning)', background: 'var(--surface-base)', borderRadius: '0 4px 4px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-warning)', background: '#FEF3C7', padding: '2px 6px', borderRadius: '4px' }}>UNDER_REVIEW</span>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>REQ-9921-ABC</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>90,000 L (75.2 MT) — DIESEL</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Submitted 2 days ago</div>
        </div>
      </div>

    </div>
  );
};
