export type FuelType = 'DIESEL' | 'BENZINE' | 'KEROSENE' | 'HFO';

export type RequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISPATCHED'
  | 'DELIVERED';

export type RequestPriority = 'NORMAL' | 'URGENT';

export interface FuelRequest {
  id: string;
  requested_by_user_id: string;
  requested_by_name: string;
  site_id: string;
  site_name: string;
  project_id: string;
  fuel_type: FuelType;
  quantity_liters: number;
  priority: RequestPriority;
  justification: string;
  requested_delivery_date: string;
  status: RequestStatus;
  created_at: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  review_notes?: string;
  pending_sync?: boolean;
}

export interface CreateRequestInput {
  fuel_type: FuelType;
  quantity_liters: number;
  priority: RequestPriority;
  justification: string;
  requested_delivery_date: string;
}

export const FUEL_TYPE_COLOR: Record<FuelType, string> = {
  DIESEL: 'var(--fuel-diesel)',
  BENZINE: 'var(--fuel-benzine)',
  KEROSENE: 'var(--fuel-kerosene)',
  HFO: 'var(--fuel-hfo)',
};

export const REQUEST_STATUS_STYLE: Record<
  RequestStatus,
  { background: string; color: string }
> = {
  DRAFT: { background: 'var(--request-draft)', color: 'var(--text-secondary)' },
  SUBMITTED: { background: 'var(--request-submitted)', color: 'var(--accent-secondary)' },
  UNDER_REVIEW: { background: 'var(--request-under-review)', color: 'var(--accent-warning)' },
  APPROVED: { background: 'var(--request-approved)', color: 'var(--accent-success)' },
  REJECTED: { background: 'var(--request-rejected)', color: 'var(--accent-danger)' },
  DISPATCHED: { background: 'var(--request-dispatched)', color: 'var(--accent-secondary)' },
  DELIVERED: { background: 'var(--request-delivered)', color: 'var(--accent-success)' },
};

export type DeliveryStatus = 'IN_TRANSIT' | 'ARRIVED' | 'RECEIVED' | 'DISCREPANCY';

export interface Delivery {
  id: string;
  request_id?: string;
  fuel_type: FuelType;
  quantity_liters_ordered: number;
  origin_depot: string;
  tracking_code: string;
  site_id: string;
  site_name: string;
  status: DeliveryStatus;
  eta: string;
  dispatched_at: string;
}

export interface Receipt {
  id: string;
  delivery_id: string;
  received_by_user_id: string;
  received_by_name: string;
  received_quantity_liters: number;
  quantity_ordered_liters: number;
  has_discrepancy: boolean;
  discrepancy_notes?: string;
  signed_at: string;
  signer_name: string;
  synced: boolean;
}

export const DELIVERY_STATUS_STYLE: Record<
  DeliveryStatus,
  { background: string; color: string; borderColor: string }
> = {
  IN_TRANSIT: { background: '#E0E7FF', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' },
  ARRIVED: { background: 'var(--request-under-review)', color: 'var(--accent-warning)', borderColor: 'var(--accent-warning)' },
  RECEIVED: { background: 'var(--request-delivered)', color: 'var(--accent-success)', borderColor: 'var(--accent-success)' },
  DISCREPANCY: { background: 'var(--request-rejected)', color: 'var(--accent-danger)', borderColor: 'var(--accent-danger)' },
};

export interface AllocationLine {
  fuel_type: FuelType;
  ceiling_liters: number;
  assigned_by: string;
}

export interface AllocationPeriod {
  id: string;
  period_label: string;
  period_start: string;
  period_end: string;
  site_id: string;
  allocations: AllocationLine[];
}

export interface StockLevel {
  fuel_type: FuelType;
  current_liters: number;
  tank_capacity_liters: number;
  last_updated: string;
}

export interface ConsumptionDataPoint {
  date: string;
  fuel_type: FuelType;
  liters_consumed: number;
}
