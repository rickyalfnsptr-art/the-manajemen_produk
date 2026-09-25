'use client';

import React from 'react';
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
import { StockSummaryStats } from '@/types';
import { TrendingUp, PieChart as PieIcon, Activity } from 'lucide-react';

interface DashboardStatisticsChartsProps {
  stats: StockSummaryStats | null;
}

const STATUS_COLORS = {
  NORMAL: '#10b981', // Emerald 500
  UNDER_MIN: '#ef4444', // Red 500
  OVER_MAX: '#f59e0b', // Amber 500
};

export const DashboardStatisticsCharts: React.FC<DashboardStatisticsChartsProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-80 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  const pieData = [
    { name: 'Normal (Min < Stok < Max)', value: stats.normalStockCount, color: STATUS_COLORS.NORMAL },
    { name: 'Kritis (Stok <= Min)', value: stats.underMinCount, color: STATUS_COLORS.UNDER_MIN },
    { name: 'Overstock (Stok >= Max)', value: stats.overMaxCount, color: STATUS_COLORS.OVER_MAX },
  ].filter((item) => item.value > 0);

  const totalStatus = stats.normalStockCount + stats.underMinCount + stats.overMaxCount;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 7-Day In vs Out Trend */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Statistik Mutasi IN vs OUT (7 Hari Terakhir)</h3>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
            Monitoring Only
          </span>
        </div>

        <div className="h-64 w-full">
          {stats.dailyTrends && stats.dailyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats.dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  iconType="circle"
                />
                <Bar dataKey="inQty" name="Barang Masuk (IN)" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.85} />
                <Bar dataKey="outQty" name="Barang Keluar (OUT)" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.85} />
                <Line type="monotone" dataKey="inQty" name="Tren IN" stroke="#1d4ed8" strokeWidth={2.5} dot={{ r: 4, fill: '#1d4ed8' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="outQty" name="Tren OUT" stroke="#047857" strokeWidth={2.5} dot={{ r: 4, fill: '#047857' }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Belum ada data pergerakan 7 hari terakhir
            </div>
          )}
        </div>
      </div>

      {/* Stock Health Status Distribution */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Distribusi Status Stok</h3>
            </div>
          </div>

          <div className="h-44 w-full relative">
            {totalStatus > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Data tidak tersedia
              </div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-black text-slate-800">{totalStatus}</span>
              <span className="text-[10px] text-slate-400 font-medium">Alokasi</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600">Normal (Aman)</span>
            </div>
            <span className="font-bold text-slate-800">{stats.normalStockCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="text-slate-600">Kritis</span>
            </div>
            <span className="font-bold text-red-600">{stats.underMinCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-slate-600">Overstock</span>
            </div>
            <span className="font-bold text-amber-600">{stats.overMaxCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
