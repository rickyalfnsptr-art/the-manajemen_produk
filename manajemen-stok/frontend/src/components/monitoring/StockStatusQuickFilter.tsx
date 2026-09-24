'use client';

import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Layers } from 'lucide-react';

interface StockStatusQuickFilterProps {
  statusFilter: string; // 'ALL' | 'RED_MIN' | 'RED_MAX' | 'GREEN_NORMAL'
  onStatusChange: (status: string) => void;
  counts: {
    total: number;
    normal: number;
    underMin: number;
    overMax: number;
  };
}

export const StockStatusQuickFilter: React.FC<StockStatusQuickFilterProps> = ({
  statusFilter,
  onStatusChange,
  counts,
}) => {
  const options = [
    {
      id: 'ALL',
      label: 'Semua Status Stok',
      count: counts.total,
      icon: Layers,
      activeColor: 'bg-blue-600 text-white shadow-sm border-blue-600',
      badgeColor: 'bg-slate-900 text-white font-bold',
      inactiveColor: 'bg-white text-slate-800 hover:bg-slate-50 border-slate-200 hover:border-blue-300',
      inactiveBadge: 'bg-slate-100 text-slate-900 border border-slate-300 font-bold',
    },
    {
      id: 'RED_MIN',
      label: 'Kritis (≤ Min Stock)',
      desc: 'Perlu Suplai Segera',
      count: counts.underMin,
      icon: TrendingDown,
      activeColor: 'bg-red-600 text-white shadow-sm border-red-600',
      badgeColor: 'bg-white text-red-700 font-bold',
      inactiveColor: 'bg-white text-slate-800 hover:bg-slate-50 border-slate-200 hover:border-red-300',
      inactiveBadge: 'bg-red-600 text-white font-bold',
    },
    {
      id: 'RED_MAX',
      label: 'Overstock (≥ Max)',
      desc: 'Kapasitas Berlebih',
      count: counts.overMax,
      icon: TrendingUp,
      activeColor: 'bg-amber-500 text-white shadow-sm border-amber-500',
      badgeColor: 'bg-white text-amber-800 font-bold',
      inactiveColor: 'bg-white text-slate-800 hover:bg-slate-50 border-slate-200 hover:border-amber-300',
      inactiveBadge: 'bg-amber-500 text-white font-bold',
    },
    {
      id: 'GREEN_NORMAL',
      label: 'Aman / Normal',
      desc: 'Stok Ideal',
      count: counts.normal,
      icon: CheckCircle2,
      activeColor: 'bg-emerald-600 text-white shadow-sm border-emerald-600',
      badgeColor: 'bg-white text-emerald-800 font-bold',
      inactiveColor: 'bg-white text-slate-800 hover:bg-slate-50 border-slate-200 hover:border-emerald-300',
      inactiveBadge: 'bg-emerald-600 text-white font-bold',
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Filter Cepat Status Kesehatan Stok:
          </span>
        </div>
        {statusFilter !== 'ALL' && (
          <button
            type="button"
            onClick={() => onStatusChange('ALL')}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline transition-colors"
          >
            Reset Filter (Tampilkan Semua)
          </button>
        )}
      </div>

      {/* 4 Interactive Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = statusFilter === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onStatusChange(opt.id)}
              className={`p-3 rounded-lg border transition-all text-left flex items-center justify-between gap-3 ${
                isActive ? opt.activeColor : opt.inactiveColor
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs font-black truncate">{opt.label}</span>
                </div>
                {opt.desc && (
                  <p
                    className={`text-[10px] mt-0.5 font-medium truncate ${
                      isActive ? 'text-white/80' : 'text-slate-500'
                    }`}
                  >
                    {opt.desc}
                  </p>
                )}
              </div>

              {/* Count Badge */}
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-black shadow-2xs flex-shrink-0 ${
                  isActive ? opt.badgeColor : opt.inactiveBadge
                }`}
              >
                {opt.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StockStatusQuickFilter;
