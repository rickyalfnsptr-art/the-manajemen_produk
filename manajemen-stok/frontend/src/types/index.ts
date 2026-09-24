export type Role = 'PPIC' | 'ADMIN' | 'OPERATOR' | 'LEADER' | string;
export type StockStatus = 'NORMAL' | 'UNDER_MIN' | 'OVER_MAX' | 'RED_MIN' | 'GREEN_NORMAL' | 'RED_MAX' | string;
export type LotStatus = 'IN_STOCK' | 'OUT_STOCK';
export type TransactionType = 'IN' | 'OUT' | 'SCAN_IN' | 'SCAN_OUT' | 'MANUAL_IN' | 'MANUAL_OUT' | string;
export type AgingCategory = 'FRESH' | 'NORMAL' | 'WARNING' | 'CRITICAL';

export interface User {
  id: string;
  npk: string;
  username: string;
  fullName: string;
  department?: string | null;
  role: Role;
}

export interface PartCustomerStock {
  id: string;
  partId?: string;
  partNumber: string;
  partName: string;
  customerPt: string;
  customerPartNumber?: string;
  minStock: number;
  maxStock: number;
  currentStock: number;
  stockStatus: StockStatus;
  category?: string | null;
  lastScanInAt?: string | null;
  lastScanOutAt?: string | null;
  part?: MasterPart;
}

export interface MasterPart {
  id: string;
  partNumber: string;
  partName: string;
  category?: string | null;
  location?: string | null;
  defaultLine?: string | null;
  standardBoxQty?: number;
  isActive?: boolean;
  customerStocks?: PartCustomerStock[];
}

export interface StockLot {
  id: string;
  lotNumber: string;
  partNumber: string;
  partName?: string;
  category?: string;
  customerPt: string;
  customerPartNumber?: string;
  qty: number;
  status: LotStatus | string;
  originLineOrVendor?: string | null;
  createdAt: string;
  outTimestamp?: string | null;
  dwellHours?: number;
  dwellDays?: number;
  dwellFormatted?: string;
  agingCategory?: AgingCategory;
  agingPercentage?: number;
}

export interface AgingSummary {
  totalActiveLots: number;
  totalActiveQty: number;
  avgDwellHours: number;
  avgDwellDays: number;
  avgDwellFormatted: string;
  agingBreakdown: {
    fresh: number;
    normal: number;
    warning: number;
    critical: number;
  };
}


export interface StockTransaction {
  id: string;
  type: TransactionType;
  transactionType?: string;
  partNumber: string;
  customerPt: string;
  qty: number;
  previousStock?: number;
  currentStock?: number;
  uniqueTag?: string | null;
  doorOrLineLocation?: string | null;
  originLineOrVendor?: string | null;
  destinationDoorOrPt?: string | null;
  operatorNpk?: string | null;
  operatorName?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface DailyTrend {
  date: string;
  inQty: number;
  outQty: number;
}

export interface StockSummaryStats {
  totalParts: number;
  totalAllocations: number;
  normalStockCount: number;
  underMinCount: number;
  overMaxCount: number;
  dailyTrends: DailyTrend[];
  statusDistribution?: { name: string; value: number; color: string }[];
}

export interface ScanResult {
  success: boolean;
  message?: string;
  error?: string;
  transaction?: StockTransaction;
  currentStock?: number;
  minStock?: number;
  maxStock?: number;
  stockStatus?: string;
}
