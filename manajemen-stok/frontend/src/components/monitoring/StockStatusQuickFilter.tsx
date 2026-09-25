'use client';

import React from 'react';
import { Layers } from 'lucide-react';

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
      label: 'Semua Status',
      count: counts.total,
      activeColor: 'bg-blue-600 text-white border-blue-600 shadow-2xs',
      badgeColor: 'bg-white/20 text-white',
      inactiveColor: 'bg-white text-slate-800 hover:bg-slate-100 border-slate-300',
      inactiveBadge: 'bg-slate-100 text-slate-800 border border-slate-200 font-bold',
    },
    {
      id: 'RED_MIN',
      label: 'Kritis',
      count: counts.underMin,
      dotColor: 'bg-red-500',
      activeColor: 'bg-red-600 text-white border-red-600 shadow-2xs',
      badgeColor: 'bg-white/20 text-white',
      inactiveColor: 'bg-white text-slate-800 hover:bg-red-50 border-slate-300 hover:border-red-300',
      inactiveBadge: 'bg-red-50 text-red-700 font-bold border border-red-200',
    },
    {
      id: 'RED_MAX',
      label: 'Overstock',
      count: counts.overMax,
      dotColor: 'bg-amber-500',
      activeColor: 'bg-amber-500 text-white border-amber-500 shadow-2xs',
      badgeColor: 'bg-white/20 text-white',
      inactiveColor: 'bg-white text-slate-800 hover:bg-amber-50 border-slate-300 hover:border-amber-300',
      inactiveBadge: 'bg-amber-50 text-amber-800 font-bold border border-amber-200',
    },
    {
      id: 'GREEN_NORMAL',
      label: 'Aman / Normal',
      count: counts.normal,
      dotColor: 'bg-emerald-500',
      activeColor: 'bg-emerald-600 text-white border-emerald-600 shadow-2xs',
      badgeColor: 'bg-white/20 text-white',
      inactiveColor: 'bg-white text-slate-800 hover:bg-emerald-50 border-slate-300 hover:border-emerald-300',
      inactiveBadge: 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200',
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map((opt) => {
        const isActive = statusFilter === opt.id;

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onStatusChange(opt.id)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-2 ${
              isActive ? opt.activeColor : opt.inactiveColor
            }`}
          >
            <div className="flex items-center gap-1.5">
              {opt.dotColor && (
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : opt.dotColor}`} />
              )}
              {opt.id === 'ALL' && <Layers className="w-3.5 h-3.5" />}
              <span>{opt.label}</span>
            </div>

            <span
              className={`px-1.5 py-0.2 text-[11px] font-mono font-bold rounded-md ${
                isActive ? opt.badgeColor : opt.inactiveBadge
              }`}
            >
              {opt.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default StockStatusQuickFilter;
