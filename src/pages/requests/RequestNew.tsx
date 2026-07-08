import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import type { CreateRequestInput, FuelType, RequestPriority } from '../../types';

const FUEL_TYPES: FuelType[] = ['DIESEL', 'BENZINE', 'KEROSENE', 'HFO'];

export const RequestNew: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAppStore((state) => state.auth);
  const createRequest = useAppStore((state) => state.createRequest);

  const [fuelType, setFuelType] = useState<FuelType>('DIESEL');
  const [quantityLiters, setQuantityLiters] = useState('');
  const [priority, setPriority] = useState<RequestPriority>('NORMAL');
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState('');
  const [justification, setJustification] = useState('');
  const [error, setError] = useState('');

  if (!auth?.permissions.includes('site.requests.create')) {
    return (
      <div
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--surface-border)',
          padding: '40px 24px',
          borderRadius: '8px',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0' }}>Permission Denied</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          You do not have permission to create fuel delivery requests. Contact your project administrator.
        </p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const quantity = parseInt(quantityLiters, 10);
    if (!quantityLiters || isNaN(quantity) || quantity <= 0) {
      setError('Please enter a valid quantity in liters.');
      return;
    }
    if (!requestedDeliveryDate) {
      setError('Please select a requested delivery date.');
      return;
    }
    if (!justification.trim()) {
      setError('Please provide a justification for this request.');
      return;
    }

    const input: CreateRequestInput = {
      fuel_type: fuelType,
      quantity_liters: quantity,
      priority,
      justification: justification.trim(),
      requested_delivery_date: requestedDeliveryDate,
    };

    createRequest(input);
    navigate('/requests');
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
    <div style={{ maxWidth: '640px' }}>
      <div
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--surface-border)',
          padding: '20px 24px',
          borderRadius: '8px',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }}>Request Fuel Delivery</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Submit a new bulk fuel delivery request for {auth.site_name}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle} htmlFor="fuel_type">
              Fuel Type
            </label>
            <select
              id="fuel_type"
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value as FuelType)}
              style={inputStyle}
            >
              {FUEL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle} htmlFor="quantity">
              Quantity (Liters)
            </label>
            <input
              id="quantity"
              type="number"
              min="1"
              step="1"
              value={quantityLiters}
              onChange={(e) => setQuantityLiters(e.target.value)}
              placeholder="e.g. 45000"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Priority</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['NORMAL', 'URGENT'] as RequestPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: `1px solid ${priority === p ? 'var(--accent-primary)' : 'var(--surface-border)'}`,
                    borderRadius: '4px',
                    background: priority === p ? 'var(--surface-highlight)' : 'var(--surface-base)',
                    color: priority === p ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle} htmlFor="delivery_date">
              Requested Delivery Date
            </label>
            <input
              id="delivery_date"
              type="date"
              value={requestedDeliveryDate}
              onChange={(e) => setRequestedDeliveryDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="justification">
              Justification
            </label>
            <textarea
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={4}
              placeholder="Describe why this fuel is needed..."
              style={{ ...inputStyle, resize: 'vertical' }}
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

          <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                background: 'var(--accent-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Submit Request
            </button>
            <button
              type="button"
              onClick={() => navigate('/requests')}
              style={{
                padding: '10px 20px',
                background: 'var(--surface-base)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--surface-border)',
                borderRadius: '4px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
