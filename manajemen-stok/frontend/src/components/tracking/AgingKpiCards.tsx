'use client';

import React from 'react';
import { AgingSummary } from '@/types';

interface AgingKpiCardsProps {
  summary?: AgingSummary | null;
  onFilterCategory?: (category: string) => void;
  selectedCategory?: string;
}

export const AgingKpiCards: React.FC<AgingKpiCardsProps> = ({
  summary,
  onFilterCategory,
  selectedCategory = 'ALL',
}) => {
  const totalLots = summary?.totalActiveLots ?? 0;
  const totalQty = summary?.totalActiveQty ?? 0;
  const avgDwell = summary?.avgDwellFormatted ?? '0 Jam';
  const fresh = summary?.agingBreakdown?.fresh ?? 0;
  const warning = summary?.agingBreakdown?.warning ?? 0;
  const critical = summary?.agingBreakdown?.critical ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Total Active Lots & Qty */}
      <button
        type="button"
        onClick={() => onFilterCategory && onFilterCategory('ALL')}
        className={`text-left p-3.5 rounded-lg border transition-all ${
          selectedCategory === 'ALL'
            ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-1 ring-blue-500'
            : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300 hover:shadow-2xs'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-bold uppercase tracking-wider ${selectedCategory === 'ALL' ? 'text-blue-100' : 'text-slate-700'}`}>
            Lot di Gudang
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-mono font-black">{totalLots.toLocaleString('id-ID')}</span>
          <span className={`text-xs font-bold ${selectedCategory === 'ALL' ? 'text-blue-100' : 'text-slate-600'}`}>Lot Box</span>
        </div>
        <div className={`mt-1 text-xs font-medium ${selectedCategory === 'ALL' ? 'text-blue-100' : 'text-slate-700'}`}>
          Total: <b className={selectedCategory === 'ALL' ? 'text-white' : 'text-slate-900'}>{totalQty.toLocaleString('id-ID')} pcs</b>
        </div>
      </button>

      {/* 2. Rata-Rata Dwell Time */}
      <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Rata-rata Aging
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-mono font-black text-slate-900">{avgDwell}</span>
        </div>
        <div className="mt-1 text-xs text-slate-700 font-medium flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-600"></span>
          <span>Waktu simpan sejak Scan IN</span>
        </div>
      </div>

      {/* 3. Fresh & Fast Turnaround (< 24 Jam) */}
      <button
        type="button"
        onClick={() => onFilterCategory && onFilterCategory('FRESH')}
        className={`text-left p-3.5 rounded-lg border transition-all ${
          selectedCategory === 'FRESH'
            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-1 ring-emerald-500'
            : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300 hover:shadow-2xs'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-bold uppercase tracking-wider ${selectedCategory === 'FRESH' ? 'text-emerald-100' : 'text-emerald-700'}`}>
            Baru Masuk (&lt; 24 Jam)
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-2xl font-mono font-black ${selectedCategory === 'FRESH' ? 'text-white' : 'text-emerald-700'}`}>
            {fresh}
          </span>
          <span className={`text-xs font-bold ${selectedCategory === 'FRESH' ? 'text-emerald-100' : 'text-emerald-700'}`}>
            Lot Baru
          </span>
        </div>
        <div className={`mt-1 text-xs font-semibold ${selectedCategory === 'FRESH' ? 'text-emerald-100' : 'text-slate-700'}`}>
          Kondisi Fresh
        </div>
      </button>

      {/* 4. Over-Aging / FIFO Alert (> 3 atau > 7 Hari) */}
      <button
        type="button"
        onClick={() => onFilterCategory && onFilterCategory(critical > 0 ? 'CRITICAL' : 'WARNING')}
        className={`text-left p-3.5 rounded-lg border transition-all ${
          selectedCategory === 'CRITICAL' || selectedCategory === 'WARNING'
            ? 'bg-red-600 text-white border-red-600 shadow-sm ring-1 ring-red-500'
            : 'bg-white text-slate-800 border-slate-200 hover:border-red-300 hover:shadow-2xs'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-bold uppercase tracking-wider ${selectedCategory === 'CRITICAL' || selectedCategory === 'WARNING' ? 'text-red-100' : 'text-red-700'}`}>
            Prioritas Aging (&gt; 3 Hari)
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-2xl font-mono font-black ${selectedCategory === 'CRITICAL' || selectedCategory === 'WARNING' ? 'text-white' : 'text-red-700'}`}>
            {warning + critical}
          </span>
          <span className={`text-xs font-bold ${selectedCategory === 'CRITICAL' || selectedCategory === 'WARNING' ? 'text-red-100' : 'text-red-700'}`}>
            Lot Perlu Keluar
          </span>
        </div>
        <div className={`mt-1 text-xs font-semibold flex items-center gap-1 ${selectedCategory === 'CRITICAL' || selectedCategory === 'WARNING' ? 'text-red-100' : 'text-slate-700'}`}>
          <span>{critical} Kritis (&gt; 7 Hari) • {warning} Perhatian</span>
        </div>
      </button>
    </div>
  );
};

export default AgingKpiCards;
