import axios from 'axios';
import {
  User,
  MasterPart,
  PartCustomerStock,
  StockLot,
  StockTransaction,
  StockSummaryStats,
  ScanResult,
} from '../types';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('mtm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('mtm_token');
        localStorage.removeItem('mtm_whfg_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;

// --- Auth Helpers ---
export const getCurrentUser = (): User => {
  if (typeof window === 'undefined') {
    return {
      id: '1',
      npk: 'PPIC001',
      username: 'ppic_user',
      fullName: 'Budi Santoso (PPIC)',
      role: 'PPIC',
      department: 'PPIC WHFG',
    };
  }
  const userStr = localStorage.getItem('mtm_whfg_user') || localStorage.getItem('mtm_user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      // fallback
    }
  }
  const defaultUser: User = {
    id: '1',
    npk: 'PPIC001',
    username: 'ppic_user',
    fullName: 'Budi Santoso (PPIC)',
    role: 'PPIC',
    department: 'PPIC WHFG',
  };
  localStorage.setItem('mtm_whfg_user', JSON.stringify(defaultUser));
  return defaultUser;
};

export const loginUser = async (username: string, password: string): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const res = await api.post('/auth/login', { username, password });
    const token = res.data?.accessToken || res.data?.access_token || res.data?.data?.accessToken;
    const user = res.data?.user || res.data?.data?.user;

    if (token) {
      localStorage.setItem('mtm_token', token);
      if (user) {
        localStorage.setItem('mtm_whfg_user', JSON.stringify(user));
      }
      return { success: true, data: res.data };
    }
    return { success: false, error: 'Login gagal: token tidak ditemukan' };
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.message || 'Gagal login ke server',
    };
  }
};

export const logoutUser = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mtm_token');
    localStorage.removeItem('mtm_whfg_user');
    window.location.href = '/login';
  }
};

// --- Monitoring & Stock Helpers ---
export const getCustomerPts = async (): Promise<string[]> => {
  try {
    const res = await api.get('/stock/customer-pts');
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.data)) return res.data.data;
    return [];
  } catch (err) {
    console.error('Failed to fetch PT list', err);
    return [];
  }
};

export const getStockMonitoring = async (customerPt?: string): Promise<PartCustomerStock[]> => {
  try {
    const params: any = { limit: 1000 };
    if (customerPt && customerPt !== 'ALL' && customerPt.trim() !== '') {
      params.customerPt = customerPt;
    }
    const res = await api.get('/stock/monitoring', { params });
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.data)) return res.data.data;
    return [];
  } catch (err) {
    console.error('Failed to fetch stock monitoring', err);
    return [];
  }
};

export const getStockSummaryStats = async (customerPt?: string): Promise<StockSummaryStats | null> => {
  try {
    const params: any = {};
    if (customerPt && customerPt !== 'ALL' && customerPt.trim() !== '') {
      params.customerPt = customerPt;
    }
    const res = await api.get('/stock/statistics', { params });
    return res.data?.data || res.data || null;
  } catch (err) {
    console.error('Failed to fetch statistics', err);
    return null;
  }
};

// --- Scanner Helpers ---
export const processScan = async (payload: {
  rawQrCode: string;
  type: 'IN' | 'OUT';
  doorOrLineLocation?: string;
}): Promise<ScanResult> => {
  try {
    const res = await api.post('/scan/process', payload);
    return res.data;
  } catch (err: any) {
    return {
      success: false,
      message: err.response?.data?.message || 'Gagal memproses scan',
      error: err.response?.data?.message || err.message,
    };
  }
};

export const submitManualStock = async (payload: {
  partNumber: string;
  customerPt: string;
  qty: number;
  type: 'IN' | 'OUT';
  originLineOrVendor?: string;
  destinationDoorOrPt?: string;
  manualTimestamp: string;
  notes?: string;
}): Promise<ScanResult> => {
  try {
    const res = await api.post('/stock/manual-input', payload);
    return res.data;
  } catch (err: any) {
    return {
      success: false,
      message: err.response?.data?.message || 'Gagal menyimpan input manual',
      error: err.response?.data?.message || err.message,
    };
  }
};

export const getRecentTransactions = async (limit = 20): Promise<StockTransaction[]> => {
  try {
    const res = await api.get('/scan/recent', { params: { limit } });
    return res.data?.data || [];
  } catch (err) {
    console.error('Failed to fetch recent transactions', err);
    return [];
  }
};

// --- Master Parts & Threshold Helpers ---
export const getMasterParts = async (): Promise<MasterPart[]> => {
  try {
    const res = await api.get('/master-parts', { params: { limit: 1000 } });
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.data)) return res.data.data;
    return [];
  } catch (err) {
    console.error('Failed to fetch master parts', err);
    return [];
  }
};

export const updatePtThreshold = async (
  stockId: string | number,
  thresholds: { minStock: number; maxStock: number }
): Promise<{ success: boolean; data?: PartCustomerStock; error?: string }> => {
  try {
    const res = await api.patch(`/master-parts/threshold/${stockId}`, thresholds);
    return { success: true, data: res.data?.data };
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.message || 'Gagal memperbarui ambang batas',
    };
  }
};

export const createOrAssignPartAllocation = async (payload: {
  partNumber: string;
  partName: string;
  category?: string;
  customerName: string;
  customerPartNumber?: string;
  minStock: number;
  maxStock: number;
}): Promise<{ success: boolean; data?: PartCustomerStock; error?: string }> => {
  try {
    const res = await api.post('/master-parts/allocation', payload);
    return { success: true, data: res.data?.data };
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.message || 'Gagal menyimpan alokasi part PT',
    };
  }
};

// --- Tracking Helpers ---
export const getPartTracking = async (
  partNumber: string
): Promise<{
  success: boolean;
  data?: {
    part: MasterPart;
    lots: StockLot[];
    transactions: StockTransaction[];
  };
  error?: string;
}> => {
  try {
    const res = await api.get(`/tracking/${encodeURIComponent(partNumber)}`);
    return { success: true, data: res.data?.data };
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.message || 'Part number tidak ditemukan',
    };
  }
};
