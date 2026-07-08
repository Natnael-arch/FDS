import { create } from 'zustand';
import { db } from './db';
import type {
  AllocationPeriod,
  ConsumptionDataPoint,
  CreateRequestInput,
  Delivery,
  FuelRequest,
  Receipt,
  RequestStatus,
} from './types';

interface AuthState {
  user_id: string;
  name: string;
  role: string;
  project_id: string;
  project_name: string;
  site_id: string;
  site_name: string;
  permissions: string[];
}

interface AppState {
  auth: AuthState | null;
  connectivity: 'ONLINE' | 'OFFLINE' | 'SYNCING';
  offlineQueue: {
    receipts_pending_sync: number;
    requests_pending_sync: number;
    last_sync_at: string | null;
  };
  requests: FuelRequest[];
  deliveries: Delivery[];
  receipts: Receipt[];
  currentAllocationPeriod: AllocationPeriod;
  mockConsumptionLog: ConsumptionDataPoint[];
  setConnectivity: (status: 'ONLINE' | 'OFFLINE' | 'SYNCING') => void;
  setAuth: (auth: AuthState) => void;
  syncOfflineQueue: () => Promise<void>;
  createRequest: (input: CreateRequestInput) => void;
  approveRequest: (id: string, notes?: string) => void;
  rejectRequest: (id: string, notes?: string) => void;
  signReceipt: (
    deliveryId: string,
    receivedQuantity: number,
    signerName: string,
    notes?: string
  ) => Promise<void>;
}

const MOCK_REQUESTS: FuelRequest[] = [
  {
    id: 'REQ-9921-ABC',
    requested_by_user_id: 'u123',
    requested_by_name: 'Abebe Bikila',
    site_id: 's-saddle',
    site_name: 'Saddle Dam Site',
    project_id: 'p-gerd',
    fuel_type: 'DIESEL',
    quantity_liters: 90000,
    priority: 'NORMAL',
    justification: 'Excavation fleet refuel for Q3 earthworks phase.',
    requested_delivery_date: '2026-07-15',
    status: 'UNDER_REVIEW',
    created_at: '2026-07-06T08:30:00.000Z',
  },
  {
    id: 'REQ-8812-DEF',
    requested_by_user_id: 'u123',
    requested_by_name: 'Abebe Bikila',
    site_id: 's-saddle',
    site_name: 'Saddle Dam Site',
    project_id: 'p-gerd',
    fuel_type: 'BENZINE',
    quantity_liters: 15000,
    priority: 'URGENT',
    justification: 'Emergency generator backup for night shift welding crew.',
    requested_delivery_date: '2026-07-10',
    status: 'SUBMITTED',
    created_at: '2026-07-07T14:15:00.000Z',
  },
  {
    id: 'REQ-7703-GHI',
    requested_by_user_id: 'u123',
    requested_by_name: 'Abebe Bikila',
    site_id: 's-saddle',
    site_name: 'Saddle Dam Site',
    project_id: 'p-gerd',
    fuel_type: 'KEROSENE',
    quantity_liters: 25000,
    priority: 'NORMAL',
    justification: 'Camp kitchen and heating supply for rainy season.',
    requested_delivery_date: '2026-07-20',
    status: 'APPROVED',
    created_at: '2026-06-28T10:00:00.000Z',
    reviewed_by_name: 'Tigist Haile',
    reviewed_at: '2026-06-29T09:00:00.000Z',
    review_notes: 'Within allocation ceiling.',
  },
  {
    id: 'REQ-6604-JKL',
    requested_by_user_id: 'u123',
    requested_by_name: 'Abebe Bikila',
    site_id: 's-saddle',
    site_name: 'Saddle Dam Site',
    project_id: 'p-gerd',
    fuel_type: 'HFO',
    quantity_liters: 50000,
    priority: 'NORMAL',
    justification: 'Batch plant boiler fuel — exceeds current period allocation.',
    requested_delivery_date: '2026-07-25',
    status: 'REJECTED',
    created_at: '2026-06-20T11:45:00.000Z',
    reviewed_by_name: 'Tigist Haile',
    reviewed_at: '2026-06-22T16:30:00.000Z',
    review_notes: 'Exceeds HFO allocation ceiling for current period. Resubmit next period.',
  },
  {
    id: 'REQ-5505-MNO',
    requested_by_user_id: 'u123',
    requested_by_name: 'Abebe Bikila',
    site_id: 's-saddle',
    site_name: 'Saddle Dam Site',
    project_id: 'p-gerd',
    fuel_type: 'DIESEL',
    quantity_liters: 45000,
    priority: 'NORMAL',
    justification: 'Scheduled refill for haul truck fleet.',
    requested_delivery_date: '2026-07-08',
    status: 'DISPATCHED',
    created_at: '2026-06-15T07:20:00.000Z',
    reviewed_by_name: 'Tigist Haile',
    reviewed_at: '2026-06-16T08:00:00.000Z',
  },
  {
    id: 'REQ-4406-PQR',
    requested_by_user_id: 'u456',
    requested_by_name: 'Kebede Assefa',
    site_id: 's-saddle',
    site_name: 'Saddle Dam Site',
    project_id: 'p-gerd',
    fuel_type: 'DIESEL',
    quantity_liters: 30000,
    priority: 'NORMAL',
    justification: 'Crane and piling equipment weekly consumption.',
    requested_delivery_date: '2026-07-05',
    status: 'SUBMITTED',
    created_at: '2026-07-05T09:00:00.000Z',
  },
];

const MOCK_DELIVERIES: Delivery[] = [
  {
    id: 'DEL-2941-XYZ',
    request_id: 'REQ-5505-MNO',
    fuel_type: 'DIESEL',
    quantity_liters_ordered: 45000,
    origin_depot: 'Addis Ababa Depot',
    tracking_code: 'DEL-2941-XYZ',
    site_id: 's-saddle',
    site_name: 'Saddle Dam Site',
    status: 'IN_TRANSIT',
    eta: '2 hours',
    dispatched_at: '2026-07-08T06:00:00.000Z',
  },
  {
    id: 'DEL-1832-ABC',
    request_id: 'REQ-7703-GHI',
    fuel_type: 'KEROSENE',
    quantity_liters_ordered: 25000,
    origin_depot: 'Bahir Dar Depot',
    tracking_code: 'DEL-1832-ABC',
    site_id: 's-saddle',
    site_name: 'Saddle Dam Site',
    status: 'ARRIVED',
    eta: 'At gate',
    dispatched_at: '2026-07-07T14:00:00.000Z',
  },
  {
    id: 'DEL-0515-GHI',
    fuel_type: 'BENZINE',
    quantity_liters_ordered: 12000,
    origin_depot: 'Addis Ababa Depot',
    tracking_code: 'DEL-0515-GHI',
    site_id: 's-saddle',
    site_name: 'Saddle Dam Site',
    status: 'RECEIVED',
    eta: '—',
    dispatched_at: '2026-07-05T08:00:00.000Z',
  },
];

const MOCK_SEED_RECEIPTS: Receipt[] = [
  {
    id: 'RCP-001',
    delivery_id: 'DEL-0515-GHI',
    received_by_user_id: 'u123',
    received_by_name: 'Abebe Bikila',
    received_quantity_liters: 12000,
    quantity_ordered_liters: 12000,
    has_discrepancy: false,
    signed_at: '2026-07-05T10:30:00.000Z',
    signer_name: 'Abebe Bikila',
    synced: true,
  },
];

function seedConsumptionLog(): ConsumptionDataPoint[] {
  const data: ConsumptionDataPoint[] = [];
  const now = Date.now();
  const fuels: Array<{ fuel_type: 'DIESEL' | 'BENZINE' | 'KEROSENE' | 'HFO'; base: number; variance: number }> = [
    { fuel_type: 'DIESEL', base: 1200, variance: 400 },
    { fuel_type: 'BENZINE', base: 300, variance: 100 },
    { fuel_type: 'KEROSENE', base: 500, variance: 150 },
    { fuel_type: 'HFO', base: 800, variance: 300 },
  ];
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now - i * 86400000).toISOString().split('T')[0];
    for (const f of fuels) {
      const offset = Math.round((Math.random() - 0.5) * f.variance * 2);
      data.push({ date, fuel_type: f.fuel_type, liters_consumed: Math.max(0, f.base + offset) });
    }
  }
  return data;
}

export const TANK_CAPACITY_LITERS: Record<string, number> = {
  DIESEL: 60000,
  BENZINE: 20000,
  KEROSENE: 25000,
  HFO: 50000,
};

const ALLOCATION_PERIOD: AllocationPeriod = {
  id: 'period-7-2026',
  period_label: 'Period 7 · Jul 2026',
  period_start: '2026-07-01',
  period_end: '2026-07-31',
  site_id: 's-saddle',
  allocations: [
    { fuel_type: 'DIESEL', ceiling_liters: 45000, assigned_by: 'EPEA' },
    { fuel_type: 'BENZINE', ceiling_liters: 30000, assigned_by: 'EPEA' },
    { fuel_type: 'KEROSENE', ceiling_liters: 40000, assigned_by: 'EPEA' },
    { fuel_type: 'HFO', ceiling_liters: 60000, assigned_by: 'EPEA' },
  ],
};

function generateRequestId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `REQ-${ts}-${rand}`;
}

function generateReceiptId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `RCP-${ts}-${rand}`;
}

export const useAppStore = create<AppState>((set, get) => ({
  auth: {
    user_id: 'u123',
    name: 'Abebe Bikila',
    role: 'SITE_MANAGER',
    project_id: 'p-gerd',
    project_name: 'Grand Ethiopian Renaissance Dam',
    site_id: 's-saddle',
    site_name: 'Saddle Dam Site',
    permissions: ['site.requests.create', 'site.receipts.sign', 'site.stock.record'],
  },
  connectivity: 'ONLINE',
  offlineQueue: {
    receipts_pending_sync: 0,
    requests_pending_sync: 0,
    last_sync_at: null,
  },
  requests: MOCK_REQUESTS,
  deliveries: MOCK_DELIVERIES,
  receipts: MOCK_SEED_RECEIPTS,
  currentAllocationPeriod: ALLOCATION_PERIOD,
  mockConsumptionLog: seedConsumptionLog(),
  setConnectivity: (status) => set({ connectivity: status }),
  setAuth: (auth) => set({ auth }),
  syncOfflineQueue: async () => {
    set({ connectivity: 'SYNCING' });
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const pendingReceipts = (await db.getAllPendingReceipts()) as Receipt[];
    for (const receipt of pendingReceipts) {
      await db.clearReceipt(receipt.delivery_id);
    }

    const syncedDeliveryIds = new Set(pendingReceipts.map((r) => r.delivery_id));

    set((state) => ({
      connectivity: 'ONLINE',
      receipts: state.receipts.map((r) =>
        syncedDeliveryIds.has(r.delivery_id) && !r.synced ? { ...r, synced: true } : r
      ),
      offlineQueue: {
        ...state.offlineQueue,
        receipts_pending_sync: 0,
        requests_pending_sync: 0,
        last_sync_at: new Date().toISOString(),
      },
    }));
  },
  createRequest: (input: CreateRequestInput) => {
    const { auth, connectivity } = get();
    if (!auth) return;

    const id = generateRequestId();
    const isOffline = connectivity === 'OFFLINE';

    const request: FuelRequest = {
      id,
      requested_by_user_id: auth.user_id,
      requested_by_name: auth.name,
      site_id: auth.site_id,
      site_name: auth.site_name,
      project_id: auth.project_id,
      fuel_type: input.fuel_type,
      quantity_liters: input.quantity_liters,
      priority: input.priority,
      justification: input.justification,
      requested_delivery_date: input.requested_delivery_date,
      status: 'SUBMITTED',
      created_at: new Date().toISOString(),
      ...(isOffline ? { pending_sync: true } : {}),
    };

    if (isOffline) {
      void db.saveRequest(id, request);
      set((state) => ({
        requests: [request, ...state.requests],
        offlineQueue: {
          ...state.offlineQueue,
          requests_pending_sync: state.offlineQueue.requests_pending_sync + 1,
        },
      }));
    } else {
      set((state) => ({
        requests: [request, ...state.requests],
      }));
    }
  },
  approveRequest: (id: string, notes?: string) => {
    const { auth } = get();
    if (!auth) return;

    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'APPROVED' as RequestStatus,
              reviewed_by_name: auth.name,
              reviewed_at: new Date().toISOString(),
              review_notes: notes,
            }
          : r
      ),
    }));
  },
  rejectRequest: (id: string, notes?: string) => {
    const { auth } = get();
    if (!auth) return;

    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'REJECTED' as RequestStatus,
              reviewed_by_name: auth.name,
              reviewed_at: new Date().toISOString(),
              review_notes: notes,
            }
          : r
      ),
    }));
  },
  signReceipt: async (
    deliveryId: string,
    receivedQuantity: number,
    signerName: string,
    notes?: string
  ) => {
    const { auth, connectivity, deliveries } = get();
    if (!auth) return;

    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (!delivery) return;

    const hasDiscrepancy = receivedQuantity !== delivery.quantity_liters_ordered;
    const isOffline = connectivity === 'OFFLINE';

    const receipt: Receipt = {
      id: generateReceiptId(),
      delivery_id: deliveryId,
      received_by_user_id: auth.user_id,
      received_by_name: auth.name,
      received_quantity_liters: receivedQuantity,
      quantity_ordered_liters: delivery.quantity_liters_ordered,
      has_discrepancy: hasDiscrepancy,
      discrepancy_notes: notes,
      signed_at: new Date().toISOString(),
      signer_name: signerName,
      synced: !isOffline,
    };

    const newStatus = hasDiscrepancy ? 'DISCREPANCY' : 'RECEIVED';

    if (isOffline) {
      await db.saveReceipt(deliveryId, receipt);
      set((state) => ({
        deliveries: state.deliveries.map((d) =>
          d.id === deliveryId ? { ...d, status: newStatus } : d
        ),
        receipts: [...state.receipts, receipt],
        offlineQueue: {
          ...state.offlineQueue,
          receipts_pending_sync: state.offlineQueue.receipts_pending_sync + 1,
        },
      }));
    } else {
      set((state) => ({
        deliveries: state.deliveries.map((d) =>
          d.id === deliveryId ? { ...d, status: newStatus } : d
        ),
        receipts: [...state.receipts, receipt],
      }));
    }
  },
}));
