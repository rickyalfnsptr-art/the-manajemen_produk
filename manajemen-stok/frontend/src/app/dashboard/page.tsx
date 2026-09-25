'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { StockMonitoringTable } from '@/components/monitoring/StockMonitoringTable';
import { getStockMonitoring, getStockSummaryStats, getCustomerPts, getCurrentUser } from '@/utils/api';
import { PartCustomerStock, StockSummaryStats, User } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [customerPts, setCustomerPts] = useState<string[]>([]);
  const [selectedPt, setSelectedPt] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [stocks, setStocks] = useState<PartCustomerStock[]>([]);
  const [stats, setStats] = useState<StockSummaryStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user & initial data
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    setCurrentUser(user);
    loadInitialData();
  }, [router]);

  const loadInitialData = async () => {
    try {
      const pts = await getCustomerPts();
      setCustomerPts(pts);
      fetchData();
    } catch (err) {
      console.error('Failed to load initial monitoring data', err);
    }
  };

  // Fetch stocks & stats
  const fetchData = async () => {
    setLoading(true);
    const [stocksData, statsData] = await Promise.all([
      getStockMonitoring(selectedPt || undefined),
      getStockSummaryStats(selectedPt || undefined),
    ]);
    setStocks(stocksData || []);
    setStats(statsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedPt]);

  // Counts for KPI strip
  const totalPhysicalStock = useMemo(() => {
    return stocks.reduce((sum, s) => sum + (s.currentStock || 0), 0);
  }, [stocks]);

  const underMinCount = useMemo(() => {
    return stocks.filter(
      (s) => s.stockStatus === 'RED_MIN' || s.stockStatus === 'UNDER_MIN' || s.currentStock <= s.minStock
    ).length;
  }, [stocks]);

  const overMaxCount = useMemo(() => {
    return stocks.filter(
      (s) => s.stockStatus === 'RED_MAX' || s.stockStatus === 'OVER_MAX' || s.currentStock >= s.maxStock
    ).length;
  }, [stocks]);

  const normalCount = stocks.length - underMinCount - overMaxCount;

  return (
    <AppLayout
      title="Monitoring Stok"
    >
      <div className="space-y-4">
        {/* 1. KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Part & Total Pcs */}
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`text-left p-3.5 rounded-lg border transition-all ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-1 ring-blue-500'
                : 'bg-white text-slate-900 border-slate-300 hover:border-blue-400 hover:shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'ALL' ? 'text-white' : 'text-slate-900'}`}>
                Total Part
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-mono font-black">{stocks.length}</span>
              <span className={`text-xs font-bold ${statusFilter === 'ALL' ? 'text-blue-100' : 'text-slate-700'}`}>Alokasi</span>
            </div>
            <div className={`text-xs mt-1 font-semibold ${statusFilter === 'ALL' ? 'text-blue-100' : 'text-slate-800'}`}>
              Total Stok: <b>{totalPhysicalStock.toLocaleString('id-ID')} pcs</b>
            </div>
          </button>

          {/* Normal Stock */}
          <button
            type="button"
            onClick={() => setStatusFilter('GREEN_NORMAL')}
            className={`text-left p-3.5 rounded-lg border transition-all ${
              statusFilter === 'GREEN_NORMAL'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-1 ring-emerald-500'
                : 'bg-white text-slate-900 border-slate-300 hover:border-emerald-400 hover:shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'GREEN_NORMAL' ? 'text-white' : 'text-emerald-800'}`}>
                Stok Aman
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-mono font-black ${statusFilter === 'GREEN_NORMAL' ? 'text-white' : 'text-emerald-800'}`}>
                {normalCount}
              </span>
              <span className={`text-xs font-bold ${statusFilter === 'GREEN_NORMAL' ? 'text-white' : 'text-emerald-800'}`}>
                Part
              </span>
            </div>
            <div className={`text-xs mt-1 font-semibold ${statusFilter === 'GREEN_NORMAL' ? 'text-white' : 'text-slate-800'}`}>
              Kondisi Ideal
            </div>
          </button>

          {/* Under Min */}
          <button
            type="button"
            onClick={() => setStatusFilter('RED_MIN')}
            className={`text-left p-3.5 rounded-lg border transition-all ${
              statusFilter === 'RED_MIN'
                ? 'bg-red-600 text-white border-red-600 shadow-sm ring-1 ring-red-500'
                : 'bg-white text-slate-900 border-slate-300 hover:border-red-400 hover:shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'RED_MIN' ? 'text-white' : 'text-red-800'}`}>
                Kritis
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-mono font-black ${statusFilter === 'RED_MIN' ? 'text-white' : 'text-red-800'}`}>
                {underMinCount}
              </span>
              <span className={`text-xs font-bold ${statusFilter === 'RED_MIN' ? 'text-white' : 'text-red-800'}`}>
                Part
              </span>
            </div>
            <div className={`text-xs mt-1 font-semibold ${statusFilter === 'RED_MIN' ? 'text-white' : 'text-slate-800'}`}>
              Perlu Suplai
            </div>
          </button>

          {/* Over Max */}
          <button
            type="button"
            onClick={() => setStatusFilter('RED_MAX')}
            className={`text-left p-3.5 rounded-lg border transition-all ${
              statusFilter === 'RED_MAX'
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm ring-1 ring-amber-500'
                : 'bg-white text-slate-900 border-slate-300 hover:border-amber-400 hover:shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'RED_MAX' ? 'text-white' : 'text-amber-800'}`}>
                Overstock
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-mono font-black ${statusFilter === 'RED_MAX' ? 'text-white' : 'text-amber-800'}`}>
                {overMaxCount}
              </span>
              <span className={`text-xs font-bold ${statusFilter === 'RED_MAX' ? 'text-white' : 'text-amber-800'}`}>
                Part
              </span>
            </div>
            <div className={`text-xs mt-1 font-semibold ${statusFilter === 'RED_MAX' ? 'text-white' : 'text-slate-800'}`}>
              Melebihi Batas
            </div>
          </button>
        </div>

        {/* 2. Pure, Solid, Executive Live Monitoring Table */}
        <StockMonitoringTable
          stocks={stocks}
          customerPts={customerPts}
          selectedPt={selectedPt}
          onSelectPt={setSelectedPt}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          loading={loading}
          onRefresh={fetchData}
        />
      </div>
    </AppLayout>
  );
}
