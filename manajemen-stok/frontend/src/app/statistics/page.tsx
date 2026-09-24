'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { CustomerPtFilterBar } from '@/components/monitoring/CustomerPtFilterBar';
import { getStockSummaryStats, getCustomerPts, getCurrentUser } from '@/utils/api';
import { StockSummaryStats, User } from '@/types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  Building2,
  RefreshCw,
  ArrowDownToLine,
  ArrowUpFromLine,
  Activity,
  Flame,
} from 'lucide-react';

const STATUS_COLORS = {
  NORMAL: '#10b981', // Emerald
  UNDER_MIN: '#ef4444', // Red
  OVER_MAX: '#f59e0b', // Amber
};

export default function StatisticsPage() {
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
    const pts = await getCustomerPts();
    setCustomerPts(pts);
    fetchStats();
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

  const criticalPercentage = totalStatus > 0
    ? Math.round(((stats?.underMinCount || 0) / totalStatus) * 100)
    : 0;

  const normalPercentage = totalStatus > 0
    ? Math.round(((stats?.normalStockCount || 0) / totalStatus) * 100)
    : 0;

  const overPercentage = totalStatus > 0
    ? Math.round(((stats?.overMaxCount || 0) / totalStatus) * 100)
    : 0;

  const pieData = [
    { name: 'Normal (Ideal)', value: stats?.normalStockCount || 0, color: STATUS_COLORS.NORMAL },
    { name: 'Kritis (<= Min)', value: stats?.underMinCount || 0, color: STATUS_COLORS.UNDER_MIN },
    { name: 'Overstock (>= Max)', value: stats?.overMaxCount || 0, color: STATUS_COLORS.OVER_MAX },
  ].filter((d) => d.value > 0);

  // Total IN & OUT sum from daily trends
  const totalInSum = stats?.dailyTrends?.reduce((acc, curr) => acc + curr.inQty, 0) || 0;
  const totalOutSum = stats?.dailyTrends?.reduce((acc, curr) => acc + curr.outQty, 0) || 0;

  return (
    <AppLayout
      title="Dashboard Statistik & Analisis WHFG"
      subtitle="Analisis grafik komprehensif, tren mutasi harian, dan rasio kesehatan inventori Finished Goods"
    >
      {/* 1. PT Filter Bar */}
      <CustomerPtFilterBar
        pts={customerPts}
        selectedPt={selectedPt}
        onSelectPt={setSelectedPt}
      />

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Allocations */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Alokasi Part
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {stats?.totalAllocations || 0}
            </div>
            <span className="text-[10px] text-slate-500">
              {stats?.totalParts || 0} Master Parts terdaftar
            </span>
          </div>
        </div>

        {/* Critical Shortages */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-red-200/80 bg-red-50/20 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-red-100 text-red-600 rounded-xl">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block">
              Stok Kritis (&le; Min)
            </span>
            <div className="text-xl sm:text-2xl font-black text-red-600 mt-0.5">
              {stats?.underMinCount || 0}
            </div>
            <span className="text-[10px] text-red-600/80 font-bold">
              {criticalPercentage}% dari total alokasi
            </span>
          </div>
        </div>

        {/* Overstock */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
              Overstock (&ge; Max)
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">
              {stats?.overMaxCount || 0}
            </div>
            <span className="text-[10px] text-amber-700 font-bold">
              {overPercentage}% dari total alokasi
            </span>
          </div>
        </div>

        {/* Normal / Healthy */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
              Stok Aman (Ideal)
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">
              {stats?.normalStockCount || 0}
            </div>
            <span className="text-[10px] text-emerald-700 font-bold">
              {normalPercentage}% kondisi optimal
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Graphical Statistics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IN vs OUT 7-Day Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Tren Mutasi Masuk (IN) vs Keluar (OUT) 7 Hari Terakhir
                </h3>
                <p className="text-[11px] text-slate-500">
                  Perbandingan volume finish good di gudang WHFG
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span>IN: {totalInSum} pcs</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                <ArrowUpFromLine className="w-3.5 h-3.5" />
                <span>OUT: {totalOutSum} pcs</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            {stats?.dailyTrends && stats.dailyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    iconType="circle"
                  />
                  <Bar dataKey="inQty" name="Barang Masuk (IN)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="outQty" name="Barang Keluar (OUT)" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Belum ada data transaksi pergerakan 7 hari terakhir
              </div>
            )}
          </div>
        </div>

        {/* Donut Chart: Inventory Health Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Distribusi Status Kesehatan</h3>
                <p className="text-[11px] text-slate-500">Evaluasi ambang batas Min & Max</p>
              </div>
            </div>

            <div className="h-48 w-full relative">
              {totalStatus > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '12px',
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
                <span className="text-xl font-black text-slate-900">{totalStatus}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Alokasi PT
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-700 font-medium">Normal / Ideal (Min &lt; S &lt; Max)</span>
              </div>
              <span className="font-bold text-slate-900">{stats?.normalStockCount || 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span className="text-slate-700 font-medium">Kritis (&le; Min Stock)</span>
              </div>
              <span className="font-bold text-red-600">{stats?.underMinCount || 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-slate-700 font-medium">Overstock (&ge; Max Stock)</span>
              </div>
              <span className="font-bold text-amber-600">{stats?.overMaxCount || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Action Banner to Operations */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
        <div>
          <h4 className="font-bold text-sm">Butuh Mengambil Tindakan Cepat untuk Part Kritis?</h4>
          <p className="text-xs text-slate-300 mt-0.5">
            Buka menu Monitoring Stok atau Scanner Barcode untuk menambah stok masuk atau memperbarui batas ambang.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
          >
            Buka Monitoring Stok
          </button>
          <button
            onClick={() => router.push('/scan')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-colors"
          >
            Terminal Scan
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
