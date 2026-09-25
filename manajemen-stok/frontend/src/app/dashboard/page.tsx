'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { getStockSummaryStats, getCustomerPts, getCurrentUser } from '@/utils/api';
import { StockSummaryStats, User } from '@/types';
import { SearchableCombobox, ComboboxOption } from '@/components/common/SearchableCombobox';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { RefreshCw } from 'lucide-react';

const STATUS_COLORS = {
  NORMAL: '#10b981', // Emerald 500
  UNDER_MIN: '#ef4444', // Red 500
  OVER_MAX: '#f59e0b', // Amber 500
};

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [customerPts, setCustomerPts] = useState<string[]>([]);
  const [selectedPt, setSelectedPt] = useState<string>('');
  const [stats, setStats] = useState<StockSummaryStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
      fetchStats();
    } catch (err) {
      console.error('Failed to load initial stats', err);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    const data = await getStockSummaryStats(selectedPt || undefined);
    setStats(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, [selectedPt]);

  const totalStatus =
    (stats?.normalStockCount || 0) +
    (stats?.underMinCount || 0) +
    (stats?.overMaxCount || 0);

  const criticalPercentage =
    totalStatus > 0 ? Math.round(((stats?.underMinCount || 0) / totalStatus) * 100) : 0;

  const normalPercentage =
    totalStatus > 0 ? Math.round(((stats?.normalStockCount || 0) / totalStatus) * 100) : 0;

  const overPercentage =
    totalStatus > 0 ? Math.round(((stats?.overMaxCount || 0) / totalStatus) * 100) : 0;

  const pieData = [
    { name: 'Aman', value: stats?.normalStockCount || 0, color: STATUS_COLORS.NORMAL },
    { name: 'Kritis', value: stats?.underMinCount || 0, color: STATUS_COLORS.UNDER_MIN },
    { name: 'Overstock', value: stats?.overMaxCount || 0, color: STATUS_COLORS.OVER_MAX },
  ].filter((d) => d.value > 0);

  const totalInSum = stats?.dailyTrends?.reduce((acc, curr) => acc + curr.inQty, 0) || 0;
  const totalOutSum = stats?.dailyTrends?.reduce((acc, curr) => acc + curr.outQty, 0) || 0;
  const netFlow = totalInSum - totalOutSum;

  const ptOptions: ComboboxOption[] = useMemo(() => {
    return [
      { value: '', label: `🏢 Semua PT (${customerPts.length} Customer)` },
      ...customerPts.map((pt) => ({ value: pt, label: pt })),
    ];
  }, [customerPts]);

  return (
    <AppLayout
      title="Dashboard"
      fullHeight
    >
      <div className="h-full flex flex-col justify-between gap-2.5 overflow-hidden">
        {/* 1. Filter Bar */}
        <div className="bg-white px-3.5 py-2 sm:py-2.5 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 flex-shrink-0">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
              Ringkasan Eksekutif
            </h2>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-72 flex-shrink-0">
              <SearchableCombobox
                value={selectedPt}
                onChange={setSelectedPt}
                options={ptOptions}
                placeholder="🏢 Semua PT Customer"
                searchPlaceholder="Cari PT (Toyota, Daihatsu...)"
                allowCustom={false}
              />
            </div>

            <button
              type="button"
              onClick={fetchStats}
              disabled={loading}
              title="Perbarui Data"
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors shadow-2xs flex-shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* 2. 4 Solid KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 flex-shrink-0">
          {/* Total Part */}
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Total Part
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-mono font-black text-slate-900">
                {stats?.totalAllocations || 0}
              </span>
              <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md">
                Alokasi PT
              </span>
            </div>
          </div>

          {/* Normal Stock (Aman) */}
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Stok Aman
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-mono font-black text-emerald-800">
                {stats?.normalStockCount || 0}
              </span>
              <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md">
                Part
              </span>
            </div>
          </div>

          {/* Under Min (Kritis) */}
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-sm flex flex-col justify-between hover:border-red-300 transition-all">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider">
                Kritis
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-mono font-black text-red-800">
                {stats?.underMinCount || 0}
              </span>
              <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md">
                Part
              </span>
            </div>
          </div>

          {/* Over Max (Overstock) */}
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                Overstock
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-mono font-black text-amber-800">
                {stats?.overMaxCount || 0}
              </span>
              <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md">
                Part
              </span>
            </div>
          </div>
        </div>

        {/* 3. Main Graphical Views: Bar Chart & Donut Chart (Zero-Scroll 1-Page Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-0">
          {/* IN vs OUT 7-Day Trend Chart (8 Cols) */}
          <div className="lg:col-span-8 bg-white rounded-lg border border-slate-200 p-3.5 sm:p-4 shadow-sm flex flex-col justify-between min-h-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 mb-1 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Tren Mutasi 7 Hari
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">Kuantitas harian (pcs)</p>
              </div>

              {/* Summary Badges */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-bold text-white bg-blue-600 px-2 py-0.5 rounded-md text-[11px] shadow-2xs">
                  IN: {totalInSum.toLocaleString('id-ID')}
                </span>
                <span className="font-bold text-white bg-emerald-600 px-2 py-0.5 rounded-md text-[11px] shadow-2xs">
                  OUT: {totalOutSum.toLocaleString('id-ID')}
                </span>
                <span className="font-bold text-white bg-slate-900 px-2 py-0.5 rounded-md text-[11px] shadow-2xs">
                  Net: {netFlow >= 0 ? `+${netFlow.toLocaleString('id-ID')}` : netFlow.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="flex-1 min-h-0 w-full pt-1">
              {stats?.dailyTrends && stats.dailyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stats.dailyTrends} margin={{ top: 8, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '11px',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '2px' }} iconType="circle" />
                    <Bar dataKey="inQty" name="Masuk (IN)" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.85} />
                    <Bar dataKey="outQty" name="Keluar (OUT)" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.85} />
                    <Line type="monotone" dataKey="inQty" name="Tren IN" stroke="#1d4ed8" strokeWidth={2.5} dot={{ r: 3.5, fill: '#1d4ed8' }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="outQty" name="Tren OUT" stroke="#047857" strokeWidth={2.5} dot={{ r: 3.5, fill: '#047857' }} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Belum ada data mutasi 7 hari terakhir
                </div>
              )}
            </div>
          </div>

          {/* Donut Chart: Inventory Health Distribution (4 Cols) */}
          <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 p-3.5 sm:p-4 shadow-sm flex flex-col justify-between min-h-0">
            <div className="flex items-center gap-2 pb-2 mb-1 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Kesehatan Stok</h3>
                <p className="text-[10px] text-slate-500">Rasio batas Min &amp; Max</p>
              </div>
            </div>

            {/* Donut Chart */}
            <div className="h-28 sm:h-32 w-full relative my-0.5 flex-shrink-0">
              {totalStatus > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={52}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '11px',
                        border: 'none',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Data belum tersedia
                </div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-mono font-black text-slate-900">{totalStatus}</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                  Alokasi PT
                </span>
              </div>
            </div>

            {/* Breakdown List with Mini Progress Bars: Aman, Kritis, Overstock */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs flex-shrink-0">
              {/* 1. Aman (Normal) - Hijau */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0" />
                    <span className="text-slate-800 font-bold">Aman (Normal)</span>
                  </div>
                  <span className="font-bold text-slate-950 font-mono">
                    {stats?.normalStockCount || 0} <span className="text-slate-500 font-normal">({normalPercentage}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(normalPercentage > 0 ? 3 : 0, normalPercentage)}%` }} />
                </div>
              </div>

              {/* 2. Kritis (Stok <= Min) - Merah */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0" />
                    <span className="text-slate-800 font-bold">Kritis</span>
                  </div>
                  <span className="font-bold text-red-600 font-mono">
                    {stats?.underMinCount || 0} <span className="text-slate-500 font-normal">({criticalPercentage}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-red-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(criticalPercentage > 0 ? 3 : 0, criticalPercentage)}%` }} />
                </div>
              </div>

              {/* 3. Overstock (Stok >= Max) - Oren */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="text-slate-800 font-bold">Overstock</span>
                  </div>
                  <span className="font-bold text-amber-600 font-mono">
                    {stats?.overMaxCount || 0} <span className="text-slate-500 font-normal">({overPercentage}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(overPercentage > 0 ? 3 : 0, overPercentage)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
