import React, { useState } from 'react';
import { useAppStore } from '../../store';
import { FUEL_TYPE_COLOR, REQUEST_STATUS_STYLE } from '../../types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const Approvals: React.FC = () => {
  const auth = useAppStore((state) => state.auth);
  const allRequests = useAppStore((state) => state.requests);
  const approveRequest = useAppStore((state) => state.approveRequest);
  const rejectRequest = useAppStore((state) => state.rejectRequest);

  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [expandedReject, setExpandedReject] = useState<string | null>(null);

  const canApprove = auth?.permissions.includes('site.requests.approve') ?? false;

  const pendingRequests = allRequests
    .filter(
      (r) =>
        r.site_id === auth?.site_id &&
        (r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW')
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleApprove = (id: string) => {
    approveRequest(id);
  };

  const handleReject = (id: string) => {
    rejectRequest(id, rejectNotes[id]?.trim() || undefined);
    setExpandedReject(null);
    setRejectNotes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }}>Approve Requests</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Review pending fuel delivery requests for {auth?.site_name}
        </p>
      </div>

      {!canApprove && (
        <div
          style={{
            background: 'var(--request-under-review)',
            border: '1px solid var(--surface-border)',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '13px',
            color: 'var(--accent-warning)',
            fontWeight: 500,
          }}
        >
          You are viewing this list in read-only mode. Approval actions require the{' '}
          <strong>site.requests.approve</strong> permission, which is assigned to project procurement officers.
        </div>
      )}

      {pendingRequests.length === 0 ? (
        <div
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--surface-border)',
            padding: '48px 24px',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 8px 0' }}>No Pending Approvals</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            There are no requests awaiting approval at this site.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pendingRequests.map((req) => {
            const statusStyle = REQUEST_STATUS_STYLE[req.status];
            const isRejectExpanded = expandedReject === req.id;

            return (
              <div
                key={req.id}
                style={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--surface-border)',
                  padding: '20px 24px',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        {req.id}
                      </span>
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
                      {req.priority === 'URGENT' && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'var(--request-rejected)',
                            color: 'var(--accent-danger)',
                          }}
                        >
                          URGENT
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>
                      <span style={{ color: FUEL_TYPE_COLOR[req.fuel_type] }}>{req.fuel_type}</span>
                      {' · '}
                      {req.quantity_liters.toLocaleString()} L
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <div>Requested by {req.requested_by_name}</div>
                    <div>Delivery: {formatDate(req.requested_delivery_date)}</div>
                    <div>Submitted: {formatDate(req.created_at)}</div>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    background: 'var(--surface-base)',
                    padding: '12px',
                    borderRadius: '4px',
                    marginBottom: canApprove ? '16px' : 0,
                  }}
                >
                  {req.justification}
                </p>

                {canApprove && (
                  <div>
                    {isRejectExpanded && (
                      <div style={{ marginBottom: '12px' }}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            marginBottom: '6px',
                          }}
                        >
                          Rejection Notes (optional)
                        </label>
                        <textarea
                          value={rejectNotes[req.id] ?? ''}
                          onChange={(e) =>
                            setRejectNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                          }
                          rows={2}
                          placeholder="Reason for rejection..."
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid var(--surface-border)',
                            borderRadius: '4px',
                            fontSize: '13px',
                            background: 'var(--surface-base)',
                            fontFamily: 'var(--font-ui)',
                            resize: 'vertical',
                          }}
                        />
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleApprove(req.id)}
                        style={{
                          padding: '8px 16px',
                          background: 'var(--accent-success)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        Approve
                      </button>
                      {isRejectExpanded ? (
                        <>
                          <button
                            onClick={() => handleReject(req.id)}
                            style={{
                              padding: '8px 16px',
                              background: 'var(--accent-danger)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              fontWeight: 600,
                              fontSize: '13px',
                              cursor: 'pointer',
                            }}
                          >
                            Confirm Reject
                          </button>
                          <button
                            onClick={() => setExpandedReject(null)}
                            style={{
                              padding: '8px 16px',
                              background: 'var(--surface-base)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--surface-border)',
                              borderRadius: '4px',
                              fontWeight: 600,
                              fontSize: '13px',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setExpandedReject(req.id)}
                          style={{
                            padding: '8px 16px',
                            background: 'var(--surface-base)',
                            color: 'var(--accent-danger)',
                            border: '1px solid var(--surface-border)',
                            borderRadius: '4px',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
