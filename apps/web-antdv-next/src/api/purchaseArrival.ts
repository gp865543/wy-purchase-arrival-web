/**
 * Issue #61: Web 推送采购入库单 — typed API client.
 *
 * Endpoints:
 * - GET  /api/v1/purchase-arrival/receipts                      (list with filters)
 * - GET  /api/v1/purchase-arrival/receipts/{id}                 (single + U8 detail)
 * - GET  /api/v1/purchase-arrival/purchase-orders               (PO list)
 * - GET  /api/v1/purchase-arrival/purchase-orders/{po_id}       (PO header)
 * - GET  /api/v1/purchase-arrival/purchase-orders/{po_id}/putaway-ratio
 * - GET  /api/v1/quality-inspection/reports                     (filter by finalConclusion)
 * - POST /api/v1/storage/putaway                                (create putaway)
 *
 * Path constants are kept here so tests and views don't hard-code strings.
 */


import { requestClient } from './request';

// --- Receipt types -------------------------------------------------------

export interface Receipt {
  id: string;
  poId: number;
  rowId: number;
  planNumber: string;
  quantity: number;
  printedBy: string;
  createdAt: string;
}

export interface ReceiptListResponse {
  items: Receipt[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReceiptDetail extends Receipt {
  u8: U8ReceiptDetail | null;
}

export interface U8ReceiptDetail {
  detail_id?: number;
  po_id?: number;
  order_no?: string;
  purchase_date?: string | null;
  arrive_date?: string | null;
  inventory_code?: string;
  inventory_name?: string;
  spec?: string;
  quantity?: number;
  vendor_code?: string;
  vendor_name?: string;
}

export interface ReceiptListParams {
  po_id?: number;
  plan_number?: string;
  created_from?: string;
  created_to?: string;
  sort?: 'created_at_desc' | 'created_at_asc';
  page?: number;
  page_size?: number;
}

// --- PO types -----------------------------------------------------------

export interface PurchaseOrderHeader {
  po_id: number;
  order_no?: string;
  vendor_name?: string;
  purchase_date?: string | null;
  [key: string]: unknown;
}

export interface PutawayRatioItem {
  rowId: number;
  planNumber: string;
  totalQuantity: number;
  putawayQuantity: number;
  remainingQuantity: number;
  completionRatio: number;
  isFullyPutaway: boolean;
}

export interface PutawayRatioResponse {
  poId: number;
  items: PutawayRatioItem[];
  overall: {
    totalQuantity: number;
    putawayQuantity: number;
    remainingQuantity: number;
    completionRatio: number;
    isFullyPutaway: boolean;
  };
}

export interface PurchaseOrderListParams {
  keyword?: string;
  days?: number;
  page?: number;
  page_size?: number;
}

// --- Quality inspection (for pass-filter join) -------------------------

export type FinalConclusion = 'pass' | 'concession' | 'fail';

export interface QualityReportSummary {
  id: string;
  inspectionId: string;
  procurementSource: 'purchase' | 'customer_supplied';
  finalConclusion: FinalConclusion;
  inspectorName: string;
  schemeName: string;
  submittedAt: number;
}

// --- Storage putaway (Issue #74) ---------------------------------------

export interface PutawayInput {
  receiptId: string;
  locationCode: string;
  quantity: number;
  isLineSide?: boolean;
}

export interface PutawayResponse {
  id: string;
  receiptId: string;
  locationCode: string;
  quantity: number;
  isLineSide: boolean;
  operatorId: string;
  createdAt: string;
  cancelledAt: string | null;
}

// --- Client methods -----------------------------------------------------

export interface PurchaseArrivalApi {
  listReceipts(params?: ReceiptListParams): Promise<ReceiptListResponse>;
  getReceipt(id: string): Promise<ReceiptDetail>;
  listPurchaseOrders(params?: PurchaseOrderListParams): Promise<Paginated<unknown>>;
  getPurchaseOrder(poId: number): Promise<{ header: PurchaseOrderHeader; details: unknown[] }>;
  getPoPutawayRatio(poId: number): Promise<PutawayRatioResponse>;
  listQualityReports(params?: { finalConclusion?: FinalConclusion; procurementSource?: 'purchase' | 'customer_supplied' }): Promise<QualityReportSummary[]>;
  createPutaway(body: PutawayInput): Promise<PutawayResponse>;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  [key: string]: unknown;
}

function unwrap<T>(p: Promise<{ data: T } | T>): Promise<T> {
  // The project uses RequestClient with responseReturn: 'data', so the
  // request promise resolves with `data` only. We accept both shapes to
  // stay compatible if a future caller wraps the client differently.
  return p.then((r: unknown) =>
    r && typeof r === 'object' && 'data' in (r as object)
      ? (r as { data: T }).data
      : (r as T),
  );
}

export const purchaseArrivalApi: PurchaseArrivalApi = {
  async listReceipts(params) {
    return unwrap(requestClient.get('/v1/purchase-arrival/receipts', { params }));
  },

  async getReceipt(id) {
    return unwrap(requestClient.get(`/v1/purchase-arrival/receipts/${id}`));
  },

  async listPurchaseOrders(params) {
    return unwrap(requestClient.get('/v1/purchase-arrival/purchase-orders', { params }));
  },

  async getPurchaseOrder(poId) {
    return unwrap(requestClient.get(`/v1/purchase-arrival/purchase-orders/${poId}`));
  },

  async getPoPutawayRatio(poId) {
    return unwrap(requestClient.get(`/v1/purchase-arrival/purchase-orders/${poId}/putaway-ratio`));
  },

  async listQualityReports(params) {
    return unwrap(requestClient.get('/v1/quality-inspection/reports', { params }));
  },

  async createPutaway(body) {
    return unwrap(requestClient.post('/v1/storage/putaway', body));
  },
};
