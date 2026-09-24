'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { CustomerPtFilterBar } from '@/components/monitoring/CustomerPtFilterBar';
import { StockStatusQuickFilter } from '@/components/monitoring/StockStatusQuickFilter';
import { CriticalStockAlertTable } from '@/components/monitoring/CriticalStockAlertTable';
import { StockMonitoringTable } from '@/components/monitoring/StockMonitoringTable';
import { PtThresholdModal } from '@/components/master/PtThresholdModal';
import { getStockMonitoring, getStockSummaryStats, getCustomerPts, getCurrentUser } from '@/utils/api';
import { PartCustomerStock, StockSummaryStats, User } from '@/types';
import { RefreshCw, LayoutDashboard } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [customerPts, setCustomerPts] = useState<string[]>([]);
  const [selectedPt, setSelectedPt] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [stocks, setStocks] = useState<PartCustomerStock[]>([]);
  const [stats, setStats] = useState<StockSummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingStock, setEditingStock] = useState<PartCustomerStock | null>(null);

  // Load user & initial data
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const pts = await getCustomerPts();
    setCustomerPts(pts);
    fetchData();
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

  const handlePtThresholdSuccess = (updated: PartCustomerStock) => {
    setStocks((prev) =>
      prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
    );
    fetchData();
  };

  // Counts for status quick filter
  const underMinCount = stocks.filter(
    (s) => s.stockStatus === 'RED_MIN' || s.stockStatus === 'UNDER_MIN' || s.currentStock <= s.minStock
  ).length;
  const overMaxCount = stocks.filter(
    (s) => s.stockStatus === 'RED_MAX' || s.stockStatus === 'OVER_MAX' || s.currentStock >= s.maxStock
  ).length;
  const normalCount = stocks.length - underMinCount - overMaxCount;

  // Filter stocks by status
  const filteredStocks = stocks.filter((item) => {
    const isUnderMin =
      item.stockStatus === 'RED_MIN' ||
      item.stockStatus === 'UNDER_MIN' ||
      item.currentStock <= item.minStock;
    const isOverMax =
      item.stockStatus === 'RED_MAX' ||
      item.stockStatus === 'OVER_MAX' ||
      item.currentStock >= item.maxStock;
    const isNormal = !isUnderMin && !isOverMax;

    if (statusFilter === 'RED_MIN') return isUnderMin;
    if (statusFilter === 'RED_MAX') return isOverMax;
    if (statusFilter === 'GREEN_NORMAL') return isNormal;
    return true;
  });

  return (
    <AppLayout
      title="Dashboard Monitoring Stok WHFG"
      subtitle="Pantauan realtime ketersediaan stok finish goods per Customer PT & Status Ambang Batas Min/Max"
    >
      {/* 1. Top Customer PT Filter Bar */}
      <CustomerPtFilterBar
        pts={customerPts}
        selectedPt={selectedPt}
        onSelectPt={setSelectedPt}
      />

      {/* 2. Interactive Status Filter Bar (Highlighting Critical & Overstock) */}
      <StockStatusQuickFilter
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        counts={{
          total: stocks.length,
          normal: normalCount,
          underMin: underMinCount,
          overMax: overMaxCount,
        }}
      />

      {/* 3. HIGHLIGHTED SECTION: Critical Stock Alerts (Visible when status is ALL or RED_MIN) */}
      {(statusFilter === 'ALL' || statusFilter === 'RED_MIN') && (
        <CriticalStockAlertTable
          stocks={stocks}
          onEditThreshold={(stock) => setEditingStock(stock)}
          userRole={currentUser?.role}
        />
      )}

      {/* 4. Detailed Stock Monitoring Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Tabel Pantauan Stok ({filteredStocks.length} Part
              {statusFilter !== 'ALL' && ` • Filter: ${statusFilter}`})
            </h3>
          </div>

          <button
            onClick={fetchData}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <StockMonitoringTable
          stocks={filteredStocks}
          loading={loading}
          onEditThreshold={(stock) => setEditingStock(stock)}
          userRole={currentUser?.role}
        />
      </div>

      {/* Threshold Modal */}
      {editingStock && (
        <PtThresholdModal
          stock={editingStock}
          isOpen={!!editingStock}
          onClose={() => setEditingStock(null)}
          onSuccess={handlePtThresholdSuccess}
        />
      )}
    </AppLayout>
  );
}
